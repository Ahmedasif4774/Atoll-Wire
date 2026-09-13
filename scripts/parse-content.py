"""
Parses the original AtollWire static HTML files into structured JSON
matching the Phase 0 content model. This JSON both (a) powers the Next.js
site's mock data layer during development, and (b) is the source the
Sanity migration script (migrate-to-sanity.mjs) reads from.

Run from the project root where the original *.html files sit alongside
this script's expected --src path.
"""
import glob, re, json, sys, os
from bs4 import BeautifulSoup

SRC = sys.argv[1] if len(sys.argv) > 1 else "."
OUT = sys.argv[2] if len(sys.argv) > 2 else "data/content.json"

CATEGORY_SLUGS = {
    "category-news.html": "news", "category-sport.html": "sport",
    "category-business.html": "business", "category-world.html": "world",
    "category-report.html": "report", "category-lifestyle.html": "lifestyle",
    "category-help.html": "help",
}
CATEGORY_LABELS_DV = {
    "news": "ހަބަރު", "sport": "ކުޅިވަރު", "business": "ވިޔަފާރި",
    "world": "ދުނިޔެ", "report": "ރިޕޯޓް", "lifestyle": "ލައިފްސްޓައިލް", "help": "އެހީ",
}
CATEGORY_LABELS_EN = {
    "news": "News", "sport": "Sport", "business": "Business",
    "world": "World", "report": "Report", "lifestyle": "Lifestyle", "help": "Appeals",
}

def slug_from_href(href):
    if not href:
        return None
    base = href.split("/")[-1]
    m = re.match(r"^(en-)?category-([a-z]+)\.html$", base)
    return m.group(2) if m else None

def article_slug_from_filename(fn):
    base = os.path.basename(fn)
    if base == "article.html":
        # The very first article page, predates the article-<slug>.html
        # naming convention. It's the dv counterpart of en-article-harbor.html.
        return "harbor"
    m = re.match(r"^(en-)?article-(.+)\.html$", base)
    return m.group(2) if m else None

def parse_article(path, lang):
    html = open(path, encoding="utf-8").read()
    soup = BeautifulSoup(html, "html.parser")

    art = soup.select_one("article.article-header")
    if not art:
        return None

    title_el = art.find("h1")
    title = title_el.get_text(strip=True) if title_el else ""

    dek_el = art.select_one("p.article-dek")
    dek = dek_el.get_text(strip=True) if dek_el else ""

    author_name_el = art.select_one(".author-name")
    author_name = author_name_el.get_text(strip=True) if author_name_el else ""
    author_initials_el = art.select_one(".author-avatar")
    author_initials = author_initials_el.get_text(strip=True) if author_initials_el else ""

    meta_spans = art.select(".article-byline .meta-line span")
    meta_texts = [s.get_text(strip=True) for s in meta_spans if "dot" not in s.get("class", [])]
    time_ago = meta_texts[0] if len(meta_texts) > 0 else ""
    read_time = meta_texts[1] if len(meta_texts) > 1 else ""

    hero_img = art.select_one(".article-hero-img img")
    hero_src = hero_img.get("src") if hero_img else ""
    hero_alt = hero_img.get("alt") if hero_img else ""

    caption_el = art.select_one("p.article-caption")
    caption = caption_el.get_text(strip=True) if caption_el else ""

    # Body: ordered list of paragraph / ad-slot blocks
    body = []
    body_container = art.select_one(".article-body")
    if body_container:
        for child in body_container.find_all(["p", "div"], recursive=False):
            if child.name == "p":
                text = child.get_text(strip=True)
                if text:
                    body.append({"type": "paragraph", "text": text})
            elif child.name == "div" and "in-article-ad" in child.get("class", []):
                img = child.select_one("img")
                body.append({
                    "type": "ad",
                    "imageUrl": img.get("src") if img else "",
                    "alt": img.get("alt") if img else "",
                })

    tags = [a.get_text(strip=True) for a in art.select(".article-tags a")]

    # Category: which nav link has class "active"
    active_nav = soup.select_one("nav.primary-nav a.active")
    category = slug_from_href(active_nav.get("href")) if active_nav else None

    result = {
        "slug": article_slug_from_filename(path),
        "lang": lang,
        "category": category,
        "title": title,
        "dek": dek,
        "author": {"name": author_name, "initials": author_initials},
        "timeAgo": time_ago,
        "readTime": read_time,
        "heroImage": {"url": hero_src, "alt": hero_alt},
        "caption": caption,
        "body": body,
        "tags": tags,
        "featured": False,
    }

    # Appeal / donation fields (Help category articles)
    donation_box = art.select_one(".donation-box")
    if donation_box:
        raised_el = donation_box.select_one(".donation-raised")
        raised_text = raised_el.contents[0].strip() if raised_el and raised_el.contents else ""
        target_el = donation_box.select_one(".donation-target")
        target_text = target_el.get_text(strip=True) if target_el else ""
        pct_el = donation_box.select_one(".donation-pct")
        pct_text = pct_el.get_text(strip=True) if pct_el else ""
        bar_fill = donation_box.select_one(".donation-bar-fill")
        bar_width = bar_fill.get("style", "") if bar_fill else ""
        pct_match = re.search(r"width:\s*(\d+)%", bar_width)
        pct_value = int(pct_match.group(1)) if pct_match else None

        bank_rows = []
        for row in donation_box.select(".donation-bank-details > div"):
            label = row.select_one(".label")
            value = row.select_one(".value")
            bank_rows.append({
                "label": label.get_text(strip=True) if label else "",
                "value": value.get_text(strip=True) if value else "",
            })

        note_el = donation_box.select_one(".donation-note")
        note = note_el.get_text(strip=True) if note_el else ""

        docs = []
        for doc in donation_box.select(".doc-item"):
            name = doc.select_one(".doc-name")
            meta = doc.select_one(".doc-meta")
            docs.append({
                "name": name.get_text(strip=True) if name else "",
                "meta": meta.get_text(strip=True) if meta else "",
            })

        result["appeal"] = {
            "raisedText": raised_text,
            "targetText": target_text,
            "pctText": pct_text,
            "pctValue": pct_value,
            "bankDetails": bank_rows,
            "note": note,
            "documents": docs,
        }

    return result

def main():
    articles = []
    dv_files = sorted(glob.glob(os.path.join(SRC, "article-*.html")))
    harbor = os.path.join(SRC, "article.html")
    if os.path.exists(harbor):
        dv_files.append(harbor)
    en_files = sorted(glob.glob(os.path.join(SRC, "en-article-*.html")))

    for f in dv_files:
        parsed = parse_article(f, "dv")
        if parsed:
            articles.append(parsed)
    for f in en_files:
        parsed = parse_article(f, "en")
        if parsed:
            articles.append(parsed)

    # Reflect the original hand-curated homepage: which articles were
    # placed in the hero lead / editor's-choice pair (=> "featured"), and
    # which were listed in the site-wide "Popular News" sidebar (=> "popular").
    # Both flags are editorial toggles a real newsroom would flip in Sanity,
    # not something derivable from the article content itself.
    FEATURED_SLUGS = {"harbor", "football-squad", "medical-appeal"}
    POPULAR_SLUGS = {
        "school-vaccine", "basketball-final", "earthquake",
        "tourism-campaign", "volleyball-championship",
    }
    for a in articles:
        if a["slug"] in FEATURED_SLUGS:
            a["featured"] = True
        a["popular"] = a["slug"] in POPULAR_SLUGS

    categories = [
        {"slug": slug, "labelDv": CATEGORY_LABELS_DV[slug], "labelEn": CATEGORY_LABELS_EN[slug]}
        for slug in CATEGORY_SLUGS.values()
    ]

    out = {"categories": categories, "articles": articles}
    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    with open(OUT, "w", encoding="utf-8") as f:
        json.dump(out, f, ensure_ascii=False, indent=2)

    print(f"Parsed {len(articles)} article entries ({len(dv_files)} dv, {len(en_files)} en) -> {OUT}")
    no_category = [a["slug"] for a in articles if not a.get("category")]
    if no_category:
        print("WARNING: no active category detected for:", no_category)

if __name__ == "__main__":
    main()

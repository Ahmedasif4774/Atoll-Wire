"use client";

import Header from "@/components/en/Header";
import Nav from "@/components/en/Nav";
import Footer from "@/components/en/Footer";
import PrayerWidget from "@/components/en/PrayerWidget";
import ArticleCard from "@/components/shared/ArticleCard";
import LiveBanner from "@/components/shared/LiveBanner";
import { formatDaysLeftLabel, getCategory, getDaysLeft } from "@/lib/data";
import { homeConfigEn as cfg } from "@/lib/homeConfig.en";
import type { Article, CategorySlug } from "@/lib/types";

// All the actual markup/styling for the English homepage lives here, in a
// Client Component, because it uses <style jsx> — which (as of Next 14)
// can't be used directly inside a Server Component. app/(en)/en/page.tsx
// next to this file stays a Server Component so it can `await` the
// Sanity-backed lib/data.ts functions, then hands the already-resolved
// articles to this component as plain props (same split used for the
// category and article pages — see components/en/CategoryPageClient.tsx).
//
// getCategory/getDaysLeft/formatDaysLeftLabel are still fine to call
// directly in here: categories are plain local data (not Sanity-backed),
// and the days-left helpers are pure functions — neither one needs a
// network fetch, so they didn't need to move to the server wrapper.
type ResolvedLatestEntry = { article: Article } | { ad: true; badgeLabel: string; catLabel: string };

export default function HomePageClient({
  hero,
  editorPair,
  latestDisplay,
  sportArticles,
  worldArticles,
}: {
  hero: Article;
  editorPair: Article[];
  latestDisplay: ResolvedLatestEntry[];
  sportArticles: Article[];
  worldArticles: Article[];
}) {
  const heroCategory = getCategory(hero.category);

  return (
    <>
      <Header dvHref="/" />
      <Nav />
      <main className="wrap">
        <LiveBanner liveNowLabel="LIVE NOW" youtubeLabel="YouTube Live" facebookLabel="Facebook Live" />

        <div className="ad-slot">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={cfg.adBanner} alt="Sale advertisement" />
        </div>

        <section className="hero">
          <article className="hero-lead">
            <a href={`/en/article/${hero.slug}`}>
              <div className="thumb">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={hero.heroImage.url} alt={hero.heroImage.alt} />
                <div className="overlay">
                  <div>
                    <span className={`cat-tag cat-${hero.category}`}>{heroCategory?.labelEn}</span>
                    <h1>{hero.title}</h1>
                    <p className="dek">{hero.dek}</p>
                  </div>
                  <div className="meta-line on-dark">
                    <span>{hero.timeAgo}</span>
                  </div>
                </div>
              </div>
            </a>
          </article>

          <div className="hero-stack">
            <PrayerWidget />
            <div className="editor-pair-row">
              {editorPair.map((a) => (
                <a key={a.slug} className="editor-pair-card" href={`/en/article/${a.slug}`}>
                  <div className="ep-thumb">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={a.heroImage.url} alt={a.heroImage.alt} />
                  </div>
                  <div className="ep-text">
                    <h4>{a.title}</h4>
                    <div className="ep-meta">
                      <span>{a.timeAgo}</span>
                    </div>
                  </div>
                </a>
              ))}
            </div>
          </div>
        </section>

        <section className="content-split">
          <div>
            <div className="section-row">
              <h2 className="section-title">Latest</h2>
              <a href="/en/news">See all &rarr;</a>
            </div>
            <div className="story-grid latest-grid">
              {latestDisplay.map((entry) =>
                "ad" in entry ? (
                  <ArticleCard
                    key="sponsored"
                    href="#"
                    image={cfg.sidebarAdTop}
                    imageAlt="Sponsored placeholder"
                    category={"news" as CategorySlug}
                    categoryLabel={entry.catLabel}
                    title="Your Headline Could Go Here"
                    dek="This space is styled to match our news cards — swap in your ad network code here."
                    timeAgo="8 hrs ago"
                    sponsored={{ badgeLabel: entry.badgeLabel }}
                  />
                ) : (
                  (() => {
                    const a = entry.article;
                    const c = getCategory(a.category);
                    const deadlineLabel = a.appeal?.deadlineDate
                      ? formatDaysLeftLabel("en", getDaysLeft(a.appeal.deadlineDate))
                      : undefined;
                    return (
                      <ArticleCard
                        key={a.slug}
                        href={`/en/article/${a.slug}`}
                        image={a.heroImage.url}
                        imageAlt={a.heroImage.alt}
                        category={a.category}
                        categoryLabel={c?.labelEn ?? a.category}
                        title={a.title}
                        dek={a.dek}
                        timeAgo={a.timeAgo}
                        deadlineLabel={deadlineLabel}
                      />
                    );
                  })()
                )
              )}
            </div>

            <div className="section-row section-row--mt">
              <h2 className="section-title">Sport</h2>
              <a href="/en/sport">See all &rarr;</a>
            </div>
            <div className="story-grid latest-grid single-cat">
              {sportArticles.map((a) => (
                <ArticleCard
                  key={a.slug}
                  href={`/en/article/${a.slug}`}
                  image={a.heroImage.url}
                  imageAlt={a.heroImage.alt}
                  category={a.category}
                  categoryLabel={getCategory(a.category)?.labelEn ?? a.category}
                  title={a.title}
                  dek={a.dek}
                  timeAgo={a.timeAgo}
                />
              ))}
            </div>

            <div className="section-row section-row--mt">
              <h2 className="section-title">World</h2>
              <a href="/en/world">See all &rarr;</a>
            </div>
            <div className="story-grid latest-grid single-cat">
              {worldArticles.map((a) => (
                <ArticleCard
                  key={a.slug}
                  href={`/en/article/${a.slug}`}
                  image={a.heroImage.url}
                  imageAlt={a.heroImage.alt}
                  category={a.category}
                  categoryLabel={getCategory(a.category)?.labelEn ?? a.category}
                  title={a.title}
                  dek={a.dek}
                  timeAgo={a.timeAgo}
                />
              ))}
            </div>
          </div>

          <div>
            <div className="ad-slot ad-sidebar" style={{ aspectRatio: "300/500" }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={cfg.sidebarAdTop} alt="Sale advertisement" />
            </div>

            <aside className="social-trending">
              <h3>{cfg.socialTrending.heading}</h3>
              {cfg.socialTrending.cards.map((card) => (
                <div className="social-card" key={card.handle}>
                  <div className="social-card-head">
                    <div className="social-platform-icon" style={{ background: card.platformBg }}>
                      {card.platformIcon}
                    </div>
                    <div className="s-handle">{card.handle}</div>
                  </div>
                  {card.tiktok && <div className="social-tiktok-thumb">▶️</div>}
                  <div className="social-card-body">{card.body}</div>
                  <div className="social-card-stats" style={card.tiktok ? { clear: "both" } : undefined}>
                    {card.stats.map((s) => (
                      <span key={s}>{s}</span>
                    ))}
                  </div>
                </div>
              ))}
            </aside>

            <div className="ad-slot ad-sidebar" style={{ aspectRatio: "300/450", marginTop: 65 }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={cfg.sidebarAdBottom} alt="Sale advertisement" />
            </div>
          </div>
        </section>

        <div className="ad-slot">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={cfg.adBanner} alt="Sale advertisement" />
        </div>

        <section className="video-section">
          <h2 className="section-title">{cfg.video.title}</h2>
          <div className="video-scroll">
            {cfg.video.items.map((v) => (
              <div className="video-card" key={v.caption}>
                <div className="thumb">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={v.image} alt={v.alt} />
                </div>
                <p>{v.caption}</p>
              </div>
            ))}
          </div>
        </section>
      </main>
      <Footer />

      <style jsx>{`
        .hero {
          display: grid;
          grid-template-columns: 1.6fr 1fr;
          gap: 24px;
          padding: 24px 0 0;
        }
        :global(.hero-lead .thumb) {
          aspect-ratio: 16/10;
          border-radius: 10px;
          margin-bottom: 14px;
          position: relative;
          overflow: hidden;
          background: var(--sea-dim);
        }
        :global(.hero-lead .thumb img) {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform 0.25s ease;
        }
        :global(.hero-lead:hover .thumb img) {
          transform: scale(1.05);
        }
        :global(.hero-lead .overlay) {
          position: absolute;
          inset: 0;
          background: linear-gradient(to top, rgba(0, 0, 0, 0.82) 0%, rgba(0, 0, 0, 0.25) 55%, rgba(0, 0, 0, 0) 80%);
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          padding: 22px;
        }
        :global(.hero-lead .overlay > .meta-line) {
          flex-shrink: 0;
          white-space: nowrap;
        }
        :global(.hero-lead .overlay h1) {
          color: #fff;
          font-size: 30px;
          line-height: 1.5;
          margin-bottom: 10px;
        }
        :global(.hero-lead .overlay p.dek) {
          color: rgba(255, 255, 255, 0.85);
          font-size: 15px;
          line-height: 1.8;
          margin-bottom: 10px;
          max-width: 42ch;
        }
        .hero-stack {
          display: flex;
          flex-direction: column;
          gap: 16px;
          height: 100%;
        }
        :global(.editor-pair-row) {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
          margin-top: 0;
          flex: 1;
        }
        :global(.editor-pair-card) {
          position: relative;
          display: block;
          height: 100%;
          min-height: 220px;
          border-radius: 10px;
          overflow: hidden;
        }
        :global(.editor-pair-card .ep-thumb) {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          background: var(--sea-dim);
        }
        :global(.editor-pair-card .ep-thumb img) {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform 0.25s ease;
        }
        :global(.editor-pair-card:hover .ep-thumb img) {
          transform: scale(1.05);
        }
        :global(.editor-pair-card .ep-text) {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          z-index: 2;
          background: linear-gradient(to top, rgba(0, 0, 0, 0.88) 0%, rgba(0, 0, 0, 0.55) 55%, transparent 100%);
          padding: 60px 12px 14px;
        }
        :global(.editor-pair-card .ep-text h4) {
          font-weight: 800;
          font-size: 17px;
          line-height: 1.5;
          margin-bottom: 0;
          color: #fff;
          text-align: center;
          display: -webkit-box;
          -webkit-line-clamp: 3;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        :global(.ep-meta) {
          display: flex;
          align-items: center;
          justify-content: flex-end;
          margin-top: 4px;
          direction: ltr;
        }
        :global(.ep-meta span) {
          font-size: 12px;
          color: rgba(255, 255, 255, 0.85);
        }

        .content-split {
          display: grid;
          grid-template-columns: 1fr 300px;
          /* Without this, grid's default (stretch) forces the shorter
             main-content column to match the sidebar's height — so
             taller sidebar ads leave dead empty space below the last
             section instead of just letting the sidebar run longer. */
          align-items: start;
          gap: 32px;
          padding: 48px 0 30px;
          border-top: 1px solid var(--line);
        }
        :global(.section-title) {
          font-family: "Archivo", sans-serif;
          font-weight: 800;
          font-size: 30px;
          color: var(--ink);
          border-left: 7px solid var(--coral);
          padding-left: 14px;
        }
        .section-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 20px;
        }
        .section-row--mt {
          margin-top: 32px;
        }
        .section-row :global(.section-title) {
          margin-bottom: 0;
        }
        .section-row a {
          font-size: 13px;
          color: var(--coral);
          font-weight: 700;
        }

        .story-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 22px;
        }
        :global(.story-grid.latest-grid) {
          grid-template-columns: repeat(4, 1fr);
          gap: 16px;
        }
        :global(.latest-grid .card) {
          position: relative;
          aspect-ratio: 4/5;
          width: 100%;
        }
        :global(.latest-grid .card .thumb) {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          aspect-ratio: unset;
          overflow: hidden;
        }
        :global(.latest-grid .card .thumb img) {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform 0.25s ease;
        }
        :global(.latest-grid .card:hover .thumb img) {
          transform: scale(1.05);
        }
        :global(.latest-grid .card .body) {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          z-index: 2;
          background: linear-gradient(to top, rgba(0, 0, 0, 0.88) 0%, rgba(0, 0, 0, 0.55) 55%, transparent 100%);
          padding: 120px 12px 14px;
        }
        :global(.latest-grid .card h3) {
          font-size: 17px;
          font-weight: 800;
          line-height: 1.5;
          color: #fff;
          margin-bottom: 0;
          order: 1;
          text-align: center;
        }
        :global(.latest-grid .card p) {
          display: none;
        }
        :global(.latest-grid .card .meta-line) {
          margin: 0;
        }
        :global(.latest-grid .card .meta-line span) {
          color: rgba(255, 255, 255, 0.85);
        }
        :global(.latest-grid .card .cat-tag) {
          display: none;
        }
        :global(.latest-grid .card .card-top-row) {
          justify-content: flex-end;
          order: 2;
          margin-top: 4px;
          margin-bottom: 0;
        }
        :global(.story-grid > a) {
          display: flex !important;
        }

        :global(aside.social-trending) {
          background: var(--sea-dim);
          border-radius: 10px;
          padding: 16px;
        }
        :global(aside.social-trending h3) {
          font-size: 18px;
          font-weight: 800;
          margin-bottom: 16px;
          display: flex;
          align-items: center;
          gap: 8px;
          color: var(--ink);
          border-left: 4px solid var(--coral);
          padding-left: 10px;
        }
        :global(.social-card) {
          background: #fff;
          border-radius: 10px;
          padding: 12px;
          margin-bottom: 10px;
          border: 1px solid var(--line);
        }
        :global(.social-card:last-child) {
          margin-bottom: 0;
        }
        :global(.social-card-head) {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 8px;
        }
        :global(.social-platform-icon) {
          width: 26px;
          height: 26px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 13px;
          color: #fff;
          flex-shrink: 0;
        }
        :global(.social-card-head .s-handle) {
          font-weight: 700;
          font-size: 12.5px;
          color: #0e2a47;
        }
        :global(.social-card-body) {
          font-size: 13px;
          line-height: 1.6;
          margin-bottom: 8px;
          color: #0e2a47;
        }
        :global(.social-card-stats) {
          display: flex;
          gap: 14px;
          direction: ltr;
          justify-content: flex-end;
        }
        :global(.social-card-stats span) {
          font-size: 11px;
          color: #52696c;
          display: flex;
          align-items: center;
          gap: 3px;
        }
        :global(.social-tiktok-thumb) {
          aspect-ratio: 9/12;
          max-width: 90px;
          border-radius: 8px;
          overflow: hidden;
          background: #000;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #fff;
          font-size: 20px;
          float: right;
          margin-right: 10px;
        }

        :global(.video-section) {
          padding: 10px 0 34px;
          border-top: 1px solid var(--line);
        }
        :global(.video-scroll) {
          display: flex;
          gap: 16px;
          overflow-x: auto;
          padding-bottom: 6px;
        }
        :global(.video-card) {
          flex: 0 0 240px;
        }
        :global(.video-card .thumb) {
          aspect-ratio: 16/9;
          border-radius: 8px;
          position: relative;
          overflow: hidden;
          background: var(--sea-dim);
        }
        :global(.video-card .thumb img) {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform 0.25s ease;
        }
        :global(.video-card:hover .thumb img) {
          transform: scale(1.05);
        }
        :global(.video-card .thumb::after) {
          content: "▶";
          position: absolute;
          top: 50%;
          right: 50%;
          transform: translate(50%, -50%);
          color: #fff;
          font-size: 22px;
          opacity: 0.85;
        }
        :global(.video-card p) {
          font-size: 14px;
          font-weight: 600;
          margin-top: 8px;
          line-height: 1.6;
        }

        @media (max-width: 900px) {
          .hero {
            grid-template-columns: 1fr;
          }
          .content-split {
            grid-template-columns: 1fr;
          }
          .story-grid {
            grid-template-columns: 1fr;
          }
          :global(.story-grid.latest-grid) {
            grid-template-columns: repeat(2, 1fr);
          }
        }
      `}</style>
    </>
  );
}

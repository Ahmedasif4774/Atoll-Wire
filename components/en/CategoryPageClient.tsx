"use client";

import Header from "@/components/en/Header";
import Nav from "@/components/en/Nav";
import Footer from "@/components/en/Footer";
import { formatDaysLeftLabel, getDaysLeft } from "@/lib/data";
import type { Article, Category, CategorySlug } from "@/lib/types";

// A small "N days left" ribbon for articles with a live fundraising
// deadline — several cards on the same category page can each show their
// own countdown with no special handling for overlapping date ranges.
function DeadlineBadge({ article }: { article: Article }) {
  if (!article.appeal?.deadlineDate) return null;
  return <span className="deadline-chip">⏳ {formatDaysLeftLabel("en", getDaysLeft(article.appeal.deadlineDate))}</span>;
}

// See the comment at the top of components/dv/CategoryPageClient.tsx —
// same reason: <style jsx> needs a Client Component, but the page.tsx next
// to this one needs to stay a Server Component for generateStaticParams.
export default function CategoryPageClient({
  category,
  articles,
  popular,
}: {
  category: Category;
  articles: Article[];
  popular: Article[];
}) {
  const [major, ...rest] = articles;
  const secondary = rest.slice(0, 4);

  return (
    <>
      <Header dvHref={`/${category.slug}`} />
      <Nav active={category.slug as CategorySlug} />
      <main className="wrap">
        <div className="category-header">
          <div className="category-title-row">
            <h1>{category.labelEn}</h1>
          </div>
        </div>

        {major && (
          <div className="feature-strip">
            <a className="feature-major" href={`/en/article/${major.slug}`}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={major.heroImage.url} alt={major.heroImage.alt} />
              <DeadlineBadge article={major} />
              <div className="overlay">
                <div>
                  <h2>{major.title}</h2>
                  <div className="meta-line">
                    <span>{major.timeAgo}</span>
                  </div>
                </div>
              </div>
            </a>
            {secondary.length > 0 && (
              <div
                className="feature-secondary"
                style={
                  secondary.length !== 4
                    ? { gridTemplateColumns: "1fr", gridTemplateRows: `repeat(${secondary.length}, 1fr)` }
                    : undefined
                }
              >
                {secondary.map((a) => (
                  <a key={a.slug} className="tile" href={`/en/article/${a.slug}`}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={a.heroImage.url} alt={a.heroImage.alt} />
                    <DeadlineBadge article={a} />
                    <div className="overlay">
                      <div>
                        <h4>{a.title}</h4>
                        <div className="meta-line">
                          <span>{a.timeAgo}</span>
                        </div>
                      </div>
                    </div>
                  </a>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="content-split">
          {articles.length > 0 ? (
            <div className="news-feed">
              {articles.map((a) => (
                <a key={a.slug} className="feed-item" href={`/en/article/${a.slug}`}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={a.heroImage.url} alt={a.heroImage.alt} />
                  <DeadlineBadge article={a} />
                  <div className="overlay">
                    <div>
                      <h3>{a.title}</h3>
                      <div className="meta-line">
                        <span>{a.timeAgo}</span>
                      </div>
                    </div>
                  </div>
                </a>
              ))}
              <div className="load-more">
                <a href="#">
                  <span className="arrow">▼</span> More news
                </a>
              </div>
            </div>
          ) : (
            <div className="category-empty">
              <div className="icon">📭</div>
              <p>No articles in this section yet</p>
            </div>
          )}

          <aside className="popular">
            <div className="ad-slot ad-sidebar">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="https://images.unsplash.com/photo-1607083206869-4c7672e72a8a?w=600&h=500&fit=crop"
                alt="Sale advertisement"
              />
            </div>
            <h3>Popular News</h3>
            {popular.map((a, idx) => (
              <a key={a.slug} className="pop-item" href={`/en/article/${a.slug}`}>
                <span className="num">{idx + 1}</span>
                <div className="thumb">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={a.heroImage.url} alt={a.heroImage.alt} />
                </div>
                <h5>{a.title}</h5>
              </a>
            ))}
          </aside>
        </div>

        <div className="ad-slot">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="https://images.unsplash.com/photo-1607083206869-4c7672e72a8a?w=1456&h=180&fit=crop"
            alt="Sale advertisement"
          />
        </div>
      </main>
      <Footer />

      <style jsx>{`
        .category-header {
          padding: 12px 0 8px;
        }
        .category-title-row {
          display: flex;
          align-items: center;
          gap: 14px;
          padding-bottom: 16px;
          border-bottom: 2px solid var(--line);
        }
        .category-title-row h1 {
          font-family: "Archivo", sans-serif;
          font-size: 28px;
          font-weight: 800;
        }

        .feature-strip {
          display: grid;
          grid-template-columns: 1.4fr 1fr;
          gap: 16px;
          margin: 14px 0 6px;
          height: 460px;
        }
        :global(.feature-major) {
          position: relative;
          border-radius: 12px;
          overflow: hidden;
          background: var(--sea-dim);
          height: 100%;
          min-height: 0;
          display: block;
        }
        :global(.feature-major img) {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform 0.25s ease;
        }
        :global(.feature-major:hover img) {
          transform: scale(1.05);
        }
        :global(.feature-major .overlay) {
          position: absolute;
          inset: 0;
          background: linear-gradient(to top, rgba(0, 0, 0, 0.85) 0%, rgba(0, 0, 0, 0.3) 55%, transparent 85%);
          display: flex;
          align-items: flex-end;
          padding: 22px;
          text-align: left;
        }
        :global(.feature-major h2) {
          color: #fff;
          font-size: 24px;
          font-weight: 700;
          line-height: 1.4;
          display: -webkit-box;
          -webkit-line-clamp: 3;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        :global(.feature-major .meta-line) {
          color: rgba(255, 255, 255, 0.85);
          margin-top: 10px;
        }
        .feature-secondary {
          display: grid;
          grid-template-columns: 1fr 1fr;
          grid-template-rows: 1fr 1fr;
          gap: 16px;
          height: 100%;
          /* Grid items default to min-height: auto, which lets a tall image
             inside a tile force this whole grid taller than its 460px cell
             instead of shrinking to fit — overflowing into the section
             below. Only shows up with a non-square item count (2 or 3
             secondary tiles instead of the usual 4), which is why this
             first surfaced on the Fund Raising category. min-height: 0
             lets it actually respect the parent's fixed height. */
          min-height: 0;
        }
        :global(.feature-secondary .tile) {
          position: relative;
          border-radius: 12px;
          overflow: hidden;
          background: var(--sea-dim);
          display: block;
          min-height: 0;
        }
        :global(.feature-secondary .tile img) {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform 0.25s ease;
        }
        :global(.feature-secondary .tile:hover img) {
          transform: scale(1.05);
        }
        :global(.feature-secondary .tile .overlay) {
          position: absolute;
          inset: 0;
          background: linear-gradient(to top, rgba(0, 0, 0, 0.88) 0%, rgba(0, 0, 0, 0.35) 55%, transparent 80%);
          display: flex;
          align-items: flex-end;
          justify-content: center;
          padding: 14px;
          text-align: center;
        }
        :global(.feature-secondary .tile h4) {
          color: #fff;
          font-size: 15px;
          font-weight: 700;
          line-height: 1.4;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        :global(.feature-secondary .tile .meta-line) {
          color: rgba(255, 255, 255, 0.8);
          font-size: 10.5px;
          margin-top: 6px;
        }

        :global(.deadline-chip) {
          position: absolute;
          top: 10px;
          left: 10px;
          z-index: 2;
          background: rgba(14, 42, 71, 0.85);
          color: #fff;
          font-size: 11px;
          font-weight: 700;
          padding: 3px 10px;
          border-radius: 999px;
          direction: ltr;
        }

        .content-split {
          display: grid;
          grid-template-columns: 1fr 300px;
          gap: 32px;
          padding: 30px 0;
          border-top: 1px solid var(--line);
        }
        .news-feed {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          grid-auto-rows: 170px;
          gap: 20px;
        }
        :global(.feed-item) {
          position: relative;
          border-radius: 12px;
          overflow: hidden;
          height: 170px;
          background: var(--sea-dim);
          display: block;
        }
        :global(.feed-item img) {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform 0.25s ease;
        }
        :global(.feed-item:hover img) {
          transform: scale(1.05);
        }
        :global(.feed-item .overlay) {
          position: absolute;
          inset: 0;
          background: linear-gradient(to top, rgba(0, 0, 0, 0.88) 0%, rgba(0, 0, 0, 0.35) 55%, transparent 80%);
          display: flex;
          align-items: flex-end;
          justify-content: center;
          padding: 16px;
          text-align: center;
        }
        :global(.feed-item h3) {
          color: #fff;
          font-size: 16px;
          font-weight: 700;
          line-height: 1.4;
          margin-bottom: 8px;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
          text-align: center;
        }
        :global(.feed-item .meta-line) {
          color: rgba(255, 255, 255, 0.85);
          font-size: 11.5px;
          justify-content: center;
        }
        .news-feed :global(.load-more) {
          grid-column: 1 / -1;
        }
        :global(.load-more) {
          display: flex;
          justify-content: center;
          padding: 28px 0 6px;
        }
        :global(.load-more a) {
          font-weight: 700;
          font-size: 15px;
          color: var(--ink-soft);
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 22px;
          border: 1px solid var(--line);
          border-radius: 999px;
        }
        :global(.load-more a:hover) {
          color: var(--coral);
          border-color: var(--coral);
        }
        :global(.load-more .arrow) {
          font-size: 11px;
        }

        .category-empty {
          text-align: center;
          padding: 60px 20px;
          color: var(--ink-soft);
        }
        .category-empty .icon {
          font-size: 40px;
          margin-bottom: 14px;
        }
        .category-empty p {
          font-size: 15px;
        }

        :global(aside.popular) {
          background: var(--sea-dim);
          border-radius: 10px;
          padding: 20px;
        }
        :global(aside.popular h3) {
          font-family: "Archivo", sans-serif;
          font-weight: 700;
          font-size: 15px;
          color: var(--coral);
          margin-bottom: 16px;
        }
        :global(.pop-item) {
          display: grid;
          grid-template-columns: 20px 52px 1fr;
          align-items: center;
          gap: 10px;
          padding: 12px 0;
          border-bottom: 1px dashed var(--line);
        }
        :global(.pop-item:last-child) {
          border-bottom: none;
        }
        :global(.pop-item .num) {
          font-family: "Archivo", sans-serif;
          font-weight: 900;
          font-size: 20px;
          color: var(--line);
          direction: ltr;
        }
        :global(.pop-item .thumb) {
          width: 52px;
          height: 52px;
          border-radius: 6px;
          overflow: hidden;
          background: var(--surface);
          flex-shrink: 0;
        }
        :global(.pop-item .thumb img) {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform 0.25s ease;
        }
        :global(.pop-item:hover .thumb img) {
          transform: scale(1.05);
        }
        :global(.pop-item h5) {
          font-size: 14px;
          font-weight: 600;
          line-height: 1.6;
        }
        :global(.pop-item:hover h5) {
          color: var(--coral);
        }
        :global(.popular .ad-slot.ad-sidebar) {
          margin-top: 0;
          margin-bottom: 16px;
        }

        @media (max-width: 900px) {
          .content-split {
            grid-template-columns: 1fr;
            padding-top: 4px;
          }
        }
        @media (max-width: 700px) {
          .feature-strip {
            grid-template-columns: 1fr;
            height: auto;
          }
          :global(.feature-major) {
            aspect-ratio: 16/11;
            height: auto;
          }
          .feature-secondary {
            grid-template-columns: 1fr 1fr !important;
            grid-template-rows: unset !important;
            height: auto;
          }
          :global(.feature-secondary .tile) {
            aspect-ratio: 1/1;
          }
          .news-feed {
            grid-template-columns: 1fr 1fr;
            grid-auto-rows: 150px;
          }
          :global(.feed-item) {
            height: 150px;
          }
        }
        @media (max-width: 480px) {
          .news-feed {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </>
  );
}

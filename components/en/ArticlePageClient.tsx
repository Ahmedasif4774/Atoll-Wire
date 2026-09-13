"use client";

import Header from "@/components/en/Header";
import Nav from "@/components/en/Nav";
import Footer from "@/components/en/Footer";
import ArticleCard from "@/components/shared/ArticleCard";
import { formatDaysLeftLabel, getCategory, getDaysLeft } from "@/lib/data";
import type { Article, CategorySlug } from "@/lib/types";

// See the comment at the top of components/dv/ArticlePageClient.tsx — same
// reason this page's markup/styling lives in a Client Component.
export default function ArticlePageClient({
  article,
  recent,
  related,
}: {
  article: Article;
  recent: Article[];
  related: Article[];
}) {
  return (
    <>
      <Header dvHref={`/article/${article.slug}`} />
      <Nav active={article.category as CategorySlug} />
      <main>
        <div className="article-page-grid">
          <div className="article-wrap">
            <article className="article-header">
              <h1>{article.title}</h1>
              <p className="article-dek">{article.dek}</p>

              <div className="article-byline">
                <div className="author-block">
                  <div className="author-avatar">{article.author.initials}</div>
                  <div>
                    <div className="author-name">{article.author.name}</div>
                    <div className="meta-line">
                      <span>{article.timeAgo}</span>
                      <span className="dot" />
                      <span>{article.readTime}</span>
                    </div>
                  </div>
                </div>
                <div className="article-share">
                  <a href="#" aria-label="Share">🔗</a>
                  <a href="#" aria-label="Share">💬</a>
                  <a href="#" aria-label="Share">↗</a>
                </div>
              </div>

              <div className="article-hero-img">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={article.heroImage.url} alt={article.heroImage.alt} />
              </div>
              <p className="article-caption">{article.caption}</p>

              <div className="article-body">
                {article.body.map((block, i) =>
                  block.type === "paragraph" ? (
                    <p key={i}>{block.text}</p>
                  ) : (
                    <div className="in-article-ad" key={i}>
                      <div className="ad-label">Advertisement</div>
                      <div className="ad-slot">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={block.imageUrl} alt={block.alt} />
                      </div>
                    </div>
                  )
                )}
              </div>

              {article.appeal && (
                <div className="donation-box">
                  {article.appeal.deadlineDate && (
                    <div className="donation-deadline">
                      ⏳ {formatDaysLeftLabel("en", getDaysLeft(article.appeal.deadlineDate))}
                    </div>
                  )}
                  <div className="donation-amounts">
                    <div className="donation-raised">
                      {article.appeal.raisedText} <span>raised</span>
                    </div>
                    <div className="donation-target">{article.appeal.targetText}</div>
                  </div>
                  <div className="donation-bar-track">
                    <div
                      className="donation-bar-fill"
                      style={{ width: `${article.appeal.pctValue ?? 0}%` }}
                    />
                  </div>
                  <div className="donation-pct">{article.appeal.pctText}</div>
                  <div className="donation-bank-details">
                    {article.appeal.bankDetails.map((row) => (
                      <div key={row.label}>
                        <span className="label">{row.label}</span> <span className="value">{row.value}</span>
                      </div>
                    ))}
                  </div>
                  <p className="donation-note">{article.appeal.note}</p>

                  {article.appeal.documents.length > 0 && (
                    <div className="doc-section">
                      <div className="doc-section-title">Supporting Documents</div>
                      <div className="doc-list">
                        {article.appeal.documents.map((doc) => (
                          <a href="#" className="doc-item" key={doc.name}>
                            <div className="doc-icon">📄</div>
                            <div className="doc-info">
                              <div className="doc-name">{doc.name}</div>
                              <div className="doc-meta">{doc.meta}</div>
                            </div>
                            <span className="doc-view">View</span>
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {article.tags.length > 0 && (
                <div className="article-tags">
                  {article.tags.map((t) => (
                    <a href="#" key={t}>
                      {t}
                    </a>
                  ))}
                </div>
              )}
            </article>
          </div>

          <aside className="article-sidebar">
            <div className="ad-slot ad-sidebar">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="https://images.unsplash.com/photo-1607083206869-4c7672e72a8a?w=600&h=500&fit=crop"
                alt="Sale advertisement"
              />
            </div>
            {recent.length > 0 && (
              <div className="sidebar-more">
                <h3 className="sidebar-more-title">Latest News</h3>
                {recent.map((a) => (
                  <a className="sidebar-more-item" href={`/en/article/${a.slug}`} key={a.slug}>
                    <div className="smi-thumb">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={a.heroImage.url} alt={a.heroImage.alt} />
                    </div>
                    <div>
                      <h4>{a.title}</h4>
                      <span className="meta-line">{a.timeAgo}</span>
                    </div>
                  </a>
                ))}
              </div>
            )}
          </aside>
        </div>

        {related.length > 0 && (
          <section className="related-section">
            <h2 className="section-title">Related News</h2>
            <div className="story-grid">
              {related.map((a) => (
                <ArticleCard
                  key={a.slug}
                  href={`/en/article/${a.slug}`}
                  image={a.heroImage.url}
                  imageAlt={a.heroImage.alt}
                  category={a.category}
                  categoryLabel={getCategory(a.category)?.labelEn ?? a.category}
                  title={a.title}
                  timeAgo={a.timeAgo}
                  deadlineLabel={
                    a.appeal?.deadlineDate ? formatDaysLeftLabel("en", getDaysLeft(a.appeal.deadlineDate)) : undefined
                  }
                />
              ))}
            </div>
          </section>
        )}
      </main>
      <Footer />

      <style jsx>{`
        .article-page-grid {
          max-width: 1160px;
          margin: 0 auto;
          padding: 28px 24px 0;
          display: grid;
          grid-template-columns: 1fr 320px;
          gap: 36px;
          align-items: start;
        }
        .article-wrap {
          max-width: 760px;
        }
        .article-sidebar {
          position: sticky;
          top: 76px;
        }
        :global(.article-sidebar .ad-slot.ad-sidebar) {
          margin: 0 0 20px;
        }
        .sidebar-more {
          margin-top: 4px;
        }
        .sidebar-more-title {
          font-size: 15px;
          font-weight: 800;
          margin-bottom: 14px;
          padding-bottom: 10px;
          border-bottom: 2px solid var(--coral);
          color: var(--ink);
        }
        :global(.sidebar-more-item) {
          display: flex;
          gap: 10px;
          margin-bottom: 16px;
          align-items: flex-start;
        }
        :global(.sidebar-more-item .smi-thumb) {
          width: 72px;
          height: 54px;
          border-radius: 6px;
          overflow: hidden;
          flex-shrink: 0;
          background: var(--sea-dim);
        }
        :global(.sidebar-more-item .smi-thumb img) {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform 0.25s ease;
        }
        :global(.sidebar-more-item:hover .smi-thumb img) {
          transform: scale(1.05);
        }
        :global(.sidebar-more-item h4) {
          font-size: 13.5px;
          line-height: 1.5;
          font-weight: 700;
          color: var(--ink);
          margin-bottom: 4px;
        }
        :global(.sidebar-more-item .meta-line) {
          font-size: 11px;
          color: var(--ink-soft);
        }
        :global(.sidebar-more-item:hover h4) {
          color: var(--coral);
        }

        .article-header h1 {
          font-family: "Archivo", sans-serif;
          font-size: 34px;
          line-height: 1.3;
          font-weight: 800;
          margin: 10px 0 14px;
        }
        .article-dek {
          font-size: 17px;
          color: var(--ink-soft);
          line-height: 1.6;
          margin-bottom: 18px;
        }
        .article-byline {
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 12px;
          padding: 14px 0;
          border-top: 1px solid var(--line);
          border-bottom: 1px solid var(--line);
          margin-bottom: 24px;
        }
        .author-block {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .author-avatar {
          width: 38px;
          height: 38px;
          border-radius: 50%;
          background: var(--sea-dim);
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: "Archivo", sans-serif;
          font-weight: 800;
          color: var(--coral);
          font-size: 14px;
        }
        .author-name {
          font-weight: 700;
          font-size: 14.5px;
        }
        .article-share {
          display: flex;
          gap: 8px;
        }
        .article-share a {
          width: 34px;
          height: 34px;
          border-radius: 50%;
          border: 1px solid var(--line);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 14px;
        }
        .article-share a:hover {
          border-color: var(--coral);
          color: var(--coral);
        }
        .article-hero-img {
          aspect-ratio: 16/9;
          border-radius: 10px;
          overflow: hidden;
          margin-bottom: 8px;
          background: var(--sea-dim);
        }
        .article-hero-img :global(img) {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .article-caption {
          font-size: 12.5px;
          color: var(--ink-soft);
          margin-bottom: 26px;
        }
        .article-body {
          font-size: 19px;
          line-height: 1.8;
        }
        .article-body :global(p) {
          margin-bottom: 20px;
        }
        .article-body :global(blockquote) {
          border-left: 4px solid var(--coral);
          padding: 4px 18px;
          margin: 26px 0;
          font-size: 19px;
          font-weight: 700;
          line-height: 1.6;
          color: var(--ink);
        }
        :global(.in-article-ad) {
          margin: 20px 0;
        }
        :global(.in-article-ad .ad-label) {
          font-size: 11px;
          color: var(--ink-soft);
          text-align: center;
          margin-bottom: 6px;
        }

        .donation-box {
          background: var(--sea-dim);
          border: 1px solid var(--line);
          border-radius: 12px;
          padding: 20px;
          margin: 22px 0 28px;
          position: relative;
        }
        .donation-deadline {
          position: absolute;
          top: -12px;
          left: 20px;
          background: var(--coral);
          color: var(--ink);
          font-size: 12px;
          font-weight: 700;
          padding: 4px 12px;
          border-radius: 999px;
          direction: ltr;
        }
        .donation-amounts {
          display: flex;
          justify-content: space-between;
          align-items: baseline;
          margin-bottom: 10px;
        }
        .donation-raised {
          font-size: 22px;
          font-weight: 800;
          color: var(--ink);
        }
        .donation-raised span {
          font-size: 13px;
          font-weight: 500;
          color: var(--ink-soft);
        }
        .donation-target {
          font-size: 13px;
          color: var(--ink-soft);
        }
        .donation-bar-track {
          background: rgba(0, 0, 0, 0.08);
          border-radius: 999px;
          height: 10px;
          overflow: hidden;
          margin-bottom: 6px;
        }
        .donation-bar-fill {
          background: #c0392b;
          height: 100%;
          border-radius: 999px;
        }
        .donation-pct {
          font-size: 12.5px;
          color: var(--ink-soft);
          margin-bottom: 18px;
          text-align: right;
        }
        .donation-bank-details {
          background: var(--sea);
          border-radius: 8px;
          padding: 14px 16px;
          font-size: 14px;
          line-height: 1.9;
        }
        .donation-bank-details .label {
          color: var(--ink-soft);
        }
        .donation-bank-details .value {
          font-weight: 700;
        }
        .donation-note {
          font-size: 12.5px;
          color: var(--ink-soft);
          margin-top: 14px;
          line-height: 1.6;
        }
        .doc-section {
          margin-top: 18px;
          padding-top: 16px;
          border-top: 1px solid var(--line);
        }
        .doc-section-title {
          font-size: 13px;
          font-weight: 700;
          color: var(--ink-soft);
          margin-bottom: 10px;
        }
        .doc-list {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
        }
        .doc-item {
          display: flex;
          align-items: center;
          gap: 10px;
          background: #fff;
          border: 1px solid var(--line);
          border-radius: 8px;
          padding: 10px 14px;
          flex: 1 1 220px;
          min-width: 200px;
        }
        .doc-icon {
          width: 34px;
          height: 34px;
          border-radius: 6px;
          background: var(--sea-dim);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 16px;
          flex-shrink: 0;
        }
        .doc-info {
          flex: 1;
          min-width: 0;
        }
        .doc-name {
          font-size: 13.5px;
          font-weight: 700;
          color: var(--ink);
        }
        .doc-meta {
          font-size: 11.5px;
          color: var(--ink-soft);
        }
        .doc-view {
          font-size: 12px;
          color: var(--coral);
          font-weight: 700;
          flex-shrink: 0;
        }

        .article-tags {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
          margin: 30px 0;
        }
        .article-tags a {
          font-size: 13px;
          background: var(--sea-dim);
          padding: 6px 14px;
          border-radius: 999px;
          color: var(--ink-soft);
        }
        .article-tags a:hover {
          color: var(--coral);
          background: rgba(242, 169, 59, 0.15);
        }

        :global(.related-section) {
          max-width: 1200px;
          margin: 0 auto;
          padding: 36px 24px 0;
          border-top: 1px solid var(--line);
        }
        @media (min-width: 1440px) {
          :global(.related-section) {
            max-width: 1320px;
          }
        }
        @media (min-width: 1680px) {
          :global(.related-section) {
            max-width: 1480px;
          }
        }
        :global(.related-section .section-title) {
          font-family: "Archivo", sans-serif;
          font-weight: 800;
          font-size: 30px;
          color: var(--ink);
          border-left: 7px solid var(--coral);
          padding-left: 14px;
          margin-bottom: 24px;
        }
        :global(.related-section .story-grid) {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 16px;
          margin-top: 20px;
        }
        :global(.related-section .card .thumb) {
          aspect-ratio: 16/11;
        }
        :global(.related-section .card h3) {
          font-size: 15px;
          line-height: 1.5;
        }
        :global(.related-section .card p) {
          display: none;
        }
        :global(.related-section .card .body) {
          padding: 12px 4px 0;
        }

        @media (max-width: 960px) {
          .article-page-grid {
            grid-template-columns: 1fr;
            max-width: 760px;
          }
          .article-wrap {
            max-width: none;
          }
          .article-sidebar {
            position: static;
          }
        }
        @media (max-width: 900px) {
          :global(.related-section .story-grid) {
            grid-template-columns: repeat(2, 1fr);
          }
        }
        @media (max-width: 600px) {
          .article-header h1 {
            font-size: 24px;
          }
        }
        @media (max-width: 480px) {
          :global(.related-section .story-grid) {
            grid-template-columns: 1fr 1fr;
            gap: 10px;
          }
          :global(.related-section .card h3) {
            font-size: 13.5px;
          }
        }
      `}</style>
    </>
  );
}

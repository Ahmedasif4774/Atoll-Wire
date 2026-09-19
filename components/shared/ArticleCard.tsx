"use client";

import Link from "next/link";
import type { CategorySlug } from "@/lib/types";

// The standard news card used across the homepage, category feeds, and
// "related news" rows. Its own class names (card / thumb / body / cat-tag /
// meta-line) are styled by the base rules in app/globals.css, which were
// verified byte-identical across the original index/category/article
// stylesheets. Pages that need a different LAYOUT for a grid of these cards
// (e.g. the homepage's image-overlay "latest-grid" look) add their own
// `:global(.some-wrapper .card) { ... }` overrides in their own
// styled-jsx block — see app/(dv)/page.tsx for an example.
export interface ArticleCardProps {
  href: string;
  image: string;
  imageAlt: string;
  category: CategorySlug;
  categoryLabel: string;
  title: string;
  dek?: string;
  timeAgo: string;
  /** Marks this as a sponsored/native-ad slot instead of a real article. */
  sponsored?: { badgeLabel: string };
  /**
   * Pre-formatted "N days left" (or localized equivalent) countdown for a
   * fundraising appeal's deadline — see lib/data.ts's formatDaysLeftLabel.
   * Left as a plain string (rather than a raw day count) so this shared,
   * language-agnostic component doesn't need to know how to word it in
   * either language. Several cards with their own overlapping deadlines
   * can appear in the same grid; each just renders its own label.
   */
  deadlineLabel?: string;
}

export default function ArticleCard({
  href,
  image,
  imageAlt,
  category,
  categoryLabel,
  title,
  dek,
  timeAgo,
  sponsored,
  deadlineLabel,
}: ArticleCardProps) {
  return (
    <Link href={href} style={{ display: "block" }}>
      <article className={`card${sponsored ? " native-ad-card" : ""}`}>
        {sponsored && <span className="ad-badge">{sponsored.badgeLabel}</span>}
        <div className="thumb">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={image} alt={imageAlt} />
          {deadlineLabel && <span className="deadline-badge">⏳ {deadlineLabel}</span>}
        </div>
        <div className="body">
          <div className="card-top-row">
            <span className={`cat-tag cat-${category}`}>{categoryLabel}</span>
            <div className="meta-line">
              <span>{timeAgo}</span>
            </div>
          </div>
          <h3>{title}</h3>
          {dek && <p>{dek}</p>}
        </div>
      </article>
      <style jsx>{`
        .card-top-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 10px;
        }
        .card-top-row :global(.meta-line) {
          direction: ltr;
        }
        .card .body > :global(.cat-tag) {
          align-self: flex-start;
        }
        :global(.card .thumb) {
          position: relative;
        }
        :global(.deadline-badge) {
          position: absolute;
          top: 10px;
          left: 10px;
          z-index: 2;
          /* Fixed gold, not a theme variable, matching .cat-news elsewhere
             on the site: this badge should look the same in both themes. */
          background: #f2a93b;
          color: #0e2a47;
          font-size: 11px;
          font-weight: 700;
          padding: 3px 10px;
          border-radius: 999px;
          direction: ltr;
        }
      `}</style>
    </Link>
  );
}

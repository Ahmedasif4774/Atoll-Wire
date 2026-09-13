"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import ThemeToggle from "./ThemeToggle";
import { searchArticles } from "@/lib/data";

// Decorative date string shown in the header. The original static site
// hard-coded this per page rather than computing it from the visitor's
// clock (the whole homepage is a fixed "today" for demo purposes), so we
// keep that behavior — pass a real value in if/when this becomes live.
const DECORATIVE_DATE = "ހޯމަ، 7 ސެޕްޓެމްބަރު 2026";

export default function Header({ enHref }: { enHref: string }) {
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);

  const results = useMemo(() => searchArticles("dv", query, 6), [query]);

  // Close the dropdown on an outside click, or on Escape while it's open —
  // the box stays mounted either way, only `isOpen` toggles its dropdown.
  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setIsOpen(false);
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setIsOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onClickOutside);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, []);

  return (
    <header className="site-header">
      <div className="wrap">
        <Link
          href="/"
          className="logo"
          style={{
            fontFamily: "'MV Waheed','Noto Sans Thaana',sans-serif",
            direction: "rtl",
            fontWeight: 700,
            fontSize: 34,
            letterSpacing: 0,
          }}
        >
          އެޓޯލް<span style={{ color: "var(--coral)" }}> ވަޔަރ</span>
        </Link>
        <div className="header-utils">
          <span className="header-date">{DECORATIVE_DATE}</span>
          <ThemeToggle />
          <Link href={enHref} className="lang-toggle">
            English
          </Link>
          <div className="search-box" ref={boxRef}>
            <span className="search-icon">🔍</span>
            <input
              type="text"
              className="search-input"
              placeholder="ހޯދާ..."
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setIsOpen(true);
              }}
              onFocus={() => setIsOpen(true)}
            />
            {isOpen && query.trim().length > 0 && (
              <div className="search-dropdown">
                {results.length > 0 ? (
                  results.map((a) => (
                    <Link
                      key={a.slug}
                      href={`/article/${a.slug}`}
                      className="search-result"
                      onClick={() => {
                        setQuery("");
                        setIsOpen(false);
                      }}
                    >
                      <div className="search-result-thumb">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={a.heroImage.url} alt={a.heroImage.alt} />
                      </div>
                      <span className="search-result-title">{a.title}</span>
                    </Link>
                  ))
                ) : (
                  <div className="search-empty">ނަތީޖާއެއް ނުފެނުނު</div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
      <style jsx>{`
        header.site-header {
          background: var(--surface);
          border-bottom: 1px solid var(--line);
        }
        header.site-header .wrap {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 18px 24px 14px;
        }
        :global(.logo span) {
          color: var(--coral);
        }
        .search-box {
          position: relative;
          display: flex;
          align-items: center;
          gap: 8px;
          border: 1px solid var(--line);
          border-radius: 999px;
          padding: 8px 16px;
          font-size: 14px;
          color: var(--ink-soft);
          min-width: 200px;
        }
        .search-icon {
          flex-shrink: 0;
        }
        .search-input {
          border: none;
          outline: none;
          background: transparent;
          font: inherit;
          font-family: "MV Waheed", "Noto Sans Thaana", sans-serif;
          color: var(--ink);
          width: 100%;
        }
        .search-input::placeholder {
          color: var(--ink-soft);
        }
        .search-dropdown {
          position: absolute;
          top: calc(100% + 8px);
          left: 0;
          right: 0;
          background: var(--surface);
          border: 1px solid var(--line);
          border-radius: 12px;
          box-shadow: 0 12px 28px rgba(14, 42, 46, 0.14);
          overflow: hidden;
          overflow-y: auto;
          max-height: 360px;
          z-index: 60;
        }
        :global(.search-result) {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 10px 12px;
          border-bottom: 1px solid var(--line);
        }
        :global(.search-result:last-child) {
          border-bottom: none;
        }
        :global(.search-result:hover) {
          background: var(--sea-dim);
        }
        :global(.search-result-thumb) {
          width: 44px;
          height: 44px;
          border-radius: 6px;
          overflow: hidden;
          flex-shrink: 0;
          background: var(--sea-dim);
        }
        :global(.search-result-thumb img) {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        :global(.search-result-title) {
          font-family: "MV Waheed", "Noto Sans Thaana", sans-serif;
          font-size: 13.5px;
          font-weight: 600;
          line-height: 1.6;
          color: var(--ink);
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        .search-empty {
          padding: 16px;
          text-align: center;
          font-size: 13px;
          color: var(--ink-soft);
        }
        .header-utils {
          display: flex;
          align-items: center;
          gap: 16px;
        }
        .header-date {
          font-family: "MV Waheed", "Noto Sans Thaana", sans-serif;
          font-size: 14px;
          color: var(--ink-soft);
          white-space: nowrap;
        }
        :global(.theme-toggle-btn) {
          font-size: 16px;
          line-height: 1;
          cursor: pointer;
        }
        :global(.lang-toggle) {
          font-size: 13px;
          font-weight: 700;
          color: var(--ink-soft);
          white-space: nowrap;
        }
        :global(.lang-toggle:hover) {
          color: var(--coral);
        }
        @media (max-width: 700px) {
          .header-date {
            display: none;
          }
        }
        @media (max-width: 900px) {
          .search-box {
            display: none;
          }
        }
      `}</style>
    </header>
  );
}

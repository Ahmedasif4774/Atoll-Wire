"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import ThemeToggle from "./ThemeToggle";
import { getLiveDates } from "@/lib/liveDate";
import type { Article } from "@/lib/types";

export default function Header({ enHref }: { enHref: string }) {
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [results, setResults] = useState<Article[]>([]);
  const boxRef = useRef<HTMLDivElement>(null);

  // The header date used to be a hard-coded string frozen at whatever day
  // the site was last built. Compute it from the real clock instead, and
  // only on the client (after mount) so the server-rendered/prerendered
  // markup — which can be stale by the time a visitor loads the page —
  // never fights with what the visitor's browser knows "today" to be.
  const [headerDate, setHeaderDate] = useState("");
  useEffect(() => {
    const update = () => setHeaderDate(getLiveDates("dv").headerDate);
    update();
    const id = setInterval(update, 60000);
    return () => clearInterval(id);
  }, []);

  // Live search now goes through /api/search instead of calling
  // lib/data.ts's searchArticles() directly — that function fetches from
  // Sanity and is async/server-only, which a Client Component like this
  // one can't call synchronously. A short debounce avoids firing a request
  // on every single keystroke.
  useEffect(() => {
    const q = query.trim();
    if (!q) {
      setResults([]);
      return;
    }
    const controller = new AbortController();
    const timer = setTimeout(() => {
      fetch(`/api/search?lang=dv&q=${encodeURIComponent(q)}`, { signal: controller.signal })
        .then((res) => res.json())
        .then((data) => setResults(data.results ?? []))
        .catch(() => {
          // Ignore aborted/failed requests — an in-flight search that gets
          // superseded by the next keystroke is expected, not an error.
        });
    }, 200);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query]);

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
          <span className="header-date">{headerDate}</span>
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
          font-size: 14.5px;
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

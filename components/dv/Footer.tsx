"use client";

import Link from "next/link";

export default function Footer() {
  return (
    <footer>
      <p>
        © 2026 އެޓޯލް ވަޔަރ · <Link href="/terms">ޓާރމްސް</Link> ·{" "}
        <Link href="/privacy">ޕްރައިވެސީ ޕޮލިސީ</Link> ·{" "}
        <Link href="/editorial-policy">އެޑިޓޯރިއަލް ޕޮލިސީ</Link> ·{" "}
        <Link href="/contact">ގުޅުއްވުމަށް</Link>
      </p>
      <style jsx>{`
        footer {
          background: var(--ink);
          color: var(--sea);
          padding: 18px 0;
          text-align: center;
          max-width: 1152px;
          margin: 0 auto;
        }
        @media (min-width: 1440px) {
          footer {
            max-width: 1272px;
          }
        }
        @media (min-width: 1680px) {
          footer {
            max-width: 1432px;
          }
        }
        footer :global(p) {
          font-family: "MV Waheed", "Noto Sans Thaana", sans-serif;
          font-size: 12px;
          opacity: 0.75;
        }
      `}</style>
    </footer>
  );
}

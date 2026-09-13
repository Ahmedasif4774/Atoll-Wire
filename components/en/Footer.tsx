"use client";

import Link from "next/link";

export default function Footer() {
  return (
    <footer>
      <p>
        © 2026 AtollWire · <Link href="/en/terms">Terms</Link> ·{" "}
        <Link href="/en/privacy">Privacy Policy</Link> ·{" "}
        <Link href="/en/editorial-policy">Editorial Policy</Link> ·{" "}
        <Link href="/en/contact">Contact</Link>
      </p>
      <style jsx>{`
        footer {
          background: var(--ink);
          color: var(--sea);
          padding: 30px 0;
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
          font-family: "JetBrains Mono", monospace;
          font-size: 11px;
          opacity: 0.7;
          direction: ltr;
        }
      `}</style>
    </footer>
  );
}

"use client";

import { useEffect, useState } from "react";

interface Breaking {
  title: string;
  href: string;
}

// Red "Breaking news" bar shown under the menu bar, at the same width as the
// page content, while a story
// is ticked "Breaking news" in Studio (and was published in the last 6
// hours — see app/api/breaking/route.ts). Renders nothing otherwise, and
// nothing at all if the lookup fails, so it can never break a page.
export default function BreakingBar({ locale }: { locale: "dv" | "en" }) {
  const [item, setItem] = useState<Breaking | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch(`/api/breaking?lang=${locale}`, { cache: "no-store" });
        const body = await res.json();
        if (!cancelled) setItem(body?.breaking ?? null);
      } catch {
        // keep whatever is showing
      }
    }
    load();
    const id = setInterval(load, 2 * 60 * 1000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [locale]);

  if (!item) return null;

  const label = locale === "dv" ? "ބްރޭކިން ނިއުސް" : "BREAKING NEWS";

  return (
    <a
      href={item.href}
      style={{
        display: "block",
        background: "#c8102e",
        color: "#fff",
        textDecoration: "none",
        padding: "9px 16px",
        borderRadius: 6,
        margin: "20px 0 0",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          fontSize: 15,
          fontWeight: 700,
          lineHeight: 1.6,
        }}
      >
        <span
          style={{
            flexShrink: 0,
            background: "#fff",
            color: "#c8102e",
            borderRadius: 4,
            padding: "1px 10px",
            fontSize: 12.5,
            fontWeight: 800,
            letterSpacing: locale === "en" ? 0.5 : 0,
          }}
        >
          {label}
        </span>
        <span style={{ minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {item.title}
        </span>
      </div>
    </a>
  );
}

import type { Metadata } from "next";
import "../globals.css";
import VisitorBadge from "@/components/dv/VisitorBadge";

export const metadata: Metadata = {
  title: "Atoll Wire — ހަބަރު",
};

// This is a Next.js "root layout" for the dv (Dhivehi) side of the site —
// it renders its own <html>/<body>, separate from the (en) group's layout.
// That's what lets each language have its own lang/dir attribute and its
// own default body font, matching how the original static site had a
// fully separate HTML file per language. See app/(en)/en/layout.tsx for
// the English counterpart.
export default function DvRootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="dv" dir="rtl">
      <body
        style={{
          fontFamily: "'MV Waheed', 'Noto Sans Thaana', sans-serif",
        }}
      >
        {children}
        <VisitorBadge />
      </body>
    </html>
  );
}

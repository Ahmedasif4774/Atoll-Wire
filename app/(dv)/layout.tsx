import type { Metadata } from "next";
import "../globals.css";
import VisitorBadge from "@/components/dv/VisitorBadge";
import PrayerNotification from "@/components/shared/PrayerNotification";
import { LOGO_MARK_DATA_URI } from "@/lib/brandLogo";

export const metadata: Metadata = {
  title: "Atoll Wire — ހަބަރު",
  icons: {
    icon: LOGO_MARK_DATA_URI,
    shortcut: LOGO_MARK_DATA_URI,
    apple: LOGO_MARK_DATA_URI,
  },
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
        <PrayerNotification locale="dv" />
      </body>
    </html>
  );
}

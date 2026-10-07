import type { Metadata } from "next";
import "../../globals.css";
import VisitorBadge from "@/components/dv/VisitorBadge";
import PrayerNotification from "@/components/shared/PrayerNotification";
import { LOGO_MARK_DATA_URI } from "@/lib/brandLogo";

export const metadata: Metadata = {
  title: "Atoll Wire — News",
  icons: {
    icon: LOGO_MARK_DATA_URI,
    shortcut: LOGO_MARK_DATA_URI,
    apple: LOGO_MARK_DATA_URI,
  },
};

// English counterpart of app/(dv)/layout.tsx — its own root layout with
// lang="en" dir="ltr" and the Archivo body font, matching how the original
// static site had a fully separate HTML file per language. See that file
// for the general explanation of this "multiple root layouts" pattern.
export default function EnRootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" dir="ltr">
            <body style={{ fontFamily: "'Archivo', sans-serif" }}>
        {children}
        <VisitorBadge />
        <PrayerNotification locale="en" />
      </body>
    </html>
  );
}

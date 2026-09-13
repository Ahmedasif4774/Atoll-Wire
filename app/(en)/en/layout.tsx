import type { Metadata } from "next";
import "../../globals.css";
import VisitorBadge from "@/components/dv/VisitorBadge";

export const metadata: Metadata = {
  title: "Atoll Wire — News",
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
      </body>
    </html>
  );
}

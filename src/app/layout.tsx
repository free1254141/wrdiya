import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "LineChat (وردية) - Factory OEE, Downtime & Shift Log SaaS",
  description: "Global Chat-First Factory OEE, Downtime Tracking & Shift Handover SaaS",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "LineChat",
  },
};

export const viewport: Viewport = {
  themeColor: "#020617",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ar" dir="rtl" className="h-full bg-slate-950 text-slate-100 antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}

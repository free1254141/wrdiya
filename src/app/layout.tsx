import type { Metadata, Viewport } from "next";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { LanguageProvider } from "@/contexts/LanguageContext";
import WrdyaCopilotWidget from "@/components/WrdyaCopilotWidget";

export const metadata: Metadata = {
  title: "وردية | Wrdya AI - منصة إدارة وتتبع ورديات المصانع الذكية",
  description: "المنصة الذكية لإدارة الورديات، تتبع أوقات توقف الماكينات، وحساب OEE الصناعي",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Wrdya AI",
  },
};

export const viewport: Viewport = {
  themeColor: "#07090e",
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
    <html lang="ar" dir="rtl" className="h-full antialiased dark" suppressHydrationWarning>
      <body className="min-h-full flex flex-col font-sans transition-colors duration-200" suppressHydrationWarning>
        <ThemeProvider>
          <LanguageProvider>
            <AuthProvider>
              {children}
              {/* Global AI Assistant available across all pages including /login */}
              <WrdyaCopilotWidget />
            </AuthProvider>
          </LanguageProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}

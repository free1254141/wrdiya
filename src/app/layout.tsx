import type { Metadata, Viewport } from "next";
import { Cairo } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { LanguageProvider } from "@/contexts/LanguageContext";
import PageAnalyticsTracker from "@/components/PageAnalyticsTracker";

const cairo = Cairo({
  subsets: ["arabic", "latin"],
  weight: ["300", "400", "500", "600", "700", "800", "900"],
  variable: "--font-cairo",
  display: "swap",
});

const siteUrl = "https://www.ewanbot.com";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "إيوان بوت | Ewanbot — مستشارك العقاري الذكي للشراء والبيع في مصر",
    template: "%s | إيوان بوت Ewanbot",
  },
  description:
    "إيوان بوت (Ewanbot): مستشارك العقاري بالذكاء الاصطناعي وبحث مباشر في أكثر من 663 كمبوند و2,800 وحدة معتمدة في مصر. قارن أسعار المتر وخطط التقسيط في التجمع الخامس، الشيخ زايد، العاصمة الإدارية، 6 أكتوبر، المستقبل سيتي، والساحل الشمالي بدون مكالمات سيلز مزعجة.",
  applicationName: "Ewanbot | إيوان بوت",
  authors: [{ name: "Ewanbot AI", url: siteUrl }],
  creator: "Ewanbot Real Estate AI",
  publisher: "Ewanbot",
  keywords: [
    "إيوان بوت",
    "Ewanbot",
    "عقارات مصر",
    "شقق للبيع في التجمع الخامس",
    "كمبوندات القاهرة الجديدة 2026",
    "فيلات للبيع في الشيخ زايد",
    "كمبوندات الشيخ زايد الجديدة",
    "شقق العاصمة الإدارية الجديدة R7 و R8",
    "كمبوندات 6 أكتوبر بالتقسيط",
    "شاليهات الساحل الشمالي ورأس الحكمة",
    "كمبوندات المستقبل سيتي والشروق",
    "أسعار المتر في التجمع الخامس 2026",
    "حاسبة أقساط العقارات في مصر",
    "مقارنة كمبوندات مصر",
    "اعرض شقتك للبيع مجانا",
    "مستشار عقاري بالذكاء الاصطناعي",
    "Real Estate AI Broker Egypt",
  ],
  openGraph: {
    title: "إيوان بوت | Ewanbot — مستشارك العقاري الذكي في مصر",
    description:
      "تصفح وقارن أكثر من 663 كمبوند و2,800 عقار معتمد في مصر بالأسعار وخطط التقسيط الرسمية بدون مكالمات سيلز، أو اعرض وحدتك للبيع مجاناً.",
    url: siteUrl,
    siteName: "إيوان بوت | Ewanbot",
    images: [
      {
        url: `${siteUrl}/og-image.png`,
        secureUrl: `${siteUrl}/og-image.png`,
        width: 1200,
        height: 630,
        alt: "إيوان بوت Ewanbot - مستشارك العقاري الذكي في مصر",
        type: "image/png",
      },
      {
        url: `${siteUrl}/logo.png`,
        secureUrl: `${siteUrl}/logo.png`,
        width: 512,
        height: 512,
        alt: "لوجو إيوان بوت Ewanbot",
        type: "image/png",
      },
    ],
    locale: "ar_EG",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "إيوان بوت | Ewanbot — مستشارك العقاري الذكي في مصر",
    description:
      "تصفح وقارن أكثر من 663 كمبوند و2,800 عقار معتمد في مصر بالأسعار وخطط التقسيط الرسمية بدون مكالمات سيلز مزعجة.",
    images: [`${siteUrl}/og-image.png`],
    creator: "@ewanbot",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/favicon-96x96.png", sizes: "96x96", type: "image/png" },
      { url: "/favicon.svg", type: "image/svg+xml" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "إيوان بوت",
  },
  verification: {
    google: "googleaddb18d989d05866",
    other: {
      "msvalidate.01": "0A096C457F5CBA6563B74FAF4EBB0F47",
    },
  },
  category: "real estate",
  other: {
    "geo.region": "EG-C",
    "geo.placename": "New Cairo, Fifth Settlement, Sheikh Zayed, New Administrative Capital, 6th of October, North Coast, Egypt",
    "geo.position": "30.0131;31.4989",
    "ICBM": "30.0131, 31.4989",
    "ai-content-declaration": "grounded-database-verified",
    "llms-txt": `${siteUrl}/llms.txt`,
    "llms-full-txt": `${siteUrl}/llms-full.txt`,
  },
};

export const viewport: Viewport = {
  themeColor: "#000000",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

const jsonLdData = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebSite",
      "@id": `${siteUrl}/#website`,
      url: siteUrl,
      name: "إيوان بوت | Ewanbot",
      alternateName: ["Ewanbot", "إيوان بوت العقاري", "Ewanbot AI Real Estate"],
      inLanguage: ["ar-EG", "en-US"],
      publisher: { "@id": `${siteUrl}/#agent` },
      potentialAction: {
        "@type": "SearchAction",
        target: {
          "@type": "EntryPoint",
          urlTemplate: `${siteUrl}/?q={search_term_string}`,
        },
        "query-input": "required name=search_term_string",
      },
    },
    {
      "@type": ["RealEstateAgent", "Organization"],
      "@id": `${siteUrl}/#agent`,
      name: "إيوان بوت | Ewanbot",
      alternateName: ["Ewanbot AI", "إيوان بوت"],
      url: siteUrl,
      logo: `${siteUrl}/logo.png`,
      image: `${siteUrl}/web-app-manifest-512x512.png`,
      description:
        "منصة الذكاء الاصطناعي ودليل العقارات المصري لمقارنة أسعار وخطط أقساط أكثر من 663 كمبوند و2,800 وحدة في القاهرة الجديدة، التجمع الخامس، الشيخ زايد، العاصمة الإدارية، 6 أكتوبر، المستقبل سيتي، والساحل الشمالي.",
      priceRange: "$$ - $$$$",
      currenciesAccepted: "EGP",
      knowsLanguage: ["ar", "en"],
      address: {
        "@type": "PostalAddress",
        addressLocality: "New Cairo",
        addressRegion: "Cairo",
        addressCountry: "EG",
      },
      geo: {
        "@type": "GeoCoordinates",
        latitude: 30.0131,
        longitude: 31.4989,
      },
      areaServed: [
        { "@type": "City", name: "New Cairo (القاهرة الجديدة والتجمع الخامس)" },
        { "@type": "City", name: "Sheikh Zayed (الشيخ زايد والشيخ زايد الجديدة)" },
        { "@type": "City", name: "New Administrative Capital (العاصمة الإدارية الجديدة)" },
        { "@type": "City", name: "6th of October (مدينة 6 أكتوبر)" },
        { "@type": "City", name: "Mostakbal City & Madinaty (المستقبل سيتي ومدينتي)" },
        { "@type": "City", name: "North Coast & Ras El Hekma (الساحل الشمالي ورأس الحكمة)" },
        { "@type": "City", name: "Ain Sokhna & El Shorouk (العين السخنة والشروق)" },
      ],
      hasOfferCatalog: {
        "@type": "OfferCatalog",
        name: "دليل إيوان بوت العقاري الموثق (663+ كمبوند و2,800+ وحدة)",
        itemListElement: [
          {
            "@type": "OfferCatalog",
            name: "كمبوندات وشقق التجمع الخامس والقاهرة الجديدة بالتقسيط",
          },
          {
            "@type": "OfferCatalog",
            name: "فيلات وشقق الشيخ زايد و6 أكتوبر",
          },
          {
            "@type": "OfferCatalog",
            name: "كمبوندات العاصمة الإدارية الجديدة",
          },
          {
            "@type": "OfferCatalog",
            name: "شاليهات ومنتجعات الساحل الشمالي ورأس الحكمة والعين السخنة",
          },
          {
            "@type": "OfferCatalog",
            name: "عروض الملاك المباشرة (شقق، فيلات، أراضي للبيع من المالك)",
          },
        ],
      },
    },
    {
      "@type": "WebApplication",
      "@id": `${siteUrl}/#webapp`,
      name: "إيوان بوت | Ewanbot",
      applicationCategory: "RealEstateApplication",
      operatingSystem: "All",
      url: siteUrl,
      featureList: [
        "بحث عقاري ذكي بالذكاء الاصطناعي في 663+ كمبوند و2,800+ وحدة موثقة",
        "حلبة مقارنة الكمبوندات وجهاً لوجه بسعر المتر والمقدم وتصدير PDF",
        "حاسبة الميزانية والذهب ومقارنة العائد العقاري",
        "مؤشر أسعار العقارات الشهري في المدن الجديدة المصرية",
        "عرض وحدات وأراضي الملاك للبيع مجاناً بدون مكالمات سيلز مزعجة",
      ],
      offers: {
        "@type": "Offer",
        price: "0",
        priceCurrency: "EGP",
      },
    },
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ar" dir="rtl" className={`min-h-screen antialiased dark ${cairo.variable}`} suppressHydrationWarning>
      <head>
        <link rel="alternate" type="text/plain" href="/llms.txt" title="LLM Summary Documentation" />
        <link rel="alternate" type="text/plain" href="/llms-full.txt" title="LLM Full Reference Documentation" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdData) }}
        />
      </head>
      <body className={`min-h-screen w-full ${cairo.className} transition-colors duration-200 bg-white dark:bg-black`} suppressHydrationWarning>
        <ThemeProvider>
          <LanguageProvider>
            <AuthProvider>
              <PageAnalyticsTracker />
              {children}
            </AuthProvider>
          </LanguageProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}

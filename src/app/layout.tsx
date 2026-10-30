import type { Metadata, Viewport } from "next";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { LanguageProvider } from "@/contexts/LanguageContext";

const siteUrl = "https://skanybot.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "sakanybot | سكنى بوت",
    template: "%s | sakanybot",
  },
  description:
    "مستشارك العقاري الذكي بالذكاء الاصطناعي. ابحث عن شقق وفيلات للبيع بالتقسيط في التجمع الخامس، الشيخ زايد، العاصمة الإدارية، دبي، إسبانيا، وتركيا مع خطط سداد موثقة وحجز معاينات ميدانية.",
  applicationName: "Skanybot",
  authors: [{ name: "Skanybot AI", url: siteUrl }],
  creator: "Skanybot Real Estate AI",
  publisher: "Skanybot",
  keywords: [
    // عقارات مصر
    "عقارات مصر",
    "شقق للبيع في التجمع الخامس",
    "فيلات للبيع في الشيخ زايد",
    "شقق العاصمة الإدارية الجديدة",
    "كمبوندات التجمع الخامس بالتقسيط",
    "عقارات مدينتي ومستقبل سيتي",
    "عقارات السادس من أكتوبر",
    "شاليهات الساحل الشمالي",
    "شراء عقار بالتقسيط في مصر",
    // عقارات دولية
    "عقارات دبي بالتقسيط",
    "شقق للبيع في دبي مارينا",
    "عقارات إسبانيا ملقة وكوستا ديل سول",
    "شقق للبيع في إسطنبول تركيا",
    "الاستثمار العقاري الدولي",
    // ذكاء اصطناعي وبروكر
    "بروكر عقارات ذكي",
    "شات بوت عقاري",
    "مستشار عقاري بالذكاء الاصطناعي",
    "Real Estate AI",
    "Skanybot",
    "Egypt Real Estate AI",
    "Dubai Properties AI",
  ],
  alternates: {
    canonical: siteUrl,
    languages: {
      "ar-EG": siteUrl,
      "en-US": `${siteUrl}?lang=en`,
      "tr-TR": `${siteUrl}?lang=tr`,
      "ru-RU": `${siteUrl}?lang=ru`,
      "de-DE": `${siteUrl}?lang=de`,
      "fr-FR": `${siteUrl}?lang=fr`,
      "es-ES": `${siteUrl}?lang=es`,
    },
  },
  openGraph: {
    title: "sakanybot | سكنى بوت",
    description:
      "تصفح أكثر من 980 عقار حقيقي موثق بالصور والأسعار في مصر، دبي، إسبانيا، وتركيا مع حساب الأقساط وحجز المعاينات مجاناً.",
    url: siteUrl,
    siteName: "Skanybot",
    images: [
      {
        url: "/web-app-manifest-512x512.png",
        width: 512,
        height: 512,
        alt: "Skanybot Logo - مستشارك العقاري الذكي",
      },
    ],
    locale: "ar_EG",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "sakanybot | سكنى بوت",
    description:
      "شات بوت الذكاء الاصطناعي الأقوى للاستشارات العقارية، مقارنة الأسعار وحساب الأقساط في مصر ودولياً.",
    images: ["/web-app-manifest-512x512.png"],
    creator: "@skanybot",
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
    title: "Skanybot",
  },
  verification: {
    google: "googleaddb18d989d05866",
  },
  category: "real estate",
  other: {
    // Geo-targeting and Local SEO
    "geo.region": "EG-C",
    "geo.placename": "Cairo, New Cairo, Egypt",
    "geo.position": "30.0131;31.4989",
    "ICBM": "30.0131, 31.4989",
    "target": "all",
    "coverage": "Worldwide",
    "distribution": "Global",
    "rating": "General",
  },
};

export const viewport: Viewport = {
  themeColor: "#000000",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

const jsonLdData = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": ["RealEstateAgent", "LocalBusiness"],
      "@id": `${siteUrl}/#agent`,
      name: "sakanybot | سكنى بوت",
      alternateName: "Skanybot AI",
      url: siteUrl,
      logo: `${siteUrl}/logo.png`,
      image: `${siteUrl}/web-app-manifest-512x512.png`,
      description:
        "منصة الذكاء الاصطناعي للاستشارات العقارية، البحث عن شقق وفيلات للبيع في مصر ودولياً في دبي، إسبانيا، وتركيا.",
      priceRange: "$$",
      currenciesAccepted: "EGP, AED, USD, EUR",
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
        { "@type": "City", name: "New Cairo" },
        { "@type": "City", name: "Sheikh Zayed" },
        { "@type": "City", name: "New Administrative Capital" },
        { "@type": "City", name: "6th of October" },
        { "@type": "City", name: "Dubai" },
        { "@type": "City", name: "Istanbul" },
        { "@type": "City", name: "Malaga" },
      ],
      openingHoursSpecification: {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: [
          "Monday",
          "Tuesday",
          "Wednesday",
          "Thursday",
          "Friday",
          "Saturday",
          "Sunday",
        ],
        opens: "00:00",
        closes: "23:59",
      },
    },
    {
      "@type": "WebApplication",
      "@id": `${siteUrl}/#webapp`,
      name: "Skanybot",
      applicationCategory: "RealEstateApplication",
      operatingSystem: "All",
      url: siteUrl,
      offers: {
        "@type": "Offer",
        price: "0",
        priceCurrency: "USD",
      },
    },
    {
      "@type": "FAQPage",
      "@id": `${siteUrl}/#faq`,
      mainEntity: [
        {
          "@type": "Question",
          name: "ما هو Skanybot وكيف يساعدني في اختيار وشراء العقارات؟",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Skanybot هو سكنى بوت بالذكاء الاصطناعي لمساعدتك في العثور على أفضل الشقق والفيلات والوحدات الاستثمارية في مصر (التجمع، زايد، العاصمة) ودولياً (دبي، إسبانيا، تركيا) مع حساب دقيق للأقساط وحجز معاينات ميدانية مجانية.",
          },
        },
        {
          "@type": "Question",
          name: "ما هي أنظمة التقسيط وخطط السداد المتاحة؟",
          acceptedAnswer: {
            "@type": "Answer",
            text: "يقوم Skanybot بتوضيح خطط السداد الرسمية لكافة المشاريع بمقدم يبدأ من 0% إلى 10% وفترات تقسيط تصل إلى 8 و 10 سنوات مع حساب دقيق للأقساط الشهرية ووديعة الصيانة.",
          },
        },
        {
          "@type": "Question",
          name: "هل يتوفر عقارات دولية في دبي أو إسبانيا أو تركيا؟",
          acceptedAnswer: {
            "@type": "Answer",
            text: "نعم، يمتلك Skanybot قاعدة بيانات شاملة بأحدث العقارات الموثقة في دبي (بالدرهم الإماراتي)، إسبانيا (باليورو)، وتركيا (بالدولار الأمريكي) مع تفاصيل العائد الاستثماري المتوقع ROI وإمكانية الحصول على الإقامة الذهبية أو الجنسية.",
          },
        },
      ],
    },
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ar" dir="rtl" className="h-full antialiased dark" suppressHydrationWarning>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdData) }}
        />
      </head>
      <body className="h-full w-full overflow-hidden font-sans transition-colors duration-200 bg-white dark:bg-black" suppressHydrationWarning>
        <ThemeProvider>
          <LanguageProvider>
            <AuthProvider>
              {children}
            </AuthProvider>
          </LanguageProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}

import type { Metadata, Viewport } from "next";
import { Cairo } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { LanguageProvider } from "@/contexts/LanguageContext";

const cairo = Cairo({
  subsets: ["arabic", "latin"],
  weight: ["300", "400", "500", "600", "700", "800", "900"],
  variable: "--font-cairo",
  display: "swap",
});

const siteUrl = "https://sakanybot.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "سكنى بوت | Sakanybot — مستشارك العقاري الذكي للشراء والبيع في مصر ودولياً",
    template: "%s | سكنى بوت Sakanybot",
  },
  description:
    "سكنى بوت (Sakanybot): مستشارك العقاري بالذكاء الاصطناعي وبحث مباشر في أكثر من 980 وحدة موثقة. ابحث عن شقق وفيلات وأراضي للبيع كاش أو بالتقسيط في التجمع الخامس، الشيخ زايد، العاصمة الإدارية، دبي، إسبانيا، وتركيا، أو اعرض وحدتك للبيع مجاناً للمشترين الجادين بدون مكالمات سيلز مزعجة.",
  applicationName: "Sakanybot | سكنى بوت",
  authors: [{ name: "Sakanybot AI", url: siteUrl }],
  creator: "Sakanybot Real Estate AI",
  publisher: "Sakanybot",
  keywords: [
    // الهوية والعلامة التجارية
    "سكنى بوت",
    "سكاني بوت",
    "Sakanybot",
    "Skanybot",
    // عقارات مصر (شراء وتقسيط)
    "عقارات مصر",
    "شقق للبيع في التجمع الخامس",
    "فيلات للبيع في الشيخ زايد",
    "شقق العاصمة الإدارية الجديدة",
    "كمبوندات التجمع الخامس بالتقسيط",
    "ماونتن فيو آي سيتي التجمع",
    "تاج سيتي القاهرة الجديدة",
    "بادية بالم هيلز أكتوبر",
    "عقارات مدينتي ومستقبل سيتي",
    "عقارات السادس من أكتوبر",
    "شاليهات الساحل الشمالي",
    "شراء عقار بالتقسيط في مصر",
    // بيع وحدات وعروض الملاك
    "اعرض شقتك للبيع مجانا",
    "بيع عقار من المالك مباشرة",
    "أراضي للبيع في مصر",
    "عروض الملاك المباشرة بدون عمولة",
    // عقارات دولية واستثمار
    "عقارات دبي بالتقسيط",
    "شقق للبيع في دبي ميدان ونخلة جميرا",
    "عقارات إسبانيا مالقة وماربيا وكوستا ديل سول",
    "شقق للبيع في إسطنبول وأنطاليا تركيا",
    "عقارات الجنسية التركية والإقامة الذهبية",
    "الاستثمار العقاري الدولي",
    // ذكاء اصطناعي وبروكر
    "بروكر عقارات ذكي",
    "شات بوت عقاري",
    "مستشار عقاري بالذكاء الاصطناعي",
    "حاسبة أقساط العقارات",
    "Real Estate AI Broker",
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
      "x-default": siteUrl,
    },
  },
  openGraph: {
    title: "سكنى بوت | Sakanybot — مستشارك العقاري الذكي للشراء والبيع",
    description:
      "تصفح وقارن أكثر من 980 عقار حقيقي موثق بالأسعار وخطط الأقساط في مصر، دبي، إسبانيا، وتركيا، أو اعرض وحدتك للبيع مباشرة للمشترين الجادين.",
    url: siteUrl,
    siteName: "سكنى بوت | Sakanybot",
    images: [
      {
        url: "/web-app-manifest-512x512.png",
        width: 512,
        height: 512,
        alt: "سكنى بوت Sakanybot - مستشارك العقاري الذكي",
      },
    ],
    locale: "ar_EG",
    alternateLocale: ["en_US", "tr_TR", "ru_RU", "de_DE", "fr_FR", "es_ES"],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "سكنى بوت | Sakanybot — مستشارك العقاري الذكي",
    description:
      "ابحث عن شقتك أو اعرض وحدتك للبيع بالذكاء الاصطناعي والبحث المباشر في مصر، دبي، إسبانيا، وتركيا بدون مكالمات سيلز مزعجة.",
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
    title: "سكنى بوت",
  },
  verification: {
    google: "googleaddb18d989d05866",
    other: {
      "msvalidate.01": "0A096C457F5CBA6563B74FAF4EBB0F47",
    },
  },
  category: "real estate",
  other: {
    // Geo-targeting and Local SEO + GEO signals
    "geo.region": "EG-C",
    "geo.placename": "New Cairo, Sheikh Zayed, Cairo, Dubai, Istanbul, Malaga",
    "geo.position": "30.0131;31.4989",
    "ICBM": "30.0131, 31.4989",
    "target": "all",
    "coverage": "Worldwide",
    "distribution": "Global",
    "rating": "General",
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
      name: "سكنى بوت | Sakanybot",
      alternateName: ["Skanybot", "سكاني بوت", "Sakanybot AI Real Estate"],
      inLanguage: ["ar", "en", "tr", "ru", "de", "fr", "es"],
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
      "@type": ["RealEstateAgent", "LocalBusiness", "Organization"],
      "@id": `${siteUrl}/#agent`,
      name: "سكنى بوت | Sakanybot",
      alternateName: ["Skanybot AI", "سكاني بوت العقاري"],
      url: siteUrl,
      logo: `${siteUrl}/logo.png`,
      image: `${siteUrl}/web-app-manifest-512x512.png`,
      description:
        "منصة الذكاء الاصطناعي والسوق العقاري الثنائي لشراء وبيع الشقق والفيلات والأراضي في مصر (التجمع الخامس، الشيخ زايد، العاصمة الإدارية، أكتوبر) ودولياً (دبي، إسبانيا، تركيا) ببيانات موثقة وحاسبة أقساط دقيقة.",
      priceRange: "$$ - $$$$",
      currenciesAccepted: "EGP, AED, USD, EUR",
      knowsLanguage: ["ar", "en", "tr", "ru", "de", "fr", "es"],
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
        { "@type": "City", name: "New Cairo (التجمع الخامس والقاهرة الجديدة)" },
        { "@type": "City", name: "Sheikh Zayed (الشيخ زايد)" },
        { "@type": "City", name: "New Administrative Capital (العاصمة الإدارية الجديدة)" },
        { "@type": "City", name: "6th of October (السادس من أكتوبر)" },
        { "@type": "City", name: "Madinaty & Mostakbal City (مدينتي ومستقبل سيتي)" },
        { "@type": "City", name: "Dubai (دبي - الإمارات)" },
        { "@type": "City", name: "Istanbul & Antalya (إسطنبول وأنطاليا - تركيا)" },
        { "@type": "City", name: "Malaga & Marbella (مالقة وماربيا - إسبانيا)" },
      ],
      hasOfferCatalog: {
        "@type": "OfferCatalog",
        name: "مخزون سكنى بوت العقاري الموثق (980+ وحدة)",
        itemListElement: [
          {
            "@type": "OfferCatalog",
            name: "شقق وفيلات للبيع بالتقسيط في مصر (القاهرة الجديدة، زايد، العاصمة)",
          },
          {
            "@type": "OfferCatalog",
            name: "عقارات استثمارية في دبي والإمارات بالدرهم الإماراتي",
          },
          {
            "@type": "OfferCatalog",
            name: "عقارات إسبانيا وتركيا المؤهلة للإقامة الذهبية والجنسية",
          },
          {
            "@type": "OfferCatalog",
            name: "عروض الملاك المباشرة (شقق، فيلات، أراضي للبيع من المالك)",
          },
        ],
      },
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
      name: "سكنى بوت | Sakanybot",
      applicationCategory: "RealEstateApplication",
      operatingSystem: "All",
      url: siteUrl,
      featureList: [
        "بحث عقاري ذكي بالذكاء الاصطناعي في 980+ وحدة موثقة",
        "وضع البحث المباشر الفوري وتصفية العقارات بدون شات",
        "حاسبة أقساط ومقدم دقيقة حتى 10 سنوات",
        "إضافة وعرض وحدات وأراضي الملاك للبيع مجاناً",
        "حجز معاينات مجانية بدون مكالمات مبيعات مزعجة",
      ],
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
          name: "ما هو سكنى بوت (Sakanybot) وكيف يساعدني في شراء أو بيع العقارات؟",
          acceptedAnswer: {
            "@type": "Answer",
            text: "سكنى بوت هو مستشارك العقاري بالذكاء الاصطناعي ومنصة بحث مباشر تضم أكثر من 980 وحدة سكنية وتجارية موثقة في مصر (التجمع الخامس، الشيخ زايد، العاصمة الإدارية، أكتوبر) ودولياً (دبي، إسبانيا، تركيا). يساعد المشترين في مقارنة الأسعار وحساب الأقساط بدقة، كما يتيح للملاك عرض وحداتهم وأراضيهم للبيع مجاناً للمشترين الجادين بدون مكالمات سيلز مزعجة.",
          },
        },
        {
          "@type": "Question",
          name: "ما هي أنظمة التقسيط وخطط السداد المتاحة في المشاريع العقارية؟",
          acceptedAnswer: {
            "@type": "Answer",
            text: "يوفر سكنى بوت حاسبة أقساط فورية مرتبطة ببيانات كل وحدة؛ حيث تبدأ المقدمات في المشاريع المصرية من 5% و10% بفترات تقسيط تصل إلى 8 و10 سنوات، وفي المشاريع الدولية (دبي وإسبانيا وتركيا) بمقدم يبدأ من 20% وتقسيط حتى 5 سنوات أو كاش بعائد استثماري مرتفع.",
          },
        },
        {
          "@type": "Question",
          name: "كيف أعرض شقتي أو فيلتي أو قطعة أرض للبيع على سكنى بوت؟",
          acceptedAnswer: {
            "@type": "Answer",
            text: "يمكنك عرض وحدتك مجاناً بالضغط على زر (وحداتي المعروضة للبيع) أو إخبار الشات بوت برغبتك في البيع ليفتح لك فورم إضافة الوحدة مباشرة؛ حيث تدخل المساحة والسعر والموقع وظروف البيع وترفع صور وحدتك الحقيقية ليتم ترشيحها فوراً للمشترين الباحثين في نفس المنطقة والميزانية.",
          },
        },
        {
          "@type": "Question",
          name: "هل يتوفر عقارات دولية في دبي أو إسبانيا أو تركيا؟",
          acceptedAnswer: {
            "@type": "Answer",
            text: "نعم، يضم سكنى بوت 343+ وحدة في دبي (ميدان، جزر دبي، مينا راشد، نخلة جميرا) بالدرهم الإماراتي، و244+ وحدة في إسبانيا (مالقة، ماربيا، كوستا ديل سول) باليورو، و141+ وحدة في تركيا (إسطنبول وأنطاليا) بالدولار الأمريكي مع توضيح العائد الاستثماري المتوقع ROI وبرامج الإقامة الذهبية والجنسية.",
          },
        },
        {
          "@type": "Question",
          name: "هل يمكنني تصفح العقارات مباشرة بدون التحدث مع الشات بوت؟",
          acceptedAnswer: {
            "@type": "Answer",
            text: "نعم، يوفر سكنى بوت زر تبديل سريع أعلى الشاشة للانتقال إلى (البحث المباشر) الذي يتيح لك فلترة جميع الـ 980+ وحدة حسب الدولة، المدينة، نوع العقار، عدد الغرف، والميزانية ومشاهدة كافة التفاصيل فوراً دون استهلاك رصيد المحادثة الذكية.",
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
    <html lang="ar" dir="rtl" className={`h-full antialiased dark ${cairo.variable}`} suppressHydrationWarning>
      <head>
        <link rel="alternate" type="text/plain" href="/llms.txt" title="LLM Summary Documentation" />
        <link rel="alternate" type="text/plain" href="/llms-full.txt" title="LLM Full Reference Documentation" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdData) }}
        />
      </head>
      <body className={`h-full w-full overflow-hidden ${cairo.className} transition-colors duration-200 bg-white dark:bg-black`} suppressHydrationWarning>
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

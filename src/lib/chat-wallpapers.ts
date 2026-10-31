export interface ChatWallpaper {
  id: string;
  name: string;
  nameEn: string;
  category: "doodle" | "pattern" | "solid" | "custom";
  previewBg: string;
  style: React.CSSProperties;
  className?: string;
  icon?: string;
}

// Helper to encode inline SVG as CSS data-uri with specified color
function encodeSvg(svgString: string, color: string = "rgba(255, 255, 255, 0.35)"): string {
  const colored = svgString.replace(/currentColor/g, color);
  return `url("data:image/svg+xml,${encodeURIComponent(colored.replace(/\s+/g, ' '))}")`;
}

// 1. Architectural & Real Estate Blueprint Luxury Doodle (720x720 tile)
const ARCHITECTURAL_DOODLE_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="240" height="240" viewBox="0 0 240 240" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
  <!-- Villa -->
  <path d="M15 35 L40 15 L65 35" />
  <path d="M22 30 V55 H58 V30" />
  <line x1="32" y1="38" x2="32" y2="55" />
  <line x1="48" y1="38" x2="48" y2="55" />
  <circle cx="40" cy="25" r="3.5" />
  <!-- Skyscraper -->
  <rect x="95" y="18" width="24" height="42" rx="2" />
  <line x1="101" y1="26" x2="105" y2="26" />
  <line x1="109" y1="26" x2="113" y2="26" />
  <line x1="101" y1="34" x2="105" y2="34" />
  <line x1="109" y1="34" x2="113" y2="34" />
  <line x1="101" y1="42" x2="105" y2="42" />
  <line x1="109" y1="42" x2="113" y2="42" />
  <path d="M107 18 V10 H111 V18" />
  <!-- Key of Home -->
  <circle cx="170" cy="25" r="9" />
  <circle cx="170" cy="25" r="3.5" />
  <path d="M178 30 L198 50" />
  <path d="M190 42 L194 38" />
  <path d="M194 46 L198 42" />
  <!-- Floor Plan Blueprint -->
  <rect x="20" y="95" width="45" height="38" rx="2" />
  <line x1="20" y1="112" x2="45" y2="112" />
  <line x1="45" y1="95" x2="45" y2="133" />
  <path d="M45 105 A10 10 0 0 1 55 115" stroke-dasharray="2 2" />
  <!-- Classical Column -->
  <path d="M98 96 H122 M95 99 H125 M100 99 V130 M107 99 V130 M113 99 V130 M120 99 V130 M95 130 H125 M98 133 H122" />
  <!-- Landscape Tree & Garden -->
  <path d="M175 92 C168 92 165 98 168 104 C164 107 165 113 170 115 C167 118 170 124 175 124 C180 124 183 118 180 115 C185 113 186 107 182 104 C185 98 182 92 175 92 Z" />
  <line x1="175" y1="124" x2="175" y2="135" stroke-width="2" />
  <!-- Location Pin -->
  <path d="M40 170 C30 170 24 178 24 186 C24 198 40 215 40 215 C40 215 56 198 56 186 C56 178 50 170 40 170 Z" />
  <circle cx="40" cy="186" r="5" />
  <!-- Drafting Compass -->
  <path d="M102 215 L110 175 L118 215" />
  <circle cx="110" cy="175" r="3.5" />
  <path d="M105 195 H115" />
  <!-- Modern Balcony & Sun -->
  <circle cx="180" cy="180" r="12" />
  <path d="M165 210 H205 M168 200 H202 M172 200 V210 M182 200 V210 M192 200 V210 M198 200 V210" />
</svg>`;

// 2. Palestine Heritage & Watermelon Solidarity Doodle
const WATERMELON_DOODLE_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="220" height="220" viewBox="0 0 220 220" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
  <!-- Watermelon Slice 1 -->
  <g transform="translate(15, 20)">
    <path d="M5 12 C18 42 50 42 62 12 Z" stroke="#16a34a" stroke-width="2" />
    <path d="M10 15 C20 38 46 38 56 15 Z" fill="#ef4444" fill-opacity="0.35" stroke="#ef4444" />
    <circle cx="25" cy="24" r="1.5" fill="currentColor" />
    <circle cx="34" cy="28" r="1.5" fill="currentColor" />
    <circle cx="43" cy="24" r="1.5" fill="currentColor" />
  </g>
  <!-- Olive Branch with Olives -->
  <g transform="translate(115, 20)">
    <path d="M5 40 Q22 24 45 5" stroke="#16a34a" stroke-width="1.8" />
    <path d="M14 30 Q8 20 16 18 Q22 22 14 30 Z" fill="#22c55e" fill-opacity="0.3" stroke="#16a34a" />
    <path d="M26 20 Q20 10 28 8 Q34 12 26 20 Z" fill="#22c55e" fill-opacity="0.3" stroke="#16a34a" />
    <circle cx="12" cy="18" r="3" fill="#15803d" />
    <circle cx="36" cy="28" r="3" fill="#15803d" />
  </g>
  <!-- Key of Return (مفتاح العودة الفلسطيني) -->
  <g transform="translate(25, 110)">
    <circle cx="16" cy="16" r="11" stroke="#eab308" stroke-width="2" />
    <circle cx="16" cy="16" r="4" stroke="#eab308" />
    <line x1="27" y1="16" x2="55" y2="16" stroke="#eab308" stroke-width="2" />
    <line x1="44" y1="16" x2="44" y2="25" stroke="#eab308" stroke-width="2" />
    <line x1="51" y1="16" x2="51" y2="25" stroke="#eab308" stroke-width="2" />
  </g>
  <!-- Palestinian Tatreez Embroidery Diamond (تطريز فلسطيني) -->
  <g transform="translate(130, 110)">
    <path d="M25 5 L45 25 L25 45 L5 25 Z" fill="#ef4444" fill-opacity="0.25" stroke="#dc2626" stroke-width="1.8" />
    <path d="M25 13 L37 25 L25 37 L13 25 Z" fill="#dc2626" fill-opacity="0.3" stroke="#dc2626" />
    <circle cx="25" cy="25" r="2.5" fill="#dc2626" />
  </g>
  <!-- Peace Dove & Olive Leaf -->
  <g transform="translate(75, 165)">
    <path d="M5 25 C15 15 25 15 35 25 C45 15 55 20 60 30 C50 32 40 38 35 45 C30 38 20 32 5 25 Z" stroke="#38bdf8" />
    <circle cx="50" cy="22" r="1.5" fill="#38bdf8" />
  </g>
</svg>`;

// 3. Arabesque & Islamic Geometric Octagram Star Pattern
const ARABESQUE_DOODLE_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="160" height="160" viewBox="0 0 160 160" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round">
  <!-- Central 8-Point Star Medallion -->
  <g transform="translate(80, 80)">
    <rect x="-24" y="-24" width="48" height="48" rx="2" />
    <rect x="-24" y="-24" width="48" height="48" rx="2" transform="rotate(45)" />
    <rect x="-14" y="-14" width="28" height="28" rx="1" />
    <rect x="-14" y="-14" width="28" height="28" rx="1" transform="rotate(45)" />
    <circle cx="0" cy="0" r="6" />
    <circle cx="0" cy="0" r="2" fill="currentColor" />
    <!-- 8 Interlocking Straps -->
    <line x1="0" y1="-24" x2="0" y2="-40" />
    <line x1="0" y1="24" x2="0" y2="40" />
    <line x1="-24" y1="0" x2="-40" y2="0" />
    <line x1="24" y1="0" x2="40" y2="0" />
  </g>
  <!-- Corner Star Quadrants -->
  <g transform="translate(0, 0)">
    <rect x="-16" y="-16" width="32" height="32" />
    <rect x="-16" y="-16" width="32" height="32" transform="rotate(45)" />
  </g>
  <g transform="translate(160, 0)">
    <rect x="-16" y="-16" width="32" height="32" />
    <rect x="-16" y="-16" width="32" height="32" transform="rotate(45)" />
  </g>
  <g transform="translate(0, 160)">
    <rect x="-16" y="-16" width="32" height="32" />
    <rect x="-16" y="-16" width="32" height="32" transform="rotate(45)" />
  </g>
  <g transform="translate(160, 160)">
    <rect x="-16" y="-16" width="32" height="32" />
    <rect x="-16" y="-16" width="32" height="32" transform="rotate(45)" />
  </g>
</svg>`;

export const CHAT_WALLPAPERS: ChatWallpaper[] = [
  {
    id: "architectural",
    name: "نقوش معمارية وهندسية فاخرة",
    nameEn: "Architectural & Real Estate Blueprint",
    category: "doodle",
    previewBg: "#0B141E",
    icon: "🏛️",
    style: {
      backgroundColor: "#070E16",
      backgroundImage: encodeSvg(ARCHITECTURAL_DOODLE_SVG, "rgba(245, 158, 11, 0.45)"),
      backgroundSize: "220px 220px",
      backgroundRepeat: "repeat",
    },
  },
  {
    id: "watermelon",
    name: "تراث وتضامن فلسطيني 🍉",
    nameEn: "Palestine Heritage & Watermelon 🍉",
    category: "doodle",
    previewBg: "#0B1E16",
    icon: "🍉",
    style: {
      backgroundColor: "#06150F",
      backgroundImage: encodeSvg(WATERMELON_DOODLE_SVG, "rgba(74, 222, 128, 0.45)"),
      backgroundSize: "220px 220px",
      backgroundRepeat: "repeat",
    },
  },
  {
    id: "arabesque",
    name: "أرابيسك هندسي إسلامي راقي",
    nameEn: "Arabesque Geometric Octagram",
    category: "doodle",
    previewBg: "#14101E",
    icon: "✨",
    style: {
      backgroundColor: "#0C0A14",
      backgroundImage: encodeSvg(ARABESQUE_DOODLE_SVG, "rgba(217, 119, 6, 0.42)"),
      backgroundSize: "160px 160px",
      backgroundRepeat: "repeat",
    },
  },
  {
    id: "blueprint_grid",
    name: "شبكة المخططات المعمارية 📐",
    nameEn: "Engineering Blueprint Grid",
    category: "pattern",
    previewBg: "#080F1D",
    icon: "📐",
    style: {
      backgroundColor: "#050B14",
      backgroundImage: `
        linear-gradient(to right, rgba(56, 189, 248, 0.18) 1px, transparent 1px),
        linear-gradient(to bottom, rgba(56, 189, 248, 0.18) 1px, transparent 1px)
      `,
      backgroundSize: "32px 32px",
      backgroundRepeat: "repeat",
    },
  },
  {
    id: "dots",
    name: "مصفوفة النقاط الحديثة",
    nameEn: "Architectural Dot Matrix",
    category: "pattern",
    previewBg: "#0A0A0E",
    icon: "·",
    style: {
      backgroundColor: "#060608",
      backgroundImage: "radial-gradient(circle, rgba(255, 255, 255, 0.22) 1.2px, transparent 1.2px)",
      backgroundSize: "22px 22px",
      backgroundRepeat: "repeat",
    },
  },
  {
    id: "solid_oled",
    name: "أسود ليلي خالص (OLED Black)",
    nameEn: "Pure OLED Black",
    category: "solid",
    previewBg: "#000000",
    icon: "⬛",
    style: {
      backgroundColor: "#000000",
    },
  },
  {
    id: "solid_navy",
    name: "كحلي هادئ مريح للعين",
    nameEn: "Midnight Architecture Navy",
    category: "solid",
    previewBg: "#091322",
    icon: "🟦",
    style: {
      backgroundColor: "#060E1A",
    },
  },
  {
    id: "solid_espresso",
    name: "قهوة دافئة ورمادي هادئ",
    nameEn: "Warm Espresso Slate",
    category: "solid",
    previewBg: "#14110E",
    icon: "🟫",
    style: {
      backgroundColor: "#0C0A08",
    },
  },
  {
    id: "none",
    name: "بدون نقوش (شاشة نقية)",
    nameEn: "Clean Minimalist (No Wallpaper)",
    category: "solid",
    previewBg: "#0B0F19",
    icon: "🌙",
    style: {
      backgroundColor: "transparent",
    },
  },
];

export const DEFAULT_WALLPAPER_ID = "architectural";
export const DEFAULT_WALLPAPER_OPACITY = 80; // 10 to 100

export function getSavedWallpaperConfig(): { id: string; opacity: number; customImage?: string } {
  if (typeof window === "undefined") {
    return { id: DEFAULT_WALLPAPER_ID, opacity: DEFAULT_WALLPAPER_OPACITY };
  }
  try {
    const rawId = localStorage.getItem("skanybot_chat_wallpaper_id");
    // Handle backwards compatibility alias: 'whatsapp' -> 'architectural'
    const id = (rawId === "whatsapp" || !rawId) ? DEFAULT_WALLPAPER_ID : rawId;
    const rawOpacity = localStorage.getItem("skanybot_chat_wallpaper_opacity");
    const opacity = rawOpacity !== null ? Math.max(10, Math.min(100, Number(rawOpacity))) : DEFAULT_WALLPAPER_OPACITY;
    const customImage = localStorage.getItem("skanybot_chat_wallpaper_custom") || undefined;
    return { id, opacity, customImage };
  } catch {
    return { id: DEFAULT_WALLPAPER_ID, opacity: DEFAULT_WALLPAPER_OPACITY };
  }
}

export function saveWallpaperConfig(id: string, opacity: number, customImage?: string) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem("skanybot_chat_wallpaper_id", id);
    localStorage.setItem("skanybot_chat_wallpaper_opacity", String(opacity));
    if (customImage) {
      localStorage.setItem("skanybot_chat_wallpaper_custom", customImage);
    } else if (id !== "custom") {
      localStorage.removeItem("skanybot_chat_wallpaper_custom");
    }
    window.dispatchEvent(new CustomEvent("skanybot-wallpaper-changed", { detail: { id, opacity, customImage } }));
  } catch (err) {
    console.warn("Failed to persist wallpaper preference:", err);
  }
}

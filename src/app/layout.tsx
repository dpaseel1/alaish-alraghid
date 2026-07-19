import type { Metadata, Viewport } from "next";
import { IBM_Plex_Sans_Arabic, Markazi_Text, Aref_Ruqaa } from "next/font/google";
import { NumeralNormalizer } from "@/components/NumeralNormalizer";
import "./globals.css";

const plexArabic = IBM_Plex_Sans_Arabic({
  subsets: ["arabic", "latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-plex-arabic",
});

const markazi = Markazi_Text({
  subsets: ["arabic", "latin"],
  weight: ["500", "600", "700"],
  variable: "--font-markazi",
});

const arefRuqaa = Aref_Ruqaa({
  subsets: ["arabic", "latin"],
  weight: ["400", "700"],
  variable: "--font-ruqaa",
});

export const metadata: Metadata = {
  title: {
    default: "العيش الرغيد",
    template: "%s | العيش الرغيد",
  },
  description:
    "منصة إدارة حلقات تحفيظ القرآن الكريم، المعلمات، الطالبات والتقارير",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f8fafc" },
    { media: "(prefers-color-scheme: dark)", color: "#0f172a" },
  ],
};

// سكربت مبكر يطبّق الوضع الداكن قبل رسم الصفحة، لتجنّب وميض الشاشة (FOUC)
const themeInitScript = `
(function () {
  try {
    var stored = localStorage.getItem("theme");
    var prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    if (stored === "dark" || (!stored && prefersDark)) {
      document.documentElement.classList.add("dark");
    }
  } catch (e) {}
})();
`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ar"
      dir="rtl"
      className={`${plexArabic.variable} ${markazi.variable} ${arefRuqaa.variable} h-full`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="min-h-full bg-background text-foreground antialiased font-sans transition-colors duration-200">
        <NumeralNormalizer />
        {children}
      </body>
    </html>
  );
}

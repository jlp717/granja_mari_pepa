import localFont from "next/font/local";

// Source: Kage secret-pathways-assets/fonts.css:1-7. Byte-identical payloads.
export const kageOnest = localFont({
  src: [
    { path: "./onest-300.woff2", weight: "300", style: "normal" },
    { path: "./onest-400.woff2", weight: "400", style: "normal" },
    { path: "./onest-500.woff2", weight: "500", style: "normal" },
    { path: "./onest-700.woff2", weight: "700", style: "normal" },
  ],
  variable: "--kage-font-onest",
  display: "swap",
  adjustFontFallback: false,
  preload: true,
});

export const kageJapanese = localFont({
  src: [{ path: "./notojp-400.woff2", weight: "400", style: "normal" }],
  variable: "--kage-font-jp",
  display: "swap",
  adjustFontFallback: false,
  preload: false,
});

// This22-character subset is retained for the literal reference, never GMP text.
export const kageWordmark = localFont({
  src: [
    { path: "./wordmark-500.woff2", weight: "500", style: "normal" },
    { path: "./wordmark-600.woff2", weight: "600", style: "normal" },
  ],
  variable: "--kage-font-wordmark",
  display: "swap",
  adjustFontFallback: false,
  preload: true,
});

export const kageFontVariables = [
  kageOnest.variable,
  kageJapanese.variable,
  kageWordmark.variable,
].join(" ");

// Canvas and FontFaceSet must use these resolved names rather than literal aliases.
export const kageFontFamilies = {
  onest: kageOnest.style.fontFamily,
  jp: kageJapanese.style.fontFamily,
  wordmark: kageWordmark.style.fontFamily,
} as const;

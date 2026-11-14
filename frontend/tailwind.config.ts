import tailwindAnimate from "tailwindcss-animate";
import type { Config } from "tailwindcss";

// Kage index.html:12-27,77-107,421-431. Semantic aliases below adapt Main
// component APIs; the literal Kage sheet is not inside a purgeable Tailwind layer.
const config: Config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  corePlugins: { preflight: false },
  theme: {
    extend: {
      screens: {
        xs: "560px",
        "3xl": "1920px",
        kage: "820px",
        "kage-wide": "1080px",
      },
      fontFamily: {
        sans: ["var(--kage-font-onest)", "system-ui", "sans-serif"],
        display: ["var(--kage-font-onest)", "sans-serif"],
        mono: ["var(--kage-font-onest)", "sans-serif"],
      },
      colors: {
        background: "hsl(var(--background) / <alpha-value>)",
        foreground: "hsl(var(--foreground) / <alpha-value>)",
        card: {
          DEFAULT: "hsl(var(--card) / <alpha-value>)",
          foreground: "hsl(var(--card-foreground) / <alpha-value>)",
          hover: "hsl(var(--card-hover) / <alpha-value>)",
          elevated: "hsl(var(--card-elevated) / <alpha-value>)",
        },
        popover: {
          DEFAULT: "hsl(var(--popover) / <alpha-value>)",
          foreground: "hsl(var(--popover-foreground) / <alpha-value>)",
        },
        primary: {
          DEFAULT: "hsl(var(--primary) / <alpha-value>)",
          foreground: "hsl(var(--primary-foreground) / <alpha-value>)",
          hover: "hsl(var(--primary-hover) / <alpha-value>)",
          active: "hsl(var(--primary-active) / <alpha-value>)",
          soft: "hsl(var(--primary-soft) / <alpha-value>)",
          muted: "hsl(var(--primary-muted) / <alpha-value>)",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary) / <alpha-value>)",
          foreground: "hsl(var(--secondary-foreground) / <alpha-value>)",
          hover: "hsl(var(--secondary-hover) / <alpha-value>)",
        },
        muted: {
          DEFAULT: "hsl(var(--muted) / <alpha-value>)",
          foreground: "hsl(var(--muted-foreground) / <alpha-value>)",
        },
        accent: {
          DEFAULT: "hsl(var(--accent) / <alpha-value>)",
          foreground: "hsl(var(--accent-foreground) / <alpha-value>)",
          soft: "hsl(var(--accent-soft) / <alpha-value>)",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive) / <alpha-value>)",
          foreground: "hsl(var(--destructive-foreground) / <alpha-value>)",
          soft: "hsl(var(--destructive-soft) / <alpha-value>)",
        },
        success: {
          DEFAULT: "hsl(var(--success) / <alpha-value>)",
          foreground: "hsl(var(--success-foreground) / <alpha-value>)",
          soft: "hsl(var(--success-soft) / <alpha-value>)",
        },
        warning: {
          DEFAULT: "hsl(var(--warning) / <alpha-value>)",
          foreground: "hsl(var(--warning-foreground) / <alpha-value>)",
          soft: "hsl(var(--warning-soft) / <alpha-value>)",
        },
        purple: {
          DEFAULT: "hsl(var(--purple) / <alpha-value>)",
          soft: "hsl(var(--purple-soft) / <alpha-value>)",
        },
        surface: {
          DEFAULT: "var(--kage-bg)",
          raised: "var(--kage-surface)",
          overlay: "var(--kage-surface)",
        },
        border: {
          DEFAULT: "hsl(var(--border) / <alpha-value>)",
          hover: "hsl(var(--border-hover) / <alpha-value>)",
        },
        input: "hsl(var(--input-border) / <alpha-value>)",
        ring: "hsl(var(--ring) / <alpha-value>)",
        chart: {
          "1": "hsl(var(--chart-1))",
          "2": "hsl(var(--chart-2))",
          "3": "hsl(var(--chart-3))",
          "4": "hsl(var(--chart-4))",
          "5": "hsl(var(--chart-5))",
        },
        kage: {
          ink: "var(--kage-bg)",
          surface: "var(--kage-surface)",
          bone: "var(--kage-fg)",
          muted: "var(--kage-fg-muted)",
          accent: "var(--kage-accent)",
        },
      },
      borderRadius: {
        DEFAULT: "var(--radius)",
        sm: "0px",
        md: "0px",
        lg: "0px",
        xl: "0px",
        "2xl": "0px",
        "3xl": "0px",
      },
      transitionTimingFunction: {
        premium: "cubic-bezier(.16,1,.3,1)",
        smooth: "cubic-bezier(.22,.61,.36,1)",
        "out-expo": "cubic-bezier(.16,1,.3,1)",
        "bounce-premium": "cubic-bezier(.65,0,.35,1)",
      },
      transitionDuration: {
        fast: "350ms",
        normal: "450ms",
        slow: "650ms",
        slower: "900ms",
      },
      boxShadow: {
        "glow-sm": "none",
        glow: "none",
        "glow-lg": "none",
        "glow-accent": "none",
        "inner-glow": "none",
        premium: "0 34px 70px -30px rgba(0,0,0,.9)",
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-conic":
          "conic-gradient(from 180deg at 50% 50%,var(--tw-gradient-stops))",
        "gradient-premium": "linear-gradient(145deg,var(--tw-gradient-stops))",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "fade-in": { from: { opacity: "0" }, to: { opacity: "1" } },
        "fade-out": { from: { opacity: "1" }, to: { opacity: "0" } },
      },
      animation: {
        "accordion-down": "accordion-down .65s cubic-bezier(.16,1,.3,1)",
        "accordion-up": "accordion-up .4s cubic-bezier(.22,.61,.36,1)",
        "fade-in": "fade-in .9s cubic-bezier(.16,1,.3,1)",
        "fade-out": "fade-out .4s cubic-bezier(.22,.61,.36,1)",
      },
    },
  },
  plugins: [tailwindAnimate],
};
export default config;

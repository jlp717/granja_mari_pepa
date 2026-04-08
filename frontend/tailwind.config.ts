import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: ['class'],
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        display: ['var(--font-display)', 'Arial', 'sans-serif'],
        text: ['var(--font-text)', 'Arial', 'sans-serif'],
        sans: ['var(--font-text)', 'Arial', 'sans-serif'],
      },
      screens: {
        'xs': '475px',
        '3xl': '1600px',
      },
      /* 🎨 Premium Background Images & Gradients */
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
        'gradient-premium': 'linear-gradient(135deg, var(--tw-gradient-stops))',
        'gradient-glow': 'radial-gradient(ellipse 80% 50% at 50% -20%, var(--tw-gradient-stops))',
        'shimmer': 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.1) 50%, transparent 100%)',
      },
      /* 🔲 Premium Border Radius Scale */
      borderRadius: {
        'sm': 'calc(var(--radius) - 4px)',    /* 4px */
        'DEFAULT': 'var(--radius)',            /* 8px */
        'md': 'calc(var(--radius) + 4px)',     /* 12px */
        'lg': 'calc(var(--radius) + 8px)',     /* 16px */
        'xl': 'calc(var(--radius) + 12px)',    /* 20px */
        '2xl': 'calc(var(--radius) + 16px)',   /* 24px */
        '3xl': 'calc(var(--radius) + 20px)',   /* 28px */
      },
      /* 🎨 Premium Color System */
      colors: {
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
          hover: 'hsl(var(--card-hover, var(--card)))',
          elevated: 'hsl(var(--card-elevated, var(--card)))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          hover: 'hsl(var(--primary-hover, var(--primary)))',
          active: 'hsl(var(--primary-active, var(--primary)))',
          foreground: 'hsl(var(--primary-foreground))',
          soft: 'hsl(var(--primary-soft))',
          muted: 'hsl(var(--primary-muted))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
          hover: 'hsl(var(--secondary-hover, var(--secondary)))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
          soft: 'hsl(var(--accent-soft))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
          soft: 'hsl(var(--destructive-soft))',
        },
        success: {
          DEFAULT: 'hsl(var(--success))',
          foreground: 'hsl(var(--success-foreground))',
          soft: 'hsl(var(--success-soft))',
        },
        warning: {
          DEFAULT: 'hsl(var(--warning))',
          foreground: 'hsl(var(--warning-foreground))',
          soft: 'hsl(var(--warning-soft))',
        },
        purple: {
          DEFAULT: 'hsl(var(--purple))',
          soft: 'hsl(var(--purple-soft))',
        },
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        chart: {
          '1': 'hsl(var(--chart-1))',
          '2': 'hsl(var(--chart-2))',
          '3': 'hsl(var(--chart-3))',
          '4': 'hsl(var(--chart-4))',
          '5': 'hsl(var(--chart-5))',
        },
      },
      /* 🌟 Premium Box Shadows */
      boxShadow: {
        'glow-sm': '0 0 10px hsl(var(--primary) / 0.2)',
        'glow': '0 0 20px hsl(var(--primary) / 0.3), 0 0 40px hsl(var(--primary) / 0.1)',
        'glow-lg': '0 0 30px hsl(var(--primary) / 0.4), 0 0 60px hsl(var(--primary) / 0.2)',
        'glow-accent': '0 0 20px hsl(var(--accent) / 0.3), 0 0 40px hsl(var(--accent) / 0.1)',
        'inner-glow': 'inset 0 0 20px hsl(var(--primary) / 0.1)',
        'premium': '0 10px 40px -10px hsl(var(--foreground) / 0.15), 0 0 0 1px hsl(var(--border) / 0.5)',
      },
      /* ⏱️ Premium Transition Timing */
      transitionTimingFunction: {
        'premium': 'cubic-bezier(0.16, 1, 0.3, 1)',
        'bounce-premium': 'cubic-bezier(0.34, 1.56, 0.64, 1)',
        'smooth': 'cubic-bezier(0.4, 0, 0.2, 1)',
        'out-expo': 'cubic-bezier(0.19, 1, 0.22, 1)',
      },
      /* ⏱️ Premium Transition Duration */
      transitionDuration: {
        'fast': '150ms',
        'normal': '250ms',
        'slow': '400ms',
        'slower': '600ms',
      },
      /* 🎬 Premium Keyframe Animations */
      keyframes: {
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' },
        },
        'fade-in': {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        'fade-out': {
          from: { opacity: '1' },
          to: { opacity: '0' },
        },
        'scale-in': {
          from: { opacity: '0', transform: 'scale(0.95)' },
          to: { opacity: '1', transform: 'scale(1)' },
        },
        'scale-out': {
          from: { opacity: '1', transform: 'scale(1)' },
          to: { opacity: '0', transform: 'scale(0.95)' },
        },
        'slide-in-from-top': {
          from: { opacity: '0', transform: 'translateY(-10px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'slide-in-from-bottom': {
          from: { opacity: '0', transform: 'translateY(10px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'slide-in-from-left': {
          from: { opacity: '0', transform: 'translateX(-10px)' },
          to: { opacity: '1', transform: 'translateX(0)' },
        },
        'slide-in-from-right': {
          from: { opacity: '0', transform: 'translateX(10px)' },
          to: { opacity: '1', transform: 'translateX(0)' },
        },
        'shimmer': {
          from: { backgroundPosition: '-200% 0' },
          to: { backgroundPosition: '200% 0' },
        },
        'pulse-glow': {
          '0%, 100%': { 
            boxShadow: '0 0 10px hsl(var(--primary) / 0.3)',
            transform: 'scale(1)',
          },
          '50%': { 
            boxShadow: '0 0 25px hsl(var(--primary) / 0.5), 0 0 40px hsl(var(--accent) / 0.3)',
            transform: 'scale(1.02)',
          },
        },
        'float': {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-4px)' },
        },
        'bounce-subtle': {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-25%)' },
        },
        'spin-slow': {
          from: { transform: 'rotate(0deg)' },
          to: { transform: 'rotate(360deg)' },
        },
      },
      /* 🎬 Premium Animation Classes */
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
        'fade-in': 'fade-in 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
        'fade-out': 'fade-out 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
        'scale-in': 'scale-in 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
        'scale-out': 'scale-out 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
        'slide-in-top': 'slide-in-from-top 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
        'slide-in-bottom': 'slide-in-from-bottom 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
        'slide-in-left': 'slide-in-from-left 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
        'slide-in-right': 'slide-in-from-right 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
        'shimmer': 'shimmer 2s cubic-bezier(0.4, 0, 0.2, 1) infinite',
        'pulse-glow': 'pulse-glow 2s cubic-bezier(0.4, 0, 0.2, 1) infinite',
        'float': 'float 3s cubic-bezier(0.4, 0, 0.2, 1) infinite',
        'bounce-subtle': 'bounce-subtle 1s cubic-bezier(0.34, 1.56, 0.64, 1)',
        'spin-slow': 'spin-slow 3s linear infinite',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
};
export default config;

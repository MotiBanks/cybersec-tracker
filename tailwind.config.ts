import type { Config } from "tailwindcss"

const config: Config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
    "*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
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
        "micro-movement": {
          "0%": { transform: "translate(0, 0)" },
          "25%": { transform: "translate(1px, 1px)" },
          "50%": { transform: "translate(0, -1px)" },
          "75%": { transform: "translate(-1px, 0)" },
          "100%": { transform: "translate(0, 0)" },
        },
        glow: {
          "0%": { boxShadow: "0 0 5px rgba(0, 255, 100, 0.5)" },
          "50%": { boxShadow: "0 0 20px rgba(0, 255, 100, 0.8)" },
          "100%": { boxShadow: "0 0 5px rgba(0, 255, 100, 0.5)" },
        },
        "fade-in": {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        "slide-in": {
          from: { transform: "translateY(20px)", opacity: "0" },
          to: { transform: "translateY(0)", opacity: "1" },
        },
        "task-complete": {
          "0%": { transform: "scale(1)" },
          "50%": { transform: "scale(1.05)" },
          "100%": { transform: "scale(1)" },
        },
        "xp-gain": {
          "0%": { opacity: "0", transform: "translateY(10px)" },
          "50%": { opacity: "1", transform: "translateY(-10px)" },
          "100%": { opacity: "0", transform: "translateY(-30px)" },
        },
        "streak-milestone": {
          "0%": { transform: "scale(1)" },
          "10%": { transform: "scale(1.1)" },
          "20%": { transform: "scale(1)" },
          "30%": { transform: "scale(1.1)" },
          "40%": { transform: "scale(1)" },
          "50%": { transform: "scale(1.1)" },
          "60%": { transform: "scale(1)" },
          "100%": { transform: "scale(1)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "micro-movement": "micro-movement 2s ease-in-out infinite",
        glow: "glow 2s ease-in-out infinite",
        "fade-in": "fade-in 0.3s ease-in-out",
        "slide-in": "slide-in 0.3s ease-in-out",
        "task-complete": "task-complete 0.5s ease-in-out",
        "xp-gain": "xp-gain 1.5s ease-out forwards",
        "streak-milestone": "streak-milestone 1.5s ease-in-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}

export default config

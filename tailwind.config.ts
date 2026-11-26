import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        terminal: {
          bg: "#070b12",
          surface: "#0d131f",
          elevated: "#131b2b",
          border: "#1f2a3d",
          hover: "#192338",
          muted: "#64748b",
          text: "#e2e8f0",
        },
        signal: {
          bull: "#10b981",
          bear: "#f43f5e",
          warn: "#f59e0b",
          info: "#38bdf8",
          accent: "#8b5cf6",
          cyan: "#06b6d4",
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
        mono: ["var(--font-jetbrains-mono)", "ui-monospace", "SFMono-Regular", "monospace"],
      },
      boxShadow: {
        terminal: "0 0 0 1px rgba(31, 42, 61, 0.9), 0 8px 30px rgba(0, 0, 0, 0.45)",
        glowGreen: "0 0 20px rgba(16, 185, 129, 0.2)",
        glowRed: "0 0 20px rgba(244, 63, 94, 0.2)",
        glowBlue: "0 0 20px rgba(56, 189, 248, 0.2)",
      },
    },
  },
  plugins: [],
};

export default config;

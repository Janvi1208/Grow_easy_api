import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        ink: "#14171F",
        paper: "#F7F6F3",
        panel: "#FFFFFF",
        line: "#E7E5E0",
        coral: {
          DEFAULT: "#FF6B45",
          dark: "#E4552F",
          light: "#FFE3D8",
        },
        moss: {
          DEFAULT: "#2E7D5B",
          light: "#DEF2E7",
        },
        slate: {
          DEFAULT: "#5B5F6B",
        },
        amber: {
          DEFAULT: "#B8720A",
          light: "#FBEBD0",
        },
        rose: {
          DEFAULT: "#C23A3A",
          light: "#FBE3E3",
        },
      },
      fontFamily: {
        display: ["var(--font-display)", "sans-serif"],
        body: ["var(--font-body)", "sans-serif"],
        mono: ["var(--font-mono)", "monospace"],
      },
      boxShadow: {
        soft: "0 1px 2px rgba(20, 23, 31, 0.04), 0 8px 24px rgba(20, 23, 31, 0.06)",
      },
      borderRadius: {
        xl2: "1.25rem",
      },
    },
  },
  plugins: [],
};
export default config;

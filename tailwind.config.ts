import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        ink: "#17201a",
        mint: "#28a86b",
        coral: "#e25555",
        paper: "#f7f8f4"
      },
      boxShadow: {
        soft: "0 22px 70px rgba(23, 32, 26, 0.12)",
        glow: "0 18px 44px rgba(40, 168, 107, 0.18)"
      }
    }
  },
  plugins: []
};

export default config;

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
        soft: "0 16px 48px rgba(23, 32, 26, 0.10)"
      }
    }
  },
  plugins: []
};

export default config;

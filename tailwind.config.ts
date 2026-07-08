import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        ink: "#172026",
        muted: "#5f6f78",
        line: "#d8e0e4",
        panel: "#f7f9fa",
        brand: "#2f6f73",
        accent: "#d95f45",
        note: "#f2b84b"
      },
      boxShadow: {
        soft: "0 16px 48px rgba(23, 32, 38, 0.08)"
      }
    }
  },
  plugins: []
};

export default config;

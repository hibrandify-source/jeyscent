import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./context/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "sans-serif"],
        serif: ["Playfair Display", "serif"],
      },
      colors: {
        cream: "#faf9f6",
        charcoal: "#1a1a1a",
        muted: "#6b6b6b",
        "light-gray": "#f0f0f0",
      },
    },
  },
  plugins: [],
};

export default config;
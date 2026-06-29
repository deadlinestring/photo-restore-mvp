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
        ink: "#243044",
        linen: "#faf3ea",
        coral: "#b85b5b",
        mint: "#6f9f94"
      },
      boxShadow: {
        soft: "0 20px 50px rgba(36, 48, 68, 0.10)"
      }
    }
  },
  plugins: []
};

export default config;

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
        ink: "#14213d",
        linen: "#f8f4ee",
        coral: "#e85d75",
        mint: "#3fb8af"
      },
      boxShadow: {
        soft: "0 20px 50px rgba(20, 33, 61, 0.10)"
      }
    }
  },
  plugins: []
};

export default config;

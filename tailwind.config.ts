import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#000000",
        card: "#111111",
        accent: "#FF6B00",
        "text-primary": "#FFFFFF",
        "text-secondary": "#8A8A8A",
      },
    },
  },
  plugins: [],
};

export default config;

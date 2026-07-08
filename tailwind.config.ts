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
        background: "#0A0D1A",
        card: "#141A29",
        accent: "#33FFE0",
        "text-primary": "#FFFFFF",
        "text-secondary": "#9CA3AF",
      },
    },
  },
  plugins: [],
};

export default config;

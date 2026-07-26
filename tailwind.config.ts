import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Forest survival palette (original)
        bark: "#3b2f26",
        moss: "#5c7a4b",
        fern: "#8bab6a",
        night: "#12161d",
        dusk: "#1d2530",
        mist: "#2b3540",
        ember: "#c76b3b",
        blood: "#a23b3b",
        herb: "#6fae7a",
        infect: "#8a5cc4",
        parchment: "#e8e0cf",
      },
      fontFamily: {
        display: ["ui-serif", "Georgia", "serif"],
        body: ["ui-sans-serif", "system-ui", "sans-serif"],
      },
      keyframes: {
        "fade-in": {
          "0%": { opacity: "0", transform: "translateY(6px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "pulse-soft": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.55" },
        },
        "rain-fall": {
          "0%": { transform: "translateY(-20%)" },
          "100%": { transform: "translateY(120%)" },
        },
        drift: {
          "0%": { transform: "translateX(-10%)" },
          "100%": { transform: "translateX(110%)" },
        },
      },
      animation: {
        "fade-in": "fade-in 0.35s ease-out",
        "pulse-soft": "pulse-soft 1.6s ease-in-out infinite",
        "rain-fall": "rain-fall 0.9s linear infinite",
        drift: "drift 30s linear infinite",
      },
    },
  },
  plugins: [],
};

export default config;

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: "#F7F8F6",
        surface: "#FFFFFF",
        ink: "#12151A",
        "ink-soft": "#5B6470",
        line: "#E7EAE6",
        teal: "#00B893",
        "teal-soft": "#E3F8F1",
        indigo: "#4B4FE0",
        "indigo-soft": "#ECEDFC",
        coral: "#FF6452",
        "coral-soft": "#FFEDEA",
        amber: "#E8A93B",
      },
      fontFamily: {
        display: ["'Space Grotesk'", "sans-serif"],
        body: ["Inter", "sans-serif"],
        mono: ["'IBM Plex Mono'", "monospace"],
      },
    },
  },
  plugins: [],
};

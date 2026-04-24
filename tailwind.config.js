/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-sans)", "ui-sans-serif", "system-ui"],
        reading: ["var(--font-reading)", "Georgia", "serif"],
      },
      colors: {
        surface: {
          DEFAULT: "#0e0e10",
          raised: "#18181c",
          overlay: "#222228",
        },
        line: {
          subtle: "#2a2a32",
          DEFAULT: "#3a3a46",
        },
        gold: {
          DEFAULT: "#c9a84c",
          muted: "#8a6e2f",
          bright: "#e8c56a",
        },
        ink: {
          primary: "#f0ede6",
          secondary: "#9d9a95",
          muted: "#5a5855",
        },
      },
      typography: {
        reading: {
          css: {
            lineHeight: "1.9",
            fontSize: "1.0625rem",
          },
        },
      },
    },
  },
  plugins: [],
};

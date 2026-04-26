/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-sans)", "ui-sans-serif", "system-ui"],
        reading: ["var(--font-reading)", "Georgia", "serif"],
      },
      colors: {
        surface: {
          DEFAULT: "var(--surface)",
          raised: "var(--surface-raised)",
          overlay: "var(--surface-overlay)",
        },
        line: {
          subtle: "var(--line-subtle)",
          DEFAULT: "var(--line)",
        },
        gold: {
          DEFAULT: "var(--gold)",
          muted: "var(--gold-muted)",
          bright: "var(--gold-bright)",
        },
        ink: {
          primary: "var(--ink-primary)",
          secondary: "var(--ink-secondary)",
          muted: "var(--ink-muted)",
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

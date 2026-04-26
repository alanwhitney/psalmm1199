"use client";

import { createContext, useContext, useEffect, useState } from "react";

type Theme = "dark" | "light";

const FONT_MIN = 13;
const FONT_MAX = 25;
const FONT_DEFAULT = 17;
const FONT_STEP = 2;

interface ThemeContextValue {
  theme: Theme;
  mounted: boolean;
  toggle: () => void;
  fontSize: number;
  incFontSize: () => void;
  decFontSize: () => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>("dark");
  const [fontSize, setFontSize] = useState(FONT_DEFAULT);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const storedTheme = localStorage.getItem("theme") as Theme | null;
    const storedSize = parseInt(localStorage.getItem("fontSize") ?? "", 10);
    setTheme(storedTheme ?? "dark");
    setFontSize(Number.isNaN(storedSize) ? FONT_DEFAULT : storedSize);
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    document.documentElement.classList.toggle("dark", theme === "dark");
    localStorage.setItem("theme", theme);
  }, [theme, mounted]);

  useEffect(() => {
    if (!mounted) return;
    document.documentElement.style.setProperty("--reading-font-size", `${fontSize}px`);
    localStorage.setItem("fontSize", String(fontSize));
  }, [fontSize, mounted]);

  function toggle() {
    setTheme((t) => (t === "dark" ? "light" : "dark"));
  }

  function incFontSize() {
    setFontSize((s) => Math.min(s + FONT_STEP, FONT_MAX));
  }

  function decFontSize() {
    setFontSize((s) => Math.max(s - FONT_STEP, FONT_MIN));
  }

  return (
    <ThemeContext.Provider value={{ theme, mounted, toggle, fontSize, incFontSize, decFontSize }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}

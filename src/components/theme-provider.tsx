"use client";

import { useEffect } from "react";

export function ThemeProvider() {
  useEffect(() => {
    const saved = localStorage.getItem("cqa-theme");
    if (saved === "dark") document.documentElement.classList.add("dark");
    else document.documentElement.classList.remove("dark");
  }, []);
  return null;
}

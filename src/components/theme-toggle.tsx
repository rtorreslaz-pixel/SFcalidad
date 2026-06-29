"use client";

import { useEffect, useState } from "react";

export function ThemeToggle() {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    setDark(document.documentElement.classList.contains("dark"));
  }, []);

  function toggle() {
    const isDark = document.documentElement.classList.toggle("dark");
    localStorage.setItem("cqa-theme", isDark ? "dark" : "light");
    setDark(isDark);
  }

  return (
    <button
      onClick={toggle}
      className="flex h-9 w-9 items-center justify-center rounded-full text-white/80 hover:bg-white/10"
      aria-label="Cambiar tema"
    >
      {dark ? "☀" : "☾"}
    </button>
  );
}

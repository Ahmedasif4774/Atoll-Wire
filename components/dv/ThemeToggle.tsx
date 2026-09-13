"use client";

import { useState } from "react";

// Dark/light toggle. Flips a data-theme attribute on <html>, which is what
// app/globals.css's html[data-theme="dark"] rules key off of — same
// mechanism as the original static site's inline <script>.
export default function ThemeToggle() {
  const [isDark, setIsDark] = useState(false);

  function toggle(e: React.MouseEvent) {
    e.preventDefault();
    const root = document.documentElement;
    const next = !isDark;
    root.setAttribute("data-theme", next ? "dark" : "light");
    setIsDark(next);
  }

  return (
    <a
      href="#"
      onClick={toggle}
      className="theme-toggle-btn"
      title="Toggle dark mode"
    >
      {isDark ? "☀️" : "🌙"}
    </a>
  );
}

/**
 * @module theme
 * Theme (dark/light) management.
 * Depends on language.js for logo updates on theme change.
 */
import { getCurrentLang, updateLogos } from "./language.js";

const root = document.documentElement;

/**
 * Applies theme to root dataset, updates logos, updates [data-theme-toggle] aria labels.
 * @param {"dark"|"light"} theme
 */
export function applyTheme(theme) {
  root.dataset.theme = theme;
  const isAr = getCurrentLang() === "ar";

  updateLogos();

  document.querySelectorAll("[data-theme-toggle]").forEach((button) => {
    button.textContent = "";
    button.setAttribute(
      "aria-label",
      theme === "dark"
        ? (isAr ? "التبديل إلى الثيم الفاتح" : "Switch to light mode")
        : (isAr ? "التبديل إلى الثيم الداكن" : "Switch to dark mode")
    );
    button.setAttribute(
      "title",
      theme === "dark"
        ? (isAr ? "الثيم الفاتح" : "Light theme")
        : (isAr ? "الثيم الداكن" : "Dark theme")
    );
    button.dataset.themeState = theme;
  });
}

/**
 * Reads saved theme, applies it, and attaches [data-theme-toggle] click listeners.
 */
export function initTheme() {
  const savedTheme = localStorage.getItem("ko-theme") || "light";
  applyTheme(savedTheme);

  document.querySelectorAll("[data-theme-toggle]").forEach((button) => {
    button.addEventListener("click", () => {
      const next = root.dataset.theme === "dark" ? "light" : "dark";
      localStorage.setItem("ko-theme", next);
      applyTheme(next);
    });
  });
}

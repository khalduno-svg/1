/**
 * @module language
 * Language & i18n management.
 * Handles RTL/LTR switching, logo variants, and data-i18n text swaps.
 */
const root = document.documentElement;

/**
 * Returns current language: "ar" or "en".
 * Reads from root.lang → localStorage("ko-lang") → defaults to "ar".
 * @returns {"ar"|"en"}
 */
export function getCurrentLang() {
  const saved = localStorage.getItem("kh_lang") || localStorage.getItem("ko-lang") || "ar";
  return saved.toLowerCase().startsWith("ar") ? "ar" : "en";
}

/**
 * Updates all [data-logo-en][data-logo-ar] images to match current lang + theme.
 * Called on init and on every lang/theme change.
 */
export function updateLogos() {
  const lang = getCurrentLang();
  const theme = root.dataset.theme || localStorage.getItem("ko-theme") || "light";

  document.querySelectorAll("[data-logo-en][data-logo-ar]").forEach((img) => {
    const next = theme === "dark"
      ? (lang === "ar" ? (img.dataset.logoArDark || img.dataset.logoAr) : (img.dataset.logoEnDark || img.dataset.logoEn))
      : (lang === "ar" ? img.dataset.logoAr : img.dataset.logoEn);

    const normalized = next
      ? (next.startsWith("//")
        ? "/" + next.replace(/^\/+/, "")
        : (next.startsWith("/") ? next : "/" + next.replace(/^\.\.\//, "").replace(/^\.\//, "")))
      : "";

    if (normalized && img.getAttribute("src") !== normalized) {
      img.setAttribute("src", normalized);
    }

    img.addEventListener("error", function handleLogoError() {
      img.removeEventListener("error", handleLogoError);
      img.setAttribute("src", "/shared/brand/logo/base/ko-logo.png");
    });
  });
}

function formatServicesCoreText() {
  const lang = getCurrentLang();
  const markers = lang === "ar"
    ? ["ماذا أقدم؟", "لمن؟", "النتيجة المتوقعة:"]
    : ["What I provide:", "For whom:", "Expected result:"];

  document.querySelectorAll(".services-core-item p[data-i18n-en]").forEach((p) => {
    const source = lang === "ar" ? (p.dataset.i18nAr || p.textContent) : (p.dataset.i18nEn || p.textContent);
    const parts = [];

    markers.forEach((marker, index) => {
      const start = source.indexOf(marker);
      if (start === -1) return;
      const nextMarkers = markers.slice(index + 1).map((m) => source.indexOf(m)).filter((i) => i > start);
      const end = nextMarkers.length ? Math.min(...nextMarkers) : source.length;
      const body = source.slice(start + marker.length, end).trim();
      parts.push(`<span class="services-core-line"><strong class="services-core-label">${marker}</strong> ${body}</span>`);
    });

    if (parts.length === markers.length) {
      p.innerHTML = parts.join("");
    }
  });
}

function hydrateOriginalSections() {
  const lang = getCurrentLang();

  document.querySelectorAll("[data-ar][data-en]").forEach((el) => {
    const value = lang === "ar" ? el.getAttribute("data-ar") : el.getAttribute("data-en");
    if (value !== null && value !== "" && (el.children.length === 0 || el.matches("a,button,span,small,b,strong,em,p,h1,h2,h3,h4,label,div"))) {
      el.textContent = value;
    }
  });

  document.querySelectorAll(".reveal").forEach((el) => el.classList.add("visible"));
}

/**
 * Applies language to the document: sets lang/dir, swaps [data-i18n-en] text,
 * updates page title, formats services core text, hydrates [data-ar][data-en] elements.
 * @param {"ar"|"en"} lang
 */
export function applyLang(lang) {
  root.lang = lang;
  root.dir = lang === "ar" ? "rtl" : "ltr";

  document.querySelectorAll("[data-lang-toggle]").forEach((button) => {
    button.textContent = "";
    button.setAttribute("aria-label", lang === "ar" ? "Switch language to English" : "تغيير اللغة إلى العربية");
    button.setAttribute("title", lang === "ar" ? "English" : "العربية");
  });

  updateLogos();

document.querySelectorAll("[data-i18n-en]").forEach((el) => {
  const value = lang === "ar" ? el.dataset.i18nAr : el.dataset.i18nEn;
  if (value !== undefined) el.textContent = value;
});

document.querySelectorAll("[data-placeholder-ar]").forEach((el) => {
  el.placeholder =
    lang === "ar"
      ? (el.dataset.placeholderAr || "")
      : (el.dataset.placeholderEn || "");
});

  document.title = document.body.dataset.titleAr && lang === "ar"
    ? document.body.dataset.titleAr
    : (document.body.dataset.titleEn || document.title);

  formatServicesCoreText();
  hydrateOriginalSections();
}

/**
 * Reads saved language, applies it, and attaches [data-lang-toggle] click listeners.
 * @param {function} [onLanguageChange] - Optional callback after each language switch.
 */
export function initLanguage(onLanguageChange) {
  const savedLang = localStorage.getItem("kh_lang") || localStorage.getItem("ko-lang") || "ar";
  localStorage.setItem("kh_lang", savedLang); // migrate ko-lang → kh_lang
  applyLang(savedLang);
  const header = document.querySelector(".site-header");
  if (header) header.style.visibility = "visible";

  document.querySelectorAll("[data-lang-toggle]").forEach((button) => {
    button.addEventListener("click", () => {
      const next = getCurrentLang() === "ar" ? "en" : "ar";
      localStorage.setItem("kh_lang", next);
      localStorage.setItem("ko-lang", next); // keep in sync for safety
      applyLang(next);
      if (typeof onLanguageChange === "function") onLanguageChange(next);
    });
  });
}

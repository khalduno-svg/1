/**
 * @module navigation
 * Mobile menu and active nav state management.
 */
function normalizePath(path) {
  try {
    const url = new URL(path, window.location.origin);
    let pathname = url.pathname;
    if (pathname.length > 1) pathname = pathname.replace(/\/+$/, "");
    return pathname || "/";
  } catch (error) {
    return path;
  }
}

function setMobileMenu(panel, menuButtons, open) {
  if (!panel) return;

  panel.classList.toggle("open", open);
  menuButtons.forEach((button) => {
    button.classList.toggle("active", open);
    button.setAttribute("aria-expanded", open ? "true" : "false");
  });
  document.body.classList.toggle("mobile-menu-open", open);
}

/**
 * Initializes mobile menu: open/close via [data-open-menu],
 * close via [data-close-menu] and .mobile-nav a, Escape key support.
 */
export function initMobileMenu() {
  const panel = document.querySelector(".mobile-panel");
  const menuButtons = document.querySelectorAll("[data-open-menu]");
  const closeTargets = document.querySelectorAll("[data-close-menu], .mobile-nav a");

  menuButtons.forEach((button) => {
    button.setAttribute("aria-expanded", "false");
    button.addEventListener("click", () => {
      const isOpen = panel && panel.classList.contains("open");
      setMobileMenu(panel, menuButtons, !isOpen);
    });
  });

  closeTargets.forEach((target) => target.addEventListener("click", () => setMobileMenu(panel, menuButtons, false)));
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") setMobileMenu(panel, menuButtons, false);
  });
}

/**
 * Marks nav links matching current pathname as active (class="active", aria-current="page").
 * Covers .site-header, .mobile-nav, .site-footer .footer-links.
 */
export function initActiveNavigation() {
  const current = normalizePath(window.location.pathname);

  document
    .querySelectorAll(".site-header a[href], .mobile-nav a[href], .site-footer .footer-links a[href]")
    .forEach((link) => {
      const href = link.getAttribute("href");

      if (!href || href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("tel:")) {
        return;
      }

      const target = normalizePath(href);
      link.classList.remove("active");
      link.removeAttribute("aria-current");

      if (target === current) {
        link.classList.add("active");
        link.setAttribute("aria-current", "page");
      }
    });
}

/**
 * Calls initMobileMenu() + initActiveNavigation().
 */
export function initNavigation() {
  initMobileMenu();
  initActiveNavigation();
}

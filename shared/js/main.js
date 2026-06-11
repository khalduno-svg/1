import { initLanguage } from "./modules/language.js";
import { applyTheme, initTheme } from "./modules/theme.js";
import { initNavigation } from "./modules/navigation.js";


/*
 * main.js — Page orchestrator.
 *
 * Modules:
 *   language.js  — RTL/LTR switching, i18n text swaps, logo variants
 *   theme.js     — dark/light toggle, localStorage persistence
 *   navigation.js — mobile menu, active nav state
 *
 * Page-specific functions (kept here, not extracted to modules):
 *   animateHomeMetrics()   — count-up animation for .home-metric-item h3
 *   initProfileTabs()      — tab switching for contact page profile panels
 *   initServiceCards()     — service modal open/close with i18n copy
 *   initCaseCards()        — case study modal open/close with i18n copy
 *   initServicesFlipCards()— flip card toggle for .services-core-item
 *
 * Execution order at bottom of file:
 *   initLanguage → applyTheme → initTheme → initNavigation → page functions
 */
function animateHomeMetrics() {
  const metrics = document.querySelectorAll(".home-metric-item h3");
  if (!metrics.length) return;

  const reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const run = (el) => {
    if (el.dataset.countAnimated === "true") return;

    const original = el.dataset.metricOriginal || el.textContent.trim();
    el.dataset.metricOriginal = original;
    const numeric = Number(original.replace(/[^0-9]/g, ""));

    if (!numeric || reduce) {
      el.textContent = original;
      el.dataset.countAnimated = "true";
      return;
    }

    const prefix = original.trim().startsWith("+") ? "+" : "";
    const hasComma = original.includes(",");
    const duration = 1200;
    const start = performance.now();

    const step = (now) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const value = Math.round(numeric * eased);
      el.textContent = prefix + (hasComma ? value.toLocaleString("en-US") : value.toString());

      if (progress < 1) {
        requestAnimationFrame(step);
      } else {
        el.textContent = original;
        el.dataset.countAnimated = "true";
      }
    };

    requestAnimationFrame(step);
  };

  if ("IntersectionObserver" in window) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          run(entry.target);
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.35 });

    metrics.forEach((el) => observer.observe(el));
  } else {
    metrics.forEach(run);
  }
}

function currentLang() {
  return (document.documentElement.lang || "en").toLowerCase().startsWith("ar") ? "ar" : "en";
}

function initProfileTabs() {
  document.querySelectorAll(".profile-tab[data-profile-tab]").forEach((tab) => {
    tab.addEventListener("click", () => {
      const key = tab.getAttribute("data-profile-tab");

      document.querySelectorAll(".profile-tab[data-profile-tab]").forEach((button) => {
        const active = button === tab;
        button.classList.toggle("active", active);
        button.setAttribute("aria-selected", active ? "true" : "false");
      });

      document.querySelectorAll(".profile-panel[data-profile-panel]").forEach((panel) => {
        panel.classList.toggle("active", panel.getAttribute("data-profile-panel") === key);
      });
    });
  });
}

function initServiceCards() {
  const serviceCopy = {
    "program-design": { en: "Designing local governance and participation programs from idea to implementation, with practical structures, indicators, roles, and delivery tools.", ar: "تصميم برامج الحكم المحلي والمشاركة من الفكرة إلى التنفيذ، مع هياكل عملية ومؤشرات وأدوار وأدوات تنفيذ واضحة." },
    toolkits: { en: "Developing templates, guides, checklists, and operational tools that teams can use directly in the field.", ar: "تطوير القوالب والأدلة وقوائم التحقق والأدوات التشغيلية التي تستطيع الفرق استخدامها مباشرة في الميدان." },
    facilitation: { en: "Designing and facilitating listening sessions, workshops, surveys, and structured community dialogue.", ar: "تصميم وتيسير جلسات الاستماع وورش العمل والاستبيانات والحوار المجتمعي المنظم." },
    capacity: { en: "Building the capabilities of teams, municipalities, and local leaders through practical training and applied learning.", ar: "بناء قدرات الفرق والبلديات والقيادات المحلية من خلال تدريب عملي وتعلم تطبيقي." },
    documentation: { en: "Turning field experience into lessons, stories, reports, case studies, and reusable knowledge products.", ar: "تحويل الخبرات الميدانية إلى دروس وقصص وتقارير ودراسات حالة ومنتجات معرفية قابلة لإعادة الاستخدام." }
  };

  const serviceModal = document.getElementById("serviceModal");
  const closeService = () => {
    if (serviceModal) {
      serviceModal.classList.remove("open");
      serviceModal.setAttribute("aria-hidden", "true");
    }
  };

  document.querySelectorAll("[data-service]").forEach((card) => {
    const open = () => {
      if (!serviceModal) return;
      const key = card.getAttribute("data-service");
      const title = card.querySelector("h3")?.textContent || "Service";
      document.getElementById("serviceModalTitle").textContent = title;
      document.getElementById("serviceModalText").textContent = (serviceCopy[key] || {})[currentLang()] || card.querySelector("p")?.textContent || "";
      serviceModal.classList.add("open");
      serviceModal.setAttribute("aria-hidden", "false");
    };

    card.addEventListener("click", open);
    card.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        open();
      }
    });
  });

  document.querySelectorAll("[data-service-close]").forEach((el) => el.addEventListener("click", closeService));
}

function initCaseCards() {
  const caseModal = document.getElementById("caseModal");

  const closeCase = () => {
    if (caseModal) {
      caseModal.classList.remove("open");
      caseModal.setAttribute("aria-hidden", "true");
      document.body.classList.remove("case-modal-lock");
    }
  };

  const pick = (card, field, lang) => {
    const suffix = lang === "ar" ? "Ar" : "En";
    return card.dataset[`${field}${suffix}`] || card.dataset[`${field}En`] || card.dataset[`${field}Ar`] || "";
  };

  const translatedText = (el, lang) => {
    if (!el) return "";
    return el.getAttribute(`data-i18n-${lang}`) || el.textContent.trim();
  };

  const set = (id, value) => {
    const el = document.getElementById(id);
    if (el) el.textContent = value || "";
  };

  document.querySelectorAll("[data-case]").forEach((card) => {
    const open = () => {
      if (!caseModal) return;
      const lang = currentLang();

      set("caseModalKicker", pick(card, "kicker", lang) || translatedText(card.querySelector("span"), lang));
      set("caseModalTitle", pick(card, "title", lang) || translatedText(card.querySelector("h3"), lang));
      set("caseModalSummary", pick(card, "summary", lang) || translatedText(card.querySelector("p"), lang));
      set("caseModalChallenge", pick(card, "challenge", lang));
      set("caseModalApproach", pick(card, "action", lang));
      set("caseModalOutcome", pick(card, "outcome", lang));
      set("caseModalLesson", pick(card, "lesson", lang));
      set("caseModalNote", pick(card, "note", lang));

      caseModal.classList.add("open");
      caseModal.setAttribute("aria-hidden", "false");
      document.body.classList.add("case-modal-lock");
    };

    card.addEventListener("click", open);
    card.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        open();
      }
    });
  });

  document.querySelectorAll("[data-case-close]").forEach((el) => el.addEventListener("click", closeCase));
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeCase();
  });
}

function initServicesFlipCards() {
  document.querySelectorAll(".services-card-face").forEach((face) => {
    face.addEventListener("click", (event) => {
      if (event.target.closest("a, button")) return;
      const card = face.closest(".services-core-item");
      if (card) card.classList.toggle("is-flipped");
    });
  });
}

initLanguage(() => applyTheme(document.documentElement.dataset.theme || localStorage.getItem("ko-theme") || "light"));
initTheme();
initNavigation();
animateHomeMetrics();
initProfileTabs();
initServiceCards();
initCaseCards();
initServicesFlipCards();


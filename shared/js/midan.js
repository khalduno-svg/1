
function detectContentLang(text){
  return /[\u0600-\u06FF]/.test(String(text || '')) ? 'ar' : 'en';
}

let translations = {};
let insights = [];
let toolkits = [];
let caseStudies = [];
let settings = {};
let currentModalItem = null;

function getUrlLanguage() {
  try {
    const value = new URLSearchParams(window.location.search).get('lang');
    return value === 'en' || value === 'ar' ? value : '';
  } catch (err) {
    return '';
  }
}

function setUrlLanguage(nextLang) {
  if (nextLang !== 'en' && nextLang !== 'ar') return;
  try {
    const url = new URL(window.location.href);
    url.searchParams.set('lang', nextLang);
    window.history.replaceState({}, '', url.toString());
  } catch (err) {}
}

function resolveInitialLanguage() {
  const urlLang = getUrlLanguage();
  if (urlLang === 'en' || urlLang === 'ar') {
    try { localStorage.setItem('kh_lang', urlLang); } catch(e) {}
    return urlLang;
  }
  try {
    const saved = localStorage.getItem('kh_lang') || localStorage.getItem('ko-lang') || 'ar';
    return (saved === 'en' || saved === 'ar') ? saved : 'ar';
  } catch(e) { return 'ar'; }
}

let lang = resolveInitialLanguage();
let theme = localStorage.getItem('kh_theme') || 'light';

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => Array.from(document.querySelectorAll(selector));


const CONTRIBUTION_TYPES = {
  ar: [
    'رؤية أو تحليل',
    'تجربة ميدانية',
    'درس مستفاد',
    'أداة أو نموذج',
    'دليل عملي',
    'إطار عمل',
    'مادة تدريبية',
    'تأمل مهني',
    'ملخص بحث',
    'ترشيح مورد',
    'أخرى'
  ],
  en: [
    'Insight or Analysis',
    'Field Experience',
    'Lesson Learned',
    'Toolkit or Template',
    'Practical Guide',
    'Framework',
    'Workshop Material',
    'Professional Reflection',
    'Research Summary',
    'Resource Recommendation',
    'Other'
  ]
};

const CONTACT_TYPES = {
  ar: [
    { value: 'Contribution', label: 'مساهمة' },
    { value: 'Service Request', label: 'طلب خدمة' },
    { value: 'Newsletter', label: 'اشتراك نشرة' },
    { value: 'General Message', label: 'رسالة عامة' }
  ],
  en: [
    { value: 'Contribution', label: 'Contribution' },
    { value: 'Service Request', label: 'Service Request' },
    { value: 'Newsletter', label: 'Newsletter' },
    { value: 'General Message', label: 'General Message' }
  ]
};

function isEnglishWithoutContent() {
  return lang === 'en' && !hasRenderableContent();
}

function setElementVisibility(el, visible) {
  if (!el) return;
  el.hidden = !visible;
  el.style.display = visible ? '' : 'none';
}

function syncContributionTypes() {
  const select = document.getElementById('contribType');
  if (!select) return;
  const current = select.value;
  const types = CONTRIBUTION_TYPES[lang] || CONTRIBUTION_TYPES.ar;
  select.innerHTML = types.map((type) => `<option value="${escapeHTML(type)}">${escapeHTML(type)}</option>`).join('');
  if (types.includes(current)) select.value = current;
}

function syncContactTypeOptions() {
  const select = document.getElementById('contribContactType');
  if (!select) return;
  const current = select.value || 'Contribution';
  const options = CONTACT_TYPES[lang] || CONTACT_TYPES.ar;
  select.innerHTML = options
    .map((item) => `<option value="${escapeHTML(item.value)}">${escapeHTML(item.label)}</option>`)
    .join('');
  select.value = options.some((item) => item.value === current) ? current : 'Contribution';
}

function setFieldGroupEnabled(group, enabled) {
  if (!group) return;
  group.hidden = !enabled;
  group.querySelectorAll('input, textarea, select').forEach((field) => {
    field.disabled = !enabled;
    if (field.hasAttribute('data-required-when-visible')) field.required = enabled;
  });
}

function updateContributionFormMode() {
  const mode = document.getElementById('contribContactType')?.value || 'Contribution';
  const groups = {
    role: document.querySelector('[data-contrib-group="role"]'),
    contributionType: document.querySelector('[data-contrib-group="contribution-type"]'),
    title: document.querySelector('[data-contrib-group="title"]'),
    message: document.querySelector('[data-contrib-group="message"]'),
    link: document.querySelector('[data-contrib-group="link"]')
  };

  const titleLabel = document.querySelector('label[for="contribIdeaTitle"]');
  const messageLabel = document.querySelector('label[for="contribSummary"]');
  const roleLabel = document.querySelector('label[for="contribRole"]');
  const submitBtn = document.querySelector('#contributionForm button[type="submit"]');

  const isContribution = mode === 'Contribution';
  const isService = mode === 'Service Request';
  const isNewsletter = mode === 'Newsletter';
  const isGeneral = mode === 'General Message';

  setFieldGroupEnabled(groups.role, isContribution || isService);
  setFieldGroupEnabled(groups.contributionType, isContribution);
  setFieldGroupEnabled(groups.title, isContribution || isService);
  setFieldGroupEnabled(groups.message, isContribution || isService || isGeneral);
  setFieldGroupEnabled(groups.link, isContribution);

  const text = {
    ar: {
      role: isService ? 'المؤسسة / الصفة' : 'الصفة / التخصص',
      title: isService ? 'الخدمة المطلوبة' : 'عنوان المساهمة',
      message: isGeneral ? 'الرسالة' : (isService ? 'تفاصيل الطلب' : 'وصف مختصر'),
      submit: isNewsletter ? 'إرسال الاشتراك' : (isService ? 'إرسال الطلب' : (isGeneral ? 'إرسال الرسالة' : 'إرسال المساهمة'))
    },
    en: {
      role: isService ? 'Organization / Role' : 'Role / Expertise',
      title: isService ? 'Requested Service' : 'Contribution Title',
      message: isGeneral ? 'Message' : (isService ? 'Request Details' : 'Short Description'),
      submit: isNewsletter ? 'Submit Subscription' : (isService ? 'Send Request' : (isGeneral ? 'Send Message' : 'Send Contribution'))
    }
  }[lang === 'en' ? 'en' : 'ar'];

  if (roleLabel) roleLabel.textContent = text.role;
  if (titleLabel) titleLabel.textContent = text.title;
  if (messageLabel) messageLabel.textContent = text.message;
  if (submitBtn) submitBtn.textContent = text.submit;

  const titleInput = document.getElementById('contribIdeaTitle');
  const messageInput = document.getElementById('contribSummary');
  if (titleInput) titleInput.required = isContribution || isService;
  if (messageInput) messageInput.required = isContribution || isService || isGeneral;
}

function syncLocalizedAttributes() {
  const emailInput = document.getElementById('emailInput');
  if (emailInput) emailInput.placeholder = t('email');

  document.querySelectorAll('[data-i18n-title]').forEach((el) => {
    const value = t(el.getAttribute('data-i18n-title'));
    if (value) el.setAttribute('title', value);
  });

  document.querySelectorAll('[data-ar][data-en]').forEach((el) => {
    if (el.id === 'khBrandTitle') return;
    const text = lang === 'ar' ? el.dataset.ar : el.dataset.en;
    if (text) el.textContent = text;
  });
}

function t(key) {
  const fallback = {
    en: {
      copied: 'Copied',
      saved: 'Saved',
      printPdf: 'Print PDF',
      shareOnWhatsAppText: 'Read this on MIDAN:',
      insightKind: 'Insight',
      toolkitKind: 'Toolkit',
      resourceSoon: 'File will be added soon',
      submitContribution: 'Submit a Contribution',
      copy: 'Copy link',
      save: 'Save',
      share: 'Share',
      copyInShareMenu: 'Copy link',
      shareMenuTitle: 'Share this content',
      shareMenuIntro: 'Choose a platform:',
      backToTop: 'Back to top',
      download: 'Download',
      preview: 'Preview',
      contributionModalLabel: 'Contribution',
      contribContactType: 'Type',
      contributionTitle: 'Submit a contribution',
      contributionText: 'Share a knowledge contribution related to local governance, civic participation, or community development, including insights, lessons learned, field experiences, practical resources, or training materials.',
      contribName: 'Name',
      contribEmail: 'Email',
      contribRole: 'Role / Expertise',
      contribType: 'Contribution Type',
      contribIdeaTitle: 'Contribution Title',
      contribSummary: 'Short Description',
      contribLink: 'Supporting Link or Material (Optional)',
      contributionSupportNote: 'You may include a draft, document, presentation, or supporting material related to your contribution.',
      noEnglishContentText: 'English resources and insights will be added gradually. You can also submit a contribution to help expand this knowledge space.',
      viewArabicContent: 'View Arabic Content',
      contributionNote: 'Your contribution will be submitted directly for editorial review.',
      cancel: 'Cancel',
      sendContribution: 'Send Contribution',
      contributionSent: 'Contribution submitted successfully. Thank you.',
      newsletterSent: 'Subscription submitted successfully. Thank you.',
      emailRequired: 'Please enter your email.',
      web3Sending: 'Sending...',
      web3SubmitError: 'Could not submit. Please try again.',
      web3ConnectionError: 'Connection error. Please try again.',
      sending: 'Sending...',
      submitError: 'Could not submit. Please check the key or try again later.',
      connectionError: 'Connection error. Please try again.'
    },
    ar: {
      copied: 'تم النسخ',
      saved: 'تم الحفظ',
      printPdf: 'طباعة PDF',
      shareOnWhatsAppText: 'اقرأ هذا المحتوى على محطة المعرفة:',
      insightKind: 'رؤية',
      toolkitKind: 'أداة',
      resourceSoon: 'سيتم إضافة الملف قريباً',
      submitContribution: 'أرسل مساهمة',
      copy: 'نسخ الرابط',
      save: 'حفظ',
      share: 'مشاركة',
      copyInShareMenu: 'نسخ الرابط',
      shareMenuTitle: 'مشاركة المحتوى',
      shareMenuIntro: 'اختر منصة المشاركة:',
      backToTop: 'العودة للأعلى',
      download: 'تحميل',
      preview: 'معاينة',
      contributionModalLabel: 'مساهمة',
      contribContactType: 'نوع التواصل',
      contributionTitle: 'إرسال مساهمة',
      contributionText: 'شارك مساهمة معرفية مرتبطة بالحكم المحلي أو المشاركة المجتمعية أو التنمية المحلية، مثل الرؤى، الدروس المستفادة، التجارب الميدانية، الأدوات العملية، أو المواد التدريبية.',
      contribName: 'الاسم',
      contribEmail: 'البريد الإلكتروني',
      contribRole: 'الصفة / التخصص',
      contribType: 'نوع المساهمة',
      contribIdeaTitle: 'عنوان المساهمة',
      contribSummary: 'وصف مختصر',
      contribLink: 'رابط أو مادة داعمة (اختياري)',
      contributionSupportNote: 'يمكنك مشاركة رابط لملف، مسودة، عرض تقديمي، أو أي مادة مرتبطة بالمساهمة.',
      noEnglishContentText: 'سيتم إضافة الموارد والرؤى تدريجيًا. يمكنك أيضًا إرسال مساهمة للمساعدة في إثراء هذه المساحة المعرفية.',
      viewArabicContent: 'عرض المحتوى العربي',
      contributionNote: 'سيتم إرسال المساهمة مباشرة للمراجعة عبر النموذج.',
      cancel: 'إلغاء',
      sendContribution: 'إرسال المساهمة',
      contributionSent: 'تم إرسال المساهمة بنجاح. شكرًا لك.',
      newsletterSent: 'تم إرسال الاشتراك بنجاح. شكرًا لك.',
      emailRequired: 'يرجى إدخال البريد الإلكتروني.',
      web3Sending: 'جارِ الإرسال...',
      web3SubmitError: 'تعذر الإرسال. حاول مرة أخرى.',
      web3ConnectionError: 'حدث خطأ في الاتصال. حاول مرة أخرى.',
      sending: 'جارِ الإرسال...',
      submitError: 'تعذر الإرسال. تحقق من المفتاح أو حاول لاحقًا.',
      connectionError: 'حدث خطأ في الاتصال. حاول مرة أخرى.'
    }
  };
  return (translations[lang] && translations[lang][key]) || (fallback[lang] && fallback[lang][key]) || key;
}

function val(value) {
  if (value === null || value === undefined) return '';
  if (typeof value === 'string') return value;
  if (Array.isArray(value)) return value;
  return value[lang] || value.ar || value.en || '';
}

function escapeHTML(str = '') {
  return String(str).replace(/[&<>'"]/g, (char) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    "'": '&#39;',
    '"': '&quot;'
  }[char]));
}

async function loadJSON(path) {
  const response = await fetch(path, { cache: 'no-store' });
  if (!response.ok) throw new Error('Failed to load ' + path);
  return response.json();
}

const MIDAN_DATA_BASE_PATHS = [
  'shared/data/midan',
  './shared/data/midan',
  '../shared/data/midan',
  'data/midan',
  './data/midan',
  '../data/midan'
];

async function loadKnowledgeData() {
  let lastError = null;

  for (const basePath of MIDAN_DATA_BASE_PATHS) {
    try {
      const [loadedTranslations, loadedInsights, loadedToolkits, loadedCases, loadedSettings] = await Promise.all([
        loadJSON(`${basePath}/translations.json`),
        loadJSON(`${basePath}/${lang}/insights.json`),
        loadJSON(`${basePath}/${lang}/toolkits.json`),
        loadJSON(`${basePath}/${lang}/case-studies.json`),
        loadJSON(`${basePath}/settings.json`)
      ]);

      translations = loadedTranslations || {};
      insights = Array.isArray(loadedInsights) ? loadedInsights : [];
      toolkits = Array.isArray(loadedToolkits) ? loadedToolkits : [];
      caseStudies = Array.isArray(loadedCases) ? loadedCases : [];
      settings = loadedSettings || {};

      if (!localStorage.getItem('kh_theme')) theme = settings.defaultTheme || 'light';
      return;
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError || new Error('MIDAN data failed to load from all known paths.');
}

function contentMap() {
  return [...insights, ...toolkits, ...caseStudies].reduce((acc, item) => {
    acc[item.id] = item;
    return acc;
  }, {});
}

function findById(items, id) {
  return items.find((item) => item.id === id) || items[0] || null;
}

function getFeaturedItems() {
  const featured = settings.featured || {};
  return {
    insight: findById(insights, featured.insightId),
    toolkit: findById(toolkits, featured.toolkitId),
    caseStudy: findById(caseStudies, featured.caseId)
  };
}

function setFeaturedCard(type, item, titleSelector, descSelector, descriptionField = 'summary') {
  const card = document.querySelector(`[data-featured-card="${type}"]`);
  if (card) card.setAttribute('data-open', item ? item.id : '');
  const title = $(titleSelector);
  const desc = $(descSelector);
  if (title) title.textContent = item ? val(item.title) : '';
  if (desc) desc.textContent = item ? val(item[descriptionField]) : '';
}


function hasRenderableContent() {
  return insights.length > 0 || toolkits.length > 0 || caseStudies.length > 0;
}

function applyContentAvailabilityState() {
  const noLanguageContent = !hasRenderableContent();
  const englishEmpty = lang === 'en' && noLanguageContent;
  const contentSectionIds = ['featured', 'insights', 'toolkit', 'case-studies'];

  contentSectionIds.forEach((id) => {
    setElementVisibility(document.getElementById(id), !englishEmpty);
  });

  const navContentSelectors = [
    'a[href="#featured"]',
    'a[href="#insights"]',
    'a[href="#toolkit"]',
    'a[href="#case-studies"]'
  ];
  navContentSelectors.forEach((selector) => {
    document.querySelectorAll(selector).forEach((el) => setElementVisibility(el, !englishEmpty));
  });

  document.querySelectorAll('.hero .actions').forEach((el) => setElementVisibility(el, !englishEmpty));
  setElementVisibility(document.getElementById('statsGrid'), !englishEmpty);

  const existing = document.getElementById('lang-empty-state');
  if (existing) existing.remove();

  if (!englishEmpty) return;

  const hero = document.querySelector('.hero');
  if (!hero) return;

  const div = document.createElement('section');
  div.id = 'lang-empty-state';
  div.className = 'section empty-state kh-language-empty-state';
  div.setAttribute('lang', 'en');
  div.setAttribute('dir', 'ltr');

  div.innerHTML = `
    <p>${escapeHTML(t('noEnglishContentText'))}</p>
    <div class="kh-empty-actions">
      <button class="btn btn-outline" type="button" id="switchArabic">${escapeHTML(t('viewArabicContent'))}</button>
      <button class="btn btn-primary" type="button" data-contribution-trigger>${escapeHTML(t('submitContribution'))}</button>
    </div>
  `;

  hero.insertAdjacentElement('afterend', div);
  document.getElementById('switchArabic')?.addEventListener('click', async () => {
    await switchLanguage('ar');
  });
}

async function switchLanguage(nextLang) {
  if (nextLang !== 'en' && nextLang !== 'ar') return;
  if (nextLang === lang) {
    setUrlLanguage(lang);
    syncMainSiteLinks();
    return;
  }
  lang = nextLang;
  try { localStorage.setItem('kh_lang', lang); localStorage.setItem('ko-lang', lang); } catch(e) {}
  setUrlLanguage(lang);
  await loadKnowledgeData();
  applyPrefs();
  syncResponsiveMenu();
  updateNav();
  updateBackToTop();
}

function syncMainSiteLinks() {
  const safeLang = lang === 'en' ? 'en' : 'ar';
  const target = `../index.html?lang=${encodeURIComponent(safeLang)}`;
  document.querySelectorAll('a[href]').forEach((link) => {
    const href = link.getAttribute('href') || '';
    if (href === '../index.html' || href.startsWith('../index.html?') || href === '../' || href.startsWith('../?') || href === '/index.html' || href.startsWith('/index.html?') || href === '/') {
      link.setAttribute('href', target);
    }
  });
}

function applyPrefs() {
  document.documentElement.lang = lang;
  document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
  document.documentElement.dataset.theme = theme;

  const langToggle = $('#langToggle');
  if (langToggle) langToggle.textContent = lang === 'ar' ? 'EN' : 'AR';
  const themeToggle = $('#themeToggle');
  if (themeToggle) themeToggle.textContent = theme === 'dark' ? t('themeLight') : t('themeDark');

  $$('[data-i18n]').forEach((el) => {
    el.textContent = t(el.dataset.i18n);
  });

  syncLocalizedAttributes();
  syncContributionTypes();
  syncContactTypeOptions();
  updateContributionFormMode();
  const backBtn = $('#backBtn');
  if (backBtn) backBtn.textContent = t('backBtn');
  syncMainSiteLinks();

  const featured = getFeaturedItems();
  setFeaturedCard('toolkit', featured.toolkit, '[data-featured-tool-title]', '[data-featured-tool-desc]', 'description');
  setFeaturedCard('insight', featured.insight, '[data-featured-insight-title]', '[data-featured-insight-desc]', 'summary');
  setFeaturedCard('case', featured.caseStudy, '[data-featured-case-title]', '[data-featured-case-desc]', 'lesson');

  syncKnowledgeBrandTitle();
  renderAll();
  applyContentAvailabilityState();
  document.documentElement.classList.remove('i18n-pending');
}

function renderStats() {
  const numbers = [
    insights.length,
    toolkits.length,
    caseStudies.length,
    insights.filter((item) => item.authorType === 'guest').length
  ];

  const labels = (settings.statsLabels && settings.statsLabels[lang]) || t('stats') || [];
  const statsGrid = $('#statsGrid');
  if (!statsGrid) return;
  statsGrid.innerHTML = labels.map((label, index) => `
    <div class="stat">
      <div class="stat-num">${numbers[index] ?? 0}</div>
      <div class="stat-label">${escapeHTML(label)}</div>
    </div>
  `).join('');
}

function renderInsights() {
  const insightsGrid = $('#insightsGrid');
  if (!insightsGrid) return;
  insightsGrid.innerHTML = insights.map((item) => {
    const isGuest = item.authorType === 'guest';
    return `
      <button class="insight-card" dir="${lang === 'ar' ? 'rtl' : 'ltr'}" lang="${lang}" data-open="${escapeHTML(item.id)}">
        <div class="card-label">${escapeHTML(val(item.category))}</div>
        <h3>${escapeHTML(val(item.title))}</h3>
        <p>${escapeHTML(val(item.summary))}</p>
        <div class="card-meta-row">
          <span class="author-name ${isGuest ? 'guest-author' : ''}">${escapeHTML(val(item.author))}</span>
          <span>•</span>
          <span>${escapeHTML(val(item.meta))}</span>
          ${isGuest ? `<span class="guest-badge">${escapeHTML(t('guestBadge'))}</span>` : ''}
        </div>
      </button>
    `;
  }).join('');
}

function renderToolkit() {
  const toolkitGrid = $('#toolkitGrid');
  if (!toolkitGrid) return;
  toolkitGrid.innerHTML = toolkits.map((item) => `
    <button class="card tool-card" dir="${lang === 'ar' ? 'rtl' : 'ltr'}" lang="${lang}" data-open="${escapeHTML(item.id)}">
      <div>
        <div class="pill">${escapeHTML(val(item.type))}</div>
        <h3>${escapeHTML(val(item.title))}</h3>
        <p>${escapeHTML(val(item.description))}</p>
      </div>
      <div>
        <div class="audience">${escapeHTML(val(item.audience))}</div>
        <span class="inline-cta">${escapeHTML(t('explore'))} <span>${lang === 'ar' ? '←' : '→'}</span></span>
      </div>
    </button>
  `).join('');
}

function renderCases() {
  const caseGrid = $('#caseGrid');
  if (!caseGrid) return;
  caseGrid.innerHTML = caseStudies.map((item) => `
    <button class="case-card" dir="${lang === 'ar' ? 'rtl' : 'ltr'}" lang="${lang}" data-open="${escapeHTML(item.id)}">
      ${[
        [t('challenge'), item.challenge],
        [t('action'), item.action],
        [t('outcome'), item.outcome],
        [t('lesson'), item.lesson]
      ].map(([label, value]) => `
        <div class="case-cell">
          <div class="card-label">${escapeHTML(label)}</div>
          <p>${escapeHTML(val(value))}</p>
        </div>
      `).join('')}
    </button>
  `).join('');
}

function renderAll() {
  renderStats();
  renderInsights();
  renderToolkit();
  renderCases();
}

function infoBlock(label, value) {
  return `
    <div class="info-block">
      <div class="card-label">${escapeHTML(label)}</div>
      <p>${escapeHTML(val(value))}</p>
    </div>
  `;
}

function renderModal(item) {
  $('#modalKind').textContent =
    item.kind === 'insight' ? t('insightKind') :
    item.kind === 'toolkit' ? (val(item.type) || t('toolkitKind')) :
    t('fieldCase');

  const body = $('#modalBody');
  body.setAttribute('dir', lang === 'ar' ? 'rtl' : 'ltr');
  body.setAttribute('lang', lang);

  if (item.kind === 'insight') {
    const isGuest = item.authorType === 'guest';
    body.innerHTML = `
      <div class="detail-meta">
        ${escapeHTML(val(item.category))} •
        <span class="author-name ${isGuest ? 'guest-author' : ''}">${escapeHTML(val(item.author))}</span>
        ${isGuest ? ` <span class="meta-dot" aria-hidden="true">•</span> <span class="guest-badge">${escapeHTML(t('guestBadge'))}</span>` : ''}
        <span class="meta-dot" aria-hidden="true">•</span> ${escapeHTML(val(item.date))} <span class="meta-dot" aria-hidden="true">•</span> ${escapeHTML(val(item.meta))}
      </div>
      <h2 class="detail-title" id="modalTitle">${escapeHTML(val(item.title))}</h2>
      <p class="detail-summary">${escapeHTML(val(item.summary))}</p>
      <div class="takeaways">
        <div class="card-label">${escapeHTML(t('takeaways'))}</div>
        <ul>${(val(item.takeaways) || []).map((point) => `<li>${escapeHTML(point)}</li>`).join('')}</ul>
      </div>
      <div class="body-copy">${(val(item.body) || []).map((paragraph) => `<p>${escapeHTML(paragraph)}</p>`).join('')}</div>
      <div class="modal-actions">
        <button class="btn btn-outline" data-modal-action="print">${escapeHTML(t('printPdf'))}</button>
        <button class="btn btn-primary" data-modal-action="share">${escapeHTML(t('share'))}</button>
      </div>
    `;
  }

  if (item.kind === 'toolkit') {
    const fileButton = item.file
      ? `<button class="btn btn-primary" type="button" data-modal-action="download" data-file="${escapeHTML(item.file)}">${escapeHTML(t('download'))}</button>`
      : `<button class="btn btn-primary" type="button" data-modal-action="download" data-file="">${escapeHTML(t('download'))}</button>`;

    body.innerHTML = `
      <div class="detail-meta">${escapeHTML(val(item.type))} <span class="meta-dot" aria-hidden="true">•</span> ${escapeHTML(val(item.audience))}</div>
      <h2 class="detail-title" id="modalTitle">${escapeHTML(val(item.title))}</h2>
      <p class="detail-summary">${escapeHTML(val(item.description))}</p>
      <div class="info-grid">
        ${infoBlock(t('problem'), item.problem)}
        ${infoBlock(t('when'), item.whenToUse)}
      </div>
      <div class="takeaways">
        <div class="card-label">${escapeHTML(t('how'))}</div>
        <ol class="steps">
          ${(val(item.steps) || []).map((step, index) => `
            <li class="step">
              <span class="step-num">${index + 1}</span>
              <span class="step-text">${escapeHTML(step)}</span>
            </li>
          `).join('')}
        </ol>
      </div>
      <div class="modal-actions">
        <button class="btn btn-outline" data-modal-action="share">${escapeHTML(t('share'))}</button>
        ${fileButton}
      </div>
    `;
  }

  if (item.kind === 'case') {
    body.innerHTML = `
      <div class="detail-meta">${escapeHTML(t('fieldCase'))}</div>
      <h2 class="detail-title" id="modalTitle">${escapeHTML(val(item.title))}</h2>
      <p class="detail-summary">${escapeHTML(val(item.background))}</p>
      <div class="info-grid">
        ${infoBlock(t('challenge'), item.challenge)}
        ${infoBlock(t('action'), item.action)}
        ${infoBlock(t('outcome'), item.outcome)}
        ${infoBlock(t('lesson'), item.lesson)}
      </div>
      <div class="takeaways">
        <div class="card-label">${escapeHTML(t('repeat'))}</div>
        <ul>${(val(item.repeatable) || []).map((point) => `<li>${escapeHTML(point)}</li>`).join('')}</ul>
      </div>
      <div class="modal-actions">
        <button class="btn btn-outline" data-modal-action="print">${escapeHTML(t('printPdf'))}</button>
        <button class="btn btn-primary" data-modal-action="share">${escapeHTML(t('share'))}</button>
      </div>
    `;
  }
}

function openModal(id) {
  const item = contentMap()[id];
  if (!item) return;

  currentModalItem = item;
  renderModal(item);

  const backdrop = $('#modalBackdrop');
  const modal = backdrop?.querySelector('.modal');
  const body = $('#modalBody');

  backdrop.classList.add('open');
  backdrop.setAttribute('aria-hidden', 'false');
  document.body.classList.add('kh-modal-open');
  document.body.style.overflow = 'hidden';

  requestAnimationFrame(() => {
    if (modal) modal.scrollTop = 0;
    if (body) body.scrollTop = 0;
  });
}

function closeModal() {
  const backdrop = $('#modalBackdrop');
  backdrop.classList.remove('open');
  backdrop.setAttribute('aria-hidden', 'true');
  document.body.classList.remove('kh-modal-open');
  document.body.style.overflow = '';
  document.querySelectorAll('.kh-share-overlay').forEach((el) => el.remove());
  currentModalItem = null;
}

function updateNav() {
  const sections = ['featured', 'insights', 'toolkit', 'case-studies', 'newsletter'];
  let current = '';

  sections.forEach((id) => {
    const el = document.getElementById(id);
    if (el && window.scrollY >= el.offsetTop - 120) current = id;
  });

  $$('.nav-link').forEach((el) => {
    el.classList.toggle('active', el.getAttribute('href') === '#' + current);
  });
}


function openContributionModal() {
  const backdrop = $('#contributionBackdrop');
  if (!backdrop) return;
  const modal = backdrop.querySelector('.modal');
  const body = backdrop.querySelector('.modal-body');

  backdrop.classList.add('open');
  backdrop.setAttribute('aria-hidden', 'false');
  document.body.classList.add('kh-modal-open');
  document.body.style.overflow = 'hidden';

  requestAnimationFrame(() => {
    if (modal) modal.scrollTop = 0;
    if (body) body.scrollTop = 0;
  });
}

function closeContributionModal() {
  const backdrop = $('#contributionBackdrop');
  if (!backdrop) return;
  backdrop.classList.remove('open');
  backdrop.setAttribute('aria-hidden', 'true');
  document.body.classList.remove('kh-modal-open');
  document.body.style.overflow = '';
  const status = $('#contributionStatus');
  if (status) status.textContent = '';
}



function getItemUrl(item = currentModalItem) {
  if (!item) return window.location.href;
  const hash = `${item.kind || 'item'}-${item.slug || item.id}`;
  return `${window.location.origin}${window.location.pathname}#${hash}`;
}

function getItemTitle(item = currentModalItem) {
  return item ? val(item.title) : document.title;
}

function getItemShareLabel(item = currentModalItem) {
  if (!item) return lang === 'ar' ? 'محتوى' : 'Content';
  if (item.kind === 'insight') return t('insightKind') || (lang === 'ar' ? 'مقال' : 'Insight');
  if (item.kind === 'case') return t('fieldCase') || (lang === 'ar' ? 'تجربة ميدانية' : 'Case Study');
  if (item.kind === 'toolkit') return val(item.type) || t('toolkitKind') || (lang === 'ar' ? 'أداة' : 'Toolkit');
  return lang === 'ar' ? 'محتوى' : 'Content';
}

function buildShareText(item = currentModalItem) {
  const title = getItemTitle(item);
  const url = getItemUrl(item);
  const label = getItemShareLabel(item);
  const summary = (item && (val(item.summary) || val(item.description) || val(item.background) || val(item.challenge))) || '';

  if (lang === 'ar') {
    return [
      `${label}: ${title}`,
      summary,
      'من محطة المعرفة — Khaldun Obeid',
      url
    ].filter(Boolean).join('\n\n');
  }

  return [
    `${label}: ${title}`,
    summary,
    'From MIDAN — Khaldun Obeid',
    url
  ].filter(Boolean).join('\n\n');
}

function getSharePayload(item = currentModalItem) {
  const title = getItemTitle(item);
  const url = getItemUrl(item);
  const label = getItemShareLabel(item);
  const summary = (item && (val(item.summary) || val(item.description) || val(item.background) || val(item.challenge))) || '';
  const hubName = lang === 'ar' ? 'محطة المعرفة — Khaldun Obeid' : 'MIDAN — Khaldun Obeid';
  const actionText = lang === 'ar' ? 'اقرأ المحتوى هنا:' : 'Read it here:';
  const subject = `${label}: ${title}`;

  const compactText = [
    `${label}: ${title}`,
    summary,
    hubName,
    actionText,
    url
  ].filter(Boolean).join('\n\n');

  const socialText = [
    `${label}: ${title}`,
    summary,
    hubName,
    actionText,
    url
  ].filter(Boolean).join('\n\n');

  const socialTextNoUrl = [
    `${label}: ${title}`,
    summary,
    hubName,
    actionText
  ].filter(Boolean).join('\n\n');

  return { title, url, label, summary, hubName, actionText, compactText, socialText, socialTextNoUrl, subject };
}

function printCurrentModal() {
  if (!currentModalItem) return;

  const modalBody = document.getElementById('modalBody');
  if (!modalBody) return;

  const printWindow = window.open('', '_blank', 'width=900,height=700');

  const title = getItemTitle(currentModalItem);
  const content = modalBody.innerHTML;

  printWindow.document.write(`
    <html dir="${lang === 'ar' ? 'rtl' : 'ltr'}" lang="${lang}">
    <head>
      <title>${escapeHTML(title)}</title>
      <style>
        @page{size:A4;margin:18mm;}
        body{font-family:Arial,sans-serif;line-height:1.85;color:#111;background:#fff;}
        h1,h2,h3{margin:0 0 18px;line-height:1.25;}
        .detail-title{font-size:28px !important;}
        .detail-meta,.detail-summary{color:#444;margin-bottom:18px;}
        .info-grid{display:grid;gap:14px;margin:24px 0;}
        .info-block,.takeaways{border:1px solid #ddd;border-radius:14px;padding:16px;margin:18px 0;}
        .body-copy p,.info-block p,.takeaways li{font-size:14px;line-height:1.9;}
        .modal-actions,.close,.modal-top button,.kh-share-menu{display:none !important;}
      </style>
    </head>
    <body>
      ${content}
    </body>
    </html>
  `);

  printWindow.document.close();

  setTimeout(() => {
    printWindow.focus();
    printWindow.print();
  }, 300);
}

function openShareMenu(action, modalTitle, modalUrl, shareText, originalText) {
  document.querySelectorAll('.kh-share-overlay').forEach((el) => el.remove());

  const payload = getSharePayload(currentModalItem);
  const encodedUrl = encodeURIComponent(payload.url);
  const encodedSubject = encodeURIComponent(payload.subject);
  const encodedSocialText = encodeURIComponent(payload.socialText);
  const encodedSocialTextNoUrl = encodeURIComponent(payload.socialTextNoUrl);
  const emailBody = encodeURIComponent(payload.socialText);

  const links = [
    {
      label: 'WhatsApp',
      href: `https://wa.me/?text=${encodedSocialText}`
    },
    {
      label: 'LinkedIn',
      href: `https://www.linkedin.com/feed/?shareActive=true&text=${encodedSocialText}`
    },
    {
      label: 'Facebook',
      href: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}&quote=${encodedSocialTextNoUrl}`
    },
    {
      label: 'X',
      href: `https://twitter.com/intent/tweet?text=${encodedSocialTextNoUrl}&url=${encodedUrl}`
    },
    {
      label: 'Email',
      href: `mailto:?subject=${encodedSubject}&body=${emailBody}`,
      target: ''
    }
  ];

  const overlay = document.createElement('div');
  overlay.className = 'kh-share-overlay';
  overlay.setAttribute('role', 'dialog');
  overlay.setAttribute('aria-modal', 'true');
  overlay.setAttribute('aria-label', t('shareMenuTitle') || 'Share');

  const shareMenu = document.createElement('div');
  shareMenu.className = 'kh-share-menu';
  shareMenu.setAttribute('dir', lang === 'ar' ? 'rtl' : 'ltr');
  shareMenu.setAttribute('lang', lang);

  shareMenu.innerHTML = `
    <div class="kh-share-head">
      <div>
        <div class="kh-share-title">${escapeHTML(t('shareMenuTitle') || (lang === 'ar' ? 'مشاركة المحتوى' : 'Share this content'))}</div>
        <p>${escapeHTML(t('shareMenuIntro') || (lang === 'ar' ? 'اختر منصة المشاركة:' : 'Choose a platform:'))}</p>
      </div>
      <button type="button" class="kh-share-close" aria-label="Close">×</button>
    </div>
    <div class="kh-share-preview">
      <strong>${escapeHTML(payload.title)}</strong>
      ${payload.summary ? `<span>${escapeHTML(payload.summary)}</span>` : ''}
      <small>${escapeHTML(payload.url)}</small>
    </div>
    <div class="kh-share-options">
      ${links.map((link) => `
        <a href="${link.href}" ${link.target === '' ? '' : 'target="_blank" rel="noopener"'} data-share-platform="${escapeHTML(link.label)}">${escapeHTML(link.label)}</a>
      `).join('')}
      <button type="button" class="kh-share-copy">${escapeHTML(t('copyInShareMenu') || t('copy') || 'Copy Link')}</button>
    </div>
  `;

  overlay.appendChild(shareMenu);
  document.body.appendChild(overlay);
  document.body.classList.add('kh-share-open');

  const close = () => {
    overlay.remove();
    if(!document.querySelector('.kh-share-overlay')) document.body.classList.remove('kh-share-open');
  };

  shareMenu.querySelector('.kh-share-close')?.addEventListener('click', close);

  shareMenu.querySelectorAll('.kh-share-options a').forEach((link) => {
    link.addEventListener('click', () => {
      setTimeout(close, 120);
    });
  });

  shareMenu.querySelector('.kh-share-copy')?.addEventListener('click', async () => {
    try {
      await navigator.clipboard?.writeText(payload.url);
    } catch (err) {
      const temp = document.createElement('textarea');
      temp.value = payload.url;
      document.body.appendChild(temp);
      temp.select();
      document.execCommand('copy');
      temp.remove();
    }

    const copyBtn = shareMenu.querySelector('.kh-share-copy');
    if (copyBtn) copyBtn.textContent = t('copied') || 'Copied';
    setTimeout(close, 700);
  });

  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) close();
  });
}

function updateBackToTop() {
  const btn = document.getElementById('backToTop');
  if (!btn) return;
  btn.classList.toggle('show', window.scrollY > 500);
}


function bindEvents() {
  document.addEventListener('click', (event) => {
    const contributionTrigger = event.target.closest('[data-contribution-trigger], #contributionBtn');
    if (contributionTrigger) {
      event.preventDefault();
      openContributionModal();
      const responsiveMenu = document.getElementById('khResponsiveMenu');
      const menuToggle = document.getElementById('khMenuToggle');
      responsiveMenu?.classList.remove('open');
      menuToggle?.setAttribute('aria-expanded', 'false');
      return;
    }

    if (event.target.closest('#backToTop')) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    const opener = event.target.closest('[data-open]');
    if (opener) openModal(opener.getAttribute('data-open'));

    if (event.target.id === 'modalBackdrop' || event.target.id === 'modalClose') {
      closeModal();
    }

    if (event.target.id === 'contributionBackdrop' || event.target.id === 'contributionClose' || event.target.id === 'contributionCancel') {
      closeContributionModal();
    }

    const action = event.target.closest('[data-modal-action]');
    if (action) {
      const modalUrl = getItemUrl(currentModalItem);
      const modalTitle = getItemTitle(currentModalItem);
      const shareText = buildShareText(currentModalItem);
      const originalText = action.textContent;

      if (action.dataset.modalAction === 'copy') {
        navigator.clipboard?.writeText(modalUrl);
        action.textContent = t('copied') || 'Copied';
        setTimeout(() => { action.textContent = originalText; }, 1200);
      }
      if (action.dataset.modalAction === 'print') {
        printCurrentModal();
      }
      if (action.dataset.modalAction === 'share') {
        if (navigator.share && window.innerWidth <= 768) {
          navigator.share({ title: modalTitle, text: getSharePayload(currentModalItem).socialTextNoUrl, url: getItemUrl(currentModalItem) }).catch(() => {});
        } else {
          openShareMenu(action, modalTitle, modalUrl, shareText, originalText);
        }
      }

      if (action.dataset.modalAction === 'preview') {
        document.querySelector('.modal')?.scrollTo({ top: 0, behavior: 'smooth' });
      }

      if (action.dataset.modalAction === 'download') {
        const file = action.dataset.file;
        if (file) {
          window.open(file, '_blank', 'noopener');
        } else {
          action.textContent = t('resourceSoon') || 'File will be added soon';
          setTimeout(() => { action.textContent = originalText; }, 1600);
        }
      }
    }
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') closeModal();
  });



  async function submitKnowledgeWeb3Form(form, status, successKey) {
    if (!form || !status) return;

    const key = form.querySelector('input[name="access_key"]');
    if (key) key.value = '2469e827-4a89-48e1-8d84-3b5f87b42709';

    const button = form.querySelector('button[type="submit"]');
    const original = button ? button.textContent : '';

    if (button) {
      button.disabled = true;
      button.textContent = t('web3Sending');
    }

    status.textContent = t('web3Sending');
    status.className = 'form-status sending';

    try {
      const response = await fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        body: new FormData(form),
        headers: { Accept: 'application/json' }
      });

      const result = await response.json();

      if (response.ok && result.success) {
        status.textContent = t(successKey);
        status.className = 'form-status success';
        form.reset();
      } else {
        status.textContent = (result && result.message) ? result.message : t('web3SubmitError');
        status.className = 'form-status error';
      }
    } catch (error) {
      status.textContent = t('web3ConnectionError');
      status.className = 'form-status error';
    } finally {
      if (button) {
        button.disabled = false;
        button.textContent = original;
      }
    }
  }

  $('#contribContactType')?.addEventListener('change', updateContributionFormMode);

  $('#contributionForm')?.addEventListener('submit', async (event) => {
    event.preventDefault();

    const form = event.currentTarget;
    const status = $('#contributionStatus');
    const mode = $('#contribContactType')?.value || 'Contribution';
    const name = $('#contribName')?.value.trim() || '';
    const email = $('#contribEmail')?.value.trim() || '';
    const role = $('#contribRole')?.value.trim() || '';
    const contributionType = $('#contribType')?.value || '';
    const title = $('#contribIdeaTitle')?.value.trim() || '';
    const message = $('#contribSummary')?.value.trim() || '';
    const link = $('#contribLink')?.value.trim() || '';

    const subjectField = $('#contributionSubjectField');
    const subjectMap = lang === 'ar'
      ? {
          Contribution: 'مساهمة معرفية',
          'Service Request': 'طلب خدمة',
          Newsletter: 'اشتراك نشرة',
          'General Message': 'رسالة عامة'
        }
      : {
          Contribution: 'Knowledge Contribution',
          'Service Request': 'Service Request',
          Newsletter: 'Newsletter Subscription',
          'General Message': 'General Message'
        };

    if (subjectField) {
      const base = subjectMap[mode] || subjectMap.Contribution;
      const detail = mode === 'Contribution' ? contributionType : title;
      subjectField.value = [base, detail, title].filter(Boolean).join(' - ');
    }

    // Keep Web3Forms payload clean: disabled fields are not submitted.
    updateContributionFormMode();

    // Do not submit empty optional fields.
    const optionalFields = [
      { el: $('#contribRole'), value: role },
      { el: $('#contribLink'), value: link }
    ];
    optionalFields.forEach(({ el, value }) => {
      if (!el) return;
      if (!value) el.disabled = true;
    });

    if (window.matchMedia('(max-width: 991px)').matches) {
      const labels = lang === 'ar'
        ? { type:'نوع التواصل', name:'الاسم', email:'البريد الإلكتروني', role:'الصفة / المؤسسة', contributionType:'نوع المساهمة', title:'العنوان', message:'الرسالة', link:'رابط أو مادة داعمة' }
        : { type:'Type', name:'Name', email:'Email', role:'Role / Organization', contributionType:'Contribution Type', title:'Title', message:'Message', link:'Supporting Link or Material' };
      const lines = [
        `${labels.type}: ${mode}`,
        `${labels.name}: ${name}`,
        `${labels.email}: ${email}`
      ];
      if (role) lines.push(`${labels.role}: ${role}`);
      if (mode === 'Contribution' && contributionType) lines.push(`${labels.contributionType}: ${contributionType}`);
      if (title) lines.push(`${labels.title}: ${title}`);
      if (message) lines.push('', `${labels.message}:`, message);
      if (link) lines.push('', `${labels.link}: ${link}`);
      window.location.href = `mailto:khalduno@gmail.com?subject=${encodeURIComponent(subjectField?.value || 'MIDAN')}&body=${encodeURIComponent(lines.join('\n'))}`;
      optionalFields.forEach(({ el }) => { if (el) el.disabled = false; });
      return;
    }

    await submitKnowledgeWeb3Form(form, status, mode === 'Newsletter' ? 'newsletterSent' : 'contributionSent');

    optionalFields.forEach(({ el }) => { if (el) el.disabled = false; });
    syncContactTypeOptions();
    syncContributionTypes();
    updateContributionFormMode();
  });

  $('.newsletter-form')?.addEventListener('submit', async (event) => {
    event.preventDefault();

    const form = event.currentTarget;
    const status = $('#newsletterStatus');
    const email = $('#emailInput');

    if (!email || !email.value.trim()) {
      if (status) {
        status.textContent = t('emailRequired');
        status.className = 'form-status error';
      }
      if (email) email.focus();
      return;
    }

    await submitKnowledgeWeb3Form(form, status, 'newsletterSent');
  });


  $('#langToggle').addEventListener('click', async () => {
    await switchLanguage(lang === 'en' ? 'ar' : 'en');
  });

  $('#themeToggle').addEventListener('click', () => {
    theme = theme === 'light' ? 'dark' : 'light';
    localStorage.setItem('kh_theme', theme);
    applyPrefs();
    syncResponsiveMenu();
  });

  document.addEventListener('click', (event) => {
    const link = event.target.closest && event.target.closest('a[href]');
    if (!link) return;
    const href = link.getAttribute('href') || '';
    if (href === '../index.html' || href.startsWith('../index.html?') || href === '../' || href.startsWith('../?') || href === '/index.html' || href.startsWith('/index.html?') || href === '/') {
      syncMainSiteLinks();
    }
  }, true);

  window.addEventListener('scroll', () => { updateNav(); updateBackToTop(); }, { passive: true });
}

window.addEventListener('popstate', async () => {
  const urlLang = getUrlLanguage();
  if (urlLang && urlLang !== lang) await switchLanguage(urlLang);
});

document.addEventListener('DOMContentLoaded', async () => {
  try {
    await loadKnowledgeData();
    if (!localStorage.getItem('kh_theme')) theme = settings.defaultTheme || theme;
    bindEvents();
    bindResponsiveMenu();
    applyPrefs();
    syncResponsiveMenu();
    updateNav();
    updateBackToTop();
  } catch (err) {
    console.error('MIDAN data loading failed:', err);
    document.documentElement.classList.remove('i18n-pending');
    document.body.insertAdjacentHTML(
      'afterbegin',
      '<div style="padding:16px;text-align:center;color:#b00020;background:#fff3f3">MIDAN data failed to load. Check JSON file paths.</div>'
    );
  }
});


/* === KH clean logical header + sidebar JS === */
function syncResponsiveMenu() {
  syncKnowledgeBrandTitle();
  const menuLang = document.getElementById('khMenuLang');
  const menuTheme = document.getElementById('khMenuTheme');

  if (menuLang) menuLang.textContent = lang === 'ar' ? 'EN' : 'AR';
  if (menuTheme) menuTheme.textContent = theme === 'dark' ? t('themeLight') : t('themeDark');

  document.querySelectorAll('.kh-responsive-link[data-i18n]').forEach((el) => {
    el.textContent = t(el.dataset.i18n);
  });
}

function bindResponsiveMenu() {
  const menu = document.getElementById('khResponsiveMenu');
  const toggle = document.getElementById('khMenuToggle');
  const menuLang = document.getElementById('khMenuLang');
  const menuTheme = document.getElementById('khMenuTheme');
  const langToggle = document.getElementById('langToggle');
  const themeToggle = document.getElementById('themeToggle');

  if (!menu || !toggle || toggle.dataset.khBound === 'true') return;
  toggle.dataset.khBound = 'true';

  const closeMenu = () => {
    menu.classList.remove('open');
    toggle.setAttribute('aria-expanded', 'false');
  };

  const openMenu = () => {
    syncResponsiveMenu();
    menu.classList.add('open');
    toggle.setAttribute('aria-expanded', 'true');
  };

  toggle.addEventListener('click', (event) => {
    event.stopPropagation();
    menu.classList.contains('open') ? closeMenu() : openMenu();
  });

  document.addEventListener('click', (event) => {
    if (!menu.classList.contains('open')) return;
    if (menu.contains(event.target) || toggle.contains(event.target)) return;
    closeMenu();
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') closeMenu();
  });

  document.querySelectorAll('.kh-responsive-link').forEach((link) => {
    link.addEventListener('click', closeMenu);
  });

  menuLang?.addEventListener('click', () => {
    langToggle?.click();
    setTimeout(syncResponsiveMenu, 0);
  });

  menuTheme?.addEventListener('click', () => {
    themeToggle?.click();
    setTimeout(syncResponsiveMenu, 0);
  });

  syncResponsiveMenu();
}
/* === end KH clean logical header + sidebar JS === */


/* === KH brand title language sync === */
function syncKnowledgeBrandTitle() {
  const title = document.getElementById('khBrandTitle');
  if (!title) return;
  title.textContent = lang === 'ar' ? (title.dataset.ar || 'محطة المعرفة') : (title.dataset.en || 'MIDAN');
}
/* === end KH brand title language sync === */

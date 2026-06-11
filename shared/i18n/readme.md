# i18n System

The current static version uses inline `data-i18n-ar` and `data-i18n-en` attributes.

## Defaults
- Default language: Arabic (`ar`)
- Default direction: RTL
- Default theme: Light

## How translation works
`/shared/js/main.js` reads all elements with `data-i18n-en` and swaps their text based on the active language.

Example:
```html
<h1 data-i18n-ar="عنوان عربي" data-i18n-en="English title">عنوان عربي</h1>
```

## Central labels
`site-labels.json` documents the shared labels and should be used later when migrating to Next.js.

## Maintenance rule
For static HTML, every bilingual UI text should include both:
- `data-i18n-ar`
- `data-i18n-en`

Do not hard-code one-language labels inside shared components.

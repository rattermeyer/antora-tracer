## Context

The project has two visual surfaces:
1. **Landing page** (`landing/index.html`) — static HTML served at GitHub Pages root, uses Tailwind CSS CDN with custom indigo/purple brand colors and Inter font
2. **Documentation site** (`public/docs/`) — built by Antora with the conemso UI bundle, uses teal palette (`#108193` base) and Roboto font

The conemso theme is defined in `@antora-ui-conemso` and provides a CSS custom property system. The key design tokens:

| Token | Value | Usage |
|---|---|---|
| `--color-conemso-base` | `#108193` | Primary links, borders |
| `--color-conemso-dark` | `#0d6b7a` | Hover states |
| `--color-conemso-darkest` | `#07424c` | Headings, navbar background |
| `--color-conemso-mid` | `#3ea0ad` | Accents |
| `--color-conemso-light` | `#8ecfd7` | Light accents |
| `--color-conemso-lighter` | `#d6eef2` | Panel backgrounds, borders |
| `--color-conemso-lightest` | `#edf6f8` | Page background |
| `--body-font-family` | `"Roboto", sans-serif` | All text |

The landing page currently uses Tailwind with a custom `brand` color scale based on indigo (`#6366f1`).

## Goals / Non-Goals

**Goals:**
- Replace all indigo/purple colors with conemso teal equivalents in the landing page
- Switch font from Inter to Roboto
- Maintain the same layout, content, and structure
- Zero changes to the Antora build, CI, or documentation site

**Non-Goals:**
- Rewriting the landing page in a different framework
- Adding a build step
- Changing the landing page content or structure
- Applying the conemso theme to the Antora docs (already done)
- Dark mode support on the landing page

## Decisions

### Decision 1: Map conemso colors to Tailwind `brand` scale

Rather than inlining hex values everywhere, update the Tailwind `brand` config to use conemso teal:

```
Current (indigo):         →  Target (conemso teal):
brand-50:  #eef2ff        →  #edf6f8  (conemso-lightest)
brand-100: #e0e7ff        →  #d6eef2  (conemso-lighter)
brand-200: #c7d2fe        →  #8ecfd7  (conemso-light)
brand-300: #a5b4fc        →  #3ea0ad  (conemso-mid)
brand-400: #818cf8        →  #108193  (conemso-base)
brand-500: #6366f1        →  #0d6b7a  (conemso-dark)
brand-600: #4f46e5        →  #07424c  (conemso-darkest)
brand-700: #4338ca        →  #07424c  (conemso-darkest)
brand-800: #3730a3        →  #0a1619  (navbar bg)
brand-900: #312e81        →  #12191c  (body bg dark)
brand-950: #1e1b4b        →  #0f1619  (footer bg)
```

This maps semantic Tailwind shades to conemso equivalents while preserving the class-based approach used throughout the HTML.

### Decision 2: Hero section gradient

Current: `linear-gradient(135deg, #0f0d2e 0%, #1e1b4b 50%, #312e81 100%)` (deep purple)

Target: `linear-gradient(135deg, #0a1619 0%, #07424c 50%, #108193 100%)` (dark teal → base teal)

Hero text colors also change from indigo tints to conemso tints:
- Main heading: `#e0e7ff` → `#d6eef2` (conemso-lighter)
- Sub-heading: `#c7d2fe` → `#8ecfd7` (conemso-light)
- Body text: `#a5b4fc` → `#edf6f8` (conemso-lightest)

### Decision 3: Font switch

Replace the Google Fonts import:
```
@import url("https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap");
```
with:
```
@import url("https://fonts.googleapis.com/css2?family=Roboto:wght@400;500;700&display=swap");
```

Update the `body` font-family in `landing.css` from `"Inter", system-ui, -apple-system, sans-serif` to `"Roboto", sans-serif`.

### Decision 4: Keep the same HTML structure, only change classes and inline styles

The landing page uses Tailwind utility classes extensively. The changes are:
1. Update `tailwind.config` color values (no class name changes needed — `bg-brand-700` stays `bg-brand-700` but resolves to teal instead of indigo)
2. Update inline `style="color: #..."` values in the hero section
3. Update CSS custom properties in `landing.css` (gradient, arrows, code blocks, stat section)

This minimizes the diff and keeps the page maintainable.

## Risks / Trade-offs

| Risk | Mitigation |
|---|---|
| Teal may have lower contrast than indigo on white | Conemso-darkest `#07424c` is darker than the old brand-700 `#4338ca` — actually better contrast |
| Roboto renders slightly wider than Inter | Minor layout shifts possible; verify hero text wrapping at mobile breakpoints |
| Tailwind CDN version may not support all conemso shades | Tailwind v3 CDN supports full custom color configs — confirmed working |
| Sub-pages (impressum, privacy) may look inconsistent | Update font in those pages too |

## Open Questions

None — the conemso palette is well-defined and the mapping is straightforward.

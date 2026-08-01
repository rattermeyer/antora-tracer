## Why

The landing page (`landing/index.html`) uses an indigo/purple color palette (`#6366f1`, `#312e81`) and the Inter font, while the Antora documentation site uses the conemso UI theme with a teal color palette (`#108193`) and Roboto font. Visitors navigating from the landing page to the docs experience a jarring visual disconnect — it feels like two different products. Aligning the landing page theme with the conemso UI creates a seamless brand experience.

## What Changes

- Landing page color palette: indigo/purple → conemso teal (`#108193` base, `#07424c` darkest, `#d6eef2` lightest)
- Landing page font: Inter → Roboto
- Tailwind CSS config updated with conemso color tokens
- Hero section gradient: deep purple → conemso dark teal gradient
- All brand-colored elements (buttons, links, icons, backgrounds) updated to teal
- Code blocks and stat section background updated to match conemso dark theme

## Capabilities

### New Capabilities

None — this modifies the existing `landing-page` capability.

### Modified Capabilities

- `landing-page`: Landing page visual theme updated from indigo/purple to conemso teal palette, font changed from Inter to Roboto, to match the conemso UI documentation theme.

## Impact

- **File modified**: `landing/index.html` — Tailwind config, all color classes, font import
- **File modified**: `landing/css/landing.css` — gradient, code block, and arrow colors
- **Other landing pages** (`impressum.html`, `privacy.html`) may need font update for consistency
- **No changes** to Antora playbook, documentation site, CI, or build process

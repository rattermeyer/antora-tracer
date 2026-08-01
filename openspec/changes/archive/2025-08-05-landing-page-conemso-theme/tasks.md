## 1. Update Tailwind CSS configuration

- [x] 1.1 Replace `brand` color scale in `landing/index.html` Tailwind config with conemso teal values
- [x] 1.2 Verify all `brand-*` utility classes render with teal colors

## 2. Update hero section

- [x] 2.1 Replace hero gradient in `landing/css/landing.css` with conemso dark teal gradient
- [x] 2.2 Update hero text inline styles (heading, subheading, body) to conemso tint colors

## 3. Update font

- [x] 3.1 Replace Inter font import with Roboto in `landing/index.html`
- [x] 3.2 Update `font-family` in `landing/css/landing.css` from Inter to Roboto
- [x] 3.3 Update font in `landing/impressum.html` and `landing/privacy.html` for consistency

## 4. Update CSS custom properties

- [x] 4.1 Update `.flow-arrow` color from indigo to conemso teal in `landing/css/landing.css`
- [x] 4.2 Update `.code-block` background and border to conemso dark theme colors
- [x] 4.3 Update `.feature-card:hover` border and shadow to conemso teal
- [x] 4.4 Update stat section background (`bg-brand-950`) — already handled by Tailwind config change

## 5. Verify

- [x] 5.1 Open `landing/index.html` in browser and confirm all colors are teal, not indigo
- [x] 5.2 Verify font renders as Roboto (check browser dev tools)
- [x] 5.3 Navigate from landing page to docs and confirm visual consistency
- [x] 5.4 Check mobile responsiveness at 375px and 768px widths

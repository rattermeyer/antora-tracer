## ADDED Requirements

### Requirement: Landing page uses conemso color palette
The landing page SHALL use the conemso teal color palette for all brand-colored elements, replacing the indigo/purple palette. Primary brand elements (buttons, links, icons, section backgrounds) SHALL use conemso teal (`#108193`) as the primary color and conemso darkest (`#07424c`) for headings and dark backgrounds.

#### Scenario: Hero section uses conemso gradient
- **WHEN** a visitor loads the landing page
- **THEN** the hero section background SHALL use a gradient from `#0a1619` through `#07424c` to `#108193` (conemso dark teal)

#### Scenario: Brand buttons use conemso colors
- **WHEN** a visitor views the landing page
- **THEN** primary action buttons (e.g., "Get Started") SHALL use conemso teal (`#108193`) as their background color on hover and as their text color in the default state

#### Scenario: Feature cards use conemso accent on hover
- **WHEN** a visitor hovers over a feature card
- **THEN** the card border SHALL change to conemso mid teal (`#3ea0ad`) and the box shadow SHALL use conemso base with reduced opacity

### Requirement: Landing page uses Roboto font
The landing page SHALL use the Roboto font family (matching the conemso UI theme) instead of Inter for all text content.

#### Scenario: Page renders with Roboto
- **WHEN** a visitor loads the landing page
- **THEN** all body text SHALL render in the Roboto font family with sans-serif fallback

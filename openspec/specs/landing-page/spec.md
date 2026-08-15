# Landing Page

## Purpose

A static HTML landing page hosted at the GitHub Pages root that introduces antora-tracer to visitors before they enter the Antora documentation site. Targets two audiences: developers/architects comfortable with docs-as-code, and requirements engineers/PMs focused on traceability and compliance.

## Requirements

### Requirement: Landing page at GitHub Pages root
The system SHALL serve a landing page at the GitHub Pages root URL (`/`) that introduces the antora-tracer project before visitors enter the documentation, while the Antora documentation site remains accessible at `/docs/`.

#### Scenario: Visitor lands on root URL
- **WHEN** a visitor navigates to the GitHub Pages root URL
- **THEN** the landing page is displayed with project introduction, feature highlights, and navigation to the documentation

#### Scenario: Visitor navigates to documentation
- **WHEN** a visitor clicks a documentation link on the landing page
- **THEN** the Antora documentation site at `/docs/` is loaded

#### Scenario: Docs site retains full functionality
- **WHEN** a visitor browses the Antora documentation at `/docs/`
- **THEN** all navigation, page content, and traceability matrices function as before the landing page addition

### Requirement: Two-persona feature presentation
The landing page SHALL present project features in a way that resonates with both developers/architects (docs-as-code natives) and requirements engineers/project managers (traceability/compliance focused users).

#### Scenario: Developer persona sees relevant features
- **WHEN** a developer or architect views the features section
- **THEN** they SHALL see messaging about Git-native workflows, CI/CD integration, CLI/API access, and extensible role configuration

#### Scenario: RE/PM persona sees relevant features
- **WHEN** a requirements engineer or project manager views the features section
- **THEN** they SHALL see messaging about visual traceability matrices, coverage reporting, Neo4j export, and compliance evidence

### Requirement: Traceability visualization preview
The landing page SHALL include a visual preview of traceability output that links to the live traceability matrices in the documentation site.

#### Scenario: Traceability preview is visible
- **WHEN** a visitor scrolls to the traceability section
- **THEN** a visual representation of the traceability matrix or graph is displayed

#### Scenario: Preview links to full matrix
- **WHEN** a visitor clicks on the traceability preview
- **THEN** they are navigated to the live traceability matrix in the documentation site at `/docs/`

### Requirement: Deployment integration
The GitHub Pages deployment workflow SHALL place the landing page at the root and the Antora documentation in a `/docs/` subdirectory, with both built and deployed from the same repository.

#### Scenario: CI builds and deploys both artifacts
- **WHEN** changes are pushed to the main branch
- **THEN** the CI workflow builds the Antora site to `public/docs/`, copies landing page assets from `landing/` to `public/`, and deploys the combined `public/` directory to GitHub Pages

#### Scenario: Landing page build does not interfere with docs
- **WHEN** the landing page assets are copied to `public/`
- **THEN** the Antora documentation at `public/docs/` is not modified or removed

#### Scenario: Antora clean does not remove landing page
- **WHEN** Antora runs with `clean: true` on `output.dir: ./public/docs`
- **THEN** only `public/docs/` is cleaned; the landing page at `public/index.html` and its assets are preserved

### Requirement: Minimal tooling
The landing page SHALL require no build step or installed dependencies to deploy — it SHALL be served as static HTML.

#### Scenario: Page renders without build step
- **WHEN** a developer opens `landing/index.html` directly in a browser
- **THEN** the page renders correctly with Tailwind CSS styles loaded from CDN

#### Scenario: No package.json changes required
- **WHEN** the change is applied
- **THEN** the project's `package.json`, `node_modules/`, and build scripts (`npm run build`) are unchanged

### Requirement: Landing page uses conemso color palette
The landing page SHALL use a consistent brand color palette for all brand-colored elements. Primary brand elements (buttons, links, icons, section backgrounds) SHALL use the primary brand color for interactive elements and a darker variant for headings and dark backgrounds.

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
The landing page SHALL use a consistent font family matching the documentation site theme for all text content.

#### Scenario: Page renders with Roboto
- **WHEN** a visitor loads the landing page
- **THEN** all body text SHALL render in the Roboto font family with sans-serif fallback

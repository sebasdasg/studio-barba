# Handoff: Landing Page — Studio Barba

## Overview
Landing page (visual design only, no backend/booking logic) for Studio Barba, a modern men's barbershop offering both classic and modern cuts. Sections: sticky nav, hero, cut catalog, about, photo strip, testimonials, location/hours, footer.

## About the Design Files
The original file (`studio-barba-landing.html`) is a **design reference built in HTML** — a high-fidelity prototype of look, layout, and copy, not production code to copy as-is. The task is to **recreate this design in the target codebase's environment** (Next.js/React here), using its existing component patterns, routing, and state management. Note: the original file used a custom internal templating syntax (`{{ }}`, `<sc-for>`) — ignore that syntax; treat it purely as a rendered reference of final HTML/CSS.

## Fidelity
**High-fidelity.** Colors, typography, spacing, and copy are final for this stage. Booking/reservation functionality (the "Reservar cita" button) is out of scope for the landing itself — it should link to the reservation flow once built, per the functional requirements doc.

## Screens / Views
Single scrolling page, sections in order:

### 1. Nav (sticky)
- Sticky top, `z-index: 50`, padding `20px 6vw`, background `oklch(13% 0.015 55 / 0.75)` with `backdrop-filter: blur(8px)`, bottom border `1px solid oklch(28% 0.015 55)`.
- Left: wordmark "STUDIO BARBA", font Bebas Neue, 28px, letter-spacing 2px.
- Right: nav links (Cortes, Nosotros, Opiniones, Contacto) — Inter 500, 13px, uppercase, letter-spacing 1.5px, color `oklch(88% 0.01 85)`; anchor links to section ids (`#catalogo`, `#nosotros`, `#testimonios`, `#contacto`).
- CTA pill button "Reservar cita": background `oklch(72% 0.11 75)` (brass), text `oklch(17% 0.015 55)`, padding `10px 22px`, `border-radius: 999px`, 13px bold uppercase.

### 2. Hero
- Full-bleed background image (barbershop interior) with a dark gradient overlay (`linear-gradient(180deg, oklch(15% 0.015 55/0.75) 0%, oklch(15% 0.015 55/0.55) 50%, oklch(15% 0.015 55/0.9) 100%)`), `min-height: 100vh`, centered content.
- Small brass accent bar (60×3px) above headline.
- Headline: "Estilo clásico.<br/>Actitud moderna." — Bebas Neue, `clamp(56px, 10vw, 130px)`, line-height 0.95, uppercase.
- Subcopy (Inter, 18px, `oklch(88% 0.015 80)`, max-width 560px): "En Studio Barba dominamos tanto el fade limpio de toda la vida como los cortes que se ven en la calle hoy. Vení con la idea, salí con el corte."
- Two CTA buttons side by side: filled brass "Reservar cita" + outline "Ver cortes" (both scroll to `#catalogo`).
- **Entrance animation**: each hero element fades up on load via CSS `@keyframes heroIn` (`opacity 0→1`, `translateY(28px→0)`), staggered `animation-delay` 0s/0.1s/0.28s/0.42s, 0.8–0.9s ease-out, `forwards` fill.
- If a background **video** is used instead of the static image: short (5–8s), muted, looped, compressed, same dark overlay on top for text legibility.

### 3. Catálogo de cortes (`#catalogo`)
- Section header: eyebrow "Catálogo" (brass, uppercase, 13px, letter-spacing 3px) + title "Cortes para todo tipo de estilo" (Bebas Neue, `clamp(40px,5vw,64px)`).
- Grid: `repeat(auto-fit, minmax(260px, 1fr))`, gap 28px, max-width 1400px, centered.
- 5 cards, one per cut, each:
  - Image (aspect-ratio 4/5, object-fit cover, border-radius 4px) with a bottom gradient overlay (`linear-gradient(to top, oklch(15% 0.015 55/0.85) 0%, transparent 55%)`).
  - On the image, bottom-left: cut name (Bebas Neue, 24px); bottom-right: price (bold, 13px, brass).
  - Below image: short description, 14.5px, `oklch(75% 0.015 80)`.
  - Hover: image scales to `1.06` (0.5s ease transition).
- Cut data (name / example price / description) — matches the catálogo inicial in the functional requirements doc (section 7):
  1. **Corte Francés** — S/ 35 — "Parte superior corta y texturizada con flequillo desordenado sobre la frente. Moderno y atrevido."
  2. **Pompadour Moderno** — S/ 40 — "Volumen arriba peinado hacia atrás, laterales cortos con fade. Elegante y con carácter."
  3. **Corte Rapado** — S/ 25 — "Cabello muy corto y uniforme a máquina. Minimalista, limpio y fácil de mantener."
  4. **Texturizado con Flequillo** — S/ 35 — "Capas con movimiento y flequillo irregular. Desenfadado, juvenil y versátil."
  5. **Fade Clásico** — S/ 30 — "Transición progresiva de largo, corto en nuca y laterales. El acabado más versátil de todos."
- Prices are **placeholders** pending real pricing from the business (still pending per section 8 of the requirements doc).

### 4. Sobre nosotros (`#nosotros`)
- Light section: background `oklch(96% 0.015 85)`, text `oklch(20% 0.015 55)`. Two-column grid (1fr/1fr, gap 64px, align-items center).
- Left: eyebrow "Sobre nosotros" (oxblood `oklch(33% 0.11 25)`), heading "No elegimos bando entre clásico y moderno" (Bebas Neue, `clamp(36px,4.5vw,54px)`), paragraph (16.5px, max-width 480px), and 3 mini-stats row (Navaja / Fade / Barba, each a Bebas Neue 30px label + 13px caption).
- Right: photo, aspect-ratio 4/3, cover, border-radius 4px.

### 5. Photo strip (ambiente)
- Full-width 4-column grid, gap 4px, each cell aspect-ratio 3/4, object-fit cover. 4 barbershop ambience photos.

### 6. Testimonios (`#testimonios`)
- Dark section `oklch(15% 0.015 55)`. Header: eyebrow "Lo que dicen" + title "Clientes que repiten".
- Grid `repeat(auto-fit, minmax(280px,1fr))`, gap 24px, max-width 1200px.
- 3 cards: background `oklch(20% 0.015 55)`, border `1px solid oklch(28% 0.015 55)`, radius 6px, padding 32px/28px. Large brass quote mark, quote text (15px), name (13px bold uppercase).
- Testimonial copy is **placeholder/example content**, not real customer quotes — replace with real testimonials before launch.

### 7. Ubicación y horario (`#contacto`)
- Two-column grid. Left: eyebrow "Visítanos", heading "Ubicación y horario", placeholder address ("Av. Ejemplo 123, Lima" — **needs real address**), hours table (Mon–Fri 10:00–20:00, Sat 9:00–19:00, Sun cerrado), 3 circular social icon placeholders (IG/TT/FB — need real links/icons).
- Right: photo, aspect-ratio 4/3, cover.

### 8. Footer
- Centered: wordmark, brass "Reservar cita" CTA, copyright line "© 2026 Studio Barba Barbershop".

## Interactions & Behavior
- Nav and footer/hero CTA "Reservar cita" all point to `#catalogo` for now (booking flow is future scope — wire to the real reservation flow once it's built).
- Card image hover-zoom (`transform: scale(1.06)`, 0.5s ease) is the only hover interaction beyond link color changes.
- Hero entrance animation runs once on load (CSS keyframes, no JS).
- No scroll-triggered reveal animations in the original reference (an IntersectionObserver-based version was tried and removed for reliability) — keep reveals CSS-only if added later.
- No responsive breakpoints were explicitly authored in the reference beyond `auto-fit` grids and `clamp()` type — needs verification/adjustment for mobile.

## State Management
None — fully static page, no client state, no data fetching. All content is hardcoded copy/images.

## Design Tokens

**Colors** (OKLCH):
- Background dark (near-black, warm): `oklch(17% 0.015 55)` (base), `oklch(15% 0.015 55)` / `oklch(13% 0.015 55)` (darker variants for nav/footer/testimonials)
- Background light (cream): `oklch(96% 0.015 85)`
- Text on dark: `oklch(96% 0.01 85)` (primary), `oklch(75–88% 0.015 80)` (secondary/muted)
- Text on light: `oklch(20% 0.015 55)` (primary), `oklch(38–45% 0.02 60)` (secondary)
- Brass accent: `oklch(72% 0.11 75)` (primary), `oklch(80% 0.1 75)` (link hover)
- Oxblood accent: `oklch(33% 0.11 25)` (used sparingly on light section)
- Borders: `oklch(28% 0.015 55)` (dark sections), `oklch(45% 0.02 80)` (on dark, e.g. outline button/social icons)

**Typography**:
- Display/headings: "Bebas Neue" (Google Font), uppercase, tight line-height (0.95–1.05)
- Body: "Inter" (Google Font), weights 400–700
- Type scale: hero 56–130px (clamp), section titles 36–64px (clamp), card titles 24px, body 14.5–18px, eyebrows/labels 13px with 1.5–3px letter-spacing

**Spacing/radius**:
- Section padding: `120px 6vw` (most sections), hero `120px 24px 80px`
- Card/image radius: 4px (photos), 6px (testimonial cards), 999px (pill buttons), 50% (circular social icons)
- Grid gaps: 24–28px (card grids), 4px (photo strip)

## Assets
Original design reference used Unsplash stock photos as placeholders for: hero background, about section, location section, photo strip (4 images), and 5 catalog cut photos (the cut photos were user-supplied, matching the 5 cuts in requirements doc section 7).

**Pending before implementation**: real barbershop photography (or confirmed licensing for any stock photos kept), real address, real social media links, final pricing.

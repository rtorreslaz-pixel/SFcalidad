# Control de Calidad Avícola — Design System

A design system extracted from the **Control de Calidad Avícola** product: a poultry quality-control suite used in the field and at the desk. The product digitizes what used to be manual Excel-and-paper inspection of broiler chickens (golpes, rasguños, pododermatitis, pigmentación, peso en vivo), replacing clipboards with a synced web + mobile workflow.

> **Company context:** San Fernando (poultry / agroindustrial, Peru). The UI is entirely in **Spanish (es-PE)**.

There are **two products**, each its own surface:

1. **Web console** (Next.js, "Control de Calidad Avícola") — supervisors and quality staff: dashboards, BI indicators, the granja↔cliente "engranaje" cross-check, jornadas, inspecciones, live "peso en planta", and catálogos/admin. Emerald + slate, Geist font, dense utilitarian SaaS.
2. **Android field app** ("Báscula Ranger BT") — verificadores in the plant: pairs a Bluetooth scale (Ohaus Ranger 3000, SPP), shows a big live weight readout, and captures per-bird weight + quality grades that sync in batches to the same database. Material Design, blue accent.

## Sources

This system was reverse-engineered from a single repository (read it for deeper fidelity):

- **GitHub:** `rtorreslaz-pixel/Rommeltest`, branch `claude/poultry-quality-inspection-chbub6`
  - `src/app/` — the Next.js web console (the primary visual reference).
  - `android-scale-prototype/` — the Kotlin/Material Android scale app.
  - `INTEGRATION.md` — the web↔mobile `/api/mobile/*` contract and shared DB schema.

No design files (Figma) were provided; tokens and patterns were lifted directly from the code (Tailwind 4 utility usage in the web app, Material XML layouts in the Android app).

---

## CONTENT FUNDAMENTALS

**Language:** Spanish (es-PE) everywhere. Numbers are formatted `toLocaleString("es-PE")` (thousands with `,` in the seed data; percentages to 3 decimals, e.g. `1.230%`). Weights in kilograms to 2–3 decimals (`2.31 kg`, `2305.0 g`).

**Voice:** plain, operational, imperative. Instructions address the user directly with the informal imperative (“Selecciona plantel e ingresa campaña, galpón y corral.”, “Vuelve a iniciar sesión.”). No marketing voice, no first person, no exclamation, no hype.

**Domain vocabulary is the brand.** The copy leans on the trade's own words and the team is expected to know them: *plantel, galpón, corral, campaña, jornada, ave, verificador, preventa, engranaje, selección, hematoma, pododermatitis, rasguño, pigmentación, báscula*. Roles: *Supervisor, Verificador, Jefe, Comercial*. Keep these terms — don't translate or “simplify” them.

**Tone of system messages:** factual and reassuring, never alarmist. Empty/error states explain the situation and the next step: “Ningún verificador conectado a una báscula en este momento.”, “No hay inspecciones registradas con estos filtros.”, “Credenciales inválidas.”, “Aún no hay datos suficientes para mostrar este gráfico.”

**Casing:** Sentence case for everything — headings, labels, buttons (“Nueva inspección”, “Exportar CSV”, “Comenzar captura”). KPI tile labels are the one exception: UPPERCASE with wide tracking. Buttons in the *mobile* Material app are UPPERCASE (platform convention).

**Emoji:** in the **internal QA tool**, essentially none — the single exception is the 🐔 in the web header wordmark. Do not add decorative emoji to the operational app. (Note: the **consumer-facing San Fernando brand** is deliberately playful — its website uses emoji like 😍, script display type, sticker-style tags like “Uffff!!!”, and the tagline *“La buena familia”*. Keep that energy for consumer/marketing pieces, not for the inspection/dashboard tooling.)

---

## VISUAL FOUNDATIONS

**Type.** `Geist` (sans) for all UI; `Geist Mono` for numeric readouts (weights, the live "peso en vivo", scale display). Weights do the hierarchy: 400 body, 500 labels/nav/table-headers, 600 buttons/section-titles, 700 headings/KPI values. Sizes are small and dense — 14px body, 12px labels/badges, 11px chart ticks — with two big moments: the 24px KPI value and the **56px mono** scale readout on mobile.

**Color.** A calm, utilitarian palette:
- **Emerald** is the brand/action color — `emerald-600 #059669` fills primary buttons and the active nav pill, `emerald-700` is hover and links, `emerald-500` is the focus ring. Emerald also = the "ok / under-meta" state.
- **Slate** is the entire neutral range — `slate-200` card rings/borders, `slate-300` input borders, `slate-400` placeholders, `slate-500` labels, `slate-600` body/secondary text, `slate-800` the dark "Filtrar" utility button, `slate-900` headings.
- **Teal `#0d9488`** is the secondary data-viz series.
- **Red `#dc2626`** is danger / the dashed "meta" reference line / errors; **amber** is warn/pending.
- The **canvas is `#f5f6f8`**, surfaces are pure white.
- The mobile app is a separate world: **Material blue `#1565c0`** accent, `#d32f2f` errors.

**San Fernando corporate identity (distinct from the internal-app palette above).** The company brand is **led by blue**, not emerald or red: primary **azul `#0b4ea2`** (deep navy `#002f86`) fills chrome (headers, footers); **rojo `#e2231a`** is reserved for the primary CTA (“Comprar aquí”) and the logo accent; **cian `#a6dcea`** is a soft background; white. The emerald in the QA app is a *functional* inheritance from the original codebase, not the corporate color — so brand-aligned work should put **blue in the chrome** and may keep **emerald as the action** (leaving red free for “defecto/peligro”) or use **red as a CTA** with danger shifted to amber. See the `Calidad Lima` kit's brand tweak for both treatments. (Hex sampled from sanfernando.com.pe — confirm against the official manual.)

**Surfaces & elevation.** The signature surface is one recipe used everywhere: **white card, `rounded-xl` (12px), a soft `shadow-xs`, and a 1px `slate-200` hairline ring** (a ring, not a border). Controls (buttons, inputs, badges, nav pills) use `rounded-md` (6px). Dots and avatars are fully round. Shadows are subtle — this is a flat, ringed look, not a heavy-shadow look. No glows, no gradients, no glassmorphism, no blur.

**Backgrounds.** Flat solid fills only — `#f5f6f8` canvas, white cards. No imagery, no patterns, no gradients, no textures. (No brand photography or illustration ships in the repo.)

**Spacing.** Tailwind's 4px scale. 16px is the page gutter and card padding; 24px separates dashboard sections; content is capped at `max-w-6xl` (≈72rem) and centered. Touch targets on mobile are generous (the "Registrar ave" button is 80dp tall).

**Borders & dividers.** 1px. `slate-200` for card rings, `slate-300` for inputs, `slate-100` for table-row and list dividers (`divide-y`).

**Tables.** `slate-50` header with `slate-500` medium labels, `slate-100` row dividers, `slate-50` row hover, framed in the card surface. Numeric columns use tabular-nums.

**Badges & chips.** `rounded-md`, 12px semibold, soft `bg-100 / text-700` color pairs. The hero use is the **% Selección** chip — emerald when under meta, red when it exceeds.

**Motion.** Minimal and functional. State changes (active nav pill, switch/checkbox/segmented fills, button hover, focus rings) snap **instantly** — no color/background transition. Only non-color properties animate: the switch thumb slides ~140ms (`left`), buttons fade on disable (`opacity`). No bounces, no decorative or looping animation, no entrance choreography. The only "live" motion is data: the weight readout updating and the preventa "en vivo" dot.

> ⚠️ **Authoring note:** do **not** add CSS `transition`s to properties whose value is a `var()` token (`background-color`, `color`, `border-color`, `box-shadow`). In this runtime, transitioning between two `var()` values is unreliable and can freeze the computed color at the start value (the rendered element looks "stuck" even though React re-rendered correctly). Transition only literal values (`left`, `opacity`, `transform`), or omit the transition.

**Interaction states.** Hover darkens a fill by ~one step (emerald-600→700) or adds a `slate-50/100` wash on quiet controls. Focus shows an emerald border + 1px emerald ring (the `.input` recipe). Disabled drops to ~60% opacity (buttons) or fills `slate-100` (inputs). No shrink/scale press effect.

**Transparency & blur.** Not used. Everything is opaque. The sticky header is solid white with a bottom border.

---

## ICONOGRAPHY

The product is **almost icon-free** — this is a deliberate, text-first system, and you should keep it that way.

- The **web console ships no icon library at all.** Navigation, buttons, and table actions are plain Spanish text labels. The only pictograph anywhere is the **🐔 emoji** in the header wordmark. Status is conveyed by color (the emerald/slate "en vivo" dot, the red/emerald % badge), not icons. The lone inline SVGs in the system are tiny utility glyphs drawn in CSS: the `Select` chevron, the `Checkbox` tick — both single-color, 2–3px stroke, matched to the slate/white palette.
- The **mobile app** uses stock **Material** affordances (Material switches, radio buttons, the app-bar) and otherwise text — no custom icon set.
- **Emoji / unicode:** none beyond 🐔. Don't introduce decorative emoji.

**Guidance for new work:** prefer a text label. If an icon is genuinely needed (e.g. a denser toolbar in a new screen), substitute **[FLAGGED SUBSTITUTION] Lucide** from CDN — thin 2px stroke, rounded line caps, which is the closest match to the existing hand-drawn chevron/tick glyphs — at 16–18px in `slate-500/600`. There is no official icon set in the repo to copy, so Lucide is a substitution, not a recovered asset. No logo/brand imagery exists in the source either (only Next.js starter SVGs, which are not San Fernando assets) — the wordmark is text + 🐔 until the real mark is provided.

---

## INDEX — what's in this system

**Foundations & tokens**
- `styles.css` — root entry; `@import`s everything. Consumers link this one file.
- `tokens/colors.css` · `typography.css` · `spacing.css` · `radius-elevation.css` · `fonts.css`
- `foundations/*.html` — specimen cards (Colors, Type, Spacing, Brand) shown on the Design System tab.

**Components** — `window.ControlDeCalidadAvColaDesignSystem_515b76.*` (see each component's `.prompt.md`)
- `components/core/` — `Button`, `Badge`, `Card`, `KpiCard`, `StatusDot`
- `components/forms/` — `Field`, `Input`, `Select`, `Switch`, `Checkbox`, `SegmentedControl`
- `components/navigation/` — `AppHeader`, `NavTabs`
- `components/data/` — `DataTable`, `EmptyState`
- `components/feedback/` — `Alert`

**UI kits** — full interactive recreations
- `ui_kits/web/` — the web console (login → dashboard → inspecciones), **día / supervisión**.
- `ui_kits/mobile/` — the Android "Báscula Ranger BT" scale-capture app.
- `ui_kits/calidad-lima/` — **Calidad Clientes Lima**: web inspection screen redesigned for **one-handed, gloved, night-shift** use — dark/light toggle, San Fernando-red exploration, and 3 layout variants (lista / sheet / stepper), all in Tweaks.

**Other**
- `SKILL.md` — makes this folder usable as a downloadable Agent Skill.

---

## Caveats / substitutions

- **Fonts:** Geist is delivered via Google Fonts `@import` (the product self-hosts via `next/font/google`). If you need the exact self-hosted woff2 binaries, provide them and the `@font-face` can be repointed.
- **Brand assets:** the *repo* contains no logo/photography. The corporate identity (blue-led, red CTA, cyan, white; wordmark + red/blue emblem, *“La buena familia”*) is documented from **sanfernando.com.pe** and reflected in the tokens (`--sf-blue/-red/-cyan`) and the Brand card — but the **logotipo itself is NOT recreated here (registered trademark)**. Provide the official logo **SVG** (color + a white version for dark/blue headers) to replace the text wordmark across the surfaces.
- **Icons:** none in the source; Lucide is suggested as a flagged substitute only if new screens require icons.
- **Charts:** the web dashboard uses Recharts; the UI kit renders simplified SVG/CSS charts in the same palette rather than pulling in the chart library.

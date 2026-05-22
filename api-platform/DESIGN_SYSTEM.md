# Design System — Operations MCP Platform

Source of truth for all UI decisions in this repository.
Derived from `operations-mcp.md` product philosophy and synthesized from `design-md/` references (Linear, Stripe, Vercel, Raycast, Warp, Cursor, Supabase).

---

## Philosophy

- **Dark mode first** — the default experience is deep, technical, and quiet
- **Infrastructure, not marketing** — no gradients, no orbs, no decorative blobs
- **Data-dense but readable** — tables, grids, matrices, and code surfaces are first-class
- **Developer-centric** — monospace for data, sans for UI, minimal chrome
- **Computational credibility** — the UI should feel like a terminal-native workspace

---

## Color Tokens

### Canvas & Surfaces

| Token | Value | Usage |
|-------|-------|-------|
| `--canvas` | `#010102` | Deepest background — page root |
| `--surface-1` | `#0f1011` | Primary cards, panels, nav |
| `--surface-2` | `#141516` | Elevated cards, hover states |
| `--surface-3` | `#18191a` | Active/selected states |
| `--surface-4` | `#1c1d1e` | Subtle elevation |

### Text

| Token | Value | Usage |
|-------|-------|-------|
| `--ink` | `#f7f8f8` | Primary headings, important text |
| `--ink-muted` | `#d0d6e0` | Body text, descriptions |
| `--ink-subtle` | `#8a8f98` | Captions, metadata, disabled hints |
| `--ink-tertiary` | `#62666d` | Borders of inactive elements, placeholders |

### Accent

| Token | Value | Usage |
|-------|-------|-------|
| `--accent` | `#5e6ad2` | Primary CTA, focus rings, links, active indicators |
| `--accent-hover` | `#828fff` | Hover state for accent elements |
| `--accent-soft` | `rgba(94,106,210,0.15)` | Subtle accent backgrounds, tags |

### Semantic

| Token | Value | Usage |
|-------|-------|-------|
| `--success` | `#27a644` | Positive states, valid input, success toasts |
| `--warning` | `#f5a623` | Alerts, caution states |
| `--error` | `#ff6161` | Errors, invalid input, destructive actions |
| `--error-soft` | `rgba(255,97,97,0.15)` | Error backgrounds |
| `--info` | `#57c1ff` | Info badges, neutral highlights |

### Borders & Hairlines

| Token | Value | Usage |
|-------|-------|-------|
| `--hairline` | `#23252a` | Default borders between surfaces |
| `--hairline-strong` | `#34343a` | Focused or emphasized borders |
| `--hairline-subtle` | `rgba(255,255,255,0.08)` | Very faint dividers |

---

## Typography

### Font Families

| Role | Stack | Fallback |
|------|-------|----------|
| UI / Display | Inter | `system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif` |
| Code / Data | JetBrains Mono | `ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace` |

> Use `font-variant-numeric: tabular-nums` on all numeric tables and dashboards.

### Type Scale

| Token | Size | Weight | Line Height | Letter Spacing | Usage |
|-------|------|--------|-------------|----------------|-------|
| `display-xl` | 56px | 600 | 1.05 | -0.04em | Hero headlines |
| `display-lg` | 40px | 600 | 1.10 | -0.03em | Section titles |
| `display-md` | 28px | 600 | 1.15 | -0.02em | Page headings |
| `heading-lg` | 22px | 500 | 1.25 | 0 | Card titles, modal headers |
| `heading-md` | 18px | 500 | 1.30 | 0 | Subsection headings |
| `heading-sm` | 16px | 500 | 1.40 | 0 | Labels, table headers |
| `body-lg` | 18px | 400 | 1.55 | 0 | Lead paragraphs |
| `body` | 16px | 400 | 1.50 | 0 | Default body text |
| `body-sm` | 14px | 400 | 1.45 | 0 | Secondary text, captions |
| `caption` | 12px | 400 | 1.40 | 0.01em | Metadata, timestamps, badges |
| `code` | 13px | 400 | 1.60 | 0 | Code blocks, JSON, matrix cells |
| `code-sm` | 12px | 400 | 1.50 | 0 | Inline code, terminal output |

> **Minimum body font size: 16px.** Never use `vw` for font sizes.
> **Letter spacing is 0 for body.** Do not use negative letter-spacing on body text.

---

## Spacing

| Token | Value | Usage |
|-------|-------|-------|
| `--space-1` | 4px | Tight gaps, icon padding |
| `--space-2` | 8px | Inline spacing, small gaps |
| `--space-3` | 12px | Button padding-y, compact gaps |
| `--space-4` | 16px | Default padding, card gutters |
| `--space-5` | 24px | Section gaps, card padding |
| `--space-6` | 32px | Major section separation |
| `--space-7` | 48px | Page section margins |
| `--space-8` | 64px | Hero/landing spacing |
| `--space-9` | 96px | Large section breaks |

---

## Layout

### Grid

- **Max content width**: 1200px (centered with auto margins)
- **Page padding**: `--space-4` (16px) mobile, `--space-6` (32px) desktop
- **Card grid**: CSS Grid with `repeat(auto-fill, minmax(280px, 1fr))` for responsive card layouts
- **Dashboard grids**: 12-column grid with 16px gutters

### Z-Index Scale

| Token | Value | Usage |
|-------|-------|-------|
| `--z-dropdown` | 100 | Dropdowns, tooltips |
| `--z-sticky` | 200 | Sticky headers |
| `--z-modal` | 300 | Modals, dialogs |
| `--z-toast` | 400 | Toasts, notifications |

---

## Components

### Buttons

| Variant | Background | Text | Border | Hover |
|---------|-----------|------|--------|-------|
| Primary | `--accent` | `#ffffff` | none | `--accent-hover` |
| Secondary | transparent | `--ink` | `--hairline` | `--surface-2` |
| Ghost | transparent | `--ink-muted` | none | `--surface-1` |
| Danger | `--error` | `#ffffff` | none | `#ff7a7a` |

- **Border radius**: 6px (tight, technical — not pill-shaped unless explicitly requested)
- **Padding**: `--space-3` `--space-4` (12px 16px)
- **Font**: `body-sm` weight 500
- **Minimum touch target**: 44×44 px

### Cards

- **Background**: `--surface-1`
- **Border**: 1px solid `--hairline`
- **Border radius**: 6px
- **Padding**: `--space-4` to `--space-5`
- **Hover**: border transitions to `--hairline-strong`, background to `--surface-2`
- **No box shadows** — use border elevation instead

### Inputs

- **Background**: `--surface-1`
- **Border**: 1px solid `--hairline`
- **Border radius**: 6px
- **Text**: `--ink`
- **Placeholder**: `--ink-tertiary`
- **Focus**: border `--accent`, ring `0 0 0 2px var(--accent-soft)`
- **Error**: border `--error`, background `--error-soft`
- **Font**: `body` for text inputs, `code-sm` for code inputs

### Tables

- **Header**: `--surface-2` background, `heading-sm` text, uppercase optional
- **Row**: `--surface-1` background, alternating with `--canvas`
- **Border**: 1px solid `--hairline` between rows
- **Cell padding**: `--space-3` `--space-4`
- **Font**: `body-sm` for text, `code-sm` for numeric/code cells
- **Hover row**: `--surface-2`
- **Sort indicator**: `--accent` on active sort column

### Code Blocks / Terminal Surfaces

- **Background**: `--surface-1` or `--canvas`
- **Border**: 1px solid `--hairline`
- **Border radius**: 6px
- **Font**: `code` or `code-sm`
- **Padding**: `--space-4`
- **Overflow**: `auto` with custom scrollbar (thin, `--hairline` track, `--ink-muted` thumb)
- **Syntax highlighting**: Use a dark theme (e.g., Dracula, One Dark) adapted to our tokens

### Badges / Tags

- **Background**: `--accent-soft`
- **Text**: `--accent`
- **Border radius**: 4px
- **Padding**: 2px 8px
- **Font**: `caption` weight 500
- Variants: `success` (green), `warning` (amber), `error` (red)

### Modals / Dialogs

- **Overlay**: `rgba(0,0,0,0.7)`
- **Background**: `--surface-1`
- **Border**: 1px solid `--hairline-strong`
- **Border radius**: 8px
- **Max width**: 560px (standard), 720px (wide)
- **Padding**: `--space-5`
- **Shadow**: none (use border for definition)

### Navigation

- **Background**: `--canvas` with subtle bottom border `--hairline`
- **Links**: `--ink-muted`, hover `--ink`
- **Active**: `--accent` with subtle underline or left-border indicator
- **Height**: 64px
- **Font**: `body-sm` weight 500

---

## Icons

- **Library**: Lucide (always prefer Lucide over custom SVGs)
- **Size**: 16px (default), 20px (nav/hero), 24px (feature icons)
- **Stroke width**: 1.5px (default), 2px (emphasized)
- **Color**: inherits `--ink-muted` or `--ink` by context

---

## Motion

### Principles

- Motion confirms actions, communicates state, guides attention
- Never decorative — no ambient loops, no cascade delays on load
- Animate only `transform` and `opacity` for performance
- Respect `prefers-reduced-motion: reduce`

### Tokens

| Token | Value | Usage |
|-------|-------|-------|
| `--duration-fast` | 120ms | Hover states, micro-interactions |
| `--duration-normal` | 200ms | Button presses, toggles |
| `--duration-slow` | 300ms | Modals, dropdowns, page transitions |
| `--ease-out` | `cubic-bezier(0.16, 1, 0.3, 1)` | Elements entering |
| `--ease-in-out` | `cubic-bezier(0.65, 0, 0.35, 1)` | Elements moving across |

### Patterns

- **Button press**: scale(0.97) on active, 120ms ease-out
- **Card hover**: border-color + background-color transition, 200ms
- **Modal enter**: opacity 0→1, translateY(8px)→0, 200ms ease-out
- **Toast enter**: translateX(100%)→0, 300ms ease-out
- **Skeleton**: pulse opacity 0.5→1, 1.5s linear infinite (respect `prefers-reduced-motion`)

---

## Responsive Breakpoints

| Name | Width | Target |
|------|-------|--------|
| `sm` | 640px | Small phones |
| `md` | 768px | Tablets |
| `lg` | 1024px | Laptops |
| `xl` | 1280px | Desktops |
| `2xl` | 1536px | Large monitors |

- Mobile-first: base styles target 320px+, layer up with `min-width`
- Never disable zoom (`maximum-scale=1` is forbidden)

---

## Accessibility (WCAG 2.2 AA)

- Semantic HTML: `<nav>`, `<main>`, `<section>`, `<article>`, proper heading hierarchy
- Focus rings: 2px solid `--accent`, 3:1 contrast against background
- Touch targets: minimum 44×44 px
- Color: never sole differentiator — pair with icons, labels, or shape changes
- Reduced motion: wrap all non-essential animations in `@media (prefers-reduced-motion: reduce)`
- Screen readers: `aria-expanded`, `aria-selected`, `aria-live` on dynamic content

---

## Page-Specific Notes

### Landing Page
- Hero: live tableau or JSON schema example on the right, value prop on the left
- No split-card layouts — hero text floats over surface or is unframed
- Solver showcase: interactive cards with preview animations
- CTA buttons: Primary accent, tight radius, minimal padding

### Playground
- Input panel (left): code editor or form for LP problem definition
- Visualization panel (right): tableau display, iteration timeline, pivot metadata
- Step-through controls: play/pause/step buttons for algorithm execution
- Export: JSON/CSV download buttons

### API Dashboard
- Dense tables for API keys, usage metrics, request logs
- Monospace for keys, hashes, timestamps
- Charts: line charts for usage over time, bar charts for endpoint distribution
- Dark chart theme matching our palette

### Documentation
- Stripe/Vercel-style: clean sidebar nav, example-heavy
- Request/response examples in code blocks with syntax highlighting
- Interactive "Try it" buttons where possible
- Table of contents for long pages

---

## Do / Don't

| Do | Don't |
|----|-------|
| Dark mode first, always | Light mode as default |
| Monospace for code, data, matrices | Sans-serif for code surfaces |
| Hairline borders for elevation | Box shadows for elevation |
| Dense tables with clear hierarchy | Excessive whitespace in data views |
| Lucide icons | Custom SVG icons where Lucide has an equivalent |
| Subtle hover transitions | Jarring animations, decorative motion |
| Respect `prefers-reduced-motion` | Force animations on all users |
| Tabular nums for numeric columns | Proportional nums in tables |
| 6px–8px border radius | Large rounded corners (12px+) unless explicitly needed |
| Accent color on CTAs and focus only | Accent color as background for large areas |

---

## References

- `operations-mcp.md` — Product philosophy & target architecture
- `design-md/linear.app/DESIGN.md` — Dark canvas, lavender accent, technical minimalism
- `design-md/stripe/DESIGN.md` — API docs density, clean tables
- `design-md/vercel/DESIGN.md` — Developer platform structure, Geist typography
- `design-md/raycast/DESIGN.md` — Dark developer-tool chrome, command-palette aesthetic
- `design-md/warp/DESIGN.md` — Warm charcoal terminal, code-first presentation
- `design-md/cursor/DESIGN.md` — Monospace code surfaces, JetBrains Mono
- `design-md/supabase/DESIGN.md` — Emerald accent on near-monochrome, quiet technical branding

---

## Changelog

- `2026-05-22` — Initial design system created from `operations-mcp.md` and `design-md/` synthesis

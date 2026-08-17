# Meridian CMS — Design System & Theme Guide

> A headless CMS built for editors who care about craft. The design reflects that.

---

## Concept & Aesthetic Direction

**Theme Name:** *Meridian* — the line where two worlds meet (editor's world / developer's world).

**Aesthetic:** Editorial-Industrial. Think the backstage of a print magazine that got wired up with developer tooling. Raw grid lines, ink-on-paper typographic hierarchy, warm off-white surfaces with cold steel accents — but punctuated by one electric color that signals "this is alive."

**What makes it unforgettable:**
- Ruled-line textures on backgrounds (like graph paper, but subtle) — a nod to the "content" world
- Monospaced font used deliberately for IDs, API slugs, and code — never for body copy
- A single accent color that is genuinely unusual: a muted **sap green** (`#4E7C59`) with a bright **electric lime** (`#CAFF4D`) for interactive/active states
- Sidebar uses a dark "printing press" tone while the canvas is warm ivory
- No rounded corners except on pills/tags — everything else is sharp-edged or uses 2px max border-radius

---

## Color Palette

```
/* ── Base Surfaces ───────────────────────────── */
--color-canvas:        #F5F2EC;   /* warm ivory — editor canvas, page backgrounds */
--color-paper:         #FDFBF7;   /* near-white — cards, panels, input fields */
--color-sidebar:       #1A1D16;   /* near-black with green undertone — main nav */
--color-sidebar-mid:   #252920;   /* slightly lighter — sidebar hover states */

/* ── Text ────────────────────────────────────── */
--color-ink:           #18180F;   /* primary text — almost black, warm */
--color-ink-muted:     #6B6A5E;   /* secondary text, labels, placeholders */
--color-ink-faint:     #BFBCB0;   /* disabled, ghost, timestamps */
--color-ink-inverse:   #E8E5DB;   /* text on dark sidebar */

/* ── Accent ──────────────────────────────────── */
--color-accent:        #4E7C59;   /* sap green — links, focus rings, icons */
--color-accent-bright: #CAFF4D;   /* electric lime — active states, badges, CTAs */
--color-accent-dim:    #2E4A35;   /* deep forest — pressed/active accent backgrounds */

/* ── Functional ──────────────────────────────── */
--color-border:        #DDD9CF;   /* all borders on light surfaces */
--color-border-strong: #B0AC9F;   /* emphasized borders, dividers */
--color-sidebar-border:#2F3328;   /* sidebar internal dividers */
--color-destructive:   #C94040;   /* delete, error states */
--color-warning:       #D4820A;   /* warnings, draft indicator */
--color-success:       #3A7D44;   /* published, saved, success toasts */

/* ── Overlays ────────────────────────────────── */
--color-overlay:       rgba(24, 24, 15, 0.5);   /* modal backdrops */
--color-highlight:     rgba(202, 255, 77, 0.15); /* selection highlight in editor */
```

---

## Typography

### Font Stack

| Role | Font | Source |
|---|---|---|
| **Display / Headings** | `"Playfair Display"` | Google Fonts |
| **UI / Body** | `"DM Sans"` | Google Fonts |
| **Monospace** | `"DM Mono"` | Google Fonts |

```css
@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700&family=DM+Sans:wght@300;400;500;600&family=DM+Mono:wght@400;500&display=swap');

--font-display:  'Playfair Display', Georgia, serif;
--font-ui:       'DM Sans', sans-serif;
--font-mono:     'DM Mono', 'Courier New', monospace;
```

### Type Scale

```css
--text-xs:    0.6875rem;   /* 11px — API slugs, timestamps, meta */
--text-sm:    0.8125rem;   /* 13px — sidebar labels, table rows */
--text-base:  0.9375rem;   /* 15px — body copy, form inputs */
--text-md:    1.0625rem;   /* 17px — panel headings */
--text-lg:    1.25rem;     /* 20px — section headings */
--text-xl:    1.5rem;      /* 24px — page titles */
--text-2xl:   2rem;        /* 32px — dashboard hero text */
--text-3xl:   2.75rem;     /* 44px — landing page headers */
--text-hero:  4rem;        /* 64px — landing hero */

--leading-tight:  1.15;
--leading-normal: 1.5;
--leading-loose:  1.75;

--tracking-tight:  -0.02em;
--tracking-normal:  0;
--tracking-wide:    0.04em;
--tracking-widest:  0.12em;  /* ALL CAPS labels, column headers */
```

### Usage Rules

- **Headings**: Playfair Display, `font-weight: 600`, `letter-spacing: -0.02em`
- **UI labels (ALL CAPS)**: DM Sans, `font-weight: 500`, `font-size: var(--text-xs)`, `letter-spacing: var(--tracking-widest)`, `text-transform: uppercase` — used for column headers, nav section labels, form field labels
- **Body**: DM Sans, `font-weight: 400`, `line-height: var(--leading-loose)`
- **Slugs / IDs / Code**: DM Mono everywhere — field slugs, API paths, IDs in tables, JSON preview
- **Numbers in stats**: Playfair Display numerals look gorgeous for big stat figures

---

## Spacing & Layout

```css
--space-1:  0.25rem;   /* 4px */
--space-2:  0.5rem;    /* 8px */
--space-3:  0.75rem;   /* 12px */
--space-4:  1rem;      /* 16px */
--space-5:  1.25rem;   /* 20px */
--space-6:  1.5rem;    /* 24px */
--space-8:  2rem;      /* 32px */
--space-10: 2.5rem;    /* 40px */
--space-12: 3rem;      /* 48px */
--space-16: 4rem;      /* 64px */
--space-24: 6rem;      /* 96px */

/* Layout */
--sidebar-width:       240px;
--sidebar-collapsed:   64px;
--panel-width:         320px;   /* right-side block editor panel */
--topbar-height:       56px;
--content-max-width:   960px;
--landing-max-width:   1200px;
```

### Grid

- Dashboard uses a fixed sidebar + fluid main area layout
- Content tables use a 12-column CSS grid internally
- Block editor canvas: centered, max-width 720px, with the properties panel docked right
- Landing page: `display: grid; grid-template-columns: repeat(12, 1fr); gap: var(--space-6);`

---

## Border Radius & Borders

```css
--radius-none: 0;
--radius-sm:   2px;    /* inputs, buttons — barely rounded */
--radius-md:   4px;    /* cards, dropdowns */
--radius-pill: 100px;  /* status badges, tags ONLY */

--border-width:       1px;
--border-width-thick: 2px;

/* Focus ring — used on all interactive elements */
--focus-ring: 0 0 0 3px rgba(202, 255, 77, 0.4);
```

**Rule:** This design is intentionally angular. Only use `--radius-pill` for tags and status indicators. Cards and modals use `--radius-md`. Inputs use `--radius-sm`.

---

## Shadows & Depth

```css
--shadow-sm:  0 1px 2px rgba(24, 24, 15, 0.08);
--shadow-md:  0 4px 12px rgba(24, 24, 15, 0.10);
--shadow-lg:  0 12px 32px rgba(24, 24, 15, 0.14);
--shadow-xl:  0 24px 48px rgba(24, 24, 15, 0.18);

/* Sidebar inner shadow — subtle separation */
--shadow-sidebar: inset -1px 0 0 var(--color-sidebar-border);

/* Floating panel (block props) */
--shadow-panel: -4px 0 24px rgba(24, 24, 15, 0.10);
```

---

## Background Texture

The "ruled paper" texture is a defining detail. Apply to canvas-level surfaces:

```css
/* Subtle horizontal ruled lines — like a notebook */
.ruled-bg {
  background-color: var(--color-canvas);
  background-image: repeating-linear-gradient(
    transparent,
    transparent 27px,
    var(--color-border) 27px,
    var(--color-border) 28px
  );
}

/* Graph paper variant — for empty states / block canvas */
.graph-bg {
  background-color: var(--color-canvas);
  background-image:
    linear-gradient(var(--color-border) 1px, transparent 1px),
    linear-gradient(90deg, var(--color-border) 1px, transparent 1px);
  background-size: 24px 24px;
}
```

Use `ruled-bg` on the main content area background. Use `graph-bg` on the empty state of the block editor canvas.

---

## Component Patterns

### Buttons

```
Primary CTA:
  background: var(--color-accent-bright)
  color: var(--color-ink)
  font: DM Sans 500, 13px, letter-spacing: 0.04em, uppercase
  padding: 8px 20px
  border: none
  border-radius: var(--radius-sm)
  box-shadow: none
  hover: background: #D6FF6A (slightly lighter)
  active: background: var(--color-accent-dim), color: white

Secondary:
  background: transparent
  border: 1px solid var(--color-border-strong)
  color: var(--color-ink)
  hover: border-color: var(--color-accent), color: var(--color-accent)

Ghost / Sidebar item:
  background: transparent
  color: var(--color-ink-inverse) at 60% opacity
  hover: background: var(--color-sidebar-mid), color: var(--color-ink-inverse) at 100%
  active: background: var(--color-accent-dim), left-border: 2px solid var(--color-accent-bright)

Destructive:
  background: transparent
  color: var(--color-destructive)
  border: 1px solid currentColor
  hover: background: rgba(201, 64, 64, 0.08)
```

### Inputs & Forms

```
Input field:
  background: var(--color-paper)
  border: 1px solid var(--color-border)
  border-radius: var(--radius-sm)
  padding: 9px 12px
  font: DM Sans 400, 15px
  color: var(--color-ink)
  placeholder: var(--color-ink-faint)
  focus: border-color: var(--color-accent), box-shadow: var(--focus-ring)

Slug/API name field:
  font: DM Mono 400, 13px
  background: rgba(78, 124, 89, 0.06)
  border-color: rgba(78, 124, 89, 0.3)
  prefix label: "/"  in var(--color-accent)

Label (above input):
  DM Sans 500, 11px, uppercase, letter-spacing: 0.12em
  color: var(--color-ink-muted)
  margin-bottom: 6px
```

### Status Badges / Tags

```
Published:
  background: rgba(58, 125, 68, 0.12)
  color: var(--color-success)
  border: 1px solid rgba(58, 125, 68, 0.25)
  border-radius: var(--radius-pill)
  font: DM Sans 500, 11px, uppercase, letter-spacing: 0.08em
  padding: 2px 10px

Draft:
  background: rgba(212, 130, 10, 0.10)
  color: var(--color-warning)
  border: 1px solid rgba(212, 130, 10, 0.25)

Archived:
  background: transparent
  color: var(--color-ink-faint)
  border: 1px solid var(--color-border)

API / Type badge (on content types):
  background: var(--color-sidebar)
  color: var(--color-accent-bright)
  font: DM Mono 500, 11px
  border-radius: var(--radius-sm)
  padding: 2px 8px
```

### Tables (Content Entry List)

```
Header row:
  background: var(--color-canvas)
  border-bottom: 2px solid var(--color-border-strong)
  font: DM Sans 500, 11px, uppercase, letter-spacing: 0.12em
  color: var(--color-ink-muted)
  padding: 10px 16px

Data row:
  background: var(--color-paper)
  border-bottom: 1px solid var(--color-border)
  padding: 14px 16px
  hover: background: rgba(78, 124, 89, 0.04)

Selected row:
  background: rgba(202, 255, 77, 0.08)
  border-left: 2px solid var(--color-accent-bright)

ID column:
  font: DM Mono 400, 12px
  color: var(--color-ink-muted)
```

### Sidebar Navigation

```
Sidebar:
  width: var(--sidebar-width)
  background: var(--color-sidebar)
  border-right: var(--shadow-sidebar)
  padding-top: var(--space-6)

Logo area:
  padding: 0 var(--space-5) var(--space-6)
  font: Playfair Display 600, 20px
  color: white
  sub-label: DM Mono 11px, var(--color-accent-bright) — "DASHBOARD v1"

Section label (e.g. "CONTENT", "SETTINGS"):
  DM Sans 500, 10px, uppercase, letter-spacing: 0.14em
  color: var(--color-sidebar-border) [intentionally dim]
  padding: var(--space-6) var(--space-5) var(--space-2)
  margin-top: var(--space-4)

Nav item:
  display: flex, align-items: center, gap: var(--space-3)
  padding: 9px var(--space-5)
  color: rgba(232, 229, 219, 0.65)
  font: DM Sans 400, 14px
  icon: 16px, stroke-width: 1.5
  hover: color: white, background: var(--color-sidebar-mid)
  active: color: white, background: var(--color-accent-dim)
         left-border: 2px solid var(--color-accent-bright)
         font-weight: 500
```

### Cards

```
Content Type card:
  background: var(--color-paper)
  border: 1px solid var(--color-border)
  border-radius: var(--radius-md)
  padding: var(--space-5)
  box-shadow: var(--shadow-sm)
  hover: box-shadow: var(--shadow-md), border-color: var(--color-accent)
  
  Top: type name in Playfair Display 600, 16px
  Sub: entry count in DM Sans 400, 13px, muted
  Bottom: API slug in DM Mono, var(--color-accent), with "/" prefix
```

---

## Page-by-Page Design Notes

### Landing Page

**Layout:** Full-bleed, dark top section (`var(--color-sidebar)`) transitioning to warm ivory canvas below.

**Hero section:**
- Background: `var(--color-sidebar)` with a faint graph-paper overlay at 4% opacity
- Headline: Playfair Display 700, 64px, white, `letter-spacing: -0.03em`, two lines — e.g. *"Content,*  
  *structured for builders."*
- Sub-headline: DM Sans 300, 18px, `var(--color-ink-inverse)` at 70% opacity
- CTA button: `--color-accent-bright` background, `--color-ink` text — primary; secondary ghost button
- Decorative: a faint ruled-line grid bleeds into the dark background
- Right side: a live screenshot of the dashboard (or illustrated mockup) with a lime-green glow

**Feature grid (3 columns):**
- On warm canvas background
- Each card: left-bordered with 2px `var(--color-accent)`, icon in accent green, headline in Playfair, body in DM Sans
- Numbers ("01", "02", "03") in Playfair Display, 48px, 8% opacity — decorative background numerals

**API preview section:**
- Dark card showing a code block (`DM Mono`) with the JSON response
- Syntax: keys in `var(--color-accent-bright)`, strings in white, punctuation in muted
- Side: headline "Fetch it anywhere" in Playfair Display

**Footer:** Dark background. Logo left, nav links center, API status indicator right (green dot + "Operational").

---

### Auth Pages (Login / Sign Up)

**Layout:** Split screen — left 45% dark (`var(--color-sidebar)`), right 55% ivory canvas.

**Left panel (dark):**
- Large Playfair Display quote or product name, 40px, white
- Faint ruled-line texture
- Small testimonial or feature list at bottom

**Right panel (form):**
- Centered form, max-width 380px
- Field labels in ALL CAPS DM Sans
- "Sign in" headline in Playfair Display 600, 28px
- Primary button: full-width, `--color-accent-bright`
- OAuth buttons (GitHub): white background, dark border, 1px — matches the sharp aesthetic
- No card container around the form — the form *is* the panel
- Footer: "Don't have an account? →" in DM Sans, link in `var(--color-accent)`

---

### Dashboard — Home / Overview

**Top bar:**
- Height: 56px, background: `var(--color-paper)`, border-bottom: 1px `var(--color-border)`
- Left: breadcrumb in DM Sans 400, 14px. Active segment: DM Sans 500, ink
- Right: search bar (ghost), notification bell, avatar circle (initials, dark background)

**Stats row (4 cards):**
- Background: `var(--color-paper)`, 1px border, `var(--radius-md)`
- Big number: Playfair Display, 32px, `var(--color-ink)`
- Label: DM Sans 500, 11px, ALL CAPS, muted
- Trend: tiny +12% in success green or −3% in destructive red

**Recent Entries table:**
- Full width, no card wrapper — the table IS the content
- Hover row highlighting in faint lime

**Quick Actions sidebar strip (right):**
- 280px panel, border-left: 1px `var(--color-border)`
- "New entry", "New content type", "View API" buttons stacked
- API base URL in DM Mono, copyable

---

### Content Types — List & Builder

**List view:**
- Card grid, 3 columns
- Each card shows: type name, icon, entry count, API slug, "Manage" link
- "New Content Type" button top-right: `--color-accent-bright`, uppercase label

**Field Builder (type editor):**
- Left: field list (draggable, dnd-kit handles shown as `⠿` in DM Mono, muted)
- Right: field config panel — white background, 1px left border
- Field type selector: horizontal pill-button row — Text, Number, Boolean, Media, etc.
  - Active pill: `--color-accent-bright` background, dark text
  - Inactive: border only

---

### Block Editor (Visual Page Editor)

**Layout:** Three zones:
1. **Left mini-panel (180px):** Block palette — draggable block types as compact cards
2. **Center canvas (fluid):** The page being built, with graph-paper empty state
3. **Right panel (320px):** Block properties, slides in when a block is selected

**Block cards (on canvas):**
- White background, 1px `var(--color-border)`, `--radius-sm`
- Selected: `border: 2px solid var(--color-accent)`, `box-shadow: 0 0 0 4px rgba(202,255,77,0.15)`
- Drag handle: `⠿` in left gutter, shows on hover
- Block type tag top-right: DM Mono, small, `--color-accent-bright` on dark pill

**Empty canvas:**
- Graph paper background
- Centered message: Playfair Display italic, 20px, muted — *"Your canvas is empty."*
- Sub-text: DM Sans 13px — "Drag a block from the left panel to begin."

---

### API Explorer (Developer View)

**Split layout:**
- Left: endpoint list (sidebar-style, dark background)
- Right: request/response pane

**Endpoint items:**
```
Method badge:  GET  — DM Mono, 11px
               background: rgba(202, 255, 77, 0.12)
               color: var(--color-accent-bright)
               border-radius: var(--radius-sm)
               padding: 2px 6px

Path:          DM Mono, 13px, white
Description:   DM Sans, 12px, muted
```

**Response pane:**
- Dark `#0F1109` background (darker than sidebar)
- JSON with syntax highlighting using the accent palette
- Copy button top-right: ghost, icon only

---

## Animation & Motion

```css
/* Standard easing */
--ease-out:     cubic-bezier(0.16, 1, 0.3, 1);   /* snap-out — panels, modals */
--ease-in-out:  cubic-bezier(0.45, 0, 0.55, 1);   /* balanced — accordion, tabs */
--ease-spring:  cubic-bezier(0.34, 1.56, 0.64, 1); /* slight overshoot — badges, toasts */

/* Durations */
--duration-fast:   100ms;   /* hover color changes */
--duration-normal: 200ms;   /* panel slides, dropdowns */
--duration-slow:   350ms;   /* page transitions, modals */
```

**Key moments to animate:**
- Sidebar nav item hover: `color` + left-border fade, `200ms`
- Right panel slide-in (block selected): `transform: translateX(0)` from `translateX(100%)`, `350ms --ease-out`
- Toast notifications: slide in from bottom-right + fade, spring easing
- Status badge on publish: brief scale `1 → 1.1 → 1` with color change, `300ms --ease-spring`
- Table row on create: fade + slide down from top, staggered if multiple

**Avoid:**
- Page-level skeleton loaders on every navigation (use instant transitions where possible)
- Bouncy animations on utility elements (only spring on celebratory moments)
- Spinning loaders — use a thin top-bar progress line instead (`var(--color-accent-bright)`)

---

## Iconography

Use **Lucide Icons** (`lucide-react`) throughout.
- Default size: 16px in UI, 20px in empty states
- Stroke width: `1.5` everywhere (lighter, more editorial than the default 2)
- Color: inherits from parent — never hardcoded

**Key icons by context:**
| Context | Icon |
|---|---|
| Content Types | `Layers` |
| Entries | `FileText` |
| Block Editor | `LayoutTemplate` |
| API Explorer | `Braces` |
| Published | `CheckCircle` |
| Draft | `Circle` |
| Drag handle | `GripVertical` |
| Settings | `SlidersHorizontal` |
| New / Add | `Plus` |
| Delete | `Trash2` |

---

## Responsive Notes

This is a tool for desktop-first workflows (CMS = power user tool). Mobile is read-only / preview only.

- **≥ 1280px:** Full three-column block editor layout
- **1024–1279px:** Block editor collapses right panel to overlay
- **768–1023px:** Sidebar collapses to icon-only mode (`--sidebar-collapsed: 64px`)
- **< 768px:** Dashboard renders a "mobile not supported" message with a redirect to view-only mode

---

## CSS Custom Property Summary

```css
:root {
  /* Colors */
  --color-canvas: #F5F2EC;
  --color-paper: #FDFBF7;
  --color-sidebar: #1A1D16;
  --color-sidebar-mid: #252920;
  --color-ink: #18180F;
  --color-ink-muted: #6B6A5E;
  --color-ink-faint: #BFBCB0;
  --color-ink-inverse: #E8E5DB;
  --color-accent: #4E7C59;
  --color-accent-bright: #CAFF4D;
  --color-accent-dim: #2E4A35;
  --color-border: #DDD9CF;
  --color-border-strong: #B0AC9F;
  --color-sidebar-border: #2F3328;
  --color-destructive: #C94040;
  --color-warning: #D4820A;
  --color-success: #3A7D44;

  /* Typography */
  --font-display: 'Playfair Display', Georgia, serif;
  --font-ui: 'DM Sans', sans-serif;
  --font-mono: 'DM Mono', 'Courier New', monospace;

  /* Spacing */
  --space-1: 0.25rem; --space-2: 0.5rem; --space-3: 0.75rem;
  --space-4: 1rem;    --space-5: 1.25rem; --space-6: 1.5rem;
  --space-8: 2rem;    --space-10: 2.5rem; --space-12: 3rem;
  --space-16: 4rem;   --space-24: 6rem;

  /* Layout */
  --sidebar-width: 240px;
  --sidebar-collapsed: 64px;
  --panel-width: 320px;
  --topbar-height: 56px;

  /* Borders & Radius */
  --radius-none: 0; --radius-sm: 2px; --radius-md: 4px; --radius-pill: 100px;
  --border-width: 1px; --border-width-thick: 2px;

  /* Shadows */
  --shadow-sm:  0 1px 2px rgba(24, 24, 15, 0.08);
  --shadow-md:  0 4px 12px rgba(24, 24, 15, 0.10);
  --shadow-lg:  0 12px 32px rgba(24, 24, 15, 0.14);
  --shadow-xl:  0 24px 48px rgba(24, 24, 15, 0.18);
  --shadow-panel: -4px 0 24px rgba(24, 24, 15, 0.10);
  --focus-ring: 0 0 0 3px rgba(202, 255, 77, 0.4);

  /* Animation */
  --ease-out: cubic-bezier(0.16, 1, 0.3, 1);
  --ease-in-out: cubic-bezier(0.45, 0, 0.55, 1);
  --ease-spring: cubic-bezier(0.34, 1.56, 0.64, 1);
  --duration-fast: 100ms;
  --duration-normal: 200ms;
  --duration-slow: 350ms;
}
```
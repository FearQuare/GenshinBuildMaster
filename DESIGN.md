---
version: "alpha"
name: "Glitch UI Dystopian Terminal"
description: "Glitch ui landing page, dystopian terminal, red alert style, digital interference, chaotic design, scanlines, warning aesthetic. Ideal for landing pages, modern websites. AI-ready template."
colors:
  primary: "#050000"
  secondary: "#FF5050"
  tertiary: "#FF0000"
  neutral: "#E0E0E0"
  surface: "#00FFFF"
  accent: "#330000"
typography:
  h1:
    fontFamily: Share Tech
    fontSize: 2.5rem
    fontWeight: 700
  body-md:
    fontFamily: Share Tech
    fontSize: 1rem
    fontWeight: 400
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.neutral}"
    padding: 12px
---

## Overview

Glitch ui landing page, dystopian terminal, red alert style, digital interference, chaotic design, scanlines, warning aesthetic. Ideal for landing pages, modern websites. AI-ready template. The glitch aesthetic didn't emerge from design studios. It crawled out of broken CRT monitors, corrupted VHS tapes, and the visual noise of failing hardware. In the late 1990s, artists like Jodi.org and Rosa Menkman began treating digital errors not as flaws but as raw material — exposing the fragility beneath polished interfaces. The dystopian terminal takes this further, channeling the paranoid energy of early hacker culture and Cold War-era command lines into something deliberately hostile and beautiful.

What makes this style endure is its honesty. Every scanline, every chromatic aberration, every flickering cursor says: this system is alive, unstable, possibly watching you. It owes as much to Ridley Scott's set design and William Gibson's prose as it does to actual Unix terminals. The green-on-black wasn't chosen for readability — it was chosen because phosphor burns felt dangerous.

Today the glitch-terminal aesthetic sits at the intersection of nostalgia and anxiety. We romanticize the command line precisely because GUIs made computing safe. This style rejects that safety.

- Density: 8/10 — Dense
- Variance: 8/10 — Expressive
- Motion: 4/10 — Subtle

- **Style:** Urgent, Computational, Retro-Futuristic
- **Keywords:** glitch, dystopian, terminal, warning, red, dark, chaos, digital, error
- **Era:** Dystopian Future
- **Light/Dark:** ✗ No / ✓ Full

## Colors

- **Background** (#050000) — Primary background surface
- **Text** (#FF5050) — Primary text color
- **Accent** (#FF0000) — Primary accent, CTAs and interactive elements
- **Static White** (#E0E0E0) — Secondary surface
- **Glitch Cyan** (#00FFFF) — Secondary accent
- **Dark Red** (#330000) — Deep contrast surface


## Typography

- **Display / Hero:** Share Tech — Weight 700, tight tracking, used for headline impact
- **Body:** Share Tech — Weight 400, 16px/1.6 line-height, max 72ch per line
- **UI Labels / Captions:** Share Tech — 0.875rem, weight 500, slight letter-spacing
- **Monospace:** JetBrains Mono — Used for code, metadata, and technical values

Scale:
- Hero: clamp(2.5rem, 5vw, 4rem)
- H1: 2.25rem
- H2: 1.5rem
- Body: 1rem / 1.6
- Small: 0.875rem


## Layout

- **Grid:** CSS Grid primary. Max-width containment: 1280px centered with 1.5rem side padding.
- **Spacing rhythm:** Balanced. Base unit: 0.5rem (8px).
- **Section vertical gaps:** clamp(4rem, 8vw, 8rem).
- **Hero layout:** Asymmetric composition.
- **Feature sections:** Asymmetric grid with varied card sizes. No 3-equal-columns.
- **Mobile collapse:** All multi-column layouts collapse below 768px. No horizontal overflow.
- **z-index contract:** base (0) / sticky-nav (100) / overlay (200) / modal (300) / toast (500).


## Elevation & Depth

Digital HUD layout, glitch artifacts, horizontal interference lines, wireframe iconography, CRT monitor scanlines, screen burn-in.

- **Physics:** Ease-out curves, 200-300ms duration. Smooth and predictable.
- **Entry animations:** Fade + translate-Y (16px → 0) over 420ms ease-out. Staggered cascades for lists: 80ms between items.
- **Hover states:** Subtle color shift + shadow adjustment over 200ms.
- **Page transitions:** Fade only (200ms).
- **Performance:** Only transform and opacity animated. No layout-triggering properties.


## Shapes

Base corner radius: 8px. See rounded tokens in front matter for the full scale.


## Components

- **Primary Button:** Subtly rounded (0.5rem) shape. Accent color fill. Hover: 8% darken + subtle lift shadow. Active: -1px translate tactile press. Font weight 600. No outer glows.
- **Secondary / Ghost Button:** Outline variant. 1.5px border in muted color. Text in primary color. Hover: subtle background fill.
- **Cards:** Subtly rounded (0.5rem) corners. Surface background. Subtle shadow (0 2px 12px rgba(0,0,0,0.06)). 1px border stroke.
- **Inputs:** Label above input. 1px border stroke. Focus ring: 2px accent color offset 2px. Error text below in semantic red. No floating labels.
- **Navigation:** Primary surface background. Active item: accent color indicator. Font weight 500 when active.
- **Skeletons:** Shimmer animation matching component dimensions. No circular spinners.
- **Empty States:** Icon-based composition with descriptive text and action button.


## Do's and Don'ts

- No emojis in UI — use icon system only (Lucide, Heroicons)
- No pure white (#FFFFFF) backgrounds — use off-white or dark surfaces
- No oversaturated accent colors (saturation cap: 80%)
- No 3-column equal-width feature layouts — use zig-zag or asymmetric grid
- No `h-screen` — use `min-h-[100dvh]`
- No AI copywriting clichés: "Elevate", "Seamless", "Unleash", "Next-Gen"
- No broken external image links — use picsum.photos or inline SVG
- No generic lorem ipsum in demos

- Do Black background
- Do Red dominant color scheme
- Do Glitch/Distortion animations
- Do Technical/HUD elements
- Do Monospace or Tech fonts


## Use Case

Landing pages, Modern websites
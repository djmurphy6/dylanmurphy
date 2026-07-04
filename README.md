# dylanmurphy.xyz

My personal website, modeled after an iPod Classic.

## Overview

A zero-dependency static site (HTML + CSS + inline JS) hosted on GitHub Pages.
Navigation mimics a real iPod — spin the click wheel, press the center button,
or use arrow keys.

## Structure

| File | Purpose |
|------|---------|
| `index.html` | Main menu (home) |
| `skills.html` | Soft skills submenu |
| `lang.html` | Programming languages |
| `linkedin.html` | LinkedIn preview |
| `github.html` | GitHub preview |
| `nowplaying.html` | Now Playing easter egg |
| `fastlearner/teamwork/leadership/coaching.html` | Skill detail pages |
| `style.css` | Single shared stylesheet |

Assets: `images/` (battery, favicon) · `fonts/macintosh-regular.ttf`

## Branches

| Branch | Description |
|--------|-------------|
| `main` | Stable, deployed to dylanmurphy.xyz |
| `feature/responsive-gen1-buttons` | Responsive scaling + Gen 1 iPod compass buttons |

## feature/responsive-gen1-buttons

- **Gen 1 compass buttons** — `MENU` / `⏮` / `⏭` / `⏯` added to the click
  wheel face at the four cardinal positions, matching the original 2001 iPod
  hardware layout.  Buttons are wired up on all 10 pages; on scroll-detail
  pages the labels counter-rotate as the wheel spins so they always face up.
- **Responsive scaling** — CSS media queries scale the iPod body via
  `transform: scale()` at 460 / 390 / 350 px breakpoints.  Short-screen
  devices (`max-height: 730px`) get `overflow-y: auto` so the full iPod
  remains reachable.

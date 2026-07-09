# dylanmurphy.xyz

My personal website, modeled after an iPod Classic.

## Overview

A zero-dependency static **single-page app** (HTML + CSS + vanilla JS, no
build step, no frameworks) hosted on **Vercel**. The iPod shell (screen bezel
+ click wheel + Gen 1 compass buttons) is mounted once in `index.html` and
never reloads; navigating between "pages" swaps an HTML fragment into the
screen and updates the URL via `history.pushState`, so it behaves like a real
iPod instead of a stack of separate web pages.

Navigation mimics a real iPod — spin the click wheel, press the center
button, use the four compass buttons (`menu` / `⏮` / `⏭` / `⏯`), or use arrow
keys / Enter.

## Structure

| Path | Purpose |
|------|---------|
| `index.html` | Persistent SPA shell (iPod body, wheel, compass buttons) + pre-rendered home screen |
| `404.html` | Copy of `index.html`, used as a GitHub Pages SPA fallback (Vercel doesn't need it — see `vercel.json`) |
| `js/screens.js` | Route registry — maps each path to its fragment file, wheel mode, title, and parent |
| `js/ipod.js` | Unified click wheel + compass button controller (menu nav / scroll / static modes) |
| `js/router.js` | Fetches/caches screen fragments, swaps `#screen-root`, handles `pushState`/`popstate` |
| `js/cursor.js` | Sitewide custom cursor — hides the system pointer; a cohesive mint-green orb trails the mouse with a rim-shadow + counter-rotated highlight for a lit, 3D sphere feel, tapering/bulging as one piece when dragged, with a synced idle wobble and drift when still (fine pointers only; breathing pulse lives in `style.css`) |
| `screens/*.html` | HTML fragments for each screen (home, skills, lang, linkedin, github, nowplaying, fastlearner, teamwork, leadership, coaching) |
| `style.css` | Single shared stylesheet (includes custom cursor styles) |
| `vercel.json` | Rewrites all non-asset paths to `index.html` so deep links (e.g. `/skills`) resolve client-side |

Assets: `images/` (battery, favicon) · `fonts/macintosh-regular.ttf`

## Routes

| Path | Mode | Parent |
|------|------|--------|
| `/` | menu | — |
| `/skills` | menu | `/` |
| `/lang` | menu | `/` |
| `/linkedin` | menu | `/` |
| `/github` | menu | `/` |
| `/nowplaying` | static | `/` |
| `/fastlearner`, `/teamwork`, `/leadership`, `/coaching` | scroll | `/skills` |

## Adding a new screen

1. Add a fragment at `screens/<name>.html` containing just what goes inside
   `.ipod-screen` (top bar + content — no wheel, no `<html>`/`<body>`).
2. Register it in `js/screens.js` with its `fragment`, `mode`, `title`, and
   `parent`.
3. Link to it from another screen with `<a href="/<name>">` — the router
   intercepts same-origin links automatically.

## Local development

```bash
npx serve -s .
```

Use `serve -s` so deep links like `/skills` fall back to `index.html` (same as
Vercel). The repo includes `serve.json` with `"cleanUrls": false` — without
that, `serve` strips `.html` from fragment URLs, can't find the file, and
returns `index.html` instead, which breaks submenus.

Click around at `http://localhost:3000/` (or whatever port `serve` prints).
In-app navigation, browser back/forward, and direct URL loads should all work.

## Branches

| Branch | Description |
|--------|-------------|
| `main` | Stable, deployed to dylanmurphy.xyz |
| `feature/spa-shell` | SPA conversion — persistent shell + client-side routed screens |

## Hosting

Deployed on **Vercel**, pointed at `dylanmurphy.xyz`. `vercel.json` rewrites
any unmatched path to `index.html` so the router can render the correct
screen from `window.location.pathname` on first load. GitHub Pages remains
usable as a fallback via `404.html` (identical to `index.html`), but Vercel
is the primary host.

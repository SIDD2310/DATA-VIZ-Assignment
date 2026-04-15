# WorldMonitor | Control Room (Data Viz Assignment)

An interactive “control room” dashboard that blends **geospatial visualization**, **live-ish global signals**, and a **cinematic UI** to explore risk, disruption, and macro context across the planet.

Built as a single-page **React + Vite** app with a stylized landing experience, a boot-sequence transition, and a multi-panel intelligence dashboard.

## Demo

- **GitHub Pages**: once enabled, the site will be available at `https://sidd2310.github.io/DATA-VIZ-Assignment/`
- **Local**: `npm run dev`

## What this app does

- **Cinematic landing → boot sequence → dashboard**: narrative UI that transitions into a data-heavy control room.
- **Global map views**:
  - **Flat vector map** (SVG) with layers for events and overlays.
  - **3D globe** + map rendering utilities (via `three` / `react-globe.gl` and `maplibre-gl` dependencies).
- **Live / external feeds** (best-effort; fallbacks included in places):
  - **Earthquakes** via USGS GeoJSON feeds
  - **Fires / thermal anomalies** via NASA FIRMS CSV endpoint (API key configurable)
  - **Markets** via Finnhub quotes (API key configurable)
  - **Energy & supply-chain panels** with EIA v2 telemetry support (API key configurable)
  - **News panels** via GNews (API key configurable); additional sources in `CountryDossier.jsx`
- **Accessibility modes** (persisted in `localStorage`):
  - **Colorblind mode** (deuteranopia filter)
  - **Narrator mode** (speech synthesis)
  - **Magnifier mode** (hover-to-capture text + lens overlay)

## Tech stack

- **Frontend**: React 19, Vite 8, Tailwind CSS
- **Viz / UI**: Recharts, GSAP, Lucide icons
- **Geo / 3D**: MapLibre GL, Three.js, `react-globe.gl`
- **Tooling**: ESLint (flat config)

## Project structure

- `src/main.jsx`: React entry + providers
- `src/App.jsx`: landing/boot/dashboard routing (client-side state machine)
- `src/Dashboard.jsx`: main dashboard, data ingest, panels, and map layers
- `src/FlatMap.jsx`: SVG flat map renderer + overlays + interaction
- `src/CountryDossier.jsx`: country detail view + news fetchers
- `src/AccessibilityContext.jsx`: accessibility toggles and narrator/magnifier logic
- `vite.config.js`: Vite config + **dev-only** Wingbits proxy + GitHub Pages base path

## Getting started

### Prerequisites

- **Node.js**: 22+ recommended (CI uses Node 22)
- **npm**: comes with Node

### Install

```bash
npm install
```

### Run locally

```bash
npm run dev
```

Open the URL shown in the terminal (typically `http://localhost:5173`).

### Build / preview

```bash
npm run build
npm run preview
```

## Configuration (API keys)

This app supports overriding keys via Vite environment variables.

Create a file named **`.env.local`** in the repo root (same folder as `package.json`):

```bash
VITE_FINNHUB_API_KEY="..."
VITE_GNEWS_API_KEY="..."
VITE_EIA_API_KEY="..."

# Dev-only proxy for Wingbits requests made to /api/wingbits/*
WINGBITS_API_KEY="..."

# Optional: only needed in CI / Pages builds. The GitHub Pages workflow sets this automatically.
# CI_PAGES_BASE="/DATA-VIZ-Assignment/"
```

### Notes about keys

- **Do not commit real keys**. Treat anything in `.env.local` as a secret.
- Some files currently include “demo/placeholder” keys for convenience; you should replace them with env vars for real use.

## Wingbits proxy (development only)

In `vite.config.js` a dev middleware proxies:

- `/api/wingbits/*` → `https://customer-api.wingbits.com/*`
- Adds header `x-api-key: ${WINGBITS_API_KEY}`

This only exists when running `npm run dev`. In production (GitHub Pages) there is **no server**, so those calls will fail unless you:

- add a backend/proxy (Cloudflare Worker / Netlify/Vercel functions / your own server), or
- switch to a public API that supports CORS directly from the browser.

## Deployment (free) — GitHub Pages

This repo includes a GitHub Actions workflow: `.github/workflows/deploy-github-pages.yml`.

### One-time setup

1. Go to **Repo → Settings → Pages**
2. Under **Build and deployment**
   - **Source**: select **GitHub Actions**

### Deploy

- Push to `main`, or run the workflow manually from the **Actions** tab.

The workflow builds the app and publishes the `dist/` folder to GitHub Pages.

## CI checks

Workflows are configured to match this repo’s scripts:

- **Lint Code**: runs `npm run lint`
- **Test**: runs `npm run lint` (there are no unit tests wired up yet)
- **Typecheck**: runs `npm run build` (compile-time verification)

## Troubleshooting

### GitHub Pages deploy fails with 404 from `deploy-pages`

This usually means Pages isn’t enabled for the repo yet. Enable it in **Settings → Pages** and re-run the workflow.

### `npm ci` fails on GitHub Actions

`npm ci` requires `package.json` and `package-lock.json` to be in sync. If you change dependencies, run:

```bash
npm install
git add package.json package-lock.json
```

### Lint errors from `public/` bundles

`public/` contains vendored/minified assets. ESLint is configured to ignore `public/` and `dist/`.

## Scripts

- `npm run dev`: start dev server
- `npm run build`: production build to `dist/`
- `npm run preview`: preview the production build
- `npm run lint`: run ESLint

## License

This project is for coursework/assignment use. If you plan to publish or reuse it broadly, add a license file that matches your intent.

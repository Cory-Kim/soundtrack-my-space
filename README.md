# Soundtrack My Space

[![CI](https://github.com/Cory-Kim/soundtrack-my-space/actions/workflows/ci.yml/badge.svg)](https://github.com/Cory-Kim/soundtrack-my-space/actions/workflows/ci.yml)

An immersive ambient sound mixer for building personalized focus, sleep, and relaxation soundscapes directly in the browser.

**Live demo:** [soundtrack-my-space.cdokyung.workers.dev](https://soundtrack-my-space.cdokyung.workers.dev)

## Features

- Mix multiple ambient sound layers in real time
- Control each layer independently
- Start quickly with curated mood presets
- Use sleep mode for calmer nighttime sessions
- Share a configured soundscape with others
- Install the experience as a Progressive Web App
- Continue using the app across responsive desktop and mobile layouts
- Play real audio assets through a browser-based mixing interface

## Tech stack

| Area | Technologies |
| --- | --- |
| Interface | React, JavaScript, CSS |
| Build tooling | Vite |
| Audio | Web Audio and browser media APIs |
| App experience | Progressive Web App support |
| Hosting | Cloudflare Workers |

## Getting started

### Prerequisites

- Node.js 20 or newer
- npm

### Local development

```bash
npm install
npm run dev
```

Open the local URL printed by Vite.

### Production build

```bash
npm run build
npm run preview
```

### Quality checks

```bash
npm run check
```

The check covers linting, sleep-timer fade behavior, audio-catalog integrity, and the production build.

## Project structure

```text
src/       React components, application state, and audio controls
public/    Audio files, icons, and PWA assets
docs/      Product and technical notes
```

## Product approach

The interface is designed to make a technically rich audio system feel immediate. Presets provide a useful starting point, while independent layer controls let users shape a soundscape without navigating away from the main experience.

## Deployment

The production build is configured for Cloudflare Workers through `wrangler.jsonc`.

## Author

Built by [Cory Kim](https://github.com/Cory-Kim).

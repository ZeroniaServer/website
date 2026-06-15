# Zeronia Website

Basic React site for GitHub Pages.

## Tech Stack

- React
- TypeScript
- Vite

## Structure

- `index.html` - HTML entry
- `src/app.tsx` - React DOM entry
- `src/app.css` - global styles
- `src/pages/home.tsx` - landing page
- more to come...

## Development

```bash
npm install   # first time only
npm run dev   # start the dev server
```

## Build

```bash
npm run build     # type-check + build to dist/
npm run preview   # serve the built dist/ locally
```

## Deployment

Pushing to `main` builds and publishes to GitHub Pages via
`.github/workflows/deploy.yml`.

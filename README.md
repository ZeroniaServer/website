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
- `src/components/navbar.tsx` - site navbar (data-driven)
- `src/components/footer.tsx` - site footer (matches the nav variant)
- `src/data/navbar/navbar.json` - shared navbar data (buttons, dropdown, per-page variants)
- `src/data/footer/footer.json` - footer socials (links/columns reuse navbar.json)
- `src/data/<page>/<section>/` - JSON that drives each page section
- more to come...

## Data files

Pages are data-driven from JSON under `src/data/<page>/<section>/`.

### `src/data/navbar/navbar.json`

The navbar is global — `buttons` and `dropdown` are shared across every page and
variant. Only the visual variant changes per page.

`pages` — map of page path → variant pool, e.g. `{ "/": ["grass"] }`. On load,
the current page's list is chosen from at random (list several to randomise,
like `["grass", "sand", "snow"]` for the home page). Variant names map to the
hardcoded `VARIANTS` registry in `src/components/navbar.tsx` (each defines its
colour pools, dig animation, and logo png in `src/assets/logo`). Add new
variants like `"sand"` / `"snow"` there, then list them per page here.

`buttons[]` — the nav buttons, left to right:

| Field   | Type                          | Notes                                                              |
| ------- | ----------------------------- | ------------------------------------------------------------------ |
| `name`  | string                        | Label shown on the button                                          |
| `link`  | `url` \| `scroll` \| `page`   | Kind of destination                                                |
| `route` | string                        | Destination: a URL, a scroll target, or a page path like `/games`  |
| `type`  | `button` \| `dropdown`        | Defaults to `button`; only `dropdown` shows a menu                 |

`dropdown[]` — sections shown under a dropdown button (no nested dropdowns):

| Field     | Type        | Notes                                            |
| --------- | ----------- | ------------------------------------------------ |
| `header`  | string      | Optional section label (omit for the first group) |
| `items[]` | NavLink[]   | Each has `name`, `link`, `route` (no `type`)     |

### `src/data/footer/footer.json`

The footer reuses `navbar.json` for its links and Released/Coming Soon/
Discontinued columns — only the socials are defined here.

`socials[]`:

| Field  | Type   | Notes                                          |
| ------ | ------ | ---------------------------------------------- |
| `name` | string | Accessible label                               |
| `icon` | string | png filename in `src/assets/socials`           |
| `url`  | string | Link target (opens in a new tab)               |

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

# Zeronia Website

Basic React site for GitHub Pages.

## Data files

Pages are data-driven from JSON under `src/data/<page>/<section>/`.

### `src/data/navbar/navbar.json`

Global navbar with per page driven variations.
`["grass", "sand", "snow"]`

| Field   | Type                          | Notes                                                              |
| ------- | ----------------------------- | ------------------------------------------------------------------ |
| `name`  | string                        | Button Label  |
| `link`  | `url` \ `scroll` \ `page`   | Destination type                                             |
| `route` | string                        | URL or scroll target  |
| `type`  | `button` \ `dropdown`        |                 |


| Field     | Type        | Notes                                            |
| --------- | ----------- | ------------------------------------------------ |
| `header`  | string      | Optional section label |
| `items[]` | NavLink[]   | Supports `name`, `link`, `route`     |

### `src/data/footer/footer.json`

Reuses `navbar.json` links and columns.

Defines socials.
`socials[]`:

| Field  | Type   | Notes                                          |
| ------ | ------ | ---------------------------------------------- |
| `name` | string |                |
| `icon` | string | png filename in `src/assets/socials`           |
| `url`  | string |   |

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

# Component sources

This showcase is an original system map built for Pablo Sánchez's profile.

- **Lucide**, ISC: https://github.com/lucide-icons/lucide. Interface icons.
- **Manrope**, SIL Open Font License: https://github.com/sharanda/manrope. Self-hosted through Fontsource.

The topology is illustrative: it describes areas of practice, not live deployment telemetry. Its paths animate with CSS and the selected station uses native radio controls, so the page remains usable without client-side JavaScript.

Earlier experimental source adapted from Magic UI remains in this repository but is not imported by the current public route. Its MIT license remains in [licenses/magic-ui.txt](licenses/magic-ui.txt).

Run `npm ci && npm run dev` in this directory. Static export: `npm run build`, output `out/`. GitHub Pages deploys automatically when this directory or its workflow changes.

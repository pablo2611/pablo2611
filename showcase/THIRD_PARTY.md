# Component sources

This showcase is an original animated dashboard built for Pablo Sánchez's profile.

- **Lucide**, ISC: https://github.com/lucide-icons/lucide. Interface icons.
- **Manrope**, SIL Open Font License: https://github.com/sharanda/manrope. Self-hosted through Fontsource.

The dashboard SVGs are authored in `scripts/generate-dashboard.mjs`. GitHub contributions and repository language sizes come from the GitHub GraphQL API. Language percentages describe the five largest languages by bytes in public, non-fork repositories owned by the account. The skills diagram is illustrative, not deployment telemetry. CSS animations work inside the SVGs with a reduced-motion fallback; no WebGL or client-side JavaScript is required.

Earlier experimental source adapted from Magic UI remains in this repository but is not imported by the current public route. Its MIT license remains in [licenses/magic-ui.txt](licenses/magic-ui.txt).

Run `npm ci && npm run dev` in this directory. Static export: `npm run build`, output `out/`. GitHub Pages deploys automatically when this directory or its workflow changes.

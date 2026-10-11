# Component sources

This showcase uses real open-source components, adapted for Pablo Sánchez's profile.

- **Magic UI — Animated Beam and Globe**, MIT: https://github.com/magicuidesign/magicui. Retrieved 2026-10-10 from `apps/www/registry/magicui/animated-beam.tsx` and `globe.tsx`. Full license in [licenses/magic-ui.txt](licenses/magic-ui.txt). Changes: explicit motion controls, visibility lifecycle, reduced rendering resolution, pointer accumulation correction, local visual theme.
- **Three.js**, MIT: https://github.com/mrdoob/three.js. Used for the interactive spatial scene; package license is included by npm.
- **Motion**, MIT: https://github.com/motiondivision/motion. Used by the imported beams and hover feedback.
- **COBE**, MIT: https://github.com/shuding/cobe. WebGL renderer used by Magic UI's globe.
- **Lucide**, ISC: https://github.com/lucide-icons/lucide. Interface icons.
- **Manrope**, SIL Open Font License: https://github.com/sharanda/manrope. Self-hosted through Fontsource.

Visual research: Magic UI's integration demos and Aceternity UI's 3D card presentation (https://ui.aceternity.com/components/3d-card-effect). No paid template or proprietary Aceternity source is bundled.

The node network and globe are illustrations of skills, not live deployment telemetry. The README previews are recordings of these components; the full Next.js page provides live interaction. GIF previews repeat. The live 3D scene varies its orientation and phase across visits.

Run `npm ci && npm run dev` in this directory. Static export: `npm run build`, output `out/`. GitHub Pages deploys automatically when this directory or its workflow changes.

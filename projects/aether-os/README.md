# AETHER OS

**Pablo Sánchez** · [@pablo2611](https://github.com/pablo2611)

[Abrir AETHER OS / Open AETHER OS](https://aether-os-pablo2611.vercel.app/) · [Página del proyecto / Project page](https://pablo2611.github.io/pablo2611/aether-os/) · [Español](#español) · [English](#english)

## Español

AETHER OS es un panel educativo de ciberseguridad defensiva. Reúne reportes públicos de SANS ISC, abuse.ch y CISA KEV para explorar actividad maliciosa y vulnerabilidades explotadas en un solo lugar.

- **Mapa e inteligencia** — explora la actividad reportada y consulta el catálogo CISA KEV. Los destinos de las animaciones son ilustrativos.
- **Terminal e inspector de tráfico** — consulta DNS y reputación de IPv4, y revisa las solicitudes que genera la pestaña.
- **Estudio criptográfico y guía** — calcula hashes localmente y consulta medidas de protección.
- **Evaluador de incidentes** — genera orientación defensiva con Lovable AI Gateway. Requiere configurar `LOVABLE_API_KEY` en el servidor.

## English

AETHER OS is an educational dashboard for defensive cybersecurity. It brings together public reports from SANS ISC, abuse.ch, and CISA KEV to explore reported activity and known exploited vulnerabilities.

- **Map and intelligence** — explore reported activity and browse the CISA KEV catalog. Animated destinations are illustrative.
- **Terminal and traffic inspector** — query DNS and IPv4 reputation, and inspect requests made by the browser tab.
- **Cryptography and guide** — calculate hashes locally and review defensive measures.
- **Incident assessment** — generate defensive guidance through Lovable AI Gateway. Set `LOVABLE_API_KEY` on the server to enable it.

## Desarrollo local / Local development

React, TypeScript, TanStack Start, Vite y Nitro. Usa Node.js 22.12+ y Bun. / Use Node.js 22.12+ and Bun.

```sh
git clone https://github.com/pablo2611/pablo2611.git
cd pablo2611/projects/aether-os
bun install --frozen-lockfile
bun run dev
bun run test
bun run build
```

El despliegue requiere un entorno con soporte para las funciones de servidor de TanStack Start. / Deployment requires a runtime that supports TanStack Start server functions.

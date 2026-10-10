import { writeFile } from 'node:fs/promises';

const cards = [
  { file:'expertise-infrastructure.svg', title:'Infraestructura', tech:'Linux / VPS · Cloud', lines:['Despliegue, contenedores','y monitorización.'], action:'Ver ServerDock', accent:'#86DBB6', surface:'#111F1B', border:'#315247', secondary:'#C4DCD1', icon:'<g fill="none" stroke="#86DBB6" stroke-width="1.7"><rect x="20" y="20" width="24" height="9" rx="2"/><rect x="20" y="33" width="24" height="9" rx="2"/><path d="M25 24.5h1m-1 13h1M32 24.5h7m-7 13h7" stroke-linecap="round"/></g>' },
  { file:'expertise-automation.svg', title:'Automatización e IA', tech:'Python · Telegram · n8n', lines:['Bots, APIs y flujos','entre servicios.'], action:'Ver repositorios', accent:'#73D5EB', surface:'#101E26', border:'#2E5365', secondary:'#C4DBE5', icon:'<circle cx="32" cy="31" r="14" fill="#229ED9"/><path d="M22 30 42 22 38 41 31 35 27 38 28 32 38 26 26 32Z" fill="#fff"/>' },
  { file:'expertise-web.svg', title:'Web interactiva', tech:'React · TypeScript · Three.js', lines:['Interfaces 3D y producto','con diseño y rendimiento.'], action:'Explorar AERION', accent:'#9DBFFF', surface:'#131D30', border:'#3D5279', secondary:'#CDD9F0', icon:'<g fill="none" stroke="#9DBFFF" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="m25 23-8 8 8 8m14-16 8 8-8 8m-2-19-7 23"/></g>' },
];
for (const card of cards) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="268" height="156" viewBox="0 0 268 156" role="img" aria-labelledby="title description">
<title id="title">${card.title}</title><desc id="description">${card.tech}. ${card.lines.join(' ')} ${card.action}.</desc>
<style>text{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif}.presence{animation:presence 4s ease-in-out infinite}@keyframes presence{0%,100%{opacity:.4}50%{opacity:1}}@media(prefers-reduced-motion:reduce){.presence{animation:none}}</style>
<rect x=".5" y=".5" width="267" height="155" rx="14" fill="${card.surface}" stroke="${card.border}"/>
${card.icon}
<text x="54" y="36" fill="#F4F8FA" font-size="16" font-weight="700">${card.title}</text>
<text x="20" y="62" fill="${card.accent}" font-size="11.5" font-weight="500">${card.tech}</text>
<text x="20" y="89" fill="${card.secondary}" font-size="13">${card.lines[0]}</text>
<text x="20" y="109" fill="${card.secondary}" font-size="13">${card.lines[1]}</text>
<text x="20" y="138" fill="${card.accent}" font-size="11.5" font-weight="600">${card.action}</text>
<g stroke="${card.accent}" stroke-width="1.5" fill="none" stroke-linecap="round" stroke-linejoin="round"><path d="M238 139l9-9m-8 0h8v8"/></g>
<circle class="presence" cx="246" cy="58" r="2" fill="${card.accent}"/>
</svg>`;
  await writeFile(new URL(`../assets/${card.file}`, import.meta.url), svg);
}

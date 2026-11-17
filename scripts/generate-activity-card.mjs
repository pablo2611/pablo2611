import { readFile, writeFile, readdir, unlink } from "node:fs/promises";
import { createHash } from "node:crypto";
import { dirname, basename, join } from "node:path";

const [input, output] = process.argv.slice(2);
if (!input || !output) throw new Error("Usage: node generate-activity-card.mjs <calendar.json> <output.svg>");
const result = JSON.parse((await readFile(input, "utf8")).replace(/^﻿/, ""));
const calendar = result.data?.user?.contributionsCollection?.contributionCalendar;
if (!calendar?.weeks?.length || !Number.isInteger(calendar.totalContributions)) throw new Error("Invalid GitHub calendar");

const weeks = calendar.weeks;
const days = weeks.flatMap(week => week.contributionDays);
const latest = days.at(-1).date;
const recent = count => days.filter(day => (Date.parse(latest) - Date.parse(day.date)) / 86400000 < count).reduce((sum, day) => sum + day.contributionCount, 0);
const activeDays = days.filter(day => day.contributionCount > 0).length;
const updated = new Intl.DateTimeFormat("es-PA", {day:"2-digit",month:"short",hour:"2-digit",minute:"2-digit",timeZone:"America/Panama"}).format(new Date());
const escape = value => String(value).replace(/[&<>"']/g, char => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&apos;"})[char]);

// Paleta estilo Apple: del gris azulado al azul del sistema y al cian claro.
const colors = {NONE:"#1a2432",FIRST_QUARTILE:"#0c3a6b",SECOND_QUARTILE:"#0a5cb5",THIRD_QUARTILE:"#0a84ff",FOURTH_QUARTILE:"#64d2ff"};
const glowing = new Set(["THIRD_QUARTILE","FOURTH_QUARTILE"]);
const FONT = "-apple-system,BlinkMacSystemFont,'SF Pro Display','SF Pro Text','Segoe UI',Helvetica,Arial,sans-serif";

const defs = `<defs>
<linearGradient id="surface" x1="0" y1="0" x2="0" y2="1"><stop stop-color="#121b28"/><stop offset="1" stop-color="#0a1019"/></linearGradient>
<linearGradient id="sheen" x1="0" x2="1"><stop stop-color="#fff" stop-opacity="0"/><stop offset=".5" stop-color="#fff" stop-opacity=".14"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>
<linearGradient id="blue" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#64d2ff"/><stop offset="1" stop-color="#0a84ff"/></linearGradient>
<radialGradient id="ambient" cx=".85" cy="0" r=".9"><stop stop-color="#0a84ff" stop-opacity=".16"/><stop offset="1" stop-color="#0a84ff" stop-opacity="0"/></radialGradient>
<filter id="glow" x="-100%" y="-100%" width="300%" height="300%"><feGaussianBlur stdDeviation="2.2" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
<style>
text{font-family:${FONT}}
.title{fill:#f5f5f7;font-size:18px;font-weight:600;letter-spacing:-.2px}
.sub{fill:#8e9bb0;font-size:12px}
.label{fill:#6f7d92;font-size:11px}
.num{fill:#f5f5f7;font-size:22px;font-weight:600;letter-spacing:-.4px}
.big{font-size:34px;font-weight:700;letter-spacing:-1px}
.cell{animation:flow 6s cubic-bezier(.45,0,.2,1) infinite}
.bar{transform-box:fill-box;transform-origin:center bottom;animation:bars 2.6s cubic-bezier(.45,0,.2,1) infinite alternate}
@keyframes flow{0%,100%{opacity:1}50%{opacity:.55}}
@keyframes bars{from{transform:scaleY(.6)}to{transform:scaleY(1)}}
@media(prefers-reduced-motion:reduce){.cell,.bar{animation:none}}
</style></defs>`;

const icon = (x, y) => `<rect x="${x}" y="${y}" width="38" height="38" rx="10" fill="url(#blue)"/>` +
  [12,20,15,18].map((h,i) => `<rect class="bar" x="${x+9+i*6}" y="${y+29-h}" width="3" height="${h}" rx="1.5" fill="#fff" style="animation-delay:${i*.2}s"/>`).join("");

const cell = (day, cx, cy, col) => {
  const level = day.contributionLevel in colors ? day.contributionLevel : "NONE";
  return `<rect class="cell" x="${cx}" y="${cy}" width="9.5" height="9.5" rx="3" fill="${colors[level]}"${glowing.has(level) ? ' filter="url(#glow)"' : ""} style="animation-delay:${(col*.09).toFixed(2)}s"><title>${day.contributionCount} contribuciones / ${day.date}</title></rect>`;
};

const monthLabels = (list, x0, step, y) => {
  const labels = []; let last = "", lastCol = -99;
  list.forEach((week, i) => {
    const date = new Date(`${week.firstDay}T00:00:00Z`);
    const month = date.toLocaleString("es",{month:"short",timeZone:"UTC"}).replace(".", "");
    if (i === 0 && date.getUTCDate() > 7) return;
    if (month !== last && i - lastCol >= 3) { labels.push(`<text x="${x0+i*step}" y="${y}" class="label">${escape(month)}</text>`); last = month; lastCol = i; }
  });
  return labels.join("");
};

const legend = (x, y) => `<text x="${x}" y="${y+9}" class="label" text-anchor="end">Menos</text>` +
  Object.values(colors).map((c,i) => `<rect x="${x+8+i*14}" y="${y}" width="10" height="10" rx="3" fill="${c}"/>`).join("") +
  `<text x="${x+8+5*14+4}" y="${y+9}" class="label">Más</text>`;

// Escritorio
const step = 12, gx = 86, gy = 112;
const desktop = `<svg xmlns="http://www.w3.org/2000/svg" width="760" height="286" viewBox="0 0 760 286" role="img" aria-labelledby="title description">
<title id="title">Actividad en GitHub</title><desc id="description">Contribuciones reales de Pablo Sánchez. Fuente GitHub API. Actualización cada seis horas.</desc>
${defs}
<rect x=".5" y=".5" width="759" height="285" rx="22" fill="url(#surface)" stroke="#ffffff" stroke-opacity=".08"/>
<rect x=".5" y=".5" width="759" height="285" rx="22" fill="url(#ambient)"/>
<path d="M60 1H700" stroke="url(#sheen)"/>
${icon(30,28)}
<text x="82" y="44" class="title">Actividad en GitHub</text><text x="82" y="63" class="sub">Actualizado ${escape(updated)} · Panamá</text>
<text x="730" y="52" text-anchor="end" class="big" fill="url(#blue)">${calendar.totalContributions}</text><text x="730" y="70" text-anchor="end" class="sub">contribuciones en 12 meses</text>
${monthLabels(weeks, gx, step, 100)}
<text x="50" y="132" class="label">Lun</text><text x="50" y="156" class="label">Mié</text><text x="50" y="180" class="label">Vie</text>
<g>${weeks.flatMap((week,col) => week.contributionDays.map(day => cell(day, gx+col*step, gy+day.weekday*step, col))).join("")}</g>
<path d="M30 214H730" stroke="#ffffff" stroke-opacity=".07"/>
<text x="30" y="246" class="num">${recent(7)}</text><text x="30" y="264" class="sub">últimos 7 días</text>
<path d="M150 230v34" stroke="#ffffff" stroke-opacity=".07"/>
<text x="172" y="246" class="num">${recent(30)}</text><text x="172" y="264" class="sub">últimos 30 días</text>
<path d="M300 230v34" stroke="#ffffff" stroke-opacity=".07"/>
<text x="322" y="246" class="num">${activeDays}</text><text x="322" y="264" class="sub">días activos en el año</text>
${legend(626, 250)}
</svg>`;

// Móvil
const mobileWeeks = weeks.slice(-26);
const mobile = `<svg xmlns="http://www.w3.org/2000/svg" width="380" height="340" viewBox="0 0 380 340" role="img" aria-labelledby="title description">
<title id="title">Actividad en GitHub</title><desc id="description">${calendar.totalContributions} contribuciones en doce meses. Calendario de las 26 semanas más recientes.</desc>
${defs}
<rect x=".5" y=".5" width="379" height="339" rx="22" fill="url(#surface)" stroke="#ffffff" stroke-opacity=".08"/>
<rect x=".5" y=".5" width="379" height="339" rx="22" fill="url(#ambient)"/>
<path d="M40 1H340" stroke="url(#sheen)"/>
${icon(22,22)}
<text x="72" y="38" class="title" style="font-size:16px">Actividad</text><text x="72" y="55" class="sub">${escape(updated)} · Panamá</text>
<text x="356" y="46" text-anchor="end" class="big" style="font-size:30px" fill="url(#blue)">${calendar.totalContributions}</text><text x="356" y="64" text-anchor="end" class="sub">en 12 meses</text>
${monthLabels(mobileWeeks, 40, 12, 104)}
<text x="14" y="134" class="label">L</text><text x="14" y="158" class="label">M</text><text x="14" y="182" class="label">V</text>
<g>${mobileWeeks.flatMap((week,col) => week.contributionDays.map(day => cell(day, 40+col*12, 116+day.weekday*12, col))).join("")}</g>
<path d="M22 216H358" stroke="#ffffff" stroke-opacity=".07"/>
<text x="22" y="252" class="num">${recent(7)}</text><text x="22" y="270" class="sub">7 días</text>
<text x="140" y="252" class="num">${recent(30)}</text><text x="140" y="270" class="sub">30 días</text>
<text x="258" y="252" class="num">${activeDays}</text><text x="258" y="270" class="sub">días activos</text>
${legend(262, 304)}
</svg>`;

// Nombres según el contenido: GitHub no puede servir una versión vieja en caché.
const dir = dirname(output), stem = basename(output, ".svg");
const hash = markup => createHash("sha256").update(markup).digest("hex").slice(0, 12);
const files = { [stem]: desktop, [`${stem}-mobile`]: mobile };
const names = {};
for (const [name, markup] of Object.entries(files)) {
  await writeFile(join(dir, `${name}.svg`), markup);
  names[name] = `${name}-${hash(markup)}.svg`;
  await writeFile(join(dir, names[name]), markup);
}
for (const file of await readdir(dir)) {
  if (new RegExp(`^${stem}(?:-mobile)?-[a-f0-9]{12}\\.svg$`).test(file) && !Object.values(names).includes(file)) await unlink(join(dir, file));
}
const readme = await readFile("README.md", "utf8");
const next = readme
  .replace(new RegExp(`assets/${stem}-mobile(?:-[a-f0-9]{12})?\\.svg(?:\\?v=\\d+)?`, "g"), `assets/${names[`${stem}-mobile`]}`)
  .replace(new RegExp(`assets/${stem}(?:-[a-f0-9]{12})?\\.svg(?:\\?v=\\d+)?`, "g"), `assets/${names[stem]}`);
if (next !== readme) await writeFile("README.md", next);
console.log(`Rendered activity card: ${calendar.totalContributions} contributions`);

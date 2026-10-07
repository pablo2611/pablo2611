import { readFile, writeFile } from "node:fs/promises";
const [input, output] = process.argv.slice(2);
if (!input || !output) throw new Error("Usage: node generate-activity-card.mjs <calendar.json> <output.svg>");
const result = JSON.parse(await readFile(input, "utf8"));
const calendar = result.data?.user?.contributionsCollection?.contributionCalendar;
if (!calendar?.weeks?.length || !Number.isInteger(calendar.totalContributions)) throw new Error("Invalid GitHub calendar");
const weeks = calendar.weeks;
const days = weeks.flatMap(week => week.contributionDays);
const latest = days.at(-1).date;
const recent = count => days.filter(day => (Date.parse(latest) - Date.parse(day.date)) / 86400000 < count).reduce((sum, day) => sum + day.contributionCount, 0);
const activeDays = days.filter(day => day.contributionCount > 0).length;
const updated = new Intl.DateTimeFormat("es-PA", {day:"2-digit",month:"short",hour:"2-digit",minute:"2-digit",timeZone:"America/Panama"}).format(new Date());
const escape = value => String(value).replace(/[&<>"']/g, char => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&apos;"})[char]);
const colors = {NONE:"#242331",FIRST_QUARTILE:"#554c9c",SECOND_QUARTILE:"#7468da",THIRD_QUARTILE:"#9589ff",FOURTH_QUARTILE:"#c3bcff"};
const step = 12, x = 85, y = 108;
const labels = [];
let lastMonth = "", lastColumn = -99;
for (let i = 0; i < weeks.length; i++) {
  const date = new Date(`${weeks[i].firstDay}T00:00:00Z`);
  const month = date.toLocaleString("es",{month:"short",timeZone:"UTC"});
  if (i === 0 && date.getUTCDate() > 7) continue;
  if (month !== lastMonth && i-lastColumn >= 3) {
    labels.push(`<text x="${x+i*step}" y="95" class="label">${escape(month)}</text>`);
    lastMonth = month; lastColumn = i;
  }
}
const squares = weeks.flatMap((week,col) => week.contributionDays.map(day => `<rect x="${x+col*step}" y="${y+day.weekday*step}" width="9" height="9" rx="2.5" class="${day.contributionCount ? "pulse" : ""}" style="animation-delay:${(col%7)*.19}s" fill="${colors[day.contributionLevel] ?? colors.NONE}"${day.date===latest?' stroke="#e1dcff" stroke-width="1.5"':''}><title>${day.contributionCount} contribuciones / ${day.date}</title></rect>`)).join("");
const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="760" height="278" viewBox="0 0 760 278" role="img" aria-labelledby="title description">
<title id="title">Actividad en GitHub</title><desc id="description">Contribuciones reales de Pablo S\u00e1nchez. Fuente GitHub API. Actualizaci\u00f3n cada seis horas.</desc>
<defs><linearGradient id="surface" x2="1" y2="1"><stop stop-color="#161326"/><stop offset="1" stop-color="#0d0e18"/></linearGradient><style>.label{fill:#aaa5bd;font:11px -apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif}.small{fill:#aaa5bd;font:12px -apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif}.strong{fill:#fff;font:700 18px -apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif}</style></defs>
<rect x=".5" y=".5" width="759" height="277" rx="22" fill="url(#surface)" stroke="#ffffff" stroke-opacity=".14"/>
<rect x="28" y="27" width="38" height="38" rx="10" fill="#7c6cff" fill-opacity=".18" stroke="#ffffff" stroke-opacity=".14"/>
${bars(40,53)}
<text x="80" y="43" class="strong">Actividad en GitHub</text><text x="80" y="64" class="small">Actualizado: ${escape(updated)} / Panam\u00e1</text>
<text x="710" y="44" text-anchor="end" class="strong" style="font-size:30px">${calendar.totalContributions}</text><text x="710" y="64" text-anchor="end" class="small">contribuciones / \u00faltimos 12 meses</text>
<text x="53" y="127" class="label">Lun</text><text x="53" y="151" class="label">Mi\u00e9</text><text x="53" y="175" class="label">Vie</text>
${labels.join("")}<g>${squares}</g>${scanner(x,y,weeks.length*step,81)}
<path d="M28 209H732" stroke="#ffffff" stroke-opacity=".1"/>
<text x="32" y="234" class="strong">${recent(7)}</text><text x="68" y="234" class="small">\u00faltimos 7 d\u00edas</text>
<text x="228" y="234" class="strong">${recent(30)}</text><text x="264" y="234" class="small">\u00faltimos 30 d\u00edas</text>
<text x="440" y="234" class="strong">${activeDays}</text><text x="476" y="234" class="small">d\u00edas activos / a\u00f1o</text>
<text x="32" y="260" class="small">Fuente: GitHub API / actualizaci\u00f3n cada 6 horas</text>
<text x="570" y="260" class="label">Menos</text><g transform="translate(615 249)">${Object.values(colors).map((color,i)=>`<rect x="${i*15}" width="11" height="11" rx="2.5" fill="${color}"/>`).join("")}</g><text x="700" y="260" class="label">M\u00e1s</text>
</svg>`;
await writeFile(output, animateSvg(svg, weeks.length*step));
const mobileWeeks = weeks.slice(-26);
const mobileLabels = [];
let mobileMonth = "";
mobileWeeks.forEach((week,col) => {
  const month = new Date(`${week.firstDay}T00:00:00Z`).toLocaleString("es",{month:"short",timeZone:"UTC"});
  if (month !== mobileMonth && col > 0) { mobileLabels.push(`<text x="${38+col*12}" y="124" class="label">${escape(month)}</text>`); mobileMonth=month; }
});
const mobileSquares = mobileWeeks.flatMap((week,col)=>week.contributionDays.map(day=>`<rect x="${38+col*12}" y="${139+day.weekday*12}" width="9" height="9" rx="2.5" class="${day.contributionCount?'pulse':''}" style="animation-delay:${(col%7)*.19}s" fill="${colors[day.contributionLevel]??colors.NONE}"${day.date===latest?' stroke="#e1dcff" stroke-width="1.5"':''}><title>${day.contributionCount} contribuciones / ${day.date}</title></rect>`)).join("");
const mobile = `<svg xmlns="http://www.w3.org/2000/svg" width="380" height="350" viewBox="0 0 380 350" role="img" aria-labelledby="title description">
<title id="title">Actividad en GitHub</title><desc id="description">${calendar.totalContributions} contribuciones en doce meses. Calendario de las 26 semanas más recientes.</desc>
<defs><linearGradient id="surface" x2="1" y2="1"><stop stop-color="#161326"/><stop offset="1" stop-color="#0d0e18"/></linearGradient><style>.label{fill:#aaa5bd;font:11px Arial,sans-serif}.small{fill:#aaa5bd;font:12px Arial,sans-serif}.strong{fill:#fff;font:700 18px Arial,sans-serif}</style></defs>
<rect x=".5" y=".5" width="379" height="349" rx="20" fill="url(#surface)" stroke="#ffffff" stroke-opacity=".14"/>
${bars(24,47)}<text x="62" y="40" class="strong">Actividad en GitHub</text><text x="352" y="40" text-anchor="end" class="strong" style="font-size:26px">${calendar.totalContributions}</text>
<text x="352" y="60" text-anchor="end" class="small">contribuciones / 12 meses</text>
<text x="24" y="83" class="small">Actualizado: ${escape(updated)} / Panamá</text><text x="24" y="106" class="small">Calendario / últimos 6 meses</text>
${mobileLabels.join("")}<text x="10" y="158" class="label">L</text><text x="10" y="182" class="label">M</text><text x="10" y="206" class="label">V</text><g>${mobileSquares}</g>${scanner(38,139,mobileWeeks.length*12,81)}
<path d="M24 237H356" stroke="#ffffff" stroke-opacity=".1"/>
<text x="24" y="266" class="strong" style="font-size:24px">${recent(7)}</text><text x="24" y="285" class="small">7 días</text>
<text x="143" y="266" class="strong" style="font-size:24px">${recent(30)}</text><text x="143" y="285" class="small">30 días</text>
<text x="262" y="266" class="strong" style="font-size:24px">${activeDays}</text><text x="262" y="285" class="small">días activos/año</text>
<text x="24" y="316" class="small">GitHub API / actualización cada 6 horas</text>
</svg>`;
await writeFile(output.replace(/\.svg$/, "-mobile.svg"), animateSvg(mobile, mobileWeeks.length*12));
const readme = await readFile("README.md","utf8");
const next = readme.replace(/(https:\/\/raw\.githubusercontent\.com\/pablo2611\/pablo2611\/main\/assets\/activity-heatmap(?:-mobile)?\.svg)(?:\?v=\d+)?/g,`$1?v=${Date.now()}`);
if (next !== readme) await writeFile("README.md",next);

function bars(x,y) {
  return [12,22,16,19].map((height,i)=>`<rect class="bar" x="${x+i*7}" y="${y-height}" width="3" height="${height}" rx="1.5" fill="#c3bcff" style="animation-delay:${i*.22}s"/>`).join("");
}
function scanner(x,y,width,height) {
  return `<defs><clipPath id="gridClip"><rect x="${x}" y="${y}" width="${width}" height="${height}"/></clipPath><linearGradient id="scanLight"><stop stop-color="#c3bcff" stop-opacity="0"/><stop offset="1" stop-color="#c3bcff" stop-opacity=".22"/></linearGradient></defs><g clip-path="url(#gridClip)" aria-hidden="true"><g class="scan"><rect x="${x-28}" y="${y}" width="28" height="${height}" fill="url(#scanLight)"/><path d="M${x} ${y}v${height}" stroke="#d5ceff" stroke-width="1.5" stroke-opacity=".65"/></g></g>`;
}
function animateSvg(markup,distance) {
  return markup.replace('</svg>',`<style>
.bar{transform-box:fill-box;transform-origin:center bottom;animation:bars 2.8s cubic-bezier(.77,0,.175,1) infinite alternate}
.pulse{animation:pulse 2.7s ease-in-out infinite alternate}
.scan{animation:scan 5.4s linear infinite}
@keyframes bars{from{transform:scaleY(.55);opacity:.65}to{transform:scaleY(1);opacity:1}}
@keyframes pulse{from{opacity:.62}to{opacity:1}}
@keyframes scan{0%{transform:translateX(0);opacity:0}8%{opacity:1}90%{opacity:1}100%{transform:translateX(${distance+28}px);opacity:0}}
@media(prefers-reduced-motion:reduce){.bar{animation:pulse 4s ease-in-out infinite alternate}.scan{display:none}}
</style></svg>`);
}

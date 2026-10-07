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
const squares = weeks.flatMap((week,col) => week.contributionDays.map(day => `<rect x="${x+col*step}" y="${y+day.weekday*step}" width="9" height="9" rx="2.5" fill="${colors[day.contributionLevel] ?? colors.NONE}"${day.date===latest?' stroke="#e1dcff" stroke-width="1.5"':''}><title>${day.contributionCount} contribuciones / ${day.date}</title></rect>`)).join("");
const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="760" height="278" viewBox="0 0 760 278" role="img" aria-labelledby="title description">
<title id="title">Actividad en GitHub</title><desc id="description">Contribuciones reales de Pablo S\u00e1nchez. Fuente GitHub API. Actualizaci\u00f3n cada seis horas.</desc>
<defs><linearGradient id="surface" x2="1" y2="1"><stop stop-color="#161326"/><stop offset="1" stop-color="#0d0e18"/></linearGradient><style>.label{fill:#aaa5bd;font:11px -apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif}.small{fill:#aaa5bd;font:12px -apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif}.strong{fill:#fff;font:700 18px -apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif}</style></defs>
<rect x=".5" y=".5" width="759" height="277" rx="22" fill="url(#surface)" stroke="#ffffff" stroke-opacity=".14"/>
<rect x="28" y="27" width="38" height="38" rx="10" fill="#7c6cff" fill-opacity=".18" stroke="#ffffff" stroke-opacity=".14"/>
<path d="M40 53V43m6 10V37m6 16v-7m6 7V40" fill="none" stroke="#c3bcff" stroke-width="2.5" stroke-linecap="round"/>
<text x="80" y="43" class="strong">Actividad en GitHub</text><text x="80" y="64" class="small">Actualizado: ${escape(updated)} / Panam\u00e1</text>
<text x="710" y="44" text-anchor="end" class="strong" style="font-size:30px">${calendar.totalContributions}</text><text x="710" y="64" text-anchor="end" class="small">contribuciones / \u00faltimos 12 meses</text>
<text x="53" y="127" class="label">Lun</text><text x="53" y="151" class="label">Mi\u00e9</text><text x="53" y="175" class="label">Vie</text>
${labels.join("")}<g>${squares}</g>
<path d="M28 209H732" stroke="#ffffff" stroke-opacity=".1"/>
<text x="32" y="234" class="strong">${recent(7)}</text><text x="68" y="234" class="small">\u00faltimos 7 d\u00edas</text>
<text x="228" y="234" class="strong">${recent(30)}</text><text x="264" y="234" class="small">\u00faltimos 30 d\u00edas</text>
<text x="440" y="234" class="strong">${activeDays}</text><text x="476" y="234" class="small">d\u00edas activos / a\u00f1o</text>
<text x="32" y="260" class="small">Fuente: GitHub API / actualizaci\u00f3n cada 6 horas</text>
<text x="570" y="260" class="label">Menos</text><g transform="translate(615 249)">${Object.values(colors).map((color,i)=>`<rect x="${i*15}" width="11" height="11" rx="2.5" fill="${color}"/>`).join("")}</g><text x="700" y="260" class="label">M\u00e1s</text>
</svg>`;
await writeFile(output, svg);
const readme = await readFile("README.md","utf8");
const next = readme.replace(/(https:\/\/raw\.githubusercontent\.com\/pablo2611\/pablo2611\/main\/assets\/activity-heatmap\.svg)(?:\?v=\d+)?/,`$1?v=${Date.now()}`);
if (next !== readme) await writeFile("README.md",next);

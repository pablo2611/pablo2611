import { readFile, writeFile } from "node:fs/promises";

const [input, output] = process.argv.slice(2);
if (!input || !output) throw new Error("Usage: node generate-activity-card.mjs <calendar.json> <output.svg>");

const { data } = JSON.parse(await readFile(input, "utf8"));
const calendar = data.user.contributionsCollection.contributionCalendar;
const weeks = calendar.weeks;
const cell = 10;
const gap = 3;
const step = cell + gap;
const x = 92;
const y = 110;
const levels = { NONE: "#ffffff12", FIRST_QUARTILE: "#554c9c", SECOND_QUARTILE: "#7468da", THIRD_QUARTILE: "#9589ff", FOURTH_QUARTILE: "#c3bcff" };
const escape = (value) => String(value).replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&apos;" })[char]);
const monthLabels = [];
let previousMonth = "";
for (let index = 0; index < weeks.length; index += 1) {
  const date = new Date(`${weeks[index].firstDay}T00:00:00Z`);
  const month = date.toLocaleString("en", { month: "short", timeZone: "UTC" });
  if (month !== previousMonth) {
    monthLabels.push(`<text x="${x + index * step}" y="96" class="label">${month}</text>`);
    previousMonth = month;
  }
}
const squares = weeks.flatMap((week, column) => week.contributionDays.map((day) => {
  const fill = levels[day.contributionLevel] ?? levels.NONE;
  const tooltip = `${day.contributionCount} contribution${day.contributionCount === 1 ? "" : "s"} on ${day.date}`;
  return `<rect x="${x + column * step}" y="${y + day.weekday * step}" width="${cell}" height="${cell}" rx="2.5" fill="${fill}"><title>${escape(tooltip)}</title></rect>`;
})).join("");
const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="760" height="300" viewBox="0 0 760 300" role="img" aria-labelledby="title description">
  <title id="title">Contribution activity</title>
  <desc id="description">Live GitHub contribution calendar for Pablo Sánchez, updated automatically each day.</desc>
  <defs>
    <linearGradient id="surface" x1="0" x2="1" y1="0" y2="1"><stop stop-color="#161326"/><stop offset="1" stop-color="#0d0e18"/></linearGradient>
    <radialGradient id="glow"><stop stop-color="#7c6cff" stop-opacity=".3"/><stop offset="1" stop-color="#7c6cff" stop-opacity="0"/></radialGradient>
    <filter id="blur"><feGaussianBlur stdDeviation="18"/></filter>
    <style>.label{fill:#918da9;font:10px -apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif}.small{fill:#918da9;font:11px -apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif}.strong{fill:#fff;font:700 16px -apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif}</style>
  </defs>
  <rect width="760" height="300" rx="22" fill="url(#surface)" stroke="#ffffff" stroke-opacity=".13"/>
  <circle cx="70" cy="35" r="82" fill="url(#glow)" filter="url(#blur)"><animate attributeName="opacity" values=".35;.82;.35" dur="4s" repeatCount="indefinite"/></circle>
  <rect x="28" y="27" width="38" height="38" rx="10" fill="#7c6cff" fill-opacity=".18" stroke="#ffffff" stroke-opacity=".14"/>
  <path d="M40 53V43m6 10V37m6 16v-7m6 7V40" fill="none" stroke="#c3bcff" stroke-width="2.5" stroke-linecap="round"/>
  <text x="80" y="43" class="strong">Contribution activity</text>
  <text x="80" y="62" class="small">Live data · updated daily</text>
  <text x="690" y="45" text-anchor="end" class="strong" font-size="25">${calendar.totalContributions.toLocaleString()}</text>
  <text x="690" y="63" text-anchor="end" class="small">contributions in the last year</text>
  <text x="57" y="129" class="label">Mon</text><text x="57" y="155" class="label">Wed</text><text x="57" y="181" class="label">Fri</text>
  ${monthLabels.join("")}
  <g>${squares}</g>
  <text x="590" y="263" class="label">Less</text><g transform="translate(620 252)"><rect width="11" height="11" rx="2.5" fill="#ffffff12"/><rect x="15" width="11" height="11" rx="2.5" fill="#554c9c"/><rect x="30" width="11" height="11" rx="2.5" fill="#7468da"/><rect x="45" width="11" height="11" rx="2.5" fill="#9589ff"/><rect x="60" width="11" height="11" rx="2.5" fill="#c3bcff"/></g><text x="700" y="263" class="label">More</text>
</svg>`;
await writeFile(output, svg);

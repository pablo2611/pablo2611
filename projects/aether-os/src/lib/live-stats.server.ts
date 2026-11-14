// Server-only: live attack statistics from SANS ISC + the shared threat feed.
import { loadThreatFeed } from './threat-feed.server';
import { categoryOf, groupByCategory } from './attack-types';
import { servicePorts } from './aether';

export type LiveStats = {
  checkedAt: string;
  sourceAt: string;
  infocon: string;
  daily: { date: string; records: number; sources: number; targets: number }[];
  ports: { port: number; service: string; category: string; records: number; sources: number; targets: number }[];
  categories: { id: string; name: string; what: string; records: number; share: number }[];
  portTrend: { ports: number[]; rows: Record<string, number | string>[] };
  topIps: { ip: string; reports: number; targets: number }[];
  c2Families: { malware: string; total: number; online: number }[];
  countries: { code: string; attacks: number; attackers: number; c2: number }[];
  asns: { as: string; attackers: number; attacks: number }[];
  kev: { total: number; ransomware: number; last30: number; topVendors: { vendor: string; count: number }[] };
  feed: { attackers: number; attacks: number; countries: number; c2Online: number; c2Total: number };
  errors: string[];
};

const UA = { 'User-Agent': 'AETHER-OS-lab (educational dashboard)' };
const TTL = 2 * 60 * 1000;
let cache: { at: number; data: Omit<LiveStats, 'checkedAt'> } | null = null;
let pending: Promise<Omit<LiveStats, 'checkedAt'>> | null = null;

async function json<T>(url: string): Promise<T> {
  const res = await fetch(url, { headers: UA });
  if (!res.ok) throw new Error(`${new URL(url).host} respondió ${res.status}`);
  return (await res.json()) as T;
}
const day = (d: Date) => d.toISOString().slice(0, 10);

async function build(): Promise<Omit<LiveStats, 'checkedAt'>> {
  const errors: string[] = [];
  const safe = async <T>(label: string, fn: () => Promise<T>, fallback: T) => {
    try { return await fn(); } catch (e) { console.error(label, e); errors.push(`${label}: no disponible`); return fallback; }
  };
  const end = new Date(); const start = new Date(Date.now() - 14 * 86400_000); const weekStart = new Date(Date.now() - 7 * 86400_000);
  const [feed, dailyRaw, portsRaw, ipsRaw] = await Promise.all([
    loadThreatFeed(),
    safe('SANS ISC resumen diario', () => json<Array<{ date: string; records: number; sources: number; targets: number }>>(`https://isc.sans.edu/api/dailysummary/${day(start)}/${day(end)}?json`), []),
    safe('SANS ISC puertos', () => json<Record<string, { targetport: number; records: number; targets: number; sources: number }>>('https://isc.sans.edu/api/topports/records/20?json'), {}),
    safe('SANS ISC top IPs', () => json<Array<{ source: string; reports: number; targets: number }>>('https://isc.sans.edu/api/topips/records/10?json'), []),
  ]);
  const daily = (Array.isArray(dailyRaw) ? dailyRaw : []).filter((d) => d && d.date && Number(d.records) > 0).map((d) => ({ date: d.date, records: Number(d.records), sources: Number(d.sources), targets: Number(d.targets) }));
  const ports = Object.values(portsRaw).filter((p) => p && typeof p === 'object' && 'targetport' in p).map((p) => ({ port: Number(p.targetport), service: servicePorts[Number(p.targetport)] ?? 'Otro', category: categoryOf(Number(p.targetport)).name, records: Number(p.records), sources: Number(p.sources), targets: Number(p.targets) }));
  const top5 = ports.slice(0, 5).map((p) => p.port);
  const histories = await Promise.all(top5.map((port) => safe(`SANS ISC historial ${port}`, () => json<Record<string, { date?: string; records?: number }>>(`https://isc.sans.edu/api/porthistory/${port}/${day(weekStart)}/${day(end)}?json`), {})));
  const rowsByDate = new Map<string, Record<string, number | string>>();
  histories.forEach((h, i) => {
    for (const v of Object.values(h)) {
      if (!v || typeof v !== 'object' || !v.date) continue;
      const row = rowsByDate.get(v.date) ?? { date: v.date };
      row[`p${top5[i]}`] = Number(v.records) || 0;
      rowsByDate.set(v.date, row);
    }
  });
  const fam = new Map<string, { total: number; online: number }>();
  for (const c of feed.c2) { const f = fam.get(c.malware) ?? { total: 0, online: 0 }; f.total += 1; if (c.status === 'online') f.online += 1; fam.set(c.malware, f); }
  const asn = new Map<string, { attackers: number; attacks: number }>();
  for (const a of feed.attackers) { const key = a.as || 'Desconocido'; const v = asn.get(key) ?? { attackers: 0, attacks: 0 }; v.attackers += 1; v.attacks += a.attacks; asn.set(key, v); }
  return {
    sourceAt: feed.updatedAt,
    infocon: feed.infocon,
    daily,
    ports,
    categories: groupByCategory(ports),
    portTrend: { ports: top5, rows: [...rowsByDate.values()].sort((a, b) => String(a['date']).localeCompare(String(b['date']))) },
    topIps: (Array.isArray(ipsRaw) ? ipsRaw : []).map((r) => ({ ip: r.source, reports: Number(r.reports), targets: Number(r.targets) })),
    c2Families: [...fam.entries()].map(([malware, v]) => ({ malware, ...v })).sort((a, b) => b.total - a.total).slice(0, 8),
    countries: Object.entries(feed.countries).map(([code, v]) => ({ code, attacks: v.attacks, attackers: v.attackers, c2: v.c2 })).sort((a, b) => b.attacks - a.attacks).slice(0, 10),
    asns: [...asn.entries()].map(([as, v]) => ({ as, ...v })).sort((a, b) => b.attacks - a.attacks).slice(0, 8),
    kev: { total: feed.kev.total, ransomware: feed.kev.ransomware, last30: feed.kev.last30, topVendors: feed.kev.topVendors },
    feed: { attackers: feed.attackers.length, attacks: feed.attackers.reduce((s, a) => s + a.attacks, 0), countries: Object.keys(feed.countries).length, c2Online: feed.c2.filter((c) => c.status === 'online').length, c2Total: feed.c2.length },
    errors: [...feed.errors, ...errors],
  };
}

export async function loadLiveStats(): Promise<LiveStats> {
  if (!cache || Date.now() - cache.at > TTL) {
    pending ??= build().then((data) => { if (data.daily.length || data.ports.length) cache = { at: Date.now(), data }; return data; }).finally(() => { pending = null; });
    const fresh = await pending;
    return { ...(cache?.data ?? fresh), checkedAt: new Date().toISOString() };
  }
  return { ...cache.data, checkedAt: new Date().toISOString() };
}

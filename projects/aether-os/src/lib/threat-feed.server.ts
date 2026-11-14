// Server-only: aggregates free public threat-intelligence feeds.
type Attacker = { ip: string; attacks: number; count: number; firstseen: string; lastseen: string; country: string; countryName: string; city: string; lat: number; lon: number; as: string };
type C2 = { ip: string; port: number; status: string; malware: string; country: string; asName: string; firstSeen: string; lastOnline: string };
type Kev = { cveID: string; vendorProject: string; product: string; vulnerabilityName: string; dateAdded: string; shortDescription: string; requiredAction: string; dueDate: string; ransomware: string };
export type ThreatFeed = {
  updatedAt: string;
  infocon: string;
  attackers: Attacker[];
  c2: C2[];
  ports: { port: number; records: number; targets: number; sources: number }[];
  kev: { total: number; recent: Kev[]; ransomware: number; last30: number; topVendors: { vendor: string; count: number }[] };
  news: { title: string; link: string; date: string }[];
  countries: Record<string, { attackers: number; attacks: number; reports: number; c2: number }>;
  errors: string[];
};
const UA = { 'User-Agent': 'AETHER-OS-lab (educational dashboard)' };
let cache: { at: number; feed: ThreatFeed } | null = null;
const TTL = 5 * 60 * 1000;

async function json<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, { ...init, headers: { ...UA, ...(init?.headers || {}) } });
  if (!res.ok) throw new Error(`${new URL(url).host} respondió ${res.status}`);
  return (await res.json()) as T;
}

async function geolocate(ips: string[]) {
  const out = new Map<string, { countryCode: string; country: string; city: string; lat: number; lon: number; as: string }>();
  for (let i = 0; i < ips.length; i += 100) {
    const batch = ips.slice(i, i + 100);
    const rows = await json<Array<{ status: string; query: string; countryCode: string; country: string; city: string; lat: number; lon: number; as: string }>>(
      'http://ip-api.com/batch?fields=status,query,countryCode,country,city,lat,lon,as',
      { method: 'POST', body: JSON.stringify(batch), headers: { 'Content-Type': 'application/json' } },
    );
    for (const r of rows) if (r.status === 'success') out.set(r.query, r);
  }
  return out;
}

export async function loadThreatFeed(): Promise<ThreatFeed> {
  if (cache && Date.now() - cache.at < TTL) return cache.feed;
  const errors: string[] = [];
  const safe = async <T>(label: string, fn: () => Promise<T>, fallback: T) => {
    try { return await fn(); } catch (e) { console.error(label, e); errors.push(`${label}: no disponible`); return fallback; }
  };
  const [sources, feodo, ports, infocon, kevRaw, rss] = await Promise.all([
    safe('SANS ISC atacantes', () => json<Array<{ ip: string; attacks: number; count: number; firstseen: string; lastseen: string }>>('https://isc.sans.edu/api/sources/attacks/400?json'), []),
    safe('abuse.ch Feodo Tracker', () => json<Array<{ ip_address: string; port: number; status: string; malware: string; country: string; as_name: string; first_seen: string; last_online: string }>>('https://feodotracker.abuse.ch/downloads/ipblocklist.json'), []),
    safe('SANS ISC puertos', () => json<Record<string, { targetport: number; records: number; targets: number; sources: number }>>('https://isc.sans.edu/api/topports/records/10?json'), {}),
    safe('SANS ISC Infocon', () => json<{ status: string }>('https://isc.sans.edu/api/infocon?json'), { status: 'desconocido' }),
    safe('CISA KEV', () => json<{ vulnerabilities: Array<Record<string, string>> }>('https://www.cisa.gov/sites/default/files/feeds/known_exploited_vulnerabilities.json'), { vulnerabilities: [] }),
    safe('SANS ISC diarios', async () => { const r = await fetch('https://isc.sans.edu/rssfeed_full.xml', { headers: UA }); if (!r.ok) throw new Error(String(r.status)); return r.text(); }, ''),
  ]);
  const list = Array.isArray(sources) ? sources.filter((s) => s && s.ip) : [];
  const geo = await safe('Geolocalización ip-api', () => geolocate(list.map((s) => s.ip)), new Map());
  const attackers: Attacker[] = list.flatMap((s) => {
    const g = geo.get(s.ip);
    if (!g) return [];
    return [{ ip: s.ip, attacks: Number(s.attacks) || 0, count: Number(s.count) || 0, firstseen: s.firstseen, lastseen: s.lastseen, country: g.countryCode, countryName: g.country, city: g.city, lat: g.lat, lon: g.lon, as: g.as }];
  });
  const c2: C2[] = (Array.isArray(feodo) ? feodo : []).map((f) => ({ ip: f.ip_address, port: f.port, status: f.status, malware: f.malware, country: f.country, asName: f.as_name, firstSeen: f.first_seen, lastOnline: f.last_online }));
  const countries: ThreatFeed['countries'] = {};
  for (const a of attackers) {
    const c = (countries[a.country] ??= { attackers: 0, attacks: 0, reports: 0, c2: 0 });
    c.attackers += 1; c.attacks += a.attacks; c.reports += a.count;
  }
  for (const f of c2) if (f.country) (countries[f.country] ??= { attackers: 0, attacks: 0, reports: 0, c2: 0 }).c2 += 1;
  const vulns = kevRaw.vulnerabilities || [];
  const recent = [...vulns].sort((a, b) => String(b['dateAdded']).localeCompare(String(a['dateAdded']))).slice(0, 30).map((v) => ({
    cveID: v['cveID'] ?? '', vendorProject: v['vendorProject'] ?? '', product: v['product'] ?? '', vulnerabilityName: v['vulnerabilityName'] ?? '', dateAdded: v['dateAdded'] ?? '', shortDescription: v['shortDescription'] ?? '', requiredAction: v['requiredAction'] ?? '', dueDate: v['dueDate'] ?? '', ransomware: v['knownRansomwareCampaignUse'] ?? 'Unknown',
  }));
  const news = [...rss.matchAll(/<item>[\s\S]*?<title><!\[CDATA\[([\s\S]*?)\]\]><\/title>[\s\S]*?<link>([^<]+)<\/link>[\s\S]*?<pubDate>([^<]+)<\/pubDate>/g)].slice(0, 6).map((m) => ({ title: (m[1] ?? '').trim(), link: (m[2] ?? '').trim(), date: (m[3] ?? '').trim() }));
  const feed: ThreatFeed = {
    updatedAt: new Date().toISOString(),
    infocon: infocon.status,
    attackers: attackers.sort((a, b) => b.attacks - a.attacks),
    c2,
    ports: Object.values(ports).filter((p) => p && typeof p === 'object' && 'targetport' in p).map((p) => ({ port: p.targetport, records: p.records, targets: p.targets, sources: p.sources })),
    kev: {
      total: vulns.length,
      recent,
      ransomware: vulns.filter((v) => v['knownRansomwareCampaignUse'] === 'Known').length,
      last30: vulns.filter((v) => Date.now() - Date.parse(String(v['dateAdded'])) < 30 * 86400_000).length,
      topVendors: Object.entries(vulns.reduce<Record<string, number>>((m, v) => { const k = String(v['vendorProject'] ?? 'Otro'); m[k] = (m[k] ?? 0) + 1; return m; }, {})).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([vendor, count]) => ({ vendor, count })),
    },
    news,
    countries,
    errors,
  };
  if (attackers.length || c2.length) cache = { at: Date.now(), feed };
  return feed;
}

export async function lookupIpInfo(ip: string) {
  const [geo, isc] = await Promise.all([
    json<Record<string, unknown>>(`http://ip-api.com/json/${ip}?fields=status,message,country,countryCode,regionName,city,lat,lon,isp,org,as,proxy,hosting`).catch(() => null),
    json<{ ip?: Record<string, unknown> }>(`https://isc.sans.edu/api/ip/${ip}?json`).catch(() => null),
  ]);
  const i = isc?.ip ?? {};
  return {
    ip,
    country: String(geo?.['country'] ?? '—'), countryCode: String(geo?.['countryCode'] ?? ''), city: String(geo?.['city'] ?? '—'), region: String(geo?.['regionName'] ?? '—'),
    isp: String(geo?.['isp'] ?? '—'), as: String(geo?.['as'] ?? '—'), hosting: Boolean(geo?.['hosting']), proxy: Boolean(geo?.['proxy']),
    iscReports: i['count'] == null ? 0 : Number(i['count']), iscAttacks: i['attacks'] == null ? 0 : Number(i['attacks']),
    feeds: Object.keys((i['threatfeeds'] as Record<string, unknown>) ?? {}),
    abuseContact: String(i['asabusecontact'] ?? '—'),
  };
}

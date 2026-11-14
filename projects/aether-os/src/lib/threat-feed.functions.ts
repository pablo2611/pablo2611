import { createServerFn } from '@tanstack/react-start';
import { z } from 'zod';
import type { ThreatFeed } from './threat-feed.server';
export type { ThreatFeed };

export const getThreatFeed = createServerFn({ method: 'GET' }).handler(async (): Promise<ThreatFeed> => {
  const { loadThreatFeed } = await import('./threat-feed.server');
  return loadThreatFeed();
});

const ipv4 = /^(25[0-5]|2[0-4]\d|1?\d?\d)(\.(25[0-5]|2[0-4]\d|1?\d?\d)){3}$/;
export const lookupIp = createServerFn({ method: 'POST' })
  .validator((input: unknown) => z.object({ ip: z.string().trim().regex(ipv4, 'IPv4 no válida') }).parse(input))
  .handler(async ({ data }) => {
    const { lookupIpInfo } = await import('./threat-feed.server');
    return lookupIpInfo(data.ip);
  });

export const lookupDns = createServerFn({ method: 'POST' })
  .validator((input: unknown) => z.object({ name: z.string().trim().toLowerCase().regex(/^[a-z0-9.-]+\.[a-z]{2,}$/, 'Dominio no válido').max(253), type: z.enum(['A', 'AAAA', 'MX', 'TXT', 'NS', 'CNAME']) }).parse(input))
  .handler(async ({ data }) => {
    type DnsJson = { Status: number; Answer?: { name: string; type: number; TTL: number; data: string }[] };
    let d: DnsJson | null = null;
    for (const base of ['https://cloudflare-dns.com/dns-query', 'https://dns.google/resolve']) {
      try {
        const res = await fetch(`${base}?name=${encodeURIComponent(data.name)}&type=${data.type}`, { headers: { accept: 'application/dns-json' } });
        if (res.ok) { d = (await res.json()) as DnsJson; break; }
      } catch (e) { console.error('DNS lookup failed', base, e); }
    }
    if (!d) throw new Error('El servicio DNS no respondió. Inténtalo de nuevo.');
    return { status: d.Status, answers: (d.Answer ?? []).map((a) => ({ name: a.name, ttl: a.TTL, data: a.data })) };
  });

export type { LiveStats } from './live-stats.server';
export const getLiveStats = createServerFn({ method: 'GET' }).handler(async () => {
  const { loadLiveStats } = await import('./live-stats.server');
  return loadLiveStats();
});

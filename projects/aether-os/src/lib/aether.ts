import { keccak256 } from 'js-sha3';

export function entropy(text: string) {
  const bytes = new TextEncoder().encode(text);
  if (!bytes.length) return 0;
  const counts = new Map<number, number>();
  for (const b of bytes) counts.set(b, (counts.get(b) || 0) + 1);
  return [...counts.values()].reduce((sum, n) => { const p = n / bytes.length; return sum - p * Math.log2(p); }, 0);
}

export async function hashText(text: string, algorithm: string) {
  if (algorithm === 'Keccak-256') return keccak256(text);
  const digest = await crypto.subtle.digest(algorithm, new TextEncoder().encode(text));
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

/** Severity bucket for a source IP based on how many distinct attacks SANS ISC sensors attributed to it. */
export function severityFromAttacks(attacks: number): 'critical' | 'high' | 'medium' {
  if (attacks >= 1000) return 'critical';
  if (attacks >= 200) return 'high';
  return 'medium';
}

/** 0..1 log-scaled intensity used to color countries on the map. */
export function intensity(value: number, max: number) {
  if (value <= 0 || max <= 0) return 0;
  return Math.min(1, Math.log1p(value) / Math.log1p(max));
}

export function hexRows(bytes: Uint8Array) {
  return Array.from({ length: Math.ceil(bytes.length / 16) }, (_, i) => {
    const row = bytes.slice(i * 16, i * 16 + 16);
    return {
      offset: (i * 16).toString(16).padStart(4, '0'),
      hex: [...row].map((b) => b.toString(16).padStart(2, '0')).join(' '),
      ascii: [...row].map((b) => (b > 31 && b < 127 ? String.fromCharCode(b) : '.')).join(''),
    };
  });
}

const regionNames = typeof Intl !== 'undefined' && 'DisplayNames' in Intl ? new Intl.DisplayNames(['es'], { type: 'region' }) : null;
export function countryName(code: string) {
  if (!code) return 'Desconocido';
  try { return regionNames?.of(code.toUpperCase()) ?? code; } catch { return code; }
}

export const servicePorts: Record<number, string> = { 22: 'SSH', 23: 'Telnet', 80: 'HTTP', 443: 'HTTPS', 445: 'SMB', 3389: 'RDP', 8080: 'HTTP alt', 8000: 'HTTP dev', 8443: 'HTTPS alt', 5900: 'VNC', 3306: 'MySQL', 1433: 'MSSQL', 6379: 'Redis', 25: 'SMTP', 53: 'DNS', 2222: 'SSH alt', 81: 'HTTP alt', 8888: 'HTTP alt', 9200: 'Elasticsearch', 5432: 'PostgreSQL', 37215: 'Huawei HG532', 52869: 'UPnP', 7547: 'TR-069' };

export function downloadJson(name: string, value: unknown) {
  const url = URL.createObjectURL(new Blob([JSON.stringify(value, null, 2)], { type: 'application/json' }));
  const link = document.createElement('a'); link.href = url; link.download = name; link.click(); URL.revokeObjectURL(url);
}

export function timeAgo(iso: string, now: number) {
  const s = Math.max(0, Math.round((now - new Date(iso).getTime()) / 1000));
  if (s < 60) return `hace ${s} s`;
  if (s < 3600) return `hace ${Math.round(s / 60)} min`;
  return `hace ${Math.round(s / 3600)} h`;
}

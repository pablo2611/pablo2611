import { useEffect, useRef, useState } from 'react';
import { useServerFn } from '@tanstack/react-start';
import { CornerDownLeft, Terminal as TerminalIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { countryName, entropy, hashText, servicePorts } from '@/lib/aether';
import { lookupDns, lookupIp, type ThreatFeed } from '@/lib/threat-feed.functions';
import type { Iss } from '@/lib/use-live';
import { tone } from '@/lib/audio';

const HELP = `COMANDOS (todos usan datos reales)
dns <dominio> [A|AAAA|MX|TXT|NS]  Consulta DNS vía Cloudflare DoH
ip <ipv4>                         Geolocalización y reputación (SANS ISC)
top [n]                           IPs con más ataques hoy
country <código>                  Actividad de un país (ej. country US)
ports                             Puertos más atacados hoy
cve <CVE-AAAA-NNNN>               Busca en el catálogo CISA KEV
kev [n]                           Últimas vulnerabilidades explotadas
c2                                Servidores de botnets activos
infocon                           Nivel de amenaza global de SANS ISC
iss                               Posición de la Estación Espacial
sha256 <texto> · entropy <texto>  Criptografía local
whoami                            Datos de tu navegador
audio on|off · clear · help`;

export function Terminal({ feed, iss, audio, setAudio, compact = false }: { feed: ThreatFeed | undefined; iss: Iss | null; audio: boolean; setAudio: (on: boolean) => void; compact?: boolean }) {
  const ipLookup = useServerFn(lookupIp);
  const dnsLookup = useServerFn(lookupDns);
  const [lines, setLines] = useState<{ cmd?: string | undefined; out: string }[]>([{ out: 'AETHER OS 3.0 — terminal con datos en vivo. Escribe help.' }]);
  const [input, setInput] = useState('');
  const [history, setHistory] = useState<string[]>([]);
  const [cursor, setCursor] = useState(0);
  const [busy, setBusy] = useState(false);
  const output = useRef<HTMLDivElement>(null);
  useEffect(() => { if (output.current) output.current.scrollTop = output.current.scrollHeight; }, [lines]);
  const id = compact ? 'cmd-mini' : 'cmd-full';
  const print = (cmd: string | undefined, out: string) => setLines((l) => [...l, { cmd, out }].slice(-120));

  const exec = async (raw: string): Promise<string> => {
    const [cmd = '', ...args] = raw.trim().split(/\s+/);
    const arg = args.join(' ');
    const need = () => { if (!feed) throw new Error('Los datos en vivo aún se están cargando.'); return feed; };
    switch (cmd.toLowerCase()) {
      case 'help': return HELP;
      case 'dns': {
        const name = args[0]; const type = (args[1] || 'A').toUpperCase();
        if (!name || !/^[a-z0-9.-]+\.[a-z]{2,}$/i.test(name)) return 'Uso: dns ejemplo.com [A|AAAA|MX|TXT|NS]';
        if (!['A', 'AAAA', 'MX', 'TXT', 'NS', 'CNAME'].includes(type)) return 'Tipos admitidos: A, AAAA, MX, TXT, NS, CNAME';
        const d = await dnsLookup({ data: { name, type: type as 'A' } });
        if (!d.answers.length) return `Sin registros ${type} para ${name} (estado ${d.status}).`;
        return d.answers.map((a) => `${a.name.padEnd(28)} TTL ${String(a.ttl).padEnd(6)} ${a.data}`).join('\n');
      }
      case 'ip': {
        if (!args[0]) return 'Uso: ip 8.8.8.8';
        const r = await ipLookup({ data: { ip: args[0] } });
        return [`IP        ${r.ip}`, `Ubicación ${r.city}, ${r.region}, ${r.country}`, `Red       ${r.as} (${r.isp})`, `Hosting   ${r.hosting ? 'sí' : 'no'} · Proxy/VPN ${r.proxy ? 'sí' : 'no'}`, `SANS ISC  ${r.iscReports} reportes · ${r.iscAttacks} objetivos atacados`, `Listas    ${r.feeds.length ? r.feeds.slice(0, 6).join(', ') : 'no aparece en listas de amenazas'}`, `Abuso     ${r.abuseContact}`].join('\n');
      }
      case 'top': {
        const n = Math.min(25, Number(args[0]) || 10);
        return need().attackers.slice(0, n).map((a, i) => `${String(i + 1).padStart(2)}. ${a.ip.padEnd(16)} ${String(a.attacks).padStart(6)} ataques  ${a.country}  ${a.as.slice(0, 32)}`).join('\n');
      }
      case 'country': {
        const code = (args[0] || '').toUpperCase(); const c = need().countries[code];
        if (!code) return 'Uso: country US';
        if (!c) return `${countryName(code)}: sin IPs en el top de atacantes ni servidores C2 ahora mismo.`;
        const ips = need().attackers.filter((a) => a.country === code).slice(0, 5).map((a) => `  ${a.ip} (${a.attacks} ataques, ${a.city})`).join('\n');
        return `${countryName(code)}\nIPs atacantes: ${c.attackers} · ataques: ${c.attacks.toLocaleString('es')} · reportes: ${c.reports.toLocaleString('es')} · C2: ${c.c2}\n${ips}`;
      }
      case 'ports': return need().ports.map((p) => `${String(p.port).padEnd(6)} ${(servicePorts[p.port] ?? '').padEnd(12)} ${p.records.toLocaleString('es').padStart(9)} registros · ${p.sources} orígenes`).join('\n');
      case 'cve': {
        const q = arg.toUpperCase(); const v = need().kev.recent.find((x) => x.cveID === q);
        if (!q) return 'Uso: cve CVE-2024-3400';
        return v ? `${v.cveID} · ${v.vendorProject} ${v.product}\n${v.vulnerabilityName}\n${v.shortDescription}\nAcción: ${v.requiredAction}\nRansomware: ${v.ransomware === 'Known' ? 'sí' : 'no confirmado'}` : `${q} no está entre las 30 más recientes del KEV. Detalle: https://nvd.nist.gov/vuln/detail/${q}`;
      }
      case 'kev': return need().kev.recent.slice(0, Math.min(30, Number(args[0]) || 8)).map((v) => `${v.dateAdded}  ${v.cveID.padEnd(16)} ${v.vendorProject} ${v.product}`).join('\n');
      case 'c2': return need().c2.map((c) => `${(c.ip + ':' + c.port).padEnd(22)} ${c.malware.padEnd(10)} ${c.country} ${c.status}`).join('\n') || 'Sin servidores en la lista.';
      case 'infocon': return `Infocon SANS ISC: ${need().infocon.toUpperCase()}  (green = normal · yellow = amenaza en curso · orange/red = crítica)`;
      case 'iss': return iss ? `ISS  lat ${iss.latitude.toFixed(3)}  lon ${iss.longitude.toFixed(3)}  alt ${iss.altitude.toFixed(1)} km  vel ${iss.velocity.toFixed(0)} km/h  (${iss.visibility})` : 'Conectando con la ISS…';
      case 'sha256': return arg ? await hashText(arg, 'SHA-256') : 'Uso: sha256 texto';
      case 'entropy': return arg ? `${entropy(arg).toFixed(3)} bits/byte` : 'Uso: entropy texto';
      case 'whoami': return `Navegador: ${navigator.userAgent}\nIdioma: ${navigator.language} · Zona horaria: ${Intl.DateTimeFormat().resolvedOptions().timeZone}\nNúcleos: ${navigator.hardwareConcurrency ?? '?'} · Pantalla: ${screen.width}x${screen.height}`;
      case 'audio': setAudio(args[0] === 'on'); return `Audio ${args[0] === 'on' ? 'activado' : 'silenciado'}.`;
      default: return `Comando no encontrado: ${cmd}. Escribe help.`;
    }
  };

  const run = async (command: string) => {
    if (!command.trim() || busy) return;
    setHistory((h) => [...h, command]); setCursor(history.length + 1); setInput('');
    if (command.trim() === 'clear') { setLines([]); return; }
    if (audio) tone(440, 0.03, 0.02);
    setBusy(true);
    try { print(command, await exec(command)); } catch (e) { print(command, `Error: ${e instanceof Error ? e.message.replace(/^\[.*?\]\s*/, '') : 'no disponible'}`); } finally { setBusy(false); }
  };

  return (
    <section className={`terminal-tool ${compact ? 'compact' : ''}`}>
      <div className="panel-heading"><span><TerminalIcon size={14} /> Terminal</span><span className="micro muted">{busy ? 'EJECUTANDO…' : 'DATOS EN VIVO'}</span></div>
      <div className="terminal-output" ref={output}>{lines.map((l, i) => <div key={i}>{l.cmd && <pre className="command-line">operator@aether:~$ {l.cmd}</pre>}<pre>{l.out}</pre></div>)}</div>
      <form onSubmit={(e) => { e.preventDefault(); void run(input); }} className="terminal-prompt">
        <label htmlFor={id}>operator<span>@aether</span>:~$</label>
        <input id={id} aria-label="Comando de terminal" value={input} autoComplete="off" autoCapitalize="off" spellCheck={false} onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'ArrowUp') { e.preventDefault(); const n = Math.max(0, cursor - 1); setCursor(n); setInput(history[n] || ''); } if (e.key === 'ArrowDown') { e.preventDefault(); const n = Math.min(history.length, cursor + 1); setCursor(n); setInput(history[n] || ''); } }} />
        <Button size="icon" variant="ghost" type="submit" aria-label="Ejecutar comando"><CornerDownLeft /></Button>
      </form>
      <div className="terminal-shortcuts">{['help', 'top 5', 'ports', 'dns github.com', 'ip 8.8.8.8', 'iss'].map((c) => <Button key={c} variant="ghost" size="sm" onClick={() => void run(c)}>{c}</Button>)}</div>
    </section>
  );
}

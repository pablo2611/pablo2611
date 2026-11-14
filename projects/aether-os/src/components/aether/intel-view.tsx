import { useMemo, useState } from 'react';
import { ExternalLink, Search, ShieldAlert, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { countryName, servicePorts } from '@/lib/aether';
import type { ThreatFeed } from '@/lib/threat-feed.functions';

export function IntelView({ feed, onAssess }: { feed: ThreatFeed | undefined; onAssess: (prefill: { title: string; description: string; indicators: string }) => void }) {
  const [q, setQ] = useState('');
  const [onlyRansom, setOnlyRansom] = useState(false);
  const kev = useMemo(() => (feed?.kev.recent ?? []).filter((v) => (!onlyRansom || v.ransomware === 'Known') && `${v.cveID} ${v.vendorProject} ${v.product} ${v.vulnerabilityName}`.toLowerCase().includes(q.toLowerCase())), [feed, q, onlyRansom]);
  const maxPort = Math.max(1, ...(feed?.ports ?? []).map((p) => p.records));
  if (!feed) return <div className="panel panel-body muted">Cargando inteligencia en vivo…</div>;
  return (
    <div className="stack">
      <div className="grid-auto">
        <section className="panel">
          <div className="panel-heading"><span>Puertos más atacados</span><span className="micro muted">SANS ISC · HOY</span></div>
          <div className="panel-body stack-sm">
            {feed.ports.map((p) => (
              <div key={p.port} className="bar-row">
                <span className="mono">{p.port}<small className="muted"> {servicePorts[p.port] ?? ''}</small></span>
                <div className="bar"><i style={{ width: `${(p.records / maxPort) * 100}%` }} /></div>
                <span className="mono num small">{p.records.toLocaleString('es')}</span>
              </div>
            ))}
            <p className="muted small">Registros de conexiones bloqueadas por los sensores DShield. Si expones alguno de estos servicios a internet, restríngelo por IP o VPN.</p>
          </div>
        </section>
        <section className="panel">
          <div className="panel-heading"><span>Servidores de control de botnets</span><span className="micro muted">ABUSE.CH FEODO</span></div>
          <div className="table-wrap"><table className="data-table"><thead><tr><th>IP:puerto</th><th>Malware</th><th>País</th><th>Estado</th></tr></thead>
            <tbody>{feed.c2.length === 0 ? <tr><td colSpan={4} className="muted">Sin servidores activos en la lista.</td></tr> : feed.c2.map((c) => <tr key={c.ip + c.port}><td>{c.ip}:{c.port}</td><td>{c.malware}</td><td>{countryName(c.country)}</td><td><span className={`badge-state ${c.status === 'online' ? 'alert' : ''}`}>{c.status === 'online' ? 'En línea' : 'Fuera de línea'}</span></td></tr>)}</tbody></table></div>
          <p className="panel-body muted small">Bloquea estas IP en tu firewall de salida: un equipo infectado intenta contactarlas para recibir órdenes.</p>
        </section>
        <section className="panel">
          <div className="panel-heading"><span>Diarios de SANS ISC</span><span className="micro muted">NOTICIAS</span></div>
          <ul className="news-list">{feed.news.map((n) => <li key={n.link}><a href={n.link} target="_blank" rel="noreferrer">{n.title}<ExternalLink size={12} /></a><span className="micro muted">{new Date(n.date).toLocaleDateString('es')}</span></li>)}</ul>
        </section>
      </div>
      <section className="panel">
        <div className="panel-heading"><span><ShieldAlert size={14} /> Vulnerabilidades explotadas activamente</span><span className="micro muted">CISA KEV · {feed.kev.total.toLocaleString('es')} EN CATÁLOGO</span></div>
        <div className="panel-body toolbar">
          <div className="search-field"><Search size={14} /><label className="sr-only" htmlFor="kevq">Buscar CVE, fabricante o producto</label><input id="kevq" className="field" placeholder="CVE, fabricante o producto" value={q} onChange={(e) => setQ(e.target.value)} /></div>
          <label className="check"><input type="checkbox" checked={onlyRansom} onChange={(e) => setOnlyRansom(e.target.checked)} /> Solo usadas en ransomware</label>
        </div>
        <div className="kev-grid">
          {kev.map((v) => (
            <article key={v.cveID} className="kev-card">
              <header><a className="mono" href={`https://nvd.nist.gov/vuln/detail/${v.cveID}`} target="_blank" rel="noreferrer">{v.cveID}</a>{v.ransomware === 'Known' && <span className="badge-state alert">Ransomware</span>}</header>
              <strong>{v.vendorProject} · {v.product}</strong>
              <p className="muted small">{v.shortDescription}</p>
              <dl className="kev-meta"><div><dt>Añadida</dt><dd>{v.dateAdded}</dd></div><div><dt>Plazo federal</dt><dd>{v.dueDate}</dd></div></dl>
              <p className="small"><span className="micro muted">Acción requerida</span><br />{v.requiredAction}</p>
              <Button size="sm" variant="secondary" onClick={() => onAssess({ title: `Posible explotación de ${v.cveID} (${v.product})`, description: `Se sospecha explotación de ${v.cveID} — ${v.vulnerabilityName}. ${v.shortDescription}`, indicators: v.cveID })}><Sparkles />Evaluar con IA</Button>
            </article>
          ))}
          {kev.length === 0 && <p className="panel-body muted">Sin resultados.</p>}
        </div>
      </section>
    </div>
  );
}

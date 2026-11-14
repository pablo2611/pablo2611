import { useEffect, useMemo, useState } from 'react';
import { Download, Pause, Play, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { downloadJson, hexRows } from '@/lib/aether';

type Entry = { id: number; host: string; path: string; url: string; protocol: string; type: string; size: number; duration: number; start: number };
const filters = ['Todos', 'h2', 'h3', 'http/1.1', 'otros'];

/** Real network activity of this browser tab via the Resource Timing API (no synthetic packets). */
export function TrafficView() {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [running, setRunning] = useState(true);
  const [filter, setFilter] = useState('Todos');
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<number | null>(null);
  useEffect(() => {
    if (!running || typeof PerformanceObserver === 'undefined') return;
    let id = 0;
    const map = (e: PerformanceResourceTiming): Entry => {
      let host = '', path = e.name;
      try { const u = new URL(e.name); host = u.host; path = u.pathname + u.search; } catch { /* data: urls */ }
      return { id: ++id, host, path, url: e.name, protocol: e.nextHopProtocol || 'desconocido', type: e.initiatorType, size: e.transferSize, duration: e.duration, start: e.startTime };
    };
    setEntries((performance.getEntriesByType('resource') as PerformanceResourceTiming[]).map(map).reverse().slice(0, 300));
    const obs = new PerformanceObserver((list) => {
      const next = (list.getEntries() as PerformanceResourceTiming[]).map(map).reverse();
      setEntries((l) => [...next, ...l].slice(0, 300));
    });
    obs.observe({ type: 'resource', buffered: false });
    return () => obs.disconnect();
  }, [running]);
  const shown = useMemo(() => entries.filter((e) => (filter === 'Todos' || (filter === 'otros' ? !['h2', 'h3', 'http/1.1'].includes(e.protocol) : e.protocol === filter)) && `${e.host} ${e.path}`.toLowerCase().includes(query.toLowerCase())), [entries, filter, query]);
  const current = entries.find((e) => e.id === selected) ?? shown[0];
  const rows = current ? hexRows(new TextEncoder().encode(`GET ${current.path}\r\nHost: ${current.host}\r\nProtocol: ${current.protocol}\r\nInitiator: ${current.type}\r\n`)) : [];
  return (
    <div className="split split-wide">
      <section className="panel">
        <div className="panel-heading"><span>Tráfico real de esta pestaña</span><div className="toolbar"><Button size="sm" variant="secondary" onClick={() => setRunning(!running)}>{running ? <Pause /> : <Play />}{running ? 'Pausar' : 'Reanudar'}</Button><Button size="sm" variant="ghost" onClick={() => downloadJson('aether-trafico.json', shown)}><Download />Exportar</Button></div></div>
        <div className="panel-body stack-sm">
          <p className="muted small">Cada fila es una petición de red que hizo tu navegador (Resource Timing API). Los navegadores no permiten capturar paquetes reales de otras aplicaciones.</p>
          <div className="toolbar">
            <div className="segmented scroll-x">{filters.map((p) => <button key={p} aria-pressed={filter === p} onClick={() => setFilter(p)}>{p}</button>)}</div>
            <div className="search-field"><Search size={14} /><label className="sr-only" htmlFor="pkt">Buscar host o ruta</label><input id="pkt" className="field" placeholder="Host o ruta" value={query} onChange={(e) => setQuery(e.target.value)} /></div>
          </div>
        </div>
        <div className="table-wrap tall">
          <table className="data-table"><thead><tr><th>Host</th><th>Ruta</th><th>Proto</th><th>Tipo</th><th>Bytes</th><th>ms</th></tr></thead>
            <tbody>{shown.length === 0 ? <tr><td colSpan={6} className="muted">Sin peticiones para este filtro.</td></tr> : shown.map((e) => <tr key={e.id} aria-selected={current?.id === e.id} onClick={() => setSelected(e.id)}><td>{e.host || '—'}</td><td className="truncate-cell" title={e.path}>{e.path}</td><td>{e.protocol}</td><td>{e.type}</td><td className="num">{e.size ? e.size.toLocaleString('es') : 'caché'}</td><td className="num">{e.duration.toFixed(0)}</td></tr>)}</tbody></table>
        </div>
      </section>
      <section className="panel">
        <div className="panel-heading"><span>Inspector hexadecimal</span><span className="micro muted">CABECERA DE PETICIÓN</span></div>
        <div className="panel-body hex-view">{rows.length ? rows.map((r) => <div key={r.offset}><span>{r.offset}</span><span>{r.hex}</span><span>{r.ascii}</span></div>) : <p className="muted small">Selecciona una petición.</p>}</div>
      </section>
    </div>
  );
}

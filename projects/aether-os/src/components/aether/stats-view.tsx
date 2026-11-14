import { useEffect, useMemo, useRef, useState } from 'react';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Legend, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Activity, ArrowDownRight, ArrowUpRight, BarChart3, Gauge, Globe2, Server, ShieldAlert } from 'lucide-react';
import { getLiveStats, type LiveStats } from '@/lib/threat-feed.functions';
import { attacksPerSecond } from '@/lib/attack-types';
import { countryName, timeAgo } from '@/lib/aether';
import { useNow } from '@/lib/use-live';

const palette = ['var(--danger)', 'var(--warning)', 'var(--primary)', 'var(--success)', 'var(--chart-5)', 'color-mix(in oklab, var(--danger) 55%, var(--warning))', 'color-mix(in oklab, var(--primary) 55%, var(--success))', 'color-mix(in oklab, var(--warning) 50%, var(--background))', 'color-mix(in oklab, var(--primary) 45%, var(--background))'];
const fmt = (n: number) => n.toLocaleString('es');
const compact = (n: number) => new Intl.NumberFormat('es', { notation: 'compact', maximumFractionDigits: 1 }).format(n);
const shortDate = (d: string) => new Date(`${d}T00:00:00Z`).toLocaleDateString('es', { day: '2-digit', month: 'short', timeZone: 'UTC' });
const tooltip = {
  contentStyle: { background: 'var(--popover)', border: '1px solid var(--border)', borderRadius: 6, fontSize: 12, color: 'var(--foreground)' },
  labelStyle: { color: 'var(--muted-foreground)', marginBottom: 4 },
  itemStyle: { color: 'var(--foreground)' },
  cursor: { fill: 'color-mix(in oklab, var(--primary) 8%, transparent)', stroke: 'var(--border)' },
};
const axis = { stroke: 'var(--muted-foreground)', fontSize: 11, tickLine: false, axisLine: false } as const;

export const liveStatsQuery = {
  queryKey: ['live-stats'],
  queryFn: () => getLiveStats(),
  refetchInterval: 1000,
  refetchIntervalInBackground: false,
  staleTime: 0,
  placeholderData: keepPreviousData,
} as const;

export function StatsView() {
  const q = useQuery(liveStatsQuery);
  const now = useNow(1000);
  const s = q.data;
  const [syncs, setSyncs] = useState(0);
  useEffect(() => { if (q.dataUpdatedAt) setSyncs((n) => n + 1); }, [q.dataUpdatedAt]);

  const derived = useMemo(() => {
    if (!s) return null;
    const today = new Date().toISOString().slice(0, 10);
    const full = s.daily.filter((d) => d.date < today);
    const last = full.at(-1); const prev = full.at(-2);
    const week = full.slice(-7);
    return { last, prev, rate: attacksPerSecond(week), weekTotal: week.reduce((a, d) => a + d.records, 0), trend: s.daily.map((d) => ({ ...d, label: shortDate(d.date) })), portTrend: s.portTrend.rows.map((r) => ({ ...r, label: shortDate(String(r['date'])) })) };
  }, [s]);

  if (q.isError && !s) return <div className="panel panel-body error-text">No se pudieron cargar las estadísticas en vivo. Se reintentará automáticamente.</div>;
  if (!s || !derived) return <div className="stack"><div className="stat-grid">{Array.from({ length: 6 }, (_, i) => <div key={i} className="stat"><div className="skeleton short" /><div className="skeleton stat-skel" /></div>)}</div><div className="panel panel-body muted">Descargando estadísticas en vivo…</div></div>;

  const midnight = now ? now - (now % 86400_000) : 0;
  const estimate = now ? Math.floor(derived.rate * ((now - midnight) / 1000)) : 0;
  const delta = derived.last && derived.prev ? (derived.last.records - derived.prev.records) / derived.prev.records : null;
  const topCategory = s.categories[0];
  const maxCountry = Math.max(1, ...s.countries.map((c) => c.attacks));
  const maxAsn = Math.max(1, ...s.asns.map((a) => a.attacks));
  const maxVendor = Math.max(1, ...s.kev.topVendors.map((v) => v.count));

  return (
    <div className="stack">
      <div className="sync-bar">
        <span><i className="live-dot" key={syncs} />Comprobando cada segundo · sincronización nº {fmt(syncs)}</span>
        <span className="muted">Fuentes publicadas {now ? timeAgo(s.sourceAt, now) : ''} · las fuentes publican nuevos datos cada pocos minutos</span>
      </div>

      <div className="stat-grid">
        <Kpi icon={<Gauge size={13} />} label="Ataques por segundo" value={derived.rate.toFixed(0)} hint="promedio de los últimos 7 días" />
        <Kpi icon={<Activity size={13} />} label="Ataques estimados hoy" value={fmt(estimate)} hint="según ese ritmo, desde 00:00 UTC" live />
        <Kpi icon={<BarChart3 size={13} />} label="Reportes del último día" value={derived.last ? compact(derived.last.records) : '—'} hint={derived.last ? shortDate(derived.last.date) : ''} delta={delta} />
        <Kpi icon={<Globe2 size={13} />} label="IPs atacantes únicas" value={derived.last ? fmt(derived.last.sources) : '—'} hint="último día · SANS ISC" />
        <Kpi icon={<Server size={13} />} label="Botnets C2 en línea" value={`${s.feed.c2Online}`} hint={`de ${s.feed.c2Total} listados · abuse.ch`} danger={s.feed.c2Online > 0} />
        <Kpi icon={<ShieldAlert size={13} />} label="CVE explotadas (30 días)" value={`${s.kev.last30}`} hint={`${fmt(s.kev.total)} en total · ${s.kev.ransomware} con ransomware`} />
      </div>

      {topCategory && (
        <div className="panel panel-body headline">
          <span className="micro muted">Ataque más realizado ahora</span>
          <strong>{topCategory.name}</strong>
          <span className="muted small">{(topCategory.share * 100).toFixed(1)} % de los registros de los 20 puertos más atacados. {topCategory.what}</span>
        </div>
      )}

      <div className="chart-grid">
        <Panel title="Ataques más realizados" tag="SANS ISC · HOY" wide>
          <ResponsiveContainer width="100%" height={Math.max(300, s.ports.length * 22)}>
            <BarChart data={s.ports} layout="vertical" margin={{ left: 4, right: 16, top: 4, bottom: 4 }}>
              <CartesianGrid horizontal={false} stroke="var(--border)" strokeDasharray="2 4" />
              <XAxis type="number" {...axis} tickFormatter={compact} />
              <YAxis type="category" dataKey="port" {...axis} width={92} tickFormatter={(p: number) => `${p} ${s.ports.find((x) => x.port === p)?.service ?? ''}`} interval={0} />
              <Tooltip {...tooltip} formatter={(v: number) => [fmt(v), 'Registros']} labelFormatter={(p: number) => { const x = s.ports.find((y) => y.port === p); return x ? `Puerto ${p} · ${x.service} · ${x.category}` : String(p); }} />
              <Bar dataKey="records" radius={[0, 3, 3, 0]} isAnimationActive animationDuration={700}>
                {s.ports.map((p, i) => <Cell key={p.port} fill={i < 3 ? 'var(--danger)' : i < 8 ? 'var(--warning)' : 'var(--primary)'} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Panel>

        <Panel title="Tipos de ataque" tag="POR CATEGORÍA">
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={s.categories} dataKey="records" nameKey="name" innerRadius="58%" outerRadius="88%" paddingAngle={2} stroke="var(--card)" strokeWidth={2} animationDuration={700}>
                {s.categories.map((c, i) => <Cell key={c.id} fill={palette[i % palette.length]} />)}
              </Pie>
              <Tooltip {...tooltip} formatter={(v: number, n: string) => [fmt(v), n]} />
            </PieChart>
          </ResponsiveContainer>
          <ul className="legend-list">{s.categories.map((c, i) => <li key={c.id} title={c.what}><i style={{ background: palette[i % palette.length] }} /><span>{c.name}</span><b className="mono num">{(c.share * 100).toFixed(1)} %</b></li>)}</ul>
        </Panel>

        <Panel title="Tendencia de ataques" tag="ÚLTIMOS 14 DÍAS" wide>
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={derived.trend} margin={{ left: 0, right: 8, top: 8, bottom: 0 }}>
              <defs>
                <linearGradient id="g-records" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="var(--danger)" stopOpacity={0.45} /><stop offset="100%" stopColor="var(--danger)" stopOpacity={0} /></linearGradient>
              </defs>
              <CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="2 4" />
              <XAxis dataKey="label" {...axis} minTickGap={16} />
              <YAxis yAxisId="r" {...axis} tickFormatter={compact} width={44} />
              <YAxis yAxisId="s" orientation="right" {...axis} tickFormatter={compact} width={40} />
              <Tooltip {...tooltip} formatter={(v: number, n: string) => [fmt(v), n]} />
              <Legend wrapperStyle={{ fontSize: 12, color: 'var(--muted-foreground)' }} />
              <Area yAxisId="r" type="monotone" dataKey="records" name="Reportes" stroke="var(--danger)" strokeWidth={2} fill="url(#g-records)" animationDuration={700} />
              <Line yAxisId="s" type="monotone" dataKey="sources" name="IPs atacantes" stroke="var(--primary)" strokeWidth={2} dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </Panel>

        <Panel title="Top 5 puertos día a día" tag="ÚLTIMOS 7 DÍAS">
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={derived.portTrend} margin={{ left: 0, right: 8, top: 8, bottom: 0 }}>
              <CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="2 4" />
              <XAxis dataKey="label" {...axis} minTickGap={12} />
              <YAxis {...axis} tickFormatter={compact} width={44} />
              <Tooltip {...tooltip} formatter={(v: number, n: string) => [fmt(v), n]} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              {s.portTrend.ports.map((p, i) => <Line key={p} type="monotone" dataKey={`p${p}`} name={`${p} ${s.ports.find((x) => x.port === p)?.service ?? ''}`} stroke={palette[i]} strokeWidth={2} dot={{ r: 2 }} animationDuration={700} />)}
            </LineChart>
          </ResponsiveContainer>
        </Panel>

        <Panel title="Familias de malware C2" tag="ABUSE.CH FEODO">
          {s.c2Families.length === 0 ? <p className="muted small">Sin servidores listados ahora mismo.</p> : (
            <ResponsiveContainer width="100%" height={Math.max(160, s.c2Families.length * 34)}>
              <BarChart data={s.c2Families} layout="vertical" margin={{ left: 4, right: 16 }}>
                <XAxis type="number" {...axis} allowDecimals={false} />
                <YAxis type="category" dataKey="malware" {...axis} width={90} interval={0} />
                <Tooltip {...tooltip} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="total" name="Listados" fill="var(--chart-5)" radius={[0, 3, 3, 0]} />
                <Bar dataKey="online" name="En línea" fill="var(--danger)" radius={[0, 3, 3, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </Panel>

        <Panel title="Países con más ataques" tag="IPS TOP DE HOY">
          <div className="stack-sm">{s.countries.map((c, i) => <div key={c.code} className="bar-row"><span><span className="mono muted">{String(i + 1).padStart(2, '0')}</span> {countryName(c.code)}</span><div className="bar"><i style={{ width: `${(c.attacks / maxCountry) * 100}%` }} /></div><span className="mono num small">{fmt(c.attacks)}</span></div>)}</div>
        </Panel>

        <Panel title="Redes (ASN) más activas" tag="PROVEEDORES">
          <div className="stack-sm">{s.asns.map((a) => <div key={a.as} className="bar-row" title={a.as}><span className="small">{a.as.replace(/^AS\d+\s*/, '') || a.as}</span><div className="bar"><i style={{ width: `${(a.attacks / maxAsn) * 100}%` }} /></div><span className="mono num small">{a.attackers} IP</span></div>)}</div>
        </Panel>

        <Panel title="IPs con más reportes" tag="SANS ISC">
          <div className="table-wrap"><table className="data-table"><thead><tr><th>#</th><th>IP</th><th>Reportes</th><th>Objetivos</th></tr></thead>
            <tbody>{s.topIps.map((r, i) => <tr key={r.ip}><td>{i + 1}</td><td>{r.ip}</td><td className="num">{fmt(r.reports)}</td><td className="num">{fmt(r.targets)}</td></tr>)}</tbody></table></div>
        </Panel>

        <Panel title="Fabricantes con más CVE explotadas" tag="CISA KEV">
          <div className="stack-sm">{s.kev.topVendors.map((v) => <div key={v.vendor} className="bar-row"><span className="small">{v.vendor}</span><div className="bar"><i style={{ width: `${(v.count / maxVendor) * 100}%` }} /></div><span className="mono num small">{v.count}</span></div>)}</div>
        </Panel>
      </div>

      <p className="muted small">
        Cifras reales de SANS ISC (DShield), abuse.ch y CISA. La página vuelve a consultar cada segundo; los números cambian cuando las fuentes publican, normalmente cada pocos minutos. «Ataques estimados hoy» es una estimación calculada con el ritmo medio real, no un conteo exacto.
        {s.errors.length ? <span className="warn-text"> {s.errors.join(' · ')}</span> : null}
      </p>
    </div>
  );
}

function Panel({ title, tag, wide, children }: { title: string; tag: string; wide?: boolean; children: React.ReactNode }) {
  return <section className={`panel${wide ? ' span-2' : ''}`}><div className="panel-heading"><span>{title}</span><span className="micro muted">{tag}</span></div><div className="panel-body">{children}</div></section>;
}

function Kpi({ icon, label, value, hint, delta, danger, live }: { icon: React.ReactNode; label: string; value: string; hint?: string; delta?: number | null; danger?: boolean; live?: boolean }) {
  const prev = useRef(value); const [flash, setFlash] = useState(0);
  useEffect(() => { if (prev.current !== value) { prev.current = value; if (!live) setFlash((n) => n + 1); } }, [value, live]);
  return (
    <div className="stat">
      <span className="micro muted kpi-label">{icon}{label}</span>
      <strong key={flash} className={`${danger ? 'danger-text' : ''} ${flash ? 'kpi-flash' : ''}`}>{value}</strong>
      <span className="micro muted">
        {delta != null && <span className={delta >= 0 ? 'danger-text' : 'ok-text'}>{delta >= 0 ? <ArrowUpRight size={11} /> : <ArrowDownRight size={11} />}{Math.abs(delta * 100).toFixed(1)} % vs día anterior · </span>}
        {hint}
      </span>
    </div>
  );
}

export type { LiveStats };

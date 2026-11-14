import { createFileRoute } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { useEffect, useMemo, useRef, useState } from 'react';
import { z } from 'zod';
import { Activity, BookOpen, Boxes, Brain, Download, Globe2, Hash, Pause, Play, Radar, RefreshCw, ShieldAlert, Sparkles, Terminal as TerminalIcon, Volume2, VolumeX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ThreatMap } from '@/components/aether/threat-map';
import { Terminal } from '@/components/aether/terminal';
import { TrafficView } from '@/components/aether/traffic-view';
import { CryptoView } from '@/components/aether/crypto-view';
import { ReconView } from '@/components/aether/recon-view';
import { IntelView } from '@/components/aether/intel-view';
import { AssessView, type AssessPrefill } from '@/components/aether/assess-view';
import { GuideView } from '@/components/aether/guide-view';
import { creator } from '@/lib/creator';
import { CreatorCorner } from '@/components/aether/creator-corner';
import { countryName, downloadJson, severityFromAttacks, timeAgo } from '@/lib/aether';
import { threatFeedQuery, useIss, useNow } from '@/lib/use-live';
import { tone } from '@/lib/audio';

const views = ['radar', 'intel', 'ai', 'terminal', 'traffic', 'crypto', 'recon', 'guide'] as const;
type View = (typeof views)[number];

export const Route = createFileRoute('/')({
  validateSearch: z.object({ view: z.enum(views).catch('radar') }),
  head: () => ({
    meta: [
      { title: 'AETHER OS — Pablo Sánchez' },
      { name: 'author', content: creator.name },
      { name: 'description', content: 'Mapa mundial con zoom de la actividad maliciosa en vivo, vulnerabilidades explotadas, evaluación de incidentes con IA y guía de protección, con fuentes públicas gratuitas.' },
      { property: 'og:title', content: 'AETHER OS — Mapa de ciberataques en vivo' },
      { property: 'og:description', content: 'Datos reales de SANS ISC, abuse.ch y CISA en un centro de operaciones de ciberseguridad en el navegador.' },
      { property: 'og:type', content: 'website' },
      { name: 'twitter:card', content: 'summary_large_image' },
    ],
    links: [
      { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
      { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossOrigin: 'anonymous' },
      { rel: 'stylesheet', href: 'https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600&family=IBM+Plex+Sans:wght@400;500;600&display=swap' },
    ],
  }),
  component: AetherOS,
});

const nav: [View, string, typeof Radar][] = [['radar', 'Mapa', Radar], ['intel', 'Inteligencia', ShieldAlert], ['ai', 'Evaluador IA', Brain], ['terminal', 'Terminal', TerminalIcon], ['traffic', 'Tráfico', Activity], ['crypto', 'Cripto', Hash], ['recon', 'Satélite', Globe2], ['guide', 'Guía', BookOpen]];
const titles: Record<View, [string, string]> = {
  radar: ['Mapa de amenazas en vivo', 'IPs atacantes reportadas hoy por la red de sensores DShield de SANS ISC y servidores de botnets de abuse.ch.'],
  intel: ['Inteligencia de amenazas', 'Vulnerabilidades explotadas (CISA KEV), puertos más atacados, botnets y noticias.'],
  ai: ['Evaluador de incidentes con IA', 'Describe un incidente y obtén gravedad y pasos de contención defensivos.'],
  terminal: ['Terminal', 'Consultas reales: DNS, reputación de IPs, CVE y datos del mapa.'],
  traffic: ['Inspector de tráfico', 'Peticiones de red reales hechas por esta pestaña.'],
  crypto: ['Estudio criptográfico', 'Hashes y entropía calculados en tu navegador.'],
  recon: ['Reconocimiento satelital', 'Imágenes satelitales reales de infraestructura crítica y la ISS en vivo.'],
  guide: ['Guía y acerca de', 'Qué es AETHER OS, cómo protegerte y de dónde salen los datos.'],
};
const infoconTone: Record<string, string> = { green: 'ok', yellow: 'warn', orange: 'alert', red: 'alert' };

function AetherOS() {
  const { view } = Route.useSearch();
  const navigate = Route.useNavigate();
  const feedQuery = useQuery(threatFeedQuery);
  const feed = feedQuery.data;
  const now = useNow();
  const { iss, track } = useIss(view === 'radar' || view === 'recon' || view === 'terminal');
  const [paused, setPaused] = useState(false);
  const [audio, setAudio] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);
  const [prefill, setPrefill] = useState<AssessPrefill | null>(null);
  const [ticker, setTicker] = useState<{ key: number; at: number; i: number }[]>([]);
  const seq = useRef(0);
  const audioRef = useRef(audio); audioRef.current = audio;

  // Replays today's real SANS ISC reports as a live event stream.
  useEffect(() => {
    const list = feed?.attackers ?? [];
    if (!list.length || paused) return;
    const t = setInterval(() => {
      const i = Math.floor(Math.random() * list.length);
      seq.current += 1;
      setTicker((l) => [{ key: seq.current, at: Date.now(), i }, ...l].slice(0, 14));
      if (audioRef.current) tone(severityFromAttacks(list[i]?.attacks ?? 0) === 'critical' ? 300 : 520, 0.04, 0.02);
    }, 1600);
    return () => clearInterval(t);
  }, [feed, paused]);

  const stats = useMemo(() => {
    const c = Object.values(feed?.countries ?? {});
    return { ips: feed?.attackers.length ?? 0, countries: c.length, attacks: c.reduce((s, x) => s + x.attacks, 0), c2: feed?.c2.filter((x) => x.status === 'online').length ?? 0, c2Total: feed?.c2.length ?? 0, kev: feed?.kev.total ?? 0 };
  }, [feed]);
  const ranking = useMemo(() => Object.entries(feed?.countries ?? {}).sort((a, b) => b[1].attacks + b[1].c2 * 50 - (a[1].attacks + a[1].c2 * 50)).slice(0, 10), [feed]);
  const maxRank = Math.max(1, ...ranking.map(([, v]) => v.attacks));
  const sel = selected ? feed?.countries[selected] : undefined;
  const selIps = selected ? (feed?.attackers ?? []).filter((a) => a.country === selected).slice(0, 8) : [];

  const go = (v: View) => { void navigate({ search: { view: v } }); if (audio) tone(380, 0.04); window.scrollTo({ top: 0 }); };
  const assess = (p: AssessPrefill) => { setPrefill({ ...p }); go('ai'); };
  const assessCountry = (code: string) => {
    const c = feed?.countries[code]; const ips = (feed?.attackers ?? []).filter((a) => a.country === code).slice(0, 10);
    assess({ title: `Tráfico malicioso desde ${countryName(code)} contra nuestra red`, description: `Nuestro firewall registra conexiones repetidas desde IPs de ${countryName(code)} que SANS ISC reporta como atacantes activos (${c?.attackers ?? 0} IPs, ${c?.attacks ?? 0} ataques reportados hoy). Necesitamos evaluar el riesgo y decidir medidas de contención.`, indicators: ips.map((a) => `${a.ip} (${a.as})`).join(', ') });
  };
  const [title, subtitle] = titles[view];
  const NavItems = () => <>{nav.map(([id, label, Icon]) => <button key={id} className="nav-item" aria-current={view === id ? 'page' : undefined} onClick={() => go(id)} title={label}><Icon size={17} /><span>{label}</span></button>)}</>;

  return (
    <div className="aether-shell">
      <header className="topbar">
        <div className="brand"><span className="brand-mark"><Boxes size={13} /></span><span>AETHER OS</span></div>
        <div className="topbar-right">
          {feed && <span className={`infocon-chip ${infoconTone[feed.infocon] ?? ''}`} title="Nivel de amenaza global de SANS ISC"><i />Infocon {feed.infocon}</span>}
          <span className="micro muted num hide-mobile">{now ? new Date(now).toISOString().slice(11, 19) + ' UTC' : ''}</span>
          <Button size="icon" variant="ghost" aria-label={audio ? 'Silenciar audio' : 'Activar audio'} aria-pressed={audio} onClick={() => { setAudio(!audio); if (!audio) tone(660, 0.08, 0.04); }}>{audio ? <Volume2 /> : <VolumeX />}</Button>
        </div>
      </header>
      <nav className="sidenav" aria-label="Módulos"><NavItems /></nav>
      <main className="workspace">
        <div className="page-head">
          <div><h1>{title}</h1><p className="muted small">{subtitle}</p></div>
          <div className="live-state">
            {feedQuery.isFetching ? <span className="micro muted"><RefreshCw size={11} className="spin" /> Actualizando…</span> : feed && now ? <span className="micro muted"><i className="live-dot" />Datos {timeAgo(feed.updatedAt, now)}</span> : null}
            {feed?.errors.length ? <span className="micro warn-text">{feed.errors.join(' · ')}</span> : null}
          </div>
        </div>

        {view === 'radar' && (
          <div className="stack">
            <div className="stat-grid">
              <Stat label="IPs atacantes" value={stats.ips} hint="top SANS ISC hoy" loading={!feed} />
              <Stat label="Países con actividad" value={stats.countries} loading={!feed} />
              <Stat label="Ataques reportados" value={stats.attacks} loading={!feed} />
              <Stat label="Botnets C2 en línea" value={stats.c2} hint={`de ${stats.c2Total} listados`} loading={!feed} danger={stats.c2 > 0} />
              <Stat label="CVE explotadas" value={stats.kev} hint="catálogo CISA" loading={!feed} />
            </div>
            <div className="radar-grid">
              <section className="panel map-panel">
                <div className="panel-heading">
                  <span><Radar size={14} /> Mapa global</span>
                  <div className="toolbar">
                    <Button size="sm" variant="secondary" onClick={() => setPaused(!paused)} aria-label={paused ? 'Reanudar animación' : 'Pausar animación'}>{paused ? <Play /> : <Pause />}<span className="hide-mobile">{paused ? 'Reanudar' : 'Pausar'}</span></Button>
                  </div>
                </div>
                <div className="map-frame">
                  {!feed && <div className="map-loading micro muted"><RefreshCw size={12} className="spin" /> Descargando datos en vivo…</div>}
                  <ThreatMap feed={feed} paused={paused} selected={selected} onSelect={setSelected} iss={iss} issTrack={track} />
                </div>
                <div className="map-legend">
                  <span><i className="dot critical" />≥1000 ataques</span><span><i className="dot high" />≥200</span><span><i className="dot" />menos</span><span className="muted">Origen real · destino aleatorio (las fuentes no publican a las víctimas)</span><span className="muted">Rueda o pellizco para zoom · clic en un país</span>
                </div>
              </section>
              <aside className="stack side-col">
                <section className="panel">
                  {selected ? (
                    <>
                      <div className="panel-heading"><span>{countryName(selected)}</span><Button size="sm" variant="ghost" onClick={() => setSelected(null)}>Cerrar</Button></div>
                      <div className="panel-body stack-sm">
                        {sel ? <dl className="kev-meta"><div><dt>IPs atacantes</dt><dd>{sel.attackers}</dd></div><div><dt>Ataques</dt><dd>{sel.attacks.toLocaleString('es')}</dd></div><div><dt>Reportes</dt><dd>{sel.reports.toLocaleString('es')}</dd></div><div><dt>Servidores C2</dt><dd>{sel.c2}</dd></div></dl> : <p className="muted small">Este país no aparece hoy entre las {stats.ips} IPs más activas ni en la lista de botnets.</p>}
                        {selIps.length > 0 && <ul className="ip-list">{selIps.map((a) => <li key={a.ip}><span className="mono">{a.ip}</span><span className="muted small">{a.city} · {a.as.replace(/^AS\d+\s*/, '').slice(0, 26)}</span><span className="mono small">{a.attacks}</span></li>)}</ul>}
                        <Button size="sm" onClick={() => assessCountry(selected)}><Sparkles />Evaluar con IA</Button>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="panel-heading"><span>Países más activos</span><Button size="sm" variant="ghost" onClick={() => feed && downloadJson('aether-paises.json', feed.countries)} disabled={!feed}><Download />Exportar</Button></div>
                      <div className="panel-body stack-sm">
                        {!feed && <><div className="skeleton" /><div className="skeleton" /><div className="skeleton short" /></>}
                        {ranking.map(([code, v]) => <button key={code} className="bar-row as-button" onClick={() => setSelected(code)}><span>{countryName(code)}</span><div className="bar"><i style={{ width: `${(v.attacks / maxRank) * 100}%` }} /></div><span className="mono num small">{v.attacks.toLocaleString('es')}</span></button>)}
                      </div>
                    </>
                  )}
                </section>
                <section className="panel">
                  <div className="panel-heading"><span><i className="live-dot" />Flujo de reportes</span><span className="micro muted">SANS ISC</span></div>
                  <div className="incident-list">
                    {ticker.length === 0 && <p className="panel-body muted small">{feed ? 'Esperando eventos…' : 'Cargando…'}</p>}
                    {ticker.map((t) => { const a = feed?.attackers[t.i]; if (!a) return null; const sev = severityFromAttacks(a.attacks); return (
                      <button className="incident" key={t.key} onClick={() => setSelected(a.country)}>
                        <span className={`severity ${sev}`} />
                        <span><strong>{a.ip}</strong> <span className="muted small">{countryName(a.country)}</span><br /><span className="mono muted small">{a.attacks.toLocaleString('es')} ataques · {a.as.replace(/^AS\d+\s*/, '').slice(0, 24)}</span></span>
                        <span className="micro muted num">{now ? timeAgo(new Date(t.at).toISOString(), now) : ''}</span>
                      </button>); })}
                  </div>
                  <p className="panel-body muted small">Reproduce en orden los reportes de hoy; se descargan de nuevo cada 5 minutos.</p>
                </section>
              </aside>
            </div>
            <div className="hide-mobile"><Terminal compact feed={feed} iss={iss} audio={audio} setAudio={setAudio} /></div>
          </div>
        )}
        {view === 'intel' && <IntelView feed={feed} onAssess={assess} />}
        {view === 'ai' && <AssessView prefill={prefill} />}
        {view === 'terminal' && <Terminal feed={feed} iss={iss} audio={audio} setAudio={setAudio} />}
        {view === 'traffic' && <TrafficView />}
        {view === 'crypto' && <CryptoView />}
        {view === 'recon' && <ReconView iss={iss} />}
        {view === 'guide' && <GuideView />}
      </main>
      <nav className="mobile-nav" aria-label="Módulos"><NavItems /></nav>
      <CreatorCorner />
    </div>
  );
}

function Stat({ label, value, hint, loading, danger }: { label: string; value: number; hint?: string; loading?: boolean; danger?: boolean }) {
  return <div className="stat"><span className="micro muted">{label}</span>{loading ? <div className="skeleton stat-skel" /> : <strong className={danger ? 'danger-text' : undefined}>{value.toLocaleString('es')}</strong>}{hint && <span className="micro muted">{hint}</span>}</div>;
}

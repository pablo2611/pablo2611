import { useEffect, useMemo, useRef, useState } from 'react';
import { geoNaturalEarth1, geoPath, geoGraticule10, geoContains, geoCentroid, geoArea, type GeoProjection } from 'd3-geo';
import { zoom as d3zoom, zoomIdentity, type ZoomBehavior, type ZoomTransform } from 'd3-zoom';
import { select } from 'd3-selection';
import { feature } from 'topojson-client';
import type { Topology, GeometryCollection } from 'topojson-specification';
import type { Feature, Geometry, Polygon } from 'geojson';
import world from 'world-atlas/countries-110m.json';
import { Minus, Plus, RotateCcw } from 'lucide-react';
import { numericToAlpha2 } from '@/lib/countries';
import { countryName, intensity, severityFromAttacks } from '@/lib/aether';
import type { ThreatFeed } from '@/lib/threat-feed.functions';
import type { Iss } from '@/lib/use-live';

const topology = world as unknown as Topology<{ countries: GeometryCollection }>;
const collection = feature(topology, topology.objects.countries);
const countries = collection.features.map((f) => ({ feature: f as Feature<Geometry>, code: numericToAlpha2[Number(f.id)] ?? '' }));

// One point inside the main landmass of every country: random arc destinations.
function mainCentroid(f: Feature<Geometry>): [number, number] {
  const g = f.geometry;
  if (g.type !== 'MultiPolygon') return geoCentroid(f);
  const polys = g.coordinates.map((c) => ({ type: 'Polygon', coordinates: c }) as Polygon);
  const biggest = polys.reduce((a, b) => (geoArea(b) > geoArea(a) ? b : a));
  return geoCentroid(biggest);
}
const destinations = countries.filter((c) => c.code && c.code !== 'AQ').map((c) => mainCentroid(c.feature));

type Arc = { src: number; dst: [number, number]; start: number; dur: number };
const ARCS = 32;

type Props = {
  feed: ThreatFeed | undefined;
  paused: boolean;
  selected: string | null;
  onSelect: (code: string | null) => void;
  iss: Iss | null;
  issTrack: [number, number][];
};

export function ThreatMap({ feed, paused, selected, onSelect, iss, issTrack }: Props) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const zoomRef = useRef<ZoomBehavior<HTMLCanvasElement, unknown> | null>(null);
  const transform = useRef<ZoomTransform>(zoomIdentity);
  const [hover, setHover] = useState<{ x: number; y: number; code: string } | null>(null);
  const [scale, setScale] = useState(1);
  const max = useMemo(() => Math.max(1, ...Object.values(feed?.countries ?? {}).map((c) => c.attacks + c.c2 * 50)), [feed]);
  const state = useRef({ feed, paused, selected, hover: null as string | null, iss, issTrack, max, onSelect });
  state.current = { ...state.current, feed, paused, selected, iss, issTrack, max, onSelect };

  useEffect(() => {
    const el = canvas.current;
    if (!el) return;
    const ctx = el.getContext('2d');
    if (!ctx) return;
    let frame = 0, phase = 0, last = performance.now();
    let arcs: Arc[] = [];
    let size = { w: 0, h: 0 };
    let projection: GeoProjection = geoNaturalEarth1();
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const fit = () => {
      size = { w: el.clientWidth, h: el.clientHeight };
      const ratio = window.devicePixelRatio || 1;
      el.width = Math.round(size.w * ratio); el.height = Math.round(size.h * ratio);
      projection = geoNaturalEarth1().fitExtent([[8, 8], [size.w - 8, size.h - 8]], collection);
      zoomRef.current?.translateExtent([[0, 0], [size.w, size.h]]).extent([[0, 0], [size.w, size.h]]);
    };
    fit();
    const ro = new ResizeObserver(fit); ro.observe(el);

    const z = d3zoom<HTMLCanvasElement, unknown>().scaleExtent([1, 14]).translateExtent([[0, 0], [size.w, size.h]])
      .on('zoom', (e: { transform: ZoomTransform }) => { transform.current = e.transform; setScale(e.transform.k); });
    zoomRef.current = z;
    select(el).call(z);

    const css = getComputedStyle(el);
    const color = (name: string) => css.getPropertyValue(name).trim();
    const palette = { grid: color('--map-grid'), land: color('--map-land'), border: color('--map-border'), danger: color('--danger'), warning: color('--warning'), primary: color('--primary'), label: color('--map-label'), fg: color('--foreground'), success: color('--success') };

    const draw = (now: number) => {
      const s = state.current;
      const dt = Math.min(now - last, 50); last = now;
      if (!s.paused && !reduced) phase += dt / 1000;
      const ratio = window.devicePixelRatio || 1;
      const t = transform.current; const k = t.k;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, el.width, el.height);
      ctx.setTransform(ratio * k, 0, 0, ratio * k, ratio * t.x, ratio * t.y);
      const path = geoPath(projection, ctx);
      ctx.beginPath(); path(geoGraticule10()); ctx.strokeStyle = palette.grid; ctx.lineWidth = 0.5 / k; ctx.stroke();
      for (const c of countries) {
        ctx.beginPath(); path(c.feature);
        ctx.globalAlpha = 1; ctx.fillStyle = palette.land; ctx.fill();
        const data = s.feed?.countries[c.code];
        if (data) {
          const v = intensity(data.attacks + data.c2 * 50, s.max) ** 1.8;
          ctx.globalAlpha = 0.12 + v * 0.72 * (0.85 + 0.15 * Math.sin(phase * 2 + v * 6));
          ctx.fillStyle = palette.danger; ctx.fill();
        }
        ctx.globalAlpha = 1;
        const active = c.code && (c.code === s.selected || c.code === s.hover);
        ctx.strokeStyle = active ? palette.fg : palette.border; ctx.lineWidth = (active ? 1.4 : 0.5) / k; ctx.stroke();
      }
      // Real attacker origins; each arc flies to a random country (feeds don't publish victims).
      const attackers = s.feed?.attackers ?? [];
      attackers.slice(0, 220).forEach((a) => {
        const p = projection([a.lon, a.lat]); if (!p) return;
        const sev = severityFromAttacks(a.attacks);
        ctx.fillStyle = sev === 'critical' ? palette.danger : sev === 'high' ? palette.warning : palette.primary;
        ctx.globalAlpha = 0.9; ctx.beginPath(); ctx.arc(p[0], p[1], 1.6 / k, 0, Math.PI * 2); ctx.fill();
      });
      if (attackers.length) {
        // Arcs are drawn as smooth curves in screen space so they never wrap past the map edge.
        const spawn = (delay: number): Arc => {
          let best: Arc | null = null;
          for (let tries = 0; tries < 10; tries++) {
            const src = Math.floor(Math.random() * attackers.length);
            const from = attackers[src]!;
            const dst = destinations[Math.floor(Math.random() * destinations.length)]!;
            const p0 = projection([from.lon, from.lat]); const p1 = projection(dst);
            if (!p0 || !p1) continue;
            const d = Math.hypot(p1[0] - p0[0], p1[1] - p0[1]) / size.w;
            best = { src, dst, start: phase + delay, dur: 1.8 + d * 3 + Math.random() * 0.8 };
            if (d > 0.08 && d < 0.5) break;
          }
          return best ?? { src: 0, dst: destinations[0]!, start: phase + delay, dur: 3 };
        };
        if (arcs.length !== ARCS || arcs.some((a) => a.src >= attackers.length)) arcs = Array.from({ length: ARCS }, () => spawn(Math.random() * 5));
        const top = 10;
        ctx.lineCap = 'round';
        arcs.forEach((arc, i) => {
          let prog = (phase - arc.start) / arc.dur;
          if (prog > 1.35) { arc = arcs[i] = spawn(Math.random() * 1.5); prog = (phase - arc.start) / arc.dur; }
          if (prog < 0) return;
          const a = attackers[arc.src]!;
          const p0 = projection([a.lon, a.lat]); const p1 = projection(arc.dst);
          if (!p0 || !p1) return;
          const sev = severityFromAttacks(a.attacks);
          const tone = sev === 'critical' ? palette.danger : sev === 'high' ? palette.warning : palette.primary;
          const dist = Math.hypot(p1[0] - p0[0], p1[1] - p0[1]);
          const cx = (p0[0] + p1[0]) / 2;
          const cy = Math.max(top, Math.min(p0[1], p1[1]) - Math.min(dist * 0.35, size.h * 0.3));
          const at = (t: number): [number, number] => { const u = 1 - t; return [u * u * p0[0] + 2 * u * t * cx + t * t * p1[0], u * u * p0[1] + 2 * u * t * cy + t * t * p1[1]]; };
          const head = Math.min(prog, 1);
          const tail = Math.max(0, head - 0.5);
          const fade = prog > 1 ? Math.max(0, 1 - (prog - 1) / 0.35) : 1;
          // faint full trajectory
          ctx.globalAlpha = 0.1 * fade; ctx.strokeStyle = tone; ctx.lineWidth = 0.8 / k;
          ctx.beginPath(); ctx.moveTo(p0[0], p0[1]); ctx.quadraticCurveTo(cx, cy, p1[0], p1[1]); ctx.stroke();
          // bright comet tail
          const tp = at(tail); const hp = at(head);
          const grad = ctx.createLinearGradient(tp[0], tp[1], hp[0], hp[1]);
          grad.addColorStop(0, 'transparent'); grad.addColorStop(1, tone);
          ctx.globalAlpha = 0.85 * fade; ctx.strokeStyle = grad; ctx.lineWidth = 1.4 / k; ctx.beginPath();
          for (let j = 0; j <= 24; j++) { const q = at(tail + (head - tail) * (j / 24)); if (j === 0) ctx.moveTo(q[0], q[1]); else ctx.lineTo(q[0], q[1]); }
          ctx.stroke();
          ctx.strokeStyle = tone; ctx.fillStyle = tone;
          if (prog < 0.4) { const r = prog / 0.4; ctx.globalAlpha = (1 - r) * 0.7; ctx.lineWidth = 1 / k; ctx.beginPath(); ctx.arc(p0[0], p0[1], (3 + r * 12) / k, 0, Math.PI * 2); ctx.stroke(); }
          if (prog <= 1) {
            ctx.globalAlpha = 1; ctx.shadowColor = tone; ctx.shadowBlur = 8; ctx.beginPath(); ctx.arc(hp[0], hp[1], 2 / k, 0, Math.PI * 2); ctx.fill(); ctx.shadowBlur = 0;
          } else {
            const r = (prog - 1) / 0.35;
            ctx.globalAlpha = (1 - r) * 0.9; ctx.lineWidth = 1.2 / k; ctx.beginPath(); ctx.arc(p1[0], p1[1], (2 + r * 16) / k, 0, Math.PI * 2); ctx.stroke();
            ctx.globalAlpha = (1 - r); ctx.beginPath(); ctx.arc(p1[0], p1[1], 1.8 / k, 0, Math.PI * 2); ctx.fill();
          }
        });
        ctx.lineCap = 'butt';
      }
      // ISS live track
      if (s.issTrack.length > 1) {
        ctx.globalAlpha = 0.55; ctx.strokeStyle = palette.primary; ctx.setLineDash([3 / k, 3 / k]); ctx.lineWidth = 1 / k; ctx.beginPath();
        let prev: number | null = null;
        s.issTrack.forEach(([lon, lat]) => { const q = projection([lon, lat]); if (!q) return; if (prev !== null && Math.abs(lon - prev) > 180) ctx.moveTo(q[0], q[1]); else if (prev === null) ctx.moveTo(q[0], q[1]); else ctx.lineTo(q[0], q[1]); prev = lon; });
        ctx.stroke(); ctx.setLineDash([]);
      }
      if (s.iss) {
        const q = projection([s.iss.longitude, s.iss.latitude]);
        if (q) {
          ctx.globalAlpha = 1; ctx.fillStyle = palette.fg; ctx.fillRect(q[0] - 3 / k, q[1] - 1 / k, 6 / k, 2 / k); ctx.fillRect(q[0] - 1 / k, q[1] - 3 / k, 2 / k, 6 / k);
          ctx.font = `${10 / k}px "IBM Plex Mono", monospace`; ctx.fillStyle = palette.label; ctx.fillText('ISS', q[0] + 6 / k, q[1] - 4 / k);
        }
      }
      // country labels when zoomed in
      if (k >= 2.5) {
        ctx.globalAlpha = 0.85; ctx.fillStyle = palette.label; ctx.font = `${10 / k}px "IBM Plex Sans", sans-serif`;
        for (const c of countries) { if (!c.code) continue; const cen = path.centroid(c.feature); const area = path.area(c.feature); if (area * k * k < 1800 || !Number.isFinite(cen[0])) continue; ctx.fillText(countryName(c.code), cen[0] - 14 / k, cen[1]); }
      }
      ctx.globalAlpha = 1;
      frame = requestAnimationFrame(draw);
    };
    frame = requestAnimationFrame(draw);

    const codeAt = (clientX: number, clientY: number) => {
      const rect = el.getBoundingClientRect();
      const [x, y] = transform.current.invert([clientX - rect.left, clientY - rect.top]);
      const ll = projection.invert?.([x, y]);
      if (!ll) return '';
      return countries.find((c) => geoContains(c.feature, ll))?.code ?? '';
    };
    const move = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse') return;
      const code = codeAt(e.clientX, e.clientY);
      state.current.hover = code || null;
      const rect = el.getBoundingClientRect();
      setHover(code ? { x: e.clientX - rect.left, y: e.clientY - rect.top, code } : null);
    };
    const leave = () => { state.current.hover = null; setHover(null); };
    const click = (e: MouseEvent) => { const code = codeAt(e.clientX, e.clientY); state.current.onSelect(code || null); };
    el.addEventListener('pointermove', move); el.addEventListener('pointerleave', leave); el.addEventListener('click', click);
    return () => { cancelAnimationFrame(frame); ro.disconnect(); select(el).on('.zoom', null); el.removeEventListener('pointermove', move); el.removeEventListener('pointerleave', leave); el.removeEventListener('click', click); };
  }, []);

  const zoomBy = (f: number) => { const el = canvas.current; if (el && zoomRef.current) select(el).call(zoomRef.current.scaleBy, f); };
  const reset = () => { const el = canvas.current; if (el && zoomRef.current) select(el).call(zoomRef.current.transform, zoomIdentity); };
  const hoverData = hover ? feed?.countries[hover.code] : undefined;

  return (
    <div className="map-stage">
      <canvas ref={canvas} className="threat-canvas" role="img" aria-label="Mapa mundial interactivo: países coloreados según la actividad maliciosa reportada en vivo" />
      <div className="map-zoom" role="group" aria-label="Zoom del mapa">
        <button onClick={() => zoomBy(1.6)} aria-label="Acercar"><Plus size={14} /></button>
        <span className="micro num">{scale.toFixed(1)}x</span>
        <button onClick={() => zoomBy(1 / 1.6)} aria-label="Alejar"><Minus size={14} /></button>
        <button onClick={reset} aria-label="Restablecer vista"><RotateCcw size={13} /></button>
      </div>
      {hover && (
        <div className="map-tip" style={{ left: Math.min(hover.x + 14, 9999), top: hover.y + 14 }}>
          <strong>{countryName(hover.code)}</strong>
          {hoverData ? <span className="mono">{hoverData.attackers} IPs · {hoverData.attacks.toLocaleString('es')} ataques{hoverData.c2 ? ` · ${hoverData.c2} C2` : ''}</span> : <span className="muted">Sin reportes en el top actual</span>}
        </div>
      )}
    </div>
  );
}

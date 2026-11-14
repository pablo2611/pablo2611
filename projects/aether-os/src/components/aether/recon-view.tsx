import { lazy, Suspense, useState } from 'react';
import { ClientOnly } from '@tanstack/react-router';
import { Satellite } from 'lucide-react';
import type { Iss } from '@/lib/use-live';
import type { ReconLayer } from './recon-map';

const ReconMap = lazy(() => import('./recon-map'));
const targets = [
  { name: 'Data Center Alley, Ashburn (EE. UU.)', center: [-77.4599, 39.0166] as [number, number], zoom: 16, note: 'Mayor concentración de centros de datos del mundo.' },
  { name: 'Canal de Panamá · Miraflores', center: [-79.5911, 8.9967] as [number, number], zoom: 16, note: 'Infraestructura crítica de logística global.' },
  { name: 'Frankfurt · DE-CIX', center: [8.7353, 50.1188] as [number, number], zoom: 15, note: 'Uno de los mayores puntos de intercambio de internet.' },
  { name: 'Marsella · aterrizaje de cables', center: [5.3601, 43.3109] as [number, number], zoom: 14, note: 'Llegan más de 15 cables submarinos intercontinentales.' },
  { name: 'Singapur · Tuas', center: [103.6363, 1.3205] as [number, number], zoom: 14, note: 'Nodo clave de conectividad en Asia.' },
];
const filters = { Natural: 'none', 'Térmico (efecto)': 'grayscale(1) contrast(1.4) sepia(1) hue-rotate(-25deg) saturate(4)', 'Infrarrojo (efecto)': 'grayscale(1) contrast(1.25) brightness(1.15) invert(.08)' } as const;

export function ReconView({ iss }: { iss: Iss | null }) {
  const [t, setT] = useState(0);
  const [layer, setLayer] = useState<ReconLayer>('optico');
  const [filter, setFilter] = useState<keyof typeof filters>('Natural');
  const [follow, setFollow] = useState(false);
  const target = targets[t]!;
  return (
    <div className="split split-wide">
      <section className="panel">
        <div className="panel-heading"><span>Visor satelital</span><span className="micro muted">IMÁGENES REALES · ESRI / NASA / OSM</span></div>
        <div className="recon-frame">
          <ClientOnly fallback={<div className="recon-leaflet skeleton" />}>
            <Suspense fallback={<div className="recon-leaflet skeleton" />}>
              <ReconMap center={target.center} zoom={layer === 'nocturno' ? 7 : target.zoom} layer={layer} filter={filters[filter]} iss={iss} follow={follow} />
            </Suspense>
          </ClientOnly>
          <div className="recon-reticle" aria-hidden />
        </div>
      </section>
      <section className="panel">
        <div className="panel-heading"><span>Controles de misión</span></div>
        <div className="panel-body stack">
          <div><p className="micro muted">Objetivo</p><div className="option-list">{targets.map((x, i) => <button key={x.name} aria-pressed={t === i} onClick={() => { setT(i); setFollow(false); }}>{x.name}</button>)}</div><p className="muted small">{target.note}</p></div>
          <div><p className="micro muted">Capa</p><div className="segmented">{([['optico', 'Satélite'], ['nocturno', 'Luces nocturnas'], ['calles', 'Mapa']] as const).map(([k, l]) => <button key={k} aria-pressed={layer === k} onClick={() => setLayer(k)}>{l}</button>)}</div></div>
          <div><p className="micro muted">Filtro visual</p><div className="segmented scroll-x">{(Object.keys(filters) as (keyof typeof filters)[]).map((f) => <button key={f} aria-pressed={filter === f} onClick={() => setFilter(f)}>{f}</button>)}</div><p className="muted small">Los filtros térmico e infrarrojo son efectos de color, no datos de sensores.</p></div>
          <div className="iss-card">
            <p className="micro muted"><Satellite size={12} /> Estación Espacial Internacional · en vivo</p>
            {iss ? <dl className="kev-meta"><div><dt>Latitud</dt><dd>{iss.latitude.toFixed(2)}°</dd></div><div><dt>Longitud</dt><dd>{iss.longitude.toFixed(2)}°</dd></div><div><dt>Altitud</dt><dd>{iss.altitude.toFixed(1)} km</dd></div><div><dt>Velocidad</dt><dd>{(iss.velocity / 3600).toFixed(2)} km/s</dd></div></dl> : <p className="muted small">Conectando con wheretheiss.at…</p>}
            <label className="check"><input type="checkbox" checked={follow} onChange={(e) => setFollow(e.target.checked)} disabled={!iss} /> Seguir a la ISS en el mapa</label>
          </div>
        </div>
      </section>
    </div>
  );
}

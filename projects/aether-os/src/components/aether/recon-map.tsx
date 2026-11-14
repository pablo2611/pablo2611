import { useEffect, useRef } from 'react';
import L from 'leaflet';
import type { Iss } from '@/lib/use-live';

export type ReconLayer = 'optico' | 'nocturno' | 'calles';
const layers: Record<ReconLayer, { url: string; attribution: string; maxZoom: number; maxNativeZoom?: number }> = {
  optico: { url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', attribution: 'Imágenes © Esri, Maxar, Earthstar Geographics', maxZoom: 19 },
  nocturno: { url: 'https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/VIIRS_Black_Marble/default/2016-01-01/GoogleMapsCompatible_Level8/{z}/{y}/{x}.png', attribution: 'NASA GIBS · VIIRS Black Marble', maxZoom: 12, maxNativeZoom: 8 },
  calles: { url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png', attribution: '© OpenStreetMap contributors', maxZoom: 19 },
};

export default function ReconMap({ center, zoom, layer, filter, iss, follow }: { center: [number, number]; zoom: number; layer: ReconLayer; filter: string; iss: Iss | null; follow: boolean }) {
  const el = useRef<HTMLDivElement>(null);
  const map = useRef<L.Map | null>(null);
  const tiles = useRef<L.TileLayer | null>(null);
  const issMarker = useRef<L.CircleMarker | null>(null);

  useEffect(() => {
    if (!el.current) return;
    const m = L.map(el.current, { zoomControl: true, attributionControl: true, worldCopyJump: true }).setView([center[1], center[0]], zoom);
    map.current = m;
    return () => { m.remove(); map.current = null; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const m = map.current; if (!m) return;
    tiles.current?.remove();
    const cfg = layers[layer];
    tiles.current = L.tileLayer(cfg.url, { attribution: cfg.attribution, maxZoom: cfg.maxZoom, maxNativeZoom: cfg.maxNativeZoom, crossOrigin: true }).addTo(m);
    m.setMaxZoom(cfg.maxZoom);
  }, [layer]);

  useEffect(() => { map.current?.flyTo([center[1], center[0]], zoom, { duration: 1.6 }); }, [center, zoom]);

  useEffect(() => {
    const m = map.current; if (!m || !iss) return;
    const pos: L.LatLngExpression = [iss.latitude, iss.longitude];
    if (!issMarker.current) issMarker.current = L.circleMarker(pos, { radius: 7, weight: 2, color: getComputedStyle(document.documentElement).getPropertyValue('--primary').trim(), fillOpacity: 0.35 }).bindTooltip('ISS (en vivo)', { permanent: true, direction: 'right', className: 'iss-tip' }).addTo(m);
    else issMarker.current.setLatLng(pos);
    if (follow) m.panTo(pos, { animate: true, duration: 1 });
  }, [iss, follow]);

  return <div ref={el} className="recon-leaflet" style={{ ['--recon-filter' as string]: filter }} />;
}

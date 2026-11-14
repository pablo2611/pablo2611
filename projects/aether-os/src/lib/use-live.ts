import { useEffect, useState } from 'react';
import { queryOptions } from '@tanstack/react-query';
import { getThreatFeed } from './threat-feed.functions';

export const threatFeedQuery = queryOptions({
  queryKey: ['threat-feed'],
  queryFn: () => getThreatFeed(),
  refetchInterval: 60_000,
  staleTime: 55_000,
});

export type Iss = { latitude: number; longitude: number; altitude: number; velocity: number; visibility: string; timestamp: number };

/** Live International Space Station position from wheretheiss.at (free, CORS-enabled). */
export function useIss(enabled = true) {
  const [iss, setIss] = useState<Iss | null>(null);
  const [track, setTrack] = useState<[number, number][]>([]);
  useEffect(() => {
    if (!enabled) return;
    let alive = true;
    const load = async () => {
      try {
        const res = await fetch('https://api.wheretheiss.at/v1/satellites/25544');
        if (!res.ok) return;
        const d = (await res.json()) as Iss;
        if (!alive) return;
        setIss(d);
        setTrack((t) => [...t, [d.longitude, d.latitude] as [number, number]].slice(-90));
      } catch { /* network hiccup: keep last position */ }
    };
    void load();
    const t = setInterval(load, 5000);
    return () => { alive = false; clearInterval(t); };
  }, [enabled]);
  return { iss, track };
}

export function useNow(interval = 1000) {
  const [now, setNow] = useState(0);
  useEffect(() => { setNow(Date.now()); const t = setInterval(() => setNow(Date.now()), interval); return () => clearInterval(t); }, [interval]);
  return now;
}

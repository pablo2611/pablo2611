'use client';
import { useEffect, useRef, useState } from 'react';
/** Unmount expensive renderers outside the viewport; pause when the tab is hidden. */
export function useScene() {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const [motion, setMotion] = useState(false);
  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    let inView = false;
    const preference = matchMedia('(prefers-reduced-motion: reduce)');
    const sync = () => { setVisible(inView && !document.hidden); setMotion(!preference.matches); };
    const observer = new IntersectionObserver(([entry]) => { inView = entry.isIntersecting; sync(); }, {threshold: 0.08});
    observer.observe(node);
    document.addEventListener('visibilitychange', sync);
    preference.addEventListener('change', sync);
    sync();
    return () => { observer.disconnect(); document.removeEventListener('visibilitychange', sync); preference.removeEventListener('change', sync); };
  }, []);
  return { ref, visible, motion };
}

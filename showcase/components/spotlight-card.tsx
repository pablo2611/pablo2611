'use client';

import type { CSSProperties, PointerEvent, ReactNode } from 'react';

// SpotlightCard adapted from React Bits by David Haz. See licenses/react-bits.txt.
export function SpotlightCard({ children, color }: { children: ReactNode; color: string }) {
  function moveSpotlight(event: PointerEvent<HTMLElement>) {
    if (event.pointerType === 'touch' || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const { currentTarget: card, clientX, clientY } = event;
    const bounds = card.getBoundingClientRect();
    card.style.setProperty('--spotlight-x', `${clientX - bounds.left}px`);
    card.style.setProperty('--spotlight-y', `${clientY - bounds.top}px`);
  }

  return (
    <article className="experience-card" style={{ '--spotlight-color': color } as CSSProperties} onPointerMove={moveSpotlight}>
      {children}
    </article>
  );
}

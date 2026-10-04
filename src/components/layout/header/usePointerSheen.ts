import { useCallback, useState, type MouseEvent as ReactMouseEvent } from 'react';

export type PointerSheen = {
  x: number;
  y: number;
  active: boolean;
  /** Frozen entry position as % of element box */
  entryX: number;
  entryY: number;
  /** CSS conic angle (0° = top, clockwise) at entry */
  entryAngle: number;
};

function angleFromCenter(xPct: number, yPct: number): number {
  const dx = xPct - 50;
  const dy = yPct - 50;
  return (Math.atan2(dx, -dy) * 180) / Math.PI;
}

/**
 * Tracks pointer position as % inside the hovered element
 * so a radial sheen can follow the cursor. Freezes entry angle
 * for border-wave origin on hover.
 */
export function usePointerSheen() {
  const [sheen, setSheen] = useState<PointerSheen>({
    x: 50,
    y: 50,
    active: false,
    entryX: 50,
    entryY: 50,
    entryAngle: 0,
  });

  const onPointerEnter = useCallback((e: ReactMouseEvent<HTMLElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setSheen({
      x,
      y,
      active: true,
      entryX: x,
      entryY: y,
      entryAngle: angleFromCenter(x, y),
    });
  }, []);

  const onPointerMove = useCallback((e: ReactMouseEvent<HTMLElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setSheen(prev => ({
      ...prev,
      x,
      y,
      active: true,
    }));
  }, []);

  const onPointerLeave = useCallback(() => {
    setSheen(prev => ({ ...prev, active: false }));
  }, []);

  return { sheen, onPointerEnter, onPointerMove, onPointerLeave };
}

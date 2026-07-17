import { useEffect, useState } from 'react';

/**
 * Estimates keyboard overlap on mobile using Visual Viewport API.
 * Returns 0 when the keyboard is closed or API is unavailable.
 */
export function useVisualViewportInset(threshold = 48): number {
  const [inset, setInset] = useState(0);

  useEffect(() => {
    const viewport = window.visualViewport;
    if (!viewport) return;

    const update = () => {
      const overlap = Math.max(
        0,
        window.innerHeight - viewport.height - viewport.offsetTop,
      );
      setInset(overlap >= threshold ? overlap : 0);
    };

    update();
    viewport.addEventListener('resize', update);
    viewport.addEventListener('scroll', update);

    return () => {
      viewport.removeEventListener('resize', update);
      viewport.removeEventListener('scroll', update);
    };
  }, [threshold]);

  return inset;
}

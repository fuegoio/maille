import * as React from "react";

const STORAGE_PREFIX = "scroll-restoration:";

/**
 * Saves and restores the scroll position of a scroll container across
 * navigation (mount/unmount). The position is persisted to sessionStorage
 * under a key derived from `storageKey`, so returning to a table after
 * visiting a detail page restores the previous scroll.
 *
 * Returns a ref to attach to the scrollable element.
 */
export function useScrollRestoration<T extends HTMLElement = HTMLDivElement>(
  storageKey: string,
): React.RefObject<T | null> {
  const viewportRef = React.useRef<T | null>(null);

  React.useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;

    const storageKeyFull = `${STORAGE_PREFIX}${storageKey}`;

    // Restore on mount
    const saved = sessionStorage.getItem(storageKeyFull);
    if (saved !== null) {
      const scrollTop = Number.parseInt(saved, 10);
      if (!Number.isNaN(scrollTop)) {
        // Defer until content is painted so the scroll height is correct
        requestAnimationFrame(() => {
          viewport.scrollTop = scrollTop;
        });
      }
    }

    let frame = 0;
    const onScroll = () => {
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        sessionStorage.setItem(storageKeyFull, String(viewport.scrollTop));
      });
    };

    viewport.addEventListener("scroll", onScroll, { passive: true });

    return () => {
      viewport.removeEventListener("scroll", onScroll);
      if (frame) cancelAnimationFrame(frame);
      // Persist final position on unmount
      sessionStorage.setItem(storageKeyFull, String(viewport.scrollTop));
    };
  }, [storageKey]);

  return viewportRef;
}

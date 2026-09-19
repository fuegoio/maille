import * as React from "react";

/**
 * True when the user asked the OS for reduced motion. Libraries without
 * native reduced-motion support (recharts) branch on this; CSS and
 * framer-motion handle it via the media query and MotionConfig.
 */
export function usePrefersReducedMotion() {
  return React.useSyncExternalStore(
    (onChange) => {
      const query = window.matchMedia("(prefers-reduced-motion: reduce)");
      query.addEventListener("change", onChange);
      return () => query.removeEventListener("change", onChange);
    },
    () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    () => false,
  );
}

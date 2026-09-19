import { AnimatePresence, motion } from "framer-motion";

import { cn } from "@/lib/utils";

/** The app's enter/exit curve: a short, confident deceleration. */
export const motionEaseOut = [0.25, 1, 0.5, 1] as const;

/**
 * The keyed-parent of animated list rows: items inside enter when they
 * appear after mount and exit in place when unmounted. `initial={false}`
 * keeps the first render static, so pages never open with choreography —
 * only rows added later (a new transaction, a staged leg) animate.
 * Reduced motion is honored globally via MotionConfig in main.tsx.
 */
export function MotionList({ children }: { children: React.ReactNode }) {
  return (
    <AnimatePresence initial={false} mode="popLayout">
      {children}
    </AnimatePresence>
  );
}

/**
 * A list row that enters with the app's fade-and-rise and settles its
 * siblings with a layout animation when a row is added or removed.
 */
export function MotionItem({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.99 }}
      transition={{ duration: 0.2, ease: motionEaseOut }}
      className={cn(className)}
    >
      {children}
    </motion.div>
  );
}

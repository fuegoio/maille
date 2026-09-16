import * as React from "react";

/**
 * A titled section of an analytics surface, separated like every other
 * block of the side panels.
 */
export function AnalyticsSection({
  title,
  action,
  children,
}: {
  title: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="border-b px-4 py-4">
      <div className="mb-2 flex h-7 items-center justify-between">
        <h3 className="text-sm font-medium">{title}</h3>
        {action}
      </div>
      {children}
    </section>
  );
}

/**
 * The muted line shown where a breakdown has nothing to describe — the
 * surface teaches that the current filters match nothing, not that the
 * panel is broken.
 */
export function AnalyticsEmpty({ children }: { children: React.ReactNode }) {
  return <div className="py-2 text-sm text-muted-foreground">{children}</div>;
}

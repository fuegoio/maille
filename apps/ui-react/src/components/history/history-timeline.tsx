import type { SerializedHistoryEntry } from "@maille/core/history";
import type {
  HistoryChange,
  HistoryRef,
  HistoryValue,
} from "@maille/core/history";

import { format, isToday, isYesterday } from "date-fns";
import * as React from "react";

import { ContextLink } from "@/components/navigation/breadcrumbs";
import { useCurrencyFormatter } from "@/hooks/use-currency-formatter";
import { cn } from "@/lib/utils";
import { useActivities } from "@/stores/activities";
import { useMovements } from "@/stores/movements";

interface HistoryTimelineProps {
  entityType: "activity" | "movement";
  history: SerializedHistoryEntry[];
}

const FIELD_LABELS: Record<string, string> = {
  name: "Name",
  description: "Description",
  date: "Date",
  type: "Type",
  category: "Category",
  subcategory: "Subcategory",
  project: "Project",
  account: "Account",
  amount: "Amount",
  from: "From",
  to: "To",
};

function fieldLabel(field: string): string {
  return FIELD_LABELS[field] ?? field;
}

function EntityLink({
  ref: entityRef,
  label,
}: {
  ref: HistoryRef;
  label: string;
}) {
  const activity = useActivities((state) => state.activities);
  const movements = useMovements((state) => state.movements);

  const exists =
    (entityRef.type === "activity" &&
      activity.some((a) => a.id === entityRef.id)) ||
    (entityRef.type === "movement" &&
      movements.some((m) => m.id === entityRef.id));
  if (
    !exists ||
    (entityRef.type !== "activity" && entityRef.type !== "movement")
  ) {
    return <span>{label}</span>;
  }

  return (
    <ContextLink
      to={entityRef.type === "activity" ? "/activities/$id" : "/movements/$id"}
      params={{ id: entityRef.id }}
      className="underline decoration-border underline-offset-2 hover:decoration-foreground"
    >
      {label}
    </ContextLink>
  );
}

function ChangeValue({
  field,
  value,
  entityRef,
  className,
}: {
  field: string;
  value: HistoryValue;
  entityRef?: HistoryRef;
  className?: string;
}) {
  const currencyFormatter = useCurrencyFormatter();

  if (value === null) {
    return <span className={cn("text-muted-foreground/50", className)}>—</span>;
  }
  if (entityRef) {
    return <EntityLink ref={entityRef} label={String(value)} />;
  }
  if (field === "amount") {
    return (
      <span className={cn("font-mono tabular-nums", className)}>
        {currencyFormatter.format(Number(value))}
      </span>
    );
  }
  if (field === "date") {
    return (
      <span className={className}>{format(new Date(value), "d MMM yyyy")}</span>
    );
  }
  return <span className={className}>{String(value)}</span>;
}

function ChangeLine({ change }: { change: HistoryChange }) {
  return (
    <div className="flex flex-wrap items-baseline gap-x-1 text-muted-foreground">
      <span className="after:content-[':']">{fieldLabel(change.field)}</span>
      <ChangeValue
        field={change.field}
        value={change.from}
        entityRef={change.fromRef}
        className="text-muted-foreground/80"
      />
      <span aria-hidden="true">→</span>
      <ChangeValue
        field={change.field}
        value={change.to}
        entityRef={change.toRef}
        className="text-foreground/80"
      />
    </div>
  );
}

function EntryLine({
  entry,
  entityType,
}: {
  entry: SerializedHistoryEntry;
  entityType: "activity" | "movement";
}) {
  const currencyFormatter = useCurrencyFormatter();
  const subjectLabel = entry.subject?.label;

  let action: React.ReactNode;
  switch (entry.action) {
    case "create":
      action = <>Created the {entityType}</>;
      break;
    case "update":
      action = <>Updated the {entityType}</>;
      break;
    case "link":
      action = (
        <>
          Linked{" "}
          {entry.subject ? (
            <EntityLink ref={entry.subject} label={subjectLabel!} />
          ) : null}
        </>
      );
      break;
    case "unlink":
      action = (
        <>
          Unlinked{" "}
          {entry.subject ? (
            <EntityLink ref={entry.subject} label={subjectLabel!} />
          ) : null}
        </>
      );
      break;
    case "updateLink":
      action = (
        <>
          Updated the link with{" "}
          {entry.subject ? (
            <EntityLink ref={entry.subject} label={subjectLabel!} />
          ) : null}
        </>
      );
      break;
    case "addTransaction":
      action = <>Added a transaction</>;
      break;
    case "updateTransaction":
      action = <>Updated a transaction</>;
      break;
    case "removeTransaction":
      action = <>Removed a transaction</>;
      break;
  }

  const amountChange = entry.changes.find(
    (change) => change.field === "amount",
  );
  const linkAmount =
    (entry.action === "link" || entry.action === "unlink") &&
    amountChange &&
    amountChange.from === null
      ? amountChange.to
      : null;

  return (
    <>
      <div className="flex items-baseline gap-2 text-sm">
        <span className="min-w-0">{action}</span>
        {linkAmount !== null && (
          <span className="shrink-0 font-mono text-xs text-muted-foreground tabular-nums">
            {currencyFormatter.format(Number(linkAmount))}
          </span>
        )}
        <span className="flex-1" />
        <span className="shrink-0 font-mono text-xs text-muted-foreground tabular-nums">
          {format(new Date(entry.createdAt), "HH:mm")}
        </span>
      </div>
      {entry.changes.length > 0 && (
        <div className="mt-1 space-y-0.5 text-xs">
          {entry.changes.map((change, index) => (
            <ChangeLine key={index} change={change} />
          ))}
        </div>
      )}
    </>
  );
}

export function HistoryTimeline({ entityType, history }: HistoryTimelineProps) {
  // A new entry appearing in the timeline is the receipt for what the user
  // just did: it lands at the top with a small entrance so the recording is
  // visible feedback rather than a silent list mutation. The first render
  // seeds the set with the entries already there, so loading a page never
  // choreographs — only entries added while the timeline is on screen
  // animate, once per entry id.
  const seenIdsRef = React.useRef<Set<string> | null>(null);
  if (seenIdsRef.current === null) {
    seenIdsRef.current = new Set(history.map((entry) => entry.id));
  }
  const animatedIdsRef = React.useRef<Set<string>>(new Set());
  for (const entry of history) {
    if (!seenIdsRef.current.has(entry.id)) {
      seenIdsRef.current.add(entry.id);
      animatedIdsRef.current.add(entry.id);
    }
  }

  const dayGroups = React.useMemo(() => {
    const sorted = [...history].sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );

    const groups = new Map<string, SerializedHistoryEntry[]>();
    for (const entry of sorted) {
      const date = new Date(entry.createdAt);
      const key = date.toDateString();
      const group = groups.get(key);
      if (group) {
        group.push(entry);
      } else {
        groups.set(key, [entry]);
      }
    }
    return [...groups.entries()];
  }, [history]);

  if (history.length === 0) return null;

  return (
    <div className="space-y-5">
      {dayGroups.map(([day, entries]) => (
        <div key={day}>
          <div className="text-xs font-medium text-muted-foreground">
            {isToday(new Date(day))
              ? "Today"
              : isYesterday(new Date(day))
                ? "Yesterday"
                : format(new Date(day), "d MMMM yyyy")}
          </div>

          <div className="mt-2">
            {entries.map((entry, index) => (
              <div
                key={entry.id}
                className={cn(
                  "flex gap-3",
                  animatedIdsRef.current.has(entry.id) &&
                    "animate-history-in motion-reduce:animate-none",
                )}
              >
                <div className="flex flex-col items-center pt-1.25">
                  <div
                    className={cn(
                      "size-1.5 shrink-0 rounded-full",
                      index === 0 && isToday(new Date(day))
                        ? "bg-foreground/70"
                        : "bg-muted-foreground/40",
                    )}
                  />
                  <div
                    className={cn(
                      "w-px flex-1 bg-border",
                      index === entries.length - 1 && "bg-transparent",
                    )}
                  />
                </div>
                <div
                  className={cn(
                    "min-w-0 flex-1",
                    index === entries.length - 1 ? "pb-0.5" : "pb-3.5",
                  )}
                >
                  <EntryLine entry={entry} entityType={entityType} />
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

import type { SerializedHistoryEntry } from "@maille/core/history";
import type {
  HistoryChange,
  HistoryRef,
  HistoryValue,
} from "@maille/core/history";

import { Link } from "@tanstack/react-router";
import { format, isToday, isYesterday } from "date-fns";
import * as React from "react";

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
    <Link
      to={entityRef.type === "activity" ? "/activities/$id" : "/movements/$id"}
      params={{ id: entityRef.id }}
      className="underline decoration-border underline-offset-2 hover:decoration-foreground"
    >
      {label}
    </Link>
  );
}

function ChangeValue({
  field,
  value,
  entityRef,
}: {
  field: string;
  value: HistoryValue;
  entityRef?: HistoryRef;
}) {
  const currencyFormatter = useCurrencyFormatter();

  if (value === null) {
    return <span className="text-muted-foreground">—</span>;
  }
  if (entityRef) {
    return <EntityLink ref={entityRef} label={String(value)} />;
  }
  if (field === "amount") {
    return (
      <span className="font-mono">
        {currencyFormatter.format(Number(value))}
      </span>
    );
  }
  if (field === "date") {
    return <span>{format(new Date(value), "d MMM yyyy")}</span>;
  }
  return <span>{String(value)}</span>;
}

function ChangeLine({ change }: { change: HistoryChange }) {
  return (
    <div className="text-muted-foreground">
      <span className="text-foreground/80">{fieldLabel(change.field)}: </span>
      <ChangeValue
        field={change.field}
        value={change.from}
        entityRef={change.fromRef}
      />
      {" → "}
      <ChangeValue
        field={change.field}
        value={change.to}
        entityRef={change.toRef}
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
        <span className="shrink-0 font-mono text-xs text-muted-foreground">
          {format(new Date(entry.createdAt), "HH:mm")}
        </span>
        <span>{action}</span>
        {linkAmount !== null && (
          <span className="font-mono text-xs text-muted-foreground">
            {currencyFormatter.format(Number(linkAmount))}
          </span>
        )}
      </div>
      {entry.changes.length > 0 && (
        <div className="mt-1 space-y-0.5 pl-[3.25rem] text-xs">
          {entry.changes.map((change, index) => (
            <ChangeLine key={index} change={change} />
          ))}
        </div>
      )}
    </>
  );
}

export function HistoryTimeline({ entityType, history }: HistoryTimelineProps) {
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
    <div>
      <div className="flex items-center">
        <div>
          <div className="text-base font-medium">History</div>
          <div className="text-xs text-muted-foreground">
            Every change made to this {entityType}, most recent first.
          </div>
        </div>
      </div>

      <div className="mt-4">
        {dayGroups.map(([day, entries]) => (
          <div key={day} className="mb-4 last:mb-0">
            <div className="text-xs font-medium text-muted-foreground">
              {isToday(new Date(day))
                ? "Today"
                : isYesterday(new Date(day))
                  ? "Yesterday"
                  : format(new Date(day), "d MMMM yyyy")}
            </div>

            <div className="mt-2">
              {entries.map((entry, index) => (
                <div key={entry.id} className="flex gap-3">
                  <div className="flex flex-col items-center pt-1.5">
                    <div
                      className={cn(
                        "size-1.5 shrink-0 rounded-full",
                        index === 0 && day === new Date().toDateString()
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
                      index === entries.length - 1 ? "pb-1" : "pb-4",
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
    </div>
  );
}

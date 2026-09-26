import { format } from "date-fns";
import { ChartLine, Plus, Trash2 } from "lucide-react";
import * as React from "react";
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts";

import { AmountInput } from "@/components/ui/amount-input";
import { Button } from "@/components/ui/button";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  useChartAnimation,
  type ChartConfig,
} from "@/components/ui/chart";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { useCurrencyFormatter } from "@/hooks/use-currency-formatter";
import { getGraphQLDate } from "@/lib/date";
import { cn } from "@/lib/utils";

/** One dated observation in a valuation series. */
export interface ValuationTimelinePoint {
  id: string;
  date: Date;
  value: number;
}

interface ValuationTimelineProps {
  /** The section heading, e.g. "Unit price" or "Estimated value". */
  title: string;
  /** The one-line explanation under the heading. */
  description: string;
  /** What the observed amount is called: labels the input and chart. */
  valueLabel: string;
  /** The empty-state sentence when no observation exists yet. */
  emptyText: string;
  /** The observations, newest first. */
  points: ValuationTimelinePoint[];
  /** A new observation for `date`. Callers upsert: one per day. */
  onAdd: (date: Date, value: number) => void;
  /** The observation's value changed. */
  onUpdateValue: (pointId: string, value: number) => void;
  /** The observation is removed. */
  onDelete: (pointId: string) => void;
}

/**
 * The shared valuation timeline: dated observations of a value with the
 * add form, the chart and the editable rows. One observation per day.
 * The series is the valuation layer; it never books into the ledger.
 */
export function ValuationTimeline({
  title,
  description,
  valueLabel,
  emptyText,
  points,
  onAdd,
  onUpdateValue,
  onDelete,
}: ValuationTimelineProps) {
  const currencyFormatter = useCurrencyFormatter();
  const chartAnimation = useChartAnimation();

  const chartConfig = {
    views: { label: valueLabel },
    value: {
      label: valueLabel,
      color: "var(--color-primary)",
    },
  } satisfies ChartConfig;

  const chartData = React.useMemo(
    () =>
      [...points]
        .sort((a, b) => a.date.getTime() - b.date.getTime())
        .map((point) => ({
          date: point.date.toISOString(),
          value: point.value,
        })),
    [points],
  );

  return (
    <section className="shrink-0 border-b px-4 py-6 sm:px-8">
      <div className="flex items-center gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <ChartLine className="size-3.5 text-muted-foreground" />
            <div className="font-serif text-xl leading-none font-normal">
              {title}
            </div>
          </div>
          <div className="mt-1 text-xs text-muted-foreground">
            {description}
          </div>
        </div>

        <AddObservationDialog
          valueLabel={valueLabel}
          points={points}
          onAdd={onAdd}
        />
      </div>

      {chartData.length > 0 && (
        <ChartContainer
          config={chartConfig}
          className="mt-4 aspect-auto h-[180px] w-full rounded-md border p-3"
        >
          <LineChart
            accessibilityLayer
            data={chartData}
            margin={{ left: 12, right: 12, top: 8 }}
          >
            <CartesianGrid vertical strokeDasharray="2 3" />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={4}
              minTickGap={20}
              tickFormatter={(axisValue) => {
                const axisDate = new Date(axisValue);
                return axisDate.toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                });
              }}
            />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  className="w-[160px]"
                  nameKey="views"
                  formatter={(tooltipValue) =>
                    currencyFormatter.format(tooltipValue as number)
                  }
                  labelFormatter={(label) =>
                    new Date(label).toLocaleString("default", {
                      month: "long",
                      day: "numeric",
                      year: "numeric",
                    })
                  }
                />
              }
            />
            <YAxis domain={["auto", "auto"]} hide />
            <Line
              type="stepAfter"
              dataKey="value"
              stroke="var(--color-value)"
              strokeWidth={1.5}
              dot={chartData.length <= 31}
              activeDot={{ r: 3, strokeWidth: 0 }}
              {...chartAnimation}
            />
          </LineChart>
        </ChartContainer>
      )}

      <div className="mt-4 mb-2 rounded border bg-muted/50">
        {points.length === 0 ? (
          <div className="flex items-center justify-center py-4 text-xs text-muted-foreground">
            {emptyText}
          </div>
        ) : (
          points.map((point, index) => (
            <div
              key={point.id}
              className={cn(
                "group flex h-10 items-center gap-4 px-4 text-sm transition-colors hover:bg-muted",
                index !== points.length - 1 && "border-b",
              )}
            >
              <div className="w-28 shrink-0 font-mono text-muted-foreground">
                {format(point.date, "dd MMM yyyy")}
              </div>
              <div className="flex-1" />
              <AmountInput
                value={point.value}
                onChange={(next) => onUpdateValue(point.id, next)}
                mode="cell"
                className="justify-end"
              />
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label={`Delete ${valueLabel.toLowerCase()}`}
                className="opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100"
                onClick={() => onDelete(point.id)}
              >
                <Trash2 />
              </Button>
            </div>
          ))
        )}
      </div>
    </section>
  );
}

const sameDay = (a: Date, b: Date) =>
  a.getUTCFullYear() === b.getUTCFullYear() &&
  a.getUTCMonth() === b.getUTCMonth() &&
  a.getUTCDate() === b.getUTCDate();

interface AddObservationDialogProps {
  /** What the observed amount is called: labels the form. */
  valueLabel: string;
  /** The existing observations, to warn when a day is being replaced. */
  points: ValuationTimelinePoint[];
  onAdd: (date: Date, value: number) => void;
}

/**
 * The add-observation form: date and observed value, with a quiet
 * notice when the day already carries an observation, since one
 * replaces the other.
 */
function AddObservationDialog({
  valueLabel,
  points,
  onAdd,
}: AddObservationDialogProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [date, setDate] = React.useState(() => getGraphQLDate(new Date()));
  const [value, setValue] = React.useState<number | null>(null);

  const observedAt = date === "" ? null : new Date(`${date}T00:00:00Z`);
  const isValid =
    observedAt !== null &&
    !Number.isNaN(observedAt.getTime()) &&
    value !== null &&
    value >= 0;
  const replaced =
    observedAt !== null &&
    !Number.isNaN(observedAt.getTime()) &&
    points.some((point) => sameDay(point.date, observedAt));

  const submit = () => {
    if (!isValid || observedAt === null) return;
    onAdd(observedAt, value as number);
    setIsOpen(false);
    setValue(null);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Plus />
          Add {valueLabel.toLowerCase()}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add {valueLabel.toLowerCase()}</DialogTitle>
          <DialogDescription>
            One observation per day: a day that already has one is replaced.
          </DialogDescription>
        </DialogHeader>

        {/* Keyed by the open state so the form re-seeds every time the
        dialog opens */}
        <form
          key={`${isOpen}`}
          onSubmit={(event) => {
            event.preventDefault();
            submit();
          }}
          className="space-y-4"
        >
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="observation-date">Date</FieldLabel>
              <FieldContent>
                <Input
                  id="observation-date"
                  type="date"
                  value={date}
                  onChange={(event) => setDate(event.target.value)}
                  className="w-full font-mono text-sm"
                  autoFocus
                />
              </FieldContent>
            </Field>

            <Field>
              <FieldLabel>{valueLabel}</FieldLabel>
              <FieldContent>
                <AmountInput
                  value={value}
                  onChange={setValue}
                  mode="field"
                  placeholder={valueLabel}
                  className="w-full"
                />
              </FieldContent>
              {replaced && (
                <FieldDescription>
                  Replaces the observation of{" "}
                  {format(observedAt as Date, "dd MMM yyyy")}.
                </FieldDescription>
              )}
            </Field>
          </FieldGroup>

          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline">
                Cancel
              </Button>
            </DialogClose>
            <Button type="submit" disabled={!isValid}>
              Add {valueLabel.toLowerCase()}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

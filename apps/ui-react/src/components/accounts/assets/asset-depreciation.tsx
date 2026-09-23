import type { Asset, AssetDepreciation } from "@maille/core/accounts";

import { AccountType, addMonths, firstOfMonth } from "@maille/core/accounts";
import { format } from "date-fns";
import {
  CircleCheck,
  CircleDashed,
  ChevronLeft,
  ChevronRight,
  Pencil,
  Plus,
  Trash2,
  TrendingDown,
} from "lucide-react";
import { useMemo, useState } from "react";

import { AccountSelect } from "@/components/accounts/account-select";
import { ContextLink } from "@/components/navigation/breadcrumbs";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { AmountInput } from "@/components/ui/amount-input";
import { Button } from "@/components/ui/button";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCurrencyFormatter } from "@/hooks/use-currency-formatter";
import { getGraphQLDate } from "@/lib/date";
import { getAssetValue } from "@/logic/assets";
import {
  createAssetDepreciationMutation,
  deleteAssetDepreciationMutation,
  updateAssetDepreciationMutation,
} from "@/mutations/depreciations";
import { useAccounts } from "@/stores/accounts";
import { useActivities } from "@/stores/activities";
import { useAssetDepreciations } from "@/stores/depreciations";
import { useSync } from "@/stores/sync";

interface AssetDepreciationSectionProps {
  asset: Asset;
}

/**
 * The asset's depreciation: the schedule's summary, the activities it
 * manages, and the form that creates or reshapes it. Generated activities
 * arrive as ordinary ledger rows; this section is their schedule's home.
 */
export function AssetDepreciationSection({
  asset,
}: AssetDepreciationSectionProps) {
  const currencyFormatter = useCurrencyFormatter();
  const plan = useAssetDepreciations((state) =>
    state.getDepreciationByAsset(asset.id),
  );
  const activities = useActivities((state) => state.activities);
  const [scheduleOpen, setScheduleOpen] = useState(false);

  const scheduledActivities = useMemo(
    () =>
      activities
        .filter((activity) => activity.depreciation === (plan?.id ?? "none"))
        .sort((a, b) => a.date.getTime() - b.date.getTime()),
    [activities, plan?.id],
  );

  return (
    <section className="shrink-0 border-b">
      <header className="flex h-11 items-center gap-2 px-4 sm:px-8">
        <TrendingDown className="size-3.5 text-muted-foreground" />
        <div className="font-serif text-xl leading-none font-normal">
          Depreciation
        </div>
        <div className="flex-1" />

        {plan ? (
          <>
            <div className="hidden min-w-0 truncate text-sm text-muted-foreground md:block">
              {currencyFormatter.format(plan.basis / plan.months)} / month for{" "}
              {plan.months} {plan.months === 1 ? "month" : "months"}
            </div>
            <DepreciationScheduleDialog
              asset={asset}
              plan={plan}
              open={scheduleOpen}
              onOpenChange={setScheduleOpen}
              trigger={
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label="Edit schedule"
                >
                  <Pencil />
                </Button>
              }
            />
            <DeleteScheduleButton plan={plan} />
          </>
        ) : (
          <DepreciationScheduleDialog
            asset={asset}
            plan={null}
            open={scheduleOpen}
            onOpenChange={setScheduleOpen}
            trigger={
              <Button variant="outline" size="sm">
                <Plus />
                Add schedule
              </Button>
            }
          />
        )}
      </header>

      {plan && (
        <div className="max-h-56 overflow-y-auto">
          {scheduledActivities.length === 0 ? (
            <div className="px-4 py-4 text-xs text-muted-foreground sm:px-8">
              No activity generated yet.
            </div>
          ) : (
            scheduledActivities.map((activity) => (
              <ContextLink
                key={activity.id}
                to="/activities/$id"
                params={{ id: activity.id }}
                className="group flex h-10 items-center gap-2 border-t px-4 text-sm transition-colors first:border-t-0 hover:bg-muted/50 sm:px-8"
              >
                <div className="w-20 shrink-0 text-muted-foreground">
                  {format(activity.date, "MMM yyyy")}
                </div>
                {activity.status === "scheduled" ? (
                  <CircleDashed className="size-4 shrink-0 text-muted-foreground" />
                ) : (
                  <CircleCheck className="size-4 shrink-0 text-primary" />
                )}
                <div className="min-w-0 truncate">{activity.name}</div>
                <div className="flex-1" />
                <div className="font-mono whitespace-nowrap">
                  {currencyFormatter.format(
                    activity.transactions.reduce(
                      (sum, transaction) => sum + transaction.amount,
                      0,
                    ),
                  )}
                </div>
              </ContextLink>
            ))
          )}
        </div>
      )}
    </section>
  );
}

function DeleteScheduleButton({ plan }: { plan: AssetDepreciation }) {
  const mutate = useSync((state) => state.mutate);
  const activities = useActivities((state) => state.activities);

  const managedCount = activities.filter(
    (activity) =>
      activity.depreciation === plan.id &&
      activity.date.getTime() >= todayStart(),
  ).length;

  const deleteSchedule = () => {
    mutate({
      name: "deleteAssetDepreciation",
      mutation: deleteAssetDepreciationMutation,
      variables: { id: plan.id },
      rollbackData: { ...plan },
      events: [
        {
          type: "deleteAssetDepreciation",
          payload: { id: plan.id },
        },
      ],
    });
  };

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="ghost" size="icon-sm" aria-label="Delete schedule">
          <Trash2 />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete depreciation schedule</AlertDialogTitle>
          <AlertDialogDescription>
            {managedCount > 0
              ? `${managedCount} future ${managedCount === 1 ? "activity" : "activities"} will be deleted with it. Past activities stay on the ledger.`
              : "Its generated activities are all in the past; they stay on the ledger."}{" "}
            This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={deleteSchedule} variant="destructive">
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

const todayStart = () => {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
};

interface DepreciationScheduleDialogProps {
  asset: Asset;
  plan: AssetDepreciation | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  trigger: React.ReactNode;
}

/**
 * The schedule form: how much, over how many months, starting which
 * month, booked to which expense account — with the resulting
 * installments previewed before it is committed.
 */
export function DepreciationScheduleDialog({
  asset,
  plan,
  open,
  onOpenChange,
  trigger,
}: DepreciationScheduleDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {plan ? "Edit depreciation schedule" : "Depreciation schedule"}
          </DialogTitle>
          <DialogDescription>
            {asset.name} depreciates linearly: one activity on the 1st of each
            month, from its account to an expense account.
          </DialogDescription>
        </DialogHeader>

        {/* Keyed by the open state so the form re-seeds from the plan
        every time the dialog opens */}
        <ScheduleForm
          key={`${plan?.id ?? "new"}-${open}`}
          asset={asset}
          plan={plan}
          onDone={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  );
}

/**
 * The schedule form: how much, over how long, starting which month, booked
 * to which expense account — with the resulting installments previewed
 * before they are committed.
 */
function ScheduleForm({
  asset,
  plan,
  onDone,
}: {
  asset: Asset;
  plan: AssetDepreciation | null;
  onDone: () => void;
}) {
  const mutate = useSync((state) => state.mutate);
  const activities = useActivities((state) => state.activities);
  const accounts = useAccounts((state) => state.accounts);
  const currencyFormatter = useCurrencyFormatter();

  const defaultExpenseAccount =
    accounts.find(
      (account) => account.type === AccountType.EXPENSE && account.default,
    )?.id ??
    accounts.find((account) => account.type === AccountType.EXPENSE)?.id;

  // Editing a schedule counts in years when it divides evenly, so the
  // form always reads back the way it was entered.
  const [basis, setBasis] = useState<number | null>(null);
  const [duration, setDuration] = useState<number | null>(
    plan ? (plan.months % 12 === 0 ? plan.months / 12 : plan.months) : 2,
  );
  const [durationUnit, setDurationUnit] = useState<"months" | "years">(
    plan ? (plan.months % 12 === 0 ? "years" : "months") : "years",
  );
  const [startMonth, setStartMonth] = useState<Date>(
    plan ? plan.startMonth : firstOfMonthForNextMonth(),
  );
  const [expenseAccount, setExpenseAccount] = useState<string | undefined>(
    undefined,
  );

  const basisValue =
    basis ?? plan?.basis ?? getAssetValue(activities, asset.id);
  const resolvedMonths =
    duration === null || duration < 1
      ? null
      : durationUnit === "years"
        ? duration * 12
        : duration;
  const expenseAccountValue =
    expenseAccount ?? plan?.expenseAccount ?? defaultExpenseAccount;

  const preview =
    resolvedMonths !== null &&
    basisValue > 0 &&
    expenseAccountValue !== undefined
      ? {
          amount: basisValue / resolvedMonths,
          first: startMonth,
          last: addMonths(startMonth, resolvedMonths - 1),
        }
      : null;

  const submit = () => {
    if (!preview || expenseAccountValue === undefined) {
      return;
    }

    if (plan) {
      mutate({
        name: "updateAssetDepreciation",
        mutation: updateAssetDepreciationMutation,
        variables: {
          id: plan.id,
          basis: basisValue,
          months: resolvedMonths as number,
          startMonth: getGraphQLDate(startMonth),
          expenseAccount: expenseAccountValue,
        },
        rollbackData: { ...plan },
        events: [
          {
            type: "updateAssetDepreciation",
            payload: {
              id: plan.id,
              basis: basisValue,
              months: resolvedMonths as number,
              startMonth: startMonth.toISOString(),
              expenseAccount: expenseAccountValue,
            },
          },
        ],
      });
    } else {
      const id = crypto.randomUUID();
      mutate({
        name: "createAssetDepreciation",
        mutation: createAssetDepreciationMutation,
        variables: {
          id,
          asset: asset.id,
          method: "linear",
          basis: basisValue,
          months: resolvedMonths as number,
          startMonth: getGraphQLDate(startMonth),
          expenseAccount: expenseAccountValue,
        },
        rollbackData: undefined,
        events: [
          {
            type: "createAssetDepreciation",
            payload: {
              id,
              asset: asset.id,
              method: "linear",
              basis: basisValue,
              months: resolvedMonths as number,
              startMonth: startMonth.toISOString(),
              expenseAccount: expenseAccountValue,
              category: null,
              subcategory: null,
            },
          },
        ],
      });
    }

    onDone();
  };

  return (
    <div className="space-y-4">
      <FieldGroup>
        <Field>
          <FieldLabel>Basis</FieldLabel>
          <FieldContent>
            <AmountInput
              value={basisValue}
              onChange={(value) => setBasis(value)}
              mode="field"
            />
          </FieldContent>
          <FieldDescription>
            The amount spread over the schedule.
          </FieldDescription>
        </Field>

        <Field>
          <FieldLabel>Duration</FieldLabel>
          <FieldContent>
            <div className="flex w-full items-center gap-2">
              <Input
                type="number"
                min={1}
                value={duration ?? ""}
                onChange={(event) =>
                  setDuration(
                    event.target.value === ""
                      ? null
                      : Number(event.target.value),
                  )
                }
                className="w-24"
              />
              <Select
                value={durationUnit}
                onValueChange={(value) =>
                  setDurationUnit(value === "years" ? "years" : "months")
                }
              >
                <SelectTrigger className="w-28">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="years">years</SelectItem>
                  <SelectItem value="months">months</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </FieldContent>
        </Field>

        <Field>
          <FieldLabel>First month</FieldLabel>
          <FieldContent>
            <div className="flex items-center gap-1">
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                aria-label="Previous month"
                onClick={() => setStartMonth(addMonths(startMonth, -1))}
              >
                <ChevronLeft />
              </Button>
              <div className="w-28 text-center font-mono text-sm">
                {format(startMonth, "MMM yyyy")}
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                aria-label="Next month"
                onClick={() => setStartMonth(addMonths(startMonth, 1))}
              >
                <ChevronRight />
              </Button>
            </div>
          </FieldContent>
          <FieldDescription>
            The first activity lands on the 1st of this month.
          </FieldDescription>
        </Field>

        <Field>
          <FieldLabel>Expense account</FieldLabel>
          <FieldContent>
            <AccountSelect
              value={expenseAccountValue}
              onChange={(value) => setExpenseAccount(value)}
              types={[AccountType.EXPENSE]}
              placeholder="Expense account"
            />
          </FieldContent>
          <FieldDescription>
            Where the monthly depreciation is booked.
          </FieldDescription>
        </Field>
      </FieldGroup>

      <div className="rounded-md border bg-muted/40 px-3 py-2.5 text-sm">
        {preview ? (
          <div className="flex flex-wrap items-baseline gap-x-1">
            <span className="font-mono font-medium">
              {currencyFormatter.format(preview.amount)}
            </span>
            <span>on the 1st of each month,</span>
            <span className="font-mono font-medium">{resolvedMonths}</span>
            <span>
              {resolvedMonths === 1 ? "time" : "times"} —{" "}
              {format(preview.first, "MMM yyyy")} to{" "}
              {format(preview.last, "MMM yyyy")}.
            </span>
          </div>
        ) : (
          <span className="text-muted-foreground">
            Give the schedule a basis, a duration and an expense account.
          </span>
        )}
      </div>

      <DialogFooter>
        <DialogClose asChild>
          <Button variant="outline">Cancel</Button>
        </DialogClose>
        <Button onClick={submit} disabled={preview === null}>
          {plan ? "Save schedule" : "Create schedule"}
        </Button>
      </DialogFooter>
    </div>
  );
}

const firstOfMonthForNextMonth = (): Date => {
  const now = new Date();
  return firstOfMonth(now.getFullYear(), now.getMonth() + 1);
};

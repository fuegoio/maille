import type { Transaction } from "@maille/core/activities";
import type { FundMove } from "@maille/core/funds";
import type { Movement } from "@maille/core/movements";

import { zodResolver } from "@hookform/resolvers/zod";
import { AccountType } from "@maille/core/accounts";
import { ActivityType } from "@maille/core/activities";
import { extractDateFromMovementName } from "@maille/core/movements";
import { useRouter } from "@tanstack/react-router";
import * as React from "react";
import { useForm, Controller } from "react-hook-form";
import z from "zod";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { FieldError } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useCurrencyFormatter } from "@/hooks/use-currency-formatter";
import { getGraphQLDate } from "@/lib/date";
import {
  activityCreateHistoryEvent,
  linkMovementHistoryEvent,
} from "@/lib/history-events";
import { cn } from "@/lib/utils";
import { createActivityMutation } from "@/mutations/activities";
import { useAccounts } from "@/stores/accounts";
import {
  ACTIVITY_TYPES_COLOR,
  ACTIVITY_TYPES_NAME,
  useActivities,
} from "@/stores/activities";
import { useSync } from "@/stores/sync";

import { ProjectSelect } from "../projects/project-select";
import { DatePicker } from "../ui/date-picker";
import { ActivityCategorySelect } from "./activity-category-select";
import { ActivitySubcategorySelect } from "./activity-subcategory-select";
import { Transaction as TransactionComponent } from "./transaction";
import { TransactionDropdown } from "./transaction-dropdown";

// Form schema using zod
const formSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  date: z.date(),
  type: z.enum(ActivityType),
  category: z.string().optional(),
  subcategory: z.string().optional(),
  project: z.string().optional(),
  transactions: z.array(
    z.object({
      fromAccount: z.string().min(1, "From account is required"),
      fromAsset: z.string().nullable(),
      fromCounterparty: z.string().nullable(),
      toAccount: z.string().min(1, "To account is required"),
      toAsset: z.string().nullable(),
      toCounterparty: z.string().nullable(),
      amount: z.number().min(0.01, "Amount must be greater than 0"),
      fundMoves: z.array(
        z.object({
          id: z.string(),
          fromFund: z.string().nullable(),
          toFund: z.string().nullable(),
          amount: z.number(),
          date: z.date(),
          note: z.string().nullable(),
          transaction: z.string().nullable(),
        }),
      ),
    }),
  ),
});

type FormValues = z.infer<typeof formSchema>;

interface AddActivityModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  movement?: Movement;
  movements?: Movement[];
  amount?: number;
  name?: string;
  date?: Date;
  type?: ActivityType;
  category?: string;
  subcategory?: string;
  project?: string;
}

export function AddActivityModal({
  open,
  onOpenChange,
  movement,
  movements,
  amount: initialAmount,
  name: initialName,
  date: initialDate,
  type: initialType,
  category: initialCategory,
  subcategory: initialSubcategory,
  project: initialProject,
}: AddActivityModalProps) {
  const categories = useActivities((state) => state.activityCategories);
  const subcategories = useActivities((state) => state.activitySubcategories);
  const accounts = useAccounts((state) => state.accounts);
  const mutate = useSync((state) => state.mutate);
  const router = useRouter();
  const currencyFormatter = useCurrencyFormatter();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      description: "",
      date: new Date(),
      transactions: [],
    },
  });

  const { control, handleSubmit, watch, setValue, reset, formState } = form;
  const { errors } = formState;

  const nameInputRef = React.useRef<HTMLInputElement>(null);

  // Watch form values
  const type = watch("type");
  const category = watch("category");
  const transactions = watch("transactions");

  // Filtered categories and subcategories
  const filteredCategories = React.useMemo(() => {
    if (!type) return categories;
    return categories.filter((c) => c.type === type);
  }, [type, categories]);

  // Calculate transactions sum
  const transactionsSum = transactions.reduce((sum, t) => sum + t.amount, 0);

  // Handle transaction updates for the form
  const handleTransactionUpdate = (
    transactionIndex: number,
    updateData: Partial<Transaction> & { fundMoves?: FundMove[] },
  ) => {
    const updatedTransactions = [...transactions];
    const current = updatedTransactions[transactionIndex];
    const newAmount = updateData.amount ?? current.amount;
    const newFundMoves =
      updateData.fundMoves ??
      current.fundMoves?.map((move) => ({
        ...move,
        amount: newAmount,
      }));
    updatedTransactions[transactionIndex] = {
      ...current,
      ...updateData,
      fundMoves: newFundMoves,
    };
    setValue("transactions", updatedTransactions);
  };

  // Handle transaction deletion for the form
  const handleTransactionDelete = (transactionIndex: number) => {
    const updatedTransactions = [...transactions];
    updatedTransactions.splice(transactionIndex, 1);
    setValue("transactions", updatedTransactions);
  };

  // Guess best transaction accounts based on type
  const guessBestTransaction = React.useCallback(
    (type: ActivityType) => {
      let fromAccount: string | undefined;
      let toAccount: string | undefined;

      if (type === ActivityType.EXPENSE) {
        fromAccount = accounts.find(
          (a) => a.type === AccountType.BANK_ACCOUNT,
        )?.id;
        toAccount = accounts.find((a) => a.type === AccountType.EXPENSE)?.id;

        if (movement) {
          fromAccount = movement.account;
        } else if (movements) {
          const firstMovement = movements[0];
          if (movements.every((m) => m.account === firstMovement.account)) {
            fromAccount = firstMovement.account;
          }
        }
      } else if (type === ActivityType.REVENUE) {
        fromAccount = accounts.find((a) => a.type === AccountType.REVENUE)?.id;
        toAccount = accounts.find(
          (a) => a.type === AccountType.BANK_ACCOUNT,
        )?.id;

        if (movement) {
          toAccount = movement.account;
        } else if (movements) {
          const firstMovement = movements[0];
          if (movements.every((m) => m.account === firstMovement.account)) {
            toAccount = firstMovement.account;
          }
        }
      } else if (type === ActivityType.INVESTMENT) {
        fromAccount = accounts.find(
          (a) => a.type === AccountType.BANK_ACCOUNT,
        )?.id;
        toAccount = accounts.find(
          (a) => a.type === AccountType.INVESTMENT_ACCOUNT,
        )?.id;
      }

      return { fromAccount, toAccount };
    },
    [movement, movements, accounts],
  );

  // Add a new transaction
  const addTransaction = React.useCallback(
    (type: ActivityType) => {
      const { fromAccount, toAccount } = guessBestTransaction(type);
      let amount = 0;

      if (movement) {
        amount = Math.abs(movement.amount);
      } else if (movements && movements.length > 0) {
        const firstMovement = movements[0];
        amount = Math.abs(firstMovement.amount);
      }

      setValue("transactions", [
        ...transactions,
        {
          fromAccount: fromAccount || "",
          fromAsset: null,
          fromCounterparty: null,
          toAccount: toAccount || "",
          toAsset: null,
          toCounterparty: null,
          amount,
          fundMoves: [],
        },
      ]);
    },
    [movement, movements, guessBestTransaction, transactions, setValue, type],
  );

  // Handle form submission
  const onSubmit = (data: FormValues) => {
    if (movements) {
      // Handle multiple movements
      createMultipleActivities(data);
    } else {
      // Handle single activity
      createActivity(data);
    }
  };

  // Create a single activity
  const createActivity = (data: FormValues) => {
    const transactionsWithIds = data.transactions.map((t) => ({
      ...t,
      id: crypto.randomUUID(),
    }));

    const newActivity = {
      id: crypto.randomUUID(),
      name: data.name,
      description: data.description || null,
      date: getGraphQLDate(data.date),
      type: data.type,
      category: data.category || null,
      subcategory: data.subcategory || null,
      project: data.project || null,
      transactions: transactionsWithIds.map((t) => ({
        id: t.id,
        fromAccount: t.fromAccount,
        fromAsset: t.fromAsset || null,
        fromCounterparty: t.fromCounterparty || null,
        toAccount: t.toAccount,
        toAsset: t.toAsset || null,
        toCounterparty: t.toCounterparty || null,
        amount: t.amount,
      })),
      movement: movement
        ? {
            id: crypto.randomUUID(),
            movement: movement.id,
            amount: movement.amount,
          }
        : undefined,
    };

    const eventPayload = {
      ...newActivity,
      transactions: newActivity.transactions.map((t) => {
        const source = transactionsWithIds.find((s) => s.id === t.id);
        return {
          ...t,
          fundMoves: (source?.fundMoves ?? []).map((move) => ({
            id: move.id,
            fromFund: move.fromFund,
            toFund: move.toFund,
            amount: move.amount,
            date: getGraphQLDate(move.date),
            note: move.note,
            transaction: t.id,
          })),
        };
      }),
    };

    const variables = {
      ...newActivity,
      transactions: newActivity.transactions.map((t) => {
        const source = transactionsWithIds.find((s) => s.id === t.id);
        return {
          ...t,
          fundMoves: (source?.fundMoves ?? []).map((move) => ({
            id: move.id,
            fromFund: move.fromFund,
            toFund: move.toFund,
            amount: move.amount,
            note: move.note,
          })),
        };
      }),
    };

    mutate({
      name: "createActivity",
      mutation: createActivityMutation,
      variables,
      rollbackData: undefined,
      events: [
        {
          type: "createActivity",
          payload: eventPayload,
        },
        activityCreateHistoryEvent(newActivity.id),
        ...(movement
          ? [
              linkMovementHistoryEvent(
                movement,
                { id: newActivity.id, name: data.name },
                movement.amount,
              ),
            ]
          : []),
      ],
    });

    reset();
    onOpenChange(false);
    void router.navigate({
      to: "/activities/$id",
      params: { id: newActivity.id },
    });
  };

  // Create multiple activities from movements
  const createMultipleActivities = (data: FormValues) => {
    if (!movements) return;

    movements.forEach((movement) => {
      const { fromAccount, toAccount } = guessBestTransaction(type);

      const extractedDate = extractDateFromMovementName(
        movement.name,
        movement.date,
      );
      const activityDate = extractedDate || movement.date;

      const newActivity = {
        id: crypto.randomUUID(),
        name: movement.name,
        description: data.description || null,
        date: getGraphQLDate(activityDate),
        type: movement.amount < 0 ? ActivityType.EXPENSE : ActivityType.REVENUE,
        category: data.category || null,
        subcategory: data.subcategory || null,
        project: data.project || null,
        transactions: [
          {
            id: crypto.randomUUID(),
            fromAccount: fromAccount!,
            toAccount: toAccount!,
            amount: Math.abs(movement.amount),
          },
        ],
        movements: [
          {
            id: crypto.randomUUID(),
            movement: movement.id,
            amount: movement.amount,
          },
        ],
      };

      mutate({
        name: "createActivity",
        mutation: createActivityMutation,
        variables: {
          ...newActivity,
        },
        rollbackData: undefined,
        events: [
          {
            type: "createActivity",
            payload: newActivity,
          },
          activityCreateHistoryEvent(newActivity.id),
        ],
      });
    });

    reset();
    onOpenChange(false);
  };

  React.useEffect(() => {
    const newType = movement
      ? movement.amount < 0
        ? ActivityType.EXPENSE
        : ActivityType.REVENUE
      : initialType;
    const bestTransaction = newType ? guessBestTransaction(newType) : undefined;

    const transactions = [];
    if (bestTransaction) {
      const amount = movement ? Math.abs(movement.amount) : initialAmount;
      transactions.push({
        fromAccount: bestTransaction.fromAccount,
        fromAsset: null,
        fromCounterparty: null,
        toAccount: bestTransaction.toAccount,
        toAsset: null,
        toCounterparty: null,
        amount,
        fundMoves: [],
      });
    }

    const getMovementDate = (m: Movement | undefined): Date => {
      if (!m) return initialDate || new Date();
      const extractedDate = extractDateFromMovementName(m.name, m.date);
      return extractedDate || m.date;
    };

    reset({
      name: movement ? movement.name : initialName || "",
      description: "",
      date: movement ? getMovementDate(movement) : initialDate || new Date(),
      type: newType,
      category: initialCategory,
      subcategory: initialSubcategory,
      project: initialProject,
      transactions: transactions,
    });
  }, [
    movement,
    movements,
    initialAmount,
    initialName,
    initialDate,
    initialType,
    initialCategory,
    initialSubcategory,
    initialProject,
    reset,
    guessBestTransaction,
  ]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>
            {movement && (
              <div>
                {accounts.find((a) => a.id === movement.account)?.name ||
                  movement.account}{" "}
                - {movement.name}
              </div>
            )}
            {movements && <div>{movements.length} movements</div>}
            {!movement && !movements && <div>New activity</div>}
          </DialogTitle>
        </DialogHeader>

        {/* Main content */}
        <form onSubmit={handleSubmit(onSubmit)} className="min-w-0">
          {/* Date picker */}
          {!movements && (
            <Controller
              name="date"
              control={control}
              render={({ field, fieldState }) => (
                <>
                  <label htmlFor="date" className="sr-only">
                    Date
                  </label>
                  <DatePicker
                    id="date"
                    showIcon={false}
                    value={field.value}
                    onChange={field.onChange}
                    className="h-auto border-0 bg-transparent px-0 py-0.5 font-normal text-muted-foreground hover:bg-transparent focus-visible:ring-0 focus-visible:ring-transparent dark:bg-transparent dark:hover:bg-transparent"
                  />
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </>
              )}
            />
          )}
          {movements && (
            <div className="py-0.5 text-sm text-muted-foreground">
              Date of the movement
            </div>
          )}

          {/* Name input */}
          <Controller
            name="name"
            control={control}
            render={({ field }) => (
              <>
                <Input
                  {...field}
                  ref={nameInputRef}
                  id="name"
                  aria-label="Activity name"
                  placeholder="Activity name"
                  autoFocus
                  className="mt-1 h-auto w-full border-0 bg-transparent px-0 py-0.5 text-2xl font-semibold focus-visible:ring-0 focus-visible:ring-transparent md:text-2xl dark:bg-transparent"
                />
                {errors.name && <FieldError errors={[errors.name]} />}
              </>
            )}
          />

          {/* Description */}
          <Controller
            name="description"
            control={control}
            render={({ field }) => (
              <Textarea
                {...field}
                id="description"
                aria-label="Description"
                className="mt-2 min-h-0 w-full resize-none border-0 bg-transparent px-0 py-0.5 text-sm focus-visible:ring-0 focus-visible:ring-transparent dark:bg-transparent"
                placeholder="Add a description ..."
                rows={1}
              />
            )}
          />

          {/* Type, Category, Subcategory, Project selectors */}
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <Controller
              name="type"
              control={control}
              render={({ field }) => (
                <Select
                  onValueChange={(value) => {
                    field.onChange(value as ActivityType);
                    setValue("category", ""); // Reset category when type changes
                    setValue("subcategory", "");
                    if (transactions.length === 0) {
                      addTransaction(value as ActivityType);
                    }
                  }}
                  value={field.value || ""}
                >
                  <SelectTrigger aria-label="Activity type">
                    <SelectValue placeholder="Activity type" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.values(ActivityType).map((activityType) => (
                      <SelectItem key={activityType} value={activityType}>
                        <div className="flex items-center py-1">
                          <div
                            className={cn(
                              "mr-2 h-3 w-3 rounded-full",
                              ACTIVITY_TYPES_COLOR[activityType],
                            )}
                          />
                          <span>{ACTIVITY_TYPES_NAME[activityType]}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />

            <Controller
              name="category"
              control={control}
              render={({ field }) => (
                <ActivityCategorySelect
                  value={field.value || null}
                  onValueChange={(value) => {
                    field.onChange(value ?? "");
                    setValue("subcategory", "");
                  }}
                  type={type}
                  categories={filteredCategories}
                  disabled={!type || filteredCategories.length === 0}
                  placeholder="Category"
                />
              )}
            />

            <Controller
              name="subcategory"
              control={control}
              render={({ field }) => (
                <ActivitySubcategorySelect
                  value={field.value || null}
                  onValueChange={(val) => field.onChange(val ?? "")}
                  categoryId={category}
                  subcategories={subcategories}
                />
              )}
            />

            {/* Project Select */}
            <Controller
              name="project"
              control={control}
              render={({ field }) => (
                <ProjectSelect
                  value={field.value || null}
                  onValueChange={(value) => field.onChange(value ?? "")}
                />
              )}
            />
          </div>

          {/* Transactions section */}
          <div className="mt-4 border-t pt-4">
            <div className="mb-2 flex items-center justify-between pr-2">
              <h3 className="text-sm font-medium">Transactions</h3>
              <div className="flex items-center gap-2">
                <span className="mr-2 font-mono text-sm text-muted-foreground">
                  {currencyFormatter.format(transactionsSum)}
                </span>
                {!movements && (
                  <TransactionDropdown
                    transactions={transactions}
                    baseAmount={
                      movement ? Math.abs(movement.amount) : transactionsSum
                    }
                    onApplyTemplate={(newTransactions) => {
                      setValue(
                        "transactions",
                        newTransactions.map((t) => ({
                          fromAccount: t.fromAccount,
                          fromAsset: t.fromAsset || null,
                          fromCounterparty: t.fromCounterparty || null,
                          toAccount: t.toAccount,
                          toAsset: t.toAsset || null,
                          toCounterparty: t.toCounterparty || null,
                          amount: t.amount,
                          fundMoves: t.fundMoves ?? [],
                        })),
                      );
                    }}
                    onAddTransaction={() => addTransaction(type)}
                  />
                )}
              </div>
            </div>

            <div className="space-y-3 pr-1">
              {transactions.map((transaction, index) => (
                <TransactionComponent
                  key={index}
                  transaction={transaction}
                  showMetadata={false}
                  className={
                    index !== transactions.length - 1 ? "border-b" : ""
                  }
                  onUpdate={(updateData) =>
                    handleTransactionUpdate(index, updateData)
                  }
                  onDelete={() => handleTransactionDelete(index)}
                />
              ))}
            </div>
          </div>

          <DialogFooter className="mt-4">
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button type="submit">
              {movements ? "Add activities" : "Add activity"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

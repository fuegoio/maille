import { zodResolver } from "@hookform/resolvers/zod";
import { AccountType } from "@maille/core/accounts";
import { ActivityType } from "@maille/core/activities";
import type { Transaction } from "@maille/core/activities";
import type { Movement } from "@maille/core/movements";
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
import {
  Field,
  FieldError,
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
import { Textarea } from "@/components/ui/textarea";
import { useCurrencyFormatter } from "@/hooks/use-currency-formatter";
import { getGraphQLDate } from "@/lib/date";
import { cn } from "@/lib/utils";
import { createActivityMutation } from "@/mutations/activities";
import { useAccounts } from "@/stores/accounts";
import {
  ACTIVITY_TYPES_COLOR,
  ACTIVITY_TYPES_NAME,
  useActivities,
} from "@/stores/activities";
import { useSync } from "@/stores/sync";

import { DatePicker } from "../ui/date-picker";

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
}: AddActivityModalProps) {
  const categories = useActivities((state) => state.activityCategories);
  const subcategories = useActivities((state) => state.activitySubcategories);
  const accounts = useAccounts((state) => state.accounts);
  const mutate = useSync((state) => state.mutate);
  const activities = useActivities((state) => state.activities);
  const setFocusedActivity = useActivities((state) => state.setFocusedActivity);
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

  const filteredSubcategories = React.useMemo(() => {
    if (!category) return [];
    return subcategories.filter((sc) => sc.category === category);
  }, [category, subcategories]);

  // Calculate transactions sum
  const transactionsSum = transactions.reduce((sum, t) => sum + t.amount, 0);

  // Handle transaction updates for the form
  const handleTransactionUpdate = (
    transactionIndex: number,
    updateData: Partial<Transaction>,
  ) => {
    const updatedTransactions = [...transactions];
    updatedTransactions[transactionIndex] = {
      ...updatedTransactions[transactionIndex],
      ...updateData,
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
    const newActivity = {
      id: crypto.randomUUID(),
      number: activities.length + 1,
      name: data.name,
      description: data.description || null,
      date: getGraphQLDate(data.date),
      type: data.type,
      category: data.category || null,
      subcategory: data.subcategory || null,
      project: data.project || null,
      transactions: data.transactions.map((t) => ({
        id: crypto.randomUUID(),
        fromAccount: t.fromAccount,
        toAccount: t.toAccount,
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
      ],
    });

    reset();
    onOpenChange(false);
    setFocusedActivity(newActivity.id);
  };

  // Create multiple activities from movements
  const createMultipleActivities = (data: FormValues) => {
    if (!movements) return;

    movements.forEach((movement) => {
      const { fromAccount, toAccount } = guessBestTransaction(type);

      const newActivity = {
        id: crypto.randomUUID(),
        number: activities.length + 1,
        name: movement.name,
        description: data.description || null,
        date: getGraphQLDate(movement.date),
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
      });
    }

    reset({
      name: movement ? movement.name : initialName || "",
      description: "",
      date: movement ? movement.date : initialDate || new Date(),
      type: newType,
      category: undefined,
      subcategory: undefined,
      project: undefined,
      transactions: transactions,
    });
  }, [
    movement,
    movements,
    initialAmount,
    initialName,
    initialDate,
    initialType,
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
        <form onSubmit={handleSubmit(onSubmit)} className="min-w-0 space-y-4">
          <FieldGroup>
            {/* Date picker */}
            {!movements && (
              <Controller
                name="date"
                control={control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="date">Date</FieldLabel>
                    <DatePicker value={field.value} onChange={field.onChange} />
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />
            )}
            {movements && (
              <div className="text-primary-400 text-sm">
                Date of the movement
              </div>
            )}

            {/* Name input */}
            <Controller
              name="name"
              control={control}
              render={({ field }) => (
                <Field data-invalid={!!errors.name}>
                  <FieldLabel htmlFor="name">Activity name</FieldLabel>
                  <Input
                    {...field}
                    ref={nameInputRef}
                    id="name"
                    placeholder="Activity name"
                    autoFocus
                  />
                  {errors.name && <FieldError errors={[errors.name]} />}
                </Field>
              )}
            />

            {/* Description */}
            <Controller
              name="description"
              control={control}
              render={({ field }) => (
                <Field data-invalid={!!errors.description}>
                  <FieldLabel htmlFor="description">Description</FieldLabel>
                  <Textarea
                    {...field}
                    id="description"
                    className="resize-none"
                    placeholder="Description (optional)"
                    rows={3}
                  />
                  {errors.description && (
                    <FieldError errors={[errors.description]} />
                  )}
                </Field>
              )}
            />

            {/* Type, Category, Subcategory, Project selectors */}
            <div className="flex flex-wrap items-center gap-2">
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
                    <SelectTrigger>
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
                  <Select
                    onValueChange={field.onChange}
                    value={field.value || ""}
                    disabled={!type || filteredCategories.length === 0}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Category" />
                    </SelectTrigger>
                    <SelectContent>
                      {filteredCategories.map((cat) => (
                        <SelectItem key={cat.id} value={cat.id}>
                          {cat.emoji && (
                            <span className="mr-0.5">{cat.emoji}</span>
                          )}
                          {cat.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />

              <Controller
                name="subcategory"
                control={control}
                render={({ field }) => (
                  <Select
                    onValueChange={field.onChange}
                    value={field.value || ""}
                    disabled={!category || filteredSubcategories.length === 0}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Subcategory" />
                    </SelectTrigger>
                    <SelectContent>
                      {filteredSubcategories.map((subcat) => (
                        <SelectItem key={subcat.id} value={subcat.id}>
                          {subcat.emoji && (
                            <span className="mr-0.5">{subcat.emoji}</span>
                          )}
                          {subcat.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />

              {/* Project Select */}
              <Controller
                name="project"
                control={control}
                render={({ field }) => (
                  <Select
                    onValueChange={field.onChange}
                    value={field.value || ""}
                    disabled
                  >
                    <SelectTrigger className="bg-primary-700 border-primary-600 h-8 text-sm text-white">
                      <SelectValue placeholder="Project" />
                    </SelectTrigger>
                    <SelectContent className="bg-primary-800 border-primary-700">
                      {/* Project options would go here - disabled for now */}
                      <SelectItem value="placeholder" disabled>
                        Projects not implemented yet
                      </SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
          </FieldGroup>

          {/* Transactions section */}
          <div className="border-primary-700 border-t pt-4">
            <div className="mb-2 flex items-center justify-between">
              <h3 className="text-sm font-medium text-white">Transactions</h3>
              <div className="flex items-center gap-2">
                <span className="mr-1.75 font-mono text-sm text-muted-foreground">
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
                        })),
                      );
                    }}
                    onAddTransaction={() => addTransaction(type)}
                  />
                )}
              </div>
            </div>

            <div className="pr-1">
              {transactions.map((transaction, index) => (
                <TransactionComponent
                  key={index}
                  transaction={transaction}
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

          <DialogFooter>
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

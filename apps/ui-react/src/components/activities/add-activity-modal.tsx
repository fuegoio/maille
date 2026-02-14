import { zodResolver } from "@hookform/resolvers/zod";
import { AccountType } from "@maille/core/accounts";
import { ActivityType, type Activity } from "@maille/core/activities";
import type { Movement } from "@maille/core/movements";
import { Plus, Trash2 } from "lucide-react";
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
import { getGraphQLDate } from "@/lib/date";
import { cn, randomstring } from "@/lib/utils";
import { createActivityMutation } from "@/mutations/activities";
import { useAccounts } from "@/stores/accounts";
import {
  ACTIVITY_TYPES_COLOR,
  ACTIVITY_TYPES_NAME,
  useActivities,
} from "@/stores/activities";
import { useAuth } from "@/stores/auth";
import { useSync } from "@/stores/sync";
import { useWorkspaces } from "@/stores/workspaces";

import { AmountInput } from "../ui/amount-input";
import { DatePicker } from "../ui/date-picker";

// Form schema using zod
const formSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  date: z.date(),
  type: z.enum(ActivityType),
  category: z.string().optional(),
  subcategory: z.string().optional(),
  project: z.string().optional(),
  transactions: z
    .array(
      z.object({
        fromAccount: z.string().min(1, "From account is required"),
        toAccount: z.string().min(1, "To account is required"),
        amount: z.number().min(0.01, "Amount must be greater than 0"),
      }),
    )
    .min(1, "At least one transaction is required"),
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
  onActivityAdded?: (activity: Activity) => void;
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
  onActivityAdded,
}: AddActivityModalProps) {
  const categories = useActivities((state) => state.activityCategories);
  const subcategories = useActivities((state) => state.activitySubcategories);
  const accounts = useAccounts((state) => state.accounts);
  const mutate = useSync((state) => state.mutate);
  const currentWorkspace = useWorkspaces((state) => state.currentWorkspace);
  const userId = useAuth((state) => state.user!.id);
  const activities = useActivities((state) => state.activities);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      description: "",
      date: new Date(),
      type: undefined,
      category: undefined,
      subcategory: undefined,
      project: undefined,
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
  const transactionsSum = React.useMemo(() => {
    return transactions.reduce((sum, t) => sum + t.amount, 0);
  }, [transactions]);

  // Initialize form based on props
  React.useEffect(() => {
    if (open) {
      // Set initial values from props
      const initialValues: Partial<FormValues> = {};

      if (initialName) initialValues.name = initialName;
      if (initialDate) initialValues.date = initialDate;
      if (initialType) initialValues.type = initialType;
      if (initialAmount) {
        initialValues.transactions = [
          {
            fromAccount: "",
            toAccount: "",
            amount: initialAmount,
          },
        ];
      }

      // Handle movement/movements
      if (movement) {
        initialValues.name = movement.name || "";
        initialValues.date = movement.date;
        initialValues.type =
          movement.amount < 0 ? ActivityType.EXPENSE : ActivityType.REVENUE;
        initialValues.transactions = [
          {
            fromAccount: "",
            toAccount: "",
            amount: Math.abs(movement.amount),
          },
        ];
      } else if (movements && movements.length > 0) {
        const firstMovement = movements[0];
        initialValues.name = firstMovement.name || "";

        if (movements.every((m) => m.amount < 0)) {
          initialValues.type = ActivityType.EXPENSE;
        } else if (movements.every((m) => m.amount > 0)) {
          initialValues.type = ActivityType.REVENUE;
        }

        initialValues.transactions = movements.map((m) => ({
          fromAccount: "",
          toAccount: "",
          amount: Math.abs(m.amount),
        }));
      }

      reset(initialValues);

      // Focus name input
      setTimeout(() => {
        if (nameInputRef.current) {
          nameInputRef.current.focus();
        }
      }, 100);
    }
  }, [
    open,
    movement,
    movements,
    initialName,
    initialDate,
    initialType,
    initialAmount,
    reset,
  ]);

  // Add transaction when form becomes valid and has no transactions
  React.useEffect(() => {
    if (type && transactions.length === 0 && !movements) {
      const { fromAccount, toAccount } = guessBestTransaction();
      let amount = 0;

      if (movement) {
        amount = Math.abs(movement.amount);
      } else if (movements && movements.length > 0) {
        const firstMovement = movements[0];
        amount = Math.abs(firstMovement.amount);
      }

      setValue("transactions", [
        {
          fromAccount: fromAccount || "",
          toAccount: toAccount || "",
          amount,
        },
      ]);
    }
  }, [type, transactions.length, movements, movement, setValue]);

  // Guess best transaction accounts based on type
  const guessBestTransaction = (): {
    fromAccount: string | undefined;
    toAccount: string | undefined;
  } => {
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
      toAccount = accounts.find((a) => a.type === AccountType.BANK_ACCOUNT)?.id;

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
  };

  // Add a new transaction
  const addTransaction = () => {
    const { fromAccount, toAccount } = guessBestTransaction();
    let amount = 0;

    if (movement) {
      amount = Math.abs(movement.amount);
    } else if (movements && movements.length > 0) {
      const firstMovement = movements[0];
      amount = Math.abs(firstMovement.amount);
    }

    const currentTransactions = watch("transactions");
    setValue("transactions", [
      ...currentTransactions,
      {
        fromAccount: fromAccount || "",
        toAccount: toAccount || "",
        amount,
      },
    ]);
  };

  // Remove a transaction
  const removeTransaction = (index: number) => {
    const currentTransactions = watch("transactions");
    const newTransactions = [...currentTransactions];
    newTransactions.splice(index, 1);
    setValue("transactions", newTransactions);
  };

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
      id: randomstring(),
      user: userId,
      number: activities.length + 1,
      name: data.name,
      description: data.description || null,
      date: getGraphQLDate(data.date),
      type: data.type,
      category: data.category || null,
      subcategory: data.subcategory || null,
      project: data.project || null,
      transactions: data.transactions.map((t) => ({
        id: randomstring(),
        fromUser: null,
        fromAccount: t.fromAccount,
        toUser: null,
        toAccount: t.toAccount,
        amount: t.amount,
      })),
      movements: movement
        ? [
            {
              id: randomstring(),
              movement: movement.id,
              amount: movement.amount,
            },
          ]
        : [],
    };

    mutate({
      name: "createActivity",
      mutation: createActivityMutation,
      variables: {
        ...newActivity,
        workspace: currentWorkspace!.id,
      },
      rollbackData: undefined,
      events: [
        {
          type: "createActivity",
          payload: newActivity,
        },
      ],
    });

    if (onActivityAdded) {
      onActivityAdded(newActivity);
    }

    reset();
    onOpenChange(false);
  };

  // Create multiple activities from movements
  const createMultipleActivities = (data: FormValues) => {
    if (!movements) return;

    movements.forEach((movement) => {
      const { fromAccount, toAccount } = guessBestTransaction();

      const newActivity = {
        id: randomstring(),
        user,
        number: activities.length + 1,
        name: movement.name,
        description: data.description || null,
        date: movement.date.toISOString(),
        type: movement.amount < 0 ? ActivityType.EXPENSE : ActivityType.REVENUE,
        category: data.category || null,
        subcategory: data.subcategory || null,
        project: data.project || null,
        transactions: [
          {
            id: randomstring(),
            fromUser: null,
            fromAccount: fromAccount!,
            toUser: null,
            toAccount: toAccount!,
            amount: Math.abs(movement.amount),
          },
        ],
        movements: [
          {
            id: randomstring(),
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
          workspace: currentWorkspace!.id,
        },
        rollbackData: undefined,
        events: [
          {
            type: "createActivity",
            payload: newActivity,
          },
        ],
      });

      if (onActivityAdded) {
        onActivityAdded(newActivity);
      }
    });

    reset();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            <div className="flex items-center gap-2">
              {movement && (
                <div className="rounded bg-muted px-3 py-1 text-sm font-medium text-foreground">
                  {accounts.find((a) => a.id === movement.account)?.name ||
                    movement.account}{" "}
                  - {movement.name}
                </div>
              )}
              {movements && (
                <div className="rounded bg-muted px-3 py-1 text-sm font-medium text-foreground">
                  {movements.length} movements
                </div>
              )}
              {!movement && !movements && (
                <div className="rounded bg-muted px-3 py-1 text-sm font-medium text-foreground">
                  New activity
                </div>
              )}
            </div>
          </DialogTitle>
        </DialogHeader>

        {/* Main content */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
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
                    className="bg-primary-700 border-primary-600 resize-none text-sm text-white"
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
                      setValue("category", undefined); // Reset category when type changes
                    }}
                    value={field.value}
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
                    value={field.value}
                    disabled={!type || filteredCategories.length === 0}
                  >
                    <SelectTrigger className="bg-primary-700 border-primary-600 h-8 text-sm text-white">
                      <SelectValue placeholder="Category" />
                    </SelectTrigger>
                    <SelectContent className="bg-primary-800 border-primary-700">
                      {filteredCategories.map((cat) => (
                        <SelectItem key={cat.id} value={cat.id}>
                          <span className="text-sm">{cat.name}</span>
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
                    value={field.value}
                    disabled={!category || filteredSubcategories.length === 0}
                  >
                    <SelectTrigger className="bg-primary-700 border-primary-600 h-8 text-sm text-white">
                      <SelectValue placeholder="Subcategory" />
                    </SelectTrigger>
                    <SelectContent className="bg-primary-800 border-primary-700">
                      {filteredSubcategories.map((subcat) => (
                        <SelectItem key={subcat.id} value={subcat.id}>
                          <span className="text-sm">{subcat.name}</span>
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
                    value={field.value}
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
                <span className="text-primary-300 font-mono text-sm">
                  {transactionsSum.toFixed(2)}
                </span>
                {!movements && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-primary-400 hover:text-primary-100 h-6 w-6 p-0"
                    onClick={addTransaction}
                    type="button"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>

            {transactions.map((transaction, index) => (
              <div
                key={index}
                className="border-primary-700 mb-2 flex items-center gap-2 border-b pb-2"
              >
                {/* From Account */}
                <Controller
                  name={`transactions.${index}.fromAccount` as const}
                  control={control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid} className="flex-1">
                      <FieldLabel
                        htmlFor={`transactions.${index}.fromAccount`}
                        className="sr-only"
                      >
                        From account
                      </FieldLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="From account" />
                        </SelectTrigger>
                        <SelectContent>
                          {accounts.map((account) => (
                            <SelectItem key={account.id} value={account.id}>
                              {account.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {fieldState.invalid && (
                        <FieldError errors={[fieldState.error]} />
                      )}
                    </Field>
                  )}
                />

                <span className="text-primary-400 text-sm">to</span>

                {/* To Account */}
                <Controller
                  name={`transactions.${index}.toAccount` as const}
                  control={control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid} className="flex-1">
                      <FieldLabel
                        htmlFor={`transactions.${index}.toAccount`}
                        className="sr-only"
                      >
                        To account
                      </FieldLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="To account" />
                        </SelectTrigger>
                        <SelectContent>
                          {accounts.map((account) => (
                            <SelectItem key={account.id} value={account.id}>
                              {account.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {fieldState.invalid && (
                        <FieldError errors={[fieldState.error]} />
                      )}
                    </Field>
                  )}
                />

                {/* Amount */}
                <Controller
                  name={`transactions.${index}.amount` as const}
                  control={control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid} className="w-24">
                      <FieldLabel
                        htmlFor={`transactions.${index}.amount`}
                        className="sr-only"
                      >
                        Amount
                      </FieldLabel>
                      <AmountInput {...field} />
                      {fieldState.invalid && (
                        <FieldError errors={[fieldState.error]} />
                      )}
                    </Field>
                  )}
                />

                {/* Remove transaction button */}
                {!movements && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-primary-400 hover:text-primary-100 h-6 w-6 p-0"
                    onClick={() => removeTransaction(index)}
                    type="button"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
          </div>

          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button type="submit">
              {movements ? "Create activities" : "Create activity"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

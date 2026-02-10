import * as React from "react";
import { useStore } from "zustand";
import { activitiesStore } from "@/stores/activities";
import { accountsStore } from "@/stores/accounts";
import { ActivityType, type Activity } from "@maille/core/activities";
import { AccountType } from "@maille/core/accounts";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";
import { X, Plus, Trash2 } from "lucide-react";
import { randomUUID, type UUID } from "crypto";
import type { Movement } from "@maille/core/movements";
import { syncStore } from "@/stores/sync";
import { createActivityMutation } from "@/mutations/activities";
import { workspacesStore } from "@/stores/workspaces";

// Activity type colors mapping
const ACTIVITY_TYPES_COLOR = {
  [ActivityType.EXPENSE]: "red",
  [ActivityType.REVENUE]: "green",
  [ActivityType.INVESTMENT]: "orange",
  [ActivityType.NEUTRAL]: "slate",
};

// Activity type names mapping
const ACTIVITY_TYPES_NAME = {
  [ActivityType.EXPENSE]: "Expense",
  [ActivityType.REVENUE]: "Revenue",
  [ActivityType.INVESTMENT]: "Investment",
  [ActivityType.NEUTRAL]: "Neutral",
};

interface Transaction {
  fromAccount: UUID | undefined;
  toAccount: UUID | undefined;
  amount: number;
}

interface AddActivityModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: string;
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
  user,
  movement,
  movements,
  amount: initialAmount,
  name: initialName,
  date: initialDate,
  type: initialType,
  onActivityAdded,
}: AddActivityModalProps) {
  const categories = useStore(activitiesStore, (state) => state.activityCategories);
  const subcategories = useStore(activitiesStore, (state) => state.activitySubcategories);
  const accounts = useStore(accountsStore, (state) => state.accounts);
  const mutate = useStore(syncStore, (state) => state.mutate);

  // Form state
  const [name, setName] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [date, setDate] = React.useState<Date | undefined>(new Date());
  const [type, setType] = React.useState<ActivityType | undefined>(undefined);
  const [category, setCategory] = React.useState<UUID | null>(null);
  const [subcategory, setSubcategory] = React.useState<UUID | null>(null);
  const [project, setProject] = React.useState<UUID | null>(null);
  const [transactions, setTransactions] = React.useState<Transaction[]>([]);

  const nameInputRef = React.useRef<HTMLInputElement>(null);

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

  // Form validation
  const isFormValid = React.useMemo(() => {
    return !!name && !!date && !!type;
  }, [name, date, type]);

  // Reset form
  const resetForm = () => {
    setName("");
    setDescription("");
    setDate(new Date());
    setType(undefined);
    setCategory(null);
    setSubcategory(null);
    setProject(null);
    setTransactions([]);
  };

  // Initialize form based on props
  React.useEffect(() => {
    if (open) {
      // Set initial values from props
      if (initialName) setName(initialName);
      if (initialDate) setDate(initialDate);
      if (initialType) setType(initialType);
      if (initialAmount) {
        setTransactions([
          {
            fromAccount: undefined,
            toAccount: undefined,
            amount: initialAmount,
          },
        ]);
      }

      // Handle movement/movements
      if (movement) {
        setName(movement.name || "");
        setDate(movement.date);
        setType(movement.amount < 0 ? ActivityType.EXPENSE : ActivityType.REVENUE);
        setTransactions([
          {
            fromAccount: undefined,
            toAccount: undefined,
            amount: Math.abs(movement.amount),
          },
        ]);
      } else if (movements && movements.length > 0) {
        const firstMovement = movements[0];
        setName(firstMovement.name || "");

        if (movements.every((m) => m.amount < 0)) {
          setType(ActivityType.EXPENSE);
        } else if (movements.every((m) => m.amount > 0)) {
          setType(ActivityType.REVENUE);
        }

        setTransactions(
          movements.map((m) => ({
            fromAccount: undefined,
            toAccount: undefined,
            amount: Math.abs(m.amount),
          })),
        );
      }

      // Focus name input
      setTimeout(() => {
        if (nameInputRef.current) {
          nameInputRef.current.focus();
        }
      }, 100);
    } else {
      resetForm();
    }
  }, [open, movement, movements, initialName, initialDate, initialType, initialAmount]);

  // Add transaction when form becomes valid
  React.useEffect(() => {
    if (isFormValid && transactions.length === 0 && !movements) {
      const { fromAccount, toAccount } = guessBestTransaction();
      let amount = 0;

      if (movement) {
        amount = Math.abs(movement.amount);
      } else if (movements && movements.length > 0) {
        const firstMovement = movements[0];
        amount = Math.abs(firstMovement.amount);
      }

      setTransactions([
        ...transactions,
        {
          fromAccount,
          toAccount,
          amount,
        },
      ]);
    }
  }, [isFormValid, transactions.length, movements, movement]);

  // Guess best transaction accounts based on type
  const guessBestTransaction = (): {
    fromAccount: UUID | undefined;
    toAccount: UUID | undefined;
  } => {
    let fromAccount: UUID | undefined;
    let toAccount: UUID | undefined;

    if (type === ActivityType.EXPENSE) {
      fromAccount = accounts.find((a) => a.type === AccountType.BANK_ACCOUNT)?.id;
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
      fromAccount = accounts.find((a) => a.type === AccountType.BANK_ACCOUNT)?.id;
      toAccount = accounts.find((a) => a.type === AccountType.INVESTMENT_ACCOUNT)?.id;
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

    setTransactions([
      ...transactions,
      {
        fromAccount,
        toAccount,
        amount,
      },
    ]);
  };

  // Remove a transaction
  const removeTransaction = (index: number) => {
    const newTransactions = [...transactions];
    newTransactions.splice(index, 1);
    setTransactions(newTransactions);
  };

  // Update transaction
  const updateTransaction = (index: number, field: keyof Transaction, value: any) => {
    const newTransactions = [...transactions];
    newTransactions[index] = {
      ...newTransactions[index],
      [field]: value,
    };
    setTransactions(newTransactions);
  };

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!isFormValid) {
      return;
    }

    if (movements) {
      // Handle multiple movements
      createMultipleActivities();
    } else {
      // Handle single activity
      createActivity();
    }
  };

  // Create a single activity
  const createActivity = () => {
    const newActivity = {
      id: crypto.randomUUID(),
      user,
      number: activitiesStore.getState().activities.length + 1,
      name,
      description,
      date: date!.toISOString(),
      type,
      category,
      subcategory,
      project,
      transactions,
      movements: movement
        ? [
            {
              id: randomUUID(),
              movement: movement.id,
              amount: movement.amount,
            },
          ]
        : [],
    };

    mutate({
      name: "createActivity",
      mutation: createActivityMutation,
      variables: { ...newActivity, workspace: workspacesStore.getState().currentWorkspace!.id },
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

    resetForm();
    onOpenChange(false);
  };

  // Create multiple activities from movements
  const createMultipleActivities = () => {
    if (!movements) return;

    movements.forEach((movement) => {
      const { fromAccount, toAccount } = guessBestTransaction();

      const newActivity = {
        id: crypto.randomUUID(),
        user,
        number: activitiesStore.getState().activities.length + 1,
        name: movement.name,
        description: description || null,
        date: movement.date.toISOString(),
        type: movement.amount < 0 ? ActivityType.EXPENSE : ActivityType.REVENUE,
        category,
        subcategory,
        project,
        transactions: [
          {
            id: crypto.randomUUID(),
            fromUser: null,
            fromAccount: fromAccount!,
            toUser: null,
            toAccount: toAccount!,
            amount: Math.abs(movement.amount),
          },
        ],
        movements: [
          {
            id: randomUUID(),
            movement: movement.id,
            amount: movement.amount,
          },
        ],
      };

      mutate({
        name: "createActivity",
        mutation: createActivityMutation,
        variables: { ...newActivity, workspace: workspacesStore.getState().currentWorkspace!.id },
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

    resetForm();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-primary-800 border-primary-700 max-h-[90vh] max-w-2xl overflow-y-auto text-white">
        {/* Header with movement info */}
        <div className="border-primary-700 flex items-center justify-between border-b px-4 py-2">
          <div className="flex items-center gap-2">
            {movement && (
              <div className="bg-primary-400 text-primary-900 rounded px-3 py-1 text-sm font-medium">
                {accounts.find((a) => a.id === movement.account)?.name || movement.account} -{" "}
                {movement.name}
              </div>
            )}
            {movements && (
              <div className="bg-primary-400 text-primary-900 rounded px-3 py-1 text-sm font-medium">
                {movements.length} movements
              </div>
            )}
            {!movement && !movements && (
              <div className="bg-primary-400 text-primary-900 rounded px-3 py-1 text-sm font-medium">
                New activity
              </div>
            )}
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="text-primary-400 hover:text-primary-100"
            onClick={() => onOpenChange(false)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Main content */}
        <div className="space-y-4 p-4">
          {/* Date picker */}
          {!movements && (
            <div className="flex items-center gap-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={cn(
                      "bg-primary-700 border-primary-600 h-8 justify-start text-left font-normal text-white",
                      !date && "text-muted-foreground",
                    )}
                  >
                    <CalendarIcon className="mr-2 h-3 w-3" />
                    {date ? format(date, "PPP") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="bg-primary-800 border-primary-700 w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={setDate}
                    className="bg-primary-800 text-white"
                  />
                </PopoverContent>
              </Popover>
            </div>
          )}
          {movements && <div className="text-primary-400 text-sm">Date of the movement</div>}

          {/* Name input */}
          <div className="flex items-center">
            <Input
              ref={nameInputRef}
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="bg-primary-700 border-primary-600 flex-1 text-white"
              placeholder="Activity name"
              autoFocus
            />
          </div>

          {/* Description */}
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="bg-primary-700 border-primary-600 resize-none text-sm text-white"
            placeholder="Description (optional)"
            rows={3}
          />

          {/* Type, Category, Subcategory, Project selectors */}
          <div className="flex flex-wrap items-center gap-2">
            <Select
              onValueChange={(value) => {
                setType(value as ActivityType);
                setCategory(null); // Reset category when type changes
              }}
              value={type}
            >
              <SelectTrigger className="bg-primary-700 border-primary-600 h-8 text-sm text-white">
                <SelectValue placeholder="Activity type" />
              </SelectTrigger>
              <SelectContent className="bg-primary-800 border-primary-700">
                {Object.values(ActivityType).map((activityType) => (
                  <SelectItem key={activityType} value={activityType}>
                    <div className="flex items-center">
                      <div
                        className={`mr-2 h-3 w-3 rounded-full ${ACTIVITY_TYPES_COLOR[activityType]}-500`}
                      />
                      <span className="text-sm">{ACTIVITY_TYPES_NAME[activityType]}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              onValueChange={(value) => setCategory(value as UUID)}
              value={category || undefined}
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

            <Select
              onValueChange={(value) => setSubcategory(value as UUID)}
              value={subcategory || undefined}
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

            {/* Project Select */}
            <Select
              onValueChange={(value) => setProject(value as UUID)}
              value={project || undefined}
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
          </div>

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
                <Select
                  onValueChange={(value) => updateTransaction(index, "fromAccount", value as UUID)}
                  value={transaction.fromAccount}
                >
                  <SelectTrigger className="bg-primary-700 border-primary-600 h-8 flex-1 text-sm text-white">
                    <SelectValue placeholder="From account" />
                  </SelectTrigger>
                  <SelectContent className="bg-primary-800 border-primary-700">
                    {accounts.map((account) => (
                      <SelectItem key={account.id} value={account.id}>
                        <span className="text-sm">{account.name}</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <span className="text-primary-400 text-sm">to</span>

                {/* To Account */}
                <Select
                  onValueChange={(value) => updateTransaction(index, "toAccount", value as UUID)}
                  value={transaction.toAccount}
                >
                  <SelectTrigger className="bg-primary-700 border-primary-600 h-8 flex-1 text-sm text-white">
                    <SelectValue placeholder="To account" />
                  </SelectTrigger>
                  <SelectContent className="bg-primary-800 border-primary-700">
                    {accounts.map((account) => (
                      <SelectItem key={account.id} value={account.id}>
                        <span className="text-sm">{account.name}</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* Amount */}
                <Input
                  type="number"
                  value={transaction.amount}
                  onChange={(e) =>
                    updateTransaction(index, "amount", parseFloat(e.target.value) || 0)
                  }
                  className="bg-primary-700 border-primary-600 h-8 w-24 font-mono text-sm text-white"
                  step="0.01"
                />

                {/* Remove transaction button */}
                {!movements && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-primary-400 hover:text-primary-100 h-6 w-6 p-0"
                    onClick={() => removeTransaction(index)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Footer with action buttons */}
        <div className="border-primary-700 flex justify-end gap-2 border-t px-4 py-3">
          <Button
            type="button"
            variant="outline"
            className="text-primary-300 border-primary-600 hover:bg-primary-700"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            type="button"
            className="bg-primary-600 hover:bg-primary-500 text-white"
            onClick={handleSubmit}
          >
            {movements ? "Create activities" : "Create activity"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

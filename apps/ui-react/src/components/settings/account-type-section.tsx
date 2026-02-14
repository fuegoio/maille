import { AccountType } from "@maille/core/accounts";
import { format } from "date-fns";
import { Plus, ChevronUp, ChevronDown, Trash2 } from "lucide-react";
import { useState, useMemo } from "react";

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
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { cn, randomstring } from "@/lib/utils";
import {
  createAccountMutation,
  deleteAccountMutation,
  updateAccountMutation,
} from "@/mutations/accounts";
import {
  useAccounts,
  ACCOUNT_TYPES_COLOR,
  ACCOUNT_TYPES_NAME,
} from "@/stores/accounts";
import { useActivities } from "@/stores/activities";
import { useSync } from "@/stores/sync";
import { useWorkspaces } from "@/stores/workspaces";

interface AccountTypeSectionProps {
  accountType: AccountType;
}

export function AccountTypeSection({ accountType }: AccountTypeSectionProps) {
  const accounts = useAccounts((state) => state.accounts);
  const mutate = useSync((state) => state.mutate);

  const activities = useActivities((state) => state.activities);
  const currentWorkspace = useWorkspaces((state) => state.currentWorkspace);

  const [expanded, setExpanded] = useState<string | null>(null);
  const [newAccount, setNewAccount] = useState({
    show: false,
    name: "",
  });

  const startingPeriodFormatted = currentWorkspace?.startingDate
    ? format(new Date(currentWorkspace.startingDate), "MMMM yyyy")
    : "Unknown";

  const sortedAccounts = useMemo(() => {
    return [...accounts]
      .filter((a) => a.type === accountType)
      .sort((a, b) => {
        return b.default ? 1 : a.default ? -1 : 0;
      });
  }, [accounts, accountType]);

  const toggleExpand = (accountId: string) => {
    setExpanded(expanded === accountId ? null : accountId);
  };

  const cancelNewAccount = () => {
    setNewAccount({ show: false, name: "" });
  };

  const getTransactionsLinkedToAccount = (accountId: string) => {
    return activities
      .flatMap((a) => a.transactions)
      .filter((t) => t.fromAccount === accountId || t.toAccount === accountId)
      .length;
  };

  const handleAddNewAccount = async () => {
    if (!newAccount.name) return;

    const account = {
      id: randomstring(),
      name: newAccount.name,
      type: accountType,
    };

    mutate({
      name: "createAccount",
      mutation: createAccountMutation,
      variables: {
        ...account,
        workspace: currentWorkspace!.id,
      },
      rollbackData: undefined,
      events: [
        {
          type: "createAccount",
          payload: {
            ...account,
          },
        },
      ],
    });

    cancelNewAccount();
  };

  const handleUpdateAccount = async (
    accountId: string,
    update: {
      startingBalance?: number | null;
      startingCashBalance?: number | null;
      movements?: boolean;
    },
  ) => {
    const account = accounts.find((a) => a.id === accountId);
    if (!account) return;

    mutate({
      name: "updateAccount",
      mutation: updateAccountMutation,
      variables: {
        id: accountId,
        ...update,
      },
      rollbackData: { ...account },
      events: [
        {
          type: "updateAccount",
          payload: {
            id: accountId,
            ...update,
          },
        },
      ],
    });
  };

  const handleDeleteAccount = async (accountId: string) => {
    const account = accounts.find((a) => a.id === accountId);
    if (!account) return;

    if (getTransactionsLinkedToAccount(accountId) > 0) return;
    mutate({
      name: "deleteAccount",
      mutation: deleteAccountMutation,
      variables: {
        id: accountId,
      },
      rollbackData: account,
      events: [
        {
          type: "deleteAccount",
          payload: {
            id: accountId,
          },
        },
      ],
    });
  };

  return (
    <div className="border-b px-4 pt-4 pb-10">
      <div className="mb-2 flex items-center px-2">
        <div
          className={cn(
            "mr-2 h-3 w-3 shrink-0 rounded-xl sm:mr-3",
            ACCOUNT_TYPES_COLOR[accountType],
          )}
        />
        <div className="text-sm font-medium">
          {ACCOUNT_TYPES_NAME[accountType]}
        </div>

        <div className="flex-1" />
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => setNewAccount({ show: true, name: "" })}
        >
          <Plus className="text-primary-500 h-4 w-4" />
        </Button>
      </div>

      {newAccount.show && (
        <div className="pl-4">
          <div className="my-2 flex h-12 w-full items-center rounded border bg-card px-4">
            <Input
              value={newAccount.name}
              onChange={(e) =>
                setNewAccount({ ...newAccount, name: e.target.value })
              }
              placeholder="Name"
              autoFocus
              className="max-w-96"
            />

            <div className="flex-1" />
            <Button
              variant="outline"
              className="mr-2"
              onClick={cancelNewAccount}
            >
              Cancel
            </Button>
            <Button onClick={handleAddNewAccount}>
              <Plus />
              Add
            </Button>
          </div>
        </div>
      )}

      <div className="pl-4">
        {sortedAccounts.map((account) => (
          <div
            key={account.id}
            className="group my-2 w-full rounded border px-4"
          >
            <div className="flex h-10 w-full items-center">
              <div className="text-sm font-medium">{account.name}</div>
              <div className="mx-2">·</div>
              <div className="text-sm text-muted-foreground">
                {getTransactionsLinkedToAccount(account.id)} transactions
              </div>

              <div className="flex-1" />

              {account.default ? (
                <div className="mx-1 text-sm text-muted-foreground">
                  Default
                </div>
              ) : (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      className="opacity-0 transition-opacity group-hover:opacity-100"
                      variant="ghost"
                      size="icon"
                      disabled={getTransactionsLinkedToAccount(account.id) > 0}
                    >
                      <Trash2 />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete Account</AlertDialogTitle>
                      <AlertDialogDescription>
                        {getTransactionsLinkedToAccount(account.id) > 0
                          ? "First delete all the transactions associated with this account."
                          : "Are you sure you want to delete this account?"}
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => handleDeleteAccount(account.id)}
                        disabled={
                          getTransactionsLinkedToAccount(account.id) > 0
                        }
                      >
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}

              {!(
                [AccountType.EXPENSE, AccountType.REVENUE] as AccountType[]
              ).includes(account.type) && (
                <button
                  className="ml-2"
                  onClick={() => toggleExpand(account.id)}
                >
                  {expanded === account.id ? (
                    <ChevronUp className="text-primary-500 hover:text-primary-300 h-4 w-4" />
                  ) : (
                    <ChevronDown className="text-primary-500 hover:text-primary-300 h-4 w-4" />
                  )}
                </button>
              )}
            </div>

            {expanded === account.id && (
              <div className="border-t py-4">
                <div className="flex flex-col text-sm sm:flex-row sm:items-center">
                  <div className="text-primary-500 text-sm">
                    Starting balance (in {startingPeriodFormatted})
                  </div>
                  <div className="flex-1" />
                  <AmountInput
                    value={account.startingBalance || 0}
                    onChange={(startingBalance) =>
                      handleUpdateAccount(account.id, { startingBalance })
                    }
                    className="mt-2 w-full sm:mt-0 sm:w-56"
                  />
                </div>

                {accountType === AccountType.BANK_ACCOUNT && (
                  <div className="mt-4 flex flex-col text-sm sm:flex-row sm:items-center">
                    <div className="text-primary-500 text-sm">
                      Starting cash balance (in {startingPeriodFormatted})
                    </div>
                    <div className="flex-1" />
                    <AmountInput
                      value={account.startingCashBalance || 0}
                      onChange={(startingCashBalance) =>
                        handleUpdateAccount(account.id, { startingCashBalance })
                      }
                      className="mt-2 w-full sm:mt-0 sm:w-56"
                    />
                  </div>
                )}

                <div className="mt-4 flex h-10 flex-col text-sm sm:flex-row sm:items-center">
                  <div className="text-primary-500 text-sm">
                    Movements enabled
                  </div>
                  <div className="flex-1" />
                  <Checkbox
                    checked={account.movements}
                    onCheckedChange={(checked) =>
                      handleUpdateAccount(account.id, { movements: !!checked })
                    }
                    className="mt-2 sm:mt-0"
                  />
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

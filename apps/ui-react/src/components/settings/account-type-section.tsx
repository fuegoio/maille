import { useStore } from "zustand";
import { useState, useMemo } from "react";
import type { UUID } from "crypto";
import { AccountType, type Account } from "@maille/core/accounts";
import { accountsStore, ACCOUNT_TYPES_COLOR, ACCOUNT_TYPES_NAME } from "@/stores/accounts";
import { workspacesStore } from "@/stores/workspaces";
import { eventsStore } from "@/stores/events";
import { activitiesStore } from "@/stores/activities";
import {
  createAccountMutation,
  deleteAccountMutation,
  updateAccountMutation,
} from "@/mutations/accounts";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AmountInput } from "@/components/ui/amount-input";
import { Checkbox } from "@/components/ui/checkbox";
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
import { Plus, ChevronUp, ChevronDown, Trash2 } from "lucide-react";
import { format } from "date-fns";

interface AccountTypeSectionProps {
  accountType: AccountType;
}

export function AccountTypeSection({ accountType }: AccountTypeSectionProps) {
  const accounts = useStore(accountsStore, (state) => state.accounts);
  const addAccount = useStore(accountsStore, (state) => state.addAccount);
  const updateAccount = useStore(accountsStore, (state) => state.updateAccount);
  const deleteAccount = useStore(accountsStore, (state) => state.deleteAccount);
  const sendEvent = useStore(eventsStore, (state) => state.sendEvent);

  const activities = useStore(activitiesStore, (state) => state.activities);
  const currentWorkspace = useStore(workspacesStore, (state) => state.currentWorkspace);

  const [expanded, setExpanded] = useState<UUID | null>(null);
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

  const toggleExpand = (accountId: UUID) => {
    setExpanded(expanded === accountId ? null : accountId);
  };

  const cancelNewAccount = () => {
    setNewAccount({ show: false, name: "" });
  };

  const getTransactionsLinkedToAccount = (accountId: UUID) => {
    return activities
      .flatMap((a) => a.transactions)
      .filter((t) => t.fromAccount === accountId || t.toAccount === accountId).length;
  };

  const handleAddNewAccount = async () => {
    if (!newAccount.name) return;

    const account = addAccount({
      name: newAccount.name,
      type: accountType,
    });

    sendEvent({
      name: "createAccount",
      mutation: createAccountMutation,
      variables: {
        ...account,
        workspace: currentWorkspace?.id,
      },
      rollbackData: undefined,
    });

    cancelNewAccount();
  };

  const handleUpdateAccount = async (
    accountId: UUID,
    update: {
      startingBalance?: number | null;
      startingCashBalance?: number | null;
      movements?: boolean;
    },
  ) => {
    const account = accounts.find((a) => a.id === accountId);
    if (!account) return;

    updateAccount(accountId, update);

    sendEvent({
      name: "updateAccount",
      mutation: updateAccountMutation,
      variables: {
        id: accountId,
        ...update,
      },
      rollbackData: { ...account },
    });
  };

  const handleDeleteAccount = async (accountId: UUID) => {
    const account = accounts.find((a) => a.id === accountId);
    if (!account) return;

    if (getTransactionsLinkedToAccount(accountId) > 0) return;

    deleteAccount(accountId);

    sendEvent({
      name: "deleteAccount",
      mutation: deleteAccountMutation,
      variables: {
        id: accountId,
      },
      rollbackData: account,
    });
  };

  return (
    <div className="border-t pt-4 pb-10">
      <div className="mb-2 flex items-center px-2">
        <div
          className="mr-2 h-3 w-3 shrink-0 rounded-xl sm:mr-3"
          style={{ backgroundColor: ACCOUNT_TYPES_COLOR[accountType] }}
        />
        <div className="text-sm font-medium">{ACCOUNT_TYPES_NAME[accountType]}</div>

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
        <div className="bg-primary-900 my-2 flex h-12 w-full items-center rounded border px-4">
          <Input
            value={newAccount.name}
            onChange={(e) => setNewAccount({ ...newAccount, name: e.target.value })}
            placeholder="Name"
            autoFocus
            className="flex-1 border-none bg-transparent focus:ring-0 focus:outline-none"
          />

          <div className="flex-1" />
          <Button variant="outline" className="mr-2" onClick={cancelNewAccount}>
            Cancel
          </Button>
          <Button onClick={handleAddNewAccount}>Save</Button>
        </div>
      )}

      <div className="py-2 pl-8">
        {sortedAccounts.map((account) => (
          <div key={account.id} className="group my-2 w-full rounded border px-4">
            <div className="flex h-10 w-full items-center">
              <div className="text-primary-200 text-sm font-medium">{account.name}</div>
              <div className="text-primary-600 ml-1 text-sm">
                · {getTransactionsLinkedToAccount(account.id)} transactions
              </div>

              <div className="flex-1" />

              {account.default ? (
                <div className="text-primary-600 mx-1 text-sm">Default</div>
              ) : (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <button
                      className="hidden group-hover:block"
                      disabled={getTransactionsLinkedToAccount(account.id) > 0}
                    >
                      <Trash2 className="text-primary-700 hover:text-primary-300 mx-1 h-4 w-4" />
                    </button>
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
                        disabled={getTransactionsLinkedToAccount(account.id) > 0}
                      >
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}

              {!([AccountType.EXPENSE, AccountType.REVENUE] as AccountType[]).includes(
                account.type,
              ) && (
                <button className="ml-2" onClick={() => toggleExpand(account.id)}>
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
                      placeholder=""
                    />
                  </div>
                )}

                <div className="mt-4 flex h-10 flex-col text-sm sm:flex-row sm:items-center">
                  <div className="text-primary-500 text-sm">Movements enabled</div>
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


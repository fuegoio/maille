import { useHotkey } from "@tanstack/react-hotkeys";
import { Link, useRouter } from "@tanstack/react-router";
import { BookMarked, Trash2 } from "lucide-react";
import * as React from "react";

import { AccountLabel } from "@/components/accounts/account-label";
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
import { Badge } from "@/components/ui/badge";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { Field, FieldGroup, FieldLabel, FieldSet } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { Textarea } from "@/components/ui/textarea";
import { UserSelect } from "@/components/users/user-select";
import { useCurrencyFormatter } from "@/hooks/use-currency-formatter";
import { cn } from "@/lib/utils";
import {
  deleteCounterpartyMutation,
  updateCounterpartyMutation,
} from "@/mutations/counterparties";
import { useActivities } from "@/stores/activities";
import { useAuth } from "@/stores/auth";
import { useCounterparties } from "@/stores/counterparties";
import { useSync } from "@/stores/sync";

interface CounterpartyPageProps {
  counterpartyId: string;
}

export function CounterpartyPage({ counterpartyId }: CounterpartyPageProps) {
  const router = useRouter();
  const mutate = useSync((state) => state.mutate);
  const currencyFormatter = useCurrencyFormatter();

  const counterparty = useCounterparties((state) =>
    state.getCounterpartyById(counterpartyId),
  );
  const counterparties = useCounterparties((state) => state.counterparties);
  const activities = useActivities((state) => state.activities);
  const user = useAuth((state) => state.user!);

  const getCounterpartyLiability = React.useCallback(() => {
    if (!counterparty) return 0;

    const transactionsTotal = activities
      .filter((a) => a.date >= user.startingDate)
      .flatMap((a) => a.transactions)
      .filter(
        (transaction) =>
          transaction.fromCounterparty === counterparty.id ||
          transaction.toCounterparty === counterparty.id,
      )
      .reduce((total, transaction) => {
        if (transaction.fromCounterparty === counterparty.id) {
          return total - transaction.amount;
        } else if (transaction.toCounterparty === counterparty.id) {
          return total + transaction.amount;
        }
        return total;
      }, 0);

    return (counterparty.initialBalance ?? 0) + transactionsTotal;
  }, [counterparty, activities, user.startingDate]);

  const counterpartyActivities = React.useMemo(() => {
    if (!counterparty) return [];
    return activities
      .filter((activity) =>
        activity.transactions.some(
          (transaction) =>
            transaction.fromCounterparty === counterparty.id ||
            transaction.toCounterparty === counterparty.id,
        ),
      )
      .sort((a, b) => b.date.getTime() - a.date.getTime());
  }, [counterparty, activities]);

  const deleteCounterparty = () => {
    if (!counterparty) return;
    const counterpartyData = { ...counterparty };
    mutate({
      name: "deleteCounterparty",
      mutation: deleteCounterpartyMutation,
      variables: { id: counterparty.id },
      rollbackData: counterpartyData,
      events: [
        {
          type: "deleteCounterparty",
          payload: { id: counterparty.id },
        },
      ],
    });
    void router.navigate({ to: "/counterparties" });
  };

  const handleUpdateCounterparty = (update: {
    name?: string;
    description?: string | null;
    contact?: string | null;
    initialBalance?: number | null;
  }) => {
    if (!counterparty) return;
    const counterpartyData = { ...counterparty };
    mutate({
      name: "updateCounterparty",
      mutation: updateCounterpartyMutation,
      variables: { id: counterparty.id, ...update },
      rollbackData: counterpartyData,
      events: [
        {
          type: "updateCounterparty",
          payload: { id: counterparty.id, ...update },
        },
      ],
    });
  };

  // Hotkeys to navigate between counterparties
  const sortedCounterparties = React.useMemo(() => {
    return [...counterparties].sort((a, b) => a.name.localeCompare(b.name));
  }, [counterparties]);

  useHotkey("K", (event) => {
    if (event.key !== "k") return;
    if (sortedCounterparties.length === 0) return;

    const currentIndex = sortedCounterparties.findIndex(
      (c) => c.id === counterpartyId,
    );
    const nextIndex =
      currentIndex === -1
        ? 0
        : (currentIndex - 1 + sortedCounterparties.length) %
          sortedCounterparties.length;

    void router.navigate({
      to: "/counterparties/$id",
      params: { id: sortedCounterparties[nextIndex].id },
      replace: true,
    });
  });

  useHotkey("J", (event) => {
    if (event.key !== "j") return;
    if (sortedCounterparties.length === 0) return;

    const currentIndex = sortedCounterparties.findIndex(
      (c) => c.id === counterpartyId,
    );
    const nextIndex =
      currentIndex === -1
        ? 0
        : (currentIndex + 1) % sortedCounterparties.length;

    void router.navigate({
      to: "/counterparties/$id",
      params: { id: sortedCounterparties[nextIndex].id },
      replace: true,
    });
  });

  useHotkey("Escape", () => {
    if (window.history.length > 1) {
      window.history.back();
    } else {
      void router.navigate({ to: "/counterparties" });
    }
  });

  if (!counterparty) return null;

  return (
    <SidebarInset>
      <div className="flex h-full flex-col">
        <header className="flex h-12 w-full shrink-0 items-center gap-2 border-b px-4 sm:px-4">
          <SidebarTrigger className="mr-1" />
          <Breadcrumb className="min-w-0 flex-1">
            <BreadcrumbList>
              <BreadcrumbItem className="shrink-0">
                <BreadcrumbLink asChild>
                  <Link to="/counterparties">Counterparties</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="shrink-0" />
              <BreadcrumbItem className="min-w-0">
                <BreadcrumbPage className="truncate" title={counterparty.name}>
                  {counterparty.name}
                </BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="ghost" size="icon">
                <Trash2 />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete counterparty</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete this counterparty? This action
                  cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={deleteCounterparty}
                  variant="destructive"
                >
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </header>

        <div className="flex-1 overflow-y-auto pb-20">
          <div className="mx-auto w-full max-w-5xl">
            <div className="border-b px-4 py-6 sm:px-8">
              <div className="flex items-center gap-2">
                <Badge variant="outline" asChild className="h-6">
                  <Link
                    to="/accounts/$id"
                    params={{ id: counterparty.account }}
                  >
                    <AccountLabel accountId={counterparty.account} />
                  </Link>
                </Badge>
              </div>

              <div className="mt-3 flex items-baseline justify-between gap-4">
                <Input
                  aria-label="Counterparty name"
                  value={counterparty.name}
                  onChange={(e) =>
                    handleUpdateCounterparty({ name: e.target.value })
                  }
                  placeholder="Counterparty name"
                  className="h-auto min-w-0 flex-1 border-0 bg-transparent px-0 py-0.5 text-3xl font-semibold md:text-3xl dark:bg-transparent"
                />
                <div className="shrink-0 font-mono text-2xl leading-snug font-semibold whitespace-nowrap">
                  {currencyFormatter.format(getCounterpartyLiability())}
                </div>
              </div>

              <div className="mt-1 text-sm text-muted-foreground">
                Current liability
              </div>

              <Textarea
                aria-label="Description"
                value={counterparty.description || ""}
                onChange={(e) =>
                  handleUpdateCounterparty({
                    description: e.target.value || null,
                  })
                }
                placeholder="Add a description ..."
                rows={1}
                className="mt-2 min-h-16 w-full resize-none border-0 bg-transparent px-0 py-0.5 text-sm dark:bg-transparent"
              />
            </div>

            <div className="px-4 py-6 sm:px-8">
              <FieldSet>
                <FieldGroup>
                  <Field>
                    <FieldLabel htmlFor="initialBalance">
                      Initial balance
                    </FieldLabel>
                    <Input
                      id="initialBalance"
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={counterparty.initialBalance ?? ""}
                      onChange={(e) =>
                        handleUpdateCounterparty({
                          initialBalance:
                            e.target.value === ""
                              ? null
                              : parseFloat(e.target.value),
                        })
                      }
                    />
                  </Field>

                  <Field>
                    <FieldLabel htmlFor="contact">Contact</FieldLabel>
                    <UserSelect
                      id="contact"
                      value={counterparty.contact || ""}
                      onValueChange={(value) =>
                        handleUpdateCounterparty({ contact: value })
                      }
                    />
                  </Field>
                </FieldGroup>
              </FieldSet>
            </div>

            <div className="border-t px-4 py-6 sm:px-8">
              <div className="flex items-center gap-1.5">
                <BookMarked className="size-3.5 text-muted-foreground" />
                <div className="text-sm font-medium">
                  Activities involving this counterparty
                </div>
                <div className="flex-1" />
              </div>

              <div className="mt-4 mb-2 rounded border bg-muted/50">
                {counterpartyActivities.length === 0 ? (
                  <div className="flex items-center justify-center py-4 text-xs text-muted-foreground">
                    No activities involve this counterparty yet.
                  </div>
                ) : (
                  counterpartyActivities.map((activity, index) => (
                    <Link
                      key={activity.id}
                      to="/activities/$id"
                      params={{ id: activity.id }}
                      className={cn(
                        "group flex h-10 cursor-pointer items-center gap-2 px-4 text-sm hover:bg-muted",
                        index !== counterpartyActivities.length - 1 &&
                          "border-b",
                      )}
                    >
                      <div className="hidden w-20 shrink-0 text-muted-foreground sm:block">
                        {activity.date.toLocaleDateString("fr-FR")}
                      </div>
                      <div className="w-10 shrink-0 text-muted-foreground sm:hidden">
                        {activity.date.toLocaleDateString("fr-FR", {
                          day: "2-digit",
                          month: "2-digit",
                        })}
                      </div>

                      <div className="overflow-hidden text-ellipsis whitespace-nowrap">
                        {activity.name}
                      </div>
                      <div className="flex-1" />
                      <div className="w-20 text-right font-mono whitespace-nowrap">
                        {currencyFormatter.format(activity.amount)}
                      </div>
                    </Link>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </SidebarInset>
  );
}

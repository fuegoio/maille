import { AccountType } from "@maille/core/accounts";
import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import {
  ArrowRightLeft,
  BookMarked,
  ChevronLeft,
  ChevronRight,
  House,
  Plus,
  Settings,
  SquareChartGantt,
  Users,
} from "lucide-react";
import { useEffect, useState } from "react";

import { AccountLabel } from "@/components/accounts/account-label";
import { AccountSettingsDialog } from "@/components/accounts/account-settings-dialog";
import { AccountSummary } from "@/components/accounts/account-summary";
import { AddAssetModal } from "@/components/accounts/assets/add-asset-modal";
import { Asset } from "@/components/accounts/assets/asset";
import { AssetsTable } from "@/components/accounts/assets/assets-table";
import { AddCounterpartyModal } from "@/components/accounts/counterparties/add-counterparty-modal";
import { CounterpartiesTable } from "@/components/accounts/counterparties/counterparties-table";
import { Counterparty } from "@/components/accounts/counterparties/counterparty";
import { ShareAccountDialog } from "@/components/accounts/share-account-dialog";
import { ActivitiesTable } from "@/components/activities/activities-table";
import { Activity } from "@/components/activities/activity";
import { AddActivityButton } from "@/components/activities/add-activity-button";
import { FilterActivitiesButton } from "@/components/activities/filters/filter-activities-button";
import { AddMovementButton } from "@/components/movements/add-movement-button";
import { FilterMovementsButton } from "@/components/movements/filters/filter-movements-button";
import { Movement } from "@/components/movements/movement";
import { MovementsTable } from "@/components/movements/movements-table";
import { SearchBar } from "@/components/search-bar";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAccounts } from "@/stores/accounts";
import { useActivities } from "@/stores/activities";
import { useMovements } from "@/stores/movements";

export const Route = createFileRoute("/_authenticated/accounts/$id")({
  component: AccountPage,
  loader: async ({ params }) => {
    const accounts = useAccounts.getState().accounts;
    const account = accounts.find((a) => a.id === params.id);
    if (!account) {
      throw notFound();
    }

    return { account };
  },
});

function AccountPage() {
  const accountId = Route.useParams().id;
  const account = useAccounts((state) => state.getAccountById(accountId));
  if (!account) {
    throw notFound();
  }

  const [selectedTab, setSelectedTab] = useState("activities");
  const [summaryOpen, setSummaryOpen] = useState(true);

  const activities = useActivities((state) => state.activities);
  const focusedActivity = useActivities((state) => state.focusedActivity);
  const movements = useMovements((state) => state.movements);
  const focusedMovement = useMovements((state) => state.focusedMovement);

  useEffect(() => {
    if (focusedActivity || focusedMovement) {
      setSummaryOpen(false);
    }
  }, [focusedActivity, focusedMovement]);

  const viewActivities = activities.filter((a) =>
    a.transactions.some(
      (t) => t.fromAccount === account.id || t.toAccount === account.id,
    ),
  );

  const viewMovements = movements.filter((m) => m.account === account.id);

  return (
    <>
      <SidebarInset className="flex-row">
        <div className="flex-1">
          <header className="flex h-12 shrink-0 items-center gap-2 border-b pr-4 pl-4">
            <SidebarTrigger className="mr-1" />

            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink asChild>
                    <Link to="/accounts">Accounts</Link>
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>
                    <AccountLabel accountId={account.id} />
                  </BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
            <div className="flex-1" />
            <SearchBar />
            {!summaryOpen && (
              <Button
                variant="secondary"
                onClick={() => setSummaryOpen(true)}
                size={focusedActivity || focusedMovement ? "icon" : "default"}
              >
                <SquareChartGantt />
                {!(focusedActivity || focusedMovement) && (
                  <>
                    Summary
                    <ChevronRight />
                  </>
                )}
              </Button>
            )}
            <ShareAccountDialog account={account}>
              <Button
                variant={account.sharing.length > 0 ? "default" : "ghost"}
                size={account.sharing.length > 0 ? "default" : "icon"}
              >
                <Users />
                {account.sharing.length > 0 && "Shared"}
              </Button>
            </ShareAccountDialog>
            <AccountSettingsDialog account={account}>
              <Button variant="ghost" size="icon">
                <Settings />
              </Button>
            </AccountSettingsDialog>
          </header>

          <Tabs
            value={selectedTab}
            onValueChange={setSelectedTab}
            className="h-full"
          >
            <header className="flex h-11 shrink-0 items-center gap-2 border-b bg-muted/30 pr-4 pl-7">
              <TabsList className="ml-5">
                <TabsTrigger value="activities">
                  <BookMarked />
                  Activities
                </TabsTrigger>
                <TabsTrigger value="movements">
                  <ArrowRightLeft />
                  Movements
                </TabsTrigger>
                {account.type === AccountType.ASSETS && (
                  <TabsTrigger value="assets">
                    <House />
                    Assets
                  </TabsTrigger>
                )}
                {account.type === AccountType.LIABILITIES && (
                  <TabsTrigger value="counterparties">
                    <Users />
                    Counterparties
                  </TabsTrigger>
                )}
              </TabsList>
              <div className="flex-1" />

              {selectedTab === "activities" && (
                <>
                  <FilterActivitiesButton viewId={`account-${account.id}`} />
                  <AddActivityButton size="sm" />
                </>
              )}
              {selectedTab === "movements" && (
                <>
                  <FilterMovementsButton
                    viewId={`account-${account.id}-movements`}
                  />
                  <AddMovementButton size="sm" />
                </>
              )}
              {selectedTab === "assets" && (
                <AddAssetModal accountId={accountId}>
                  <Button size="sm">
                    <Plus />
                    Add asset
                  </Button>
                </AddAssetModal>
              )}
              {selectedTab === "counterparties" && (
                <AddCounterpartyModal accountId={accountId}>
                  <Button size="sm">
                    <Plus />
                    Add counterparty
                  </Button>
                </AddCounterpartyModal>
              )}
            </header>

            <TabsContent value="activities" className="flex h-full">
              <ActivitiesTable
                viewId={`account-${account.id}`}
                activities={viewActivities}
                grouping="period"
              />
            </TabsContent>

            <TabsContent value="movements" className="flex h-full">
              <MovementsTable
                viewId={`account-${account.id}-movements`}
                movements={viewMovements}
                grouping="period"
                accountFilter={account.id}
              />
            </TabsContent>

            {account.type === AccountType.ASSETS && (
              <TabsContent value="assets" className="flex h-full">
                <AssetsTable accountId={account.id} />
              </TabsContent>
            )}

            {account.type === AccountType.LIABILITIES && (
              <TabsContent value="counterparties" className="flex h-full">
                <CounterpartiesTable accountId={account.id} />
              </TabsContent>
            )}
          </Tabs>
        </div>

        {summaryOpen && (
          <div className="h-full w-full max-w-md overflow-y-auto border-l bg-muted/30">
            <div className="flex h-12 shrink-0 items-center gap-2 border-b px-3">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSummaryOpen(false)}
              >
                <ChevronLeft className="size-4" />
              </Button>
              <div className="text-sm font-medium">Summary</div>
            </div>

            <AccountSummary accountId={account.id} />
          </div>
        )}
      </SidebarInset>

      {selectedTab === "activities" && <Activity />}
      {selectedTab === "movements" && <Movement />}
      {selectedTab === "assets" && <Asset />}
      {selectedTab === "counterparties" && <Counterparty />}
    </>
  );
}

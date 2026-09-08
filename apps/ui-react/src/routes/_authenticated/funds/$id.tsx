import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { ArrowDownToLine, BookMarked, Settings } from "lucide-react";
import { useMemo, useState } from "react";

import { ActivitiesTable } from "@/components/activities/activities-table";
import { FilterActivitiesButton } from "@/components/activities/filters/filter-activities-button";
import { AllocateDialog } from "@/components/funds/allocate-dialog";
import { FundMovesTable } from "@/components/funds/fund-moves-table";
import { FundSettingsDialog } from "@/components/funds/fund-settings-dialog";
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
import { useActivities } from "@/stores/activities";
import { useFunds } from "@/stores/funds";

export const Route = createFileRoute("/_authenticated/funds/$id")({
  component: FundPage,
  loader: async ({ params }) => {
    const funds = useFunds.getState().funds;
    const fund = funds.find((f) => f.id === params.id);
    if (!fund) {
      throw notFound();
    }

    return { fund };
  },
});

function FundPage() {
  const fundId = Route.useParams().id;
  const fund = useFunds((state) => state.getFundById(fundId));
  if (!fund) {
    throw notFound();
  }

  const [selectedTab, setSelectedTab] = useState("activities");

  const activities = useActivities((state) => state.activities);
  const fundMoves = useFunds((state) => state.fundMoves);

  // Activities touch this fund through a transaction's fund moves
  const viewActivities = useMemo(() => {
    const transactionIds = new Set(
      fundMoves
        .filter(
          (m) =>
            m.transaction !== null &&
            (m.fromFund === fundId || m.toFund === fundId),
        )
        .map((m) => m.transaction),
    );

    if (transactionIds.size === 0) return [];

    return activities.filter((a) =>
      a.transactions.some((t) => transactionIds.has(t.id)),
    );
  }, [activities, fundMoves, fundId]);

  return (
    <SidebarInset>
      <header className="flex h-12 shrink-0 items-center gap-2 border-b pr-4 pl-4">
        <SidebarTrigger className="mr-1" />

        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link to="/funds">Funds</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>
                {fund.emoji && <span className="mr-1">{fund.emoji}</span>}
                <span>{fund.name}</span>
              </BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        <div className="flex-1" />
        <SearchBar />
        <AllocateDialog defaultToFund={fund.id}>
          <Button variant="outline">
            <ArrowDownToLine />
            Allocate
          </Button>
        </AllocateDialog>
        {!fund.isDefault && (
          <FundSettingsDialog fund={fund}>
            <Button variant="ghost" size="icon" aria-label="Fund settings">
              <Settings />
            </Button>
          </FundSettingsDialog>
        )}
      </header>

      <Tabs
        value={selectedTab}
        onValueChange={setSelectedTab}
        className="min-h-0 flex-1"
      >
        <header className="flex h-11 shrink-0 items-center gap-2 border-b bg-muted/30 pr-4 pl-7">
          <TabsList className="ml-5">
            <TabsTrigger value="activities">
              <BookMarked />
              Activities
            </TabsTrigger>
            <TabsTrigger value="fund-moves">
              <ArrowDownToLine />
              Fund moves
            </TabsTrigger>
          </TabsList>
          <div className="flex-1" />

          {selectedTab === "activities" && (
            <FilterActivitiesButton viewId={`fund-${fund.id}`} />
          )}
        </header>

        <TabsContent value="activities" className="flex h-full">
          <ActivitiesTable
            viewId={`fund-${fund.id}`}
            activities={viewActivities}
            grouping="period"
          />
        </TabsContent>

        <TabsContent value="fund-moves" className="flex h-full">
          <FundMovesTable fundId={fund.id} />
        </TabsContent>
      </Tabs>
    </SidebarInset>
  );
}

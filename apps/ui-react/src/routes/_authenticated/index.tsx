import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";

import { AccountsOverview } from "@/components/home/accounts-overview";
import { CategoryBreakdown } from "@/components/home/category-breakdown";
import { DateRangePicker } from "@/components/home/date-range-picker";
import { FundsOverview } from "@/components/home/funds-overview";
import { HomeChart } from "@/components/home/home-chart";
import { HomeKpis, type Kpi } from "@/components/home/home-kpis";
import { RecentActivities } from "@/components/home/recent-activities";
import { RecentMovements } from "@/components/home/recent-movements";
import { useHomeDateRange } from "@/components/home/use-home-date-range";
import {
  PageBreadcrumbs,
  usePageBreadcrumbs,
} from "@/components/navigation/breadcrumbs";
import { PageBar } from "@/components/shared/page-bars";
import { SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { useAuth } from "@/stores/auth";

export const Route = createFileRoute("/_authenticated/")({
  component: RouteComponent,
});

function RouteComponent() {
  const user = useAuth((state) => state.user!);
  const { range, setPreset, setCustomRange } = useHomeDateRange(
    user.startingDate,
  );
  const [activeChart, setActiveChart] = useState<Kpi>("balance");

  const chartTitle =
    activeChart === "balance"
      ? "Balance history"
      : activeChart === "revenue"
        ? "Revenue history"
        : "Expense history";

  const breadcrumbs = usePageBreadcrumbs({
    contextual: false,
    routeKey: "/",
    entries: [{ key: "dashboard", label: "Dashboard", target: { to: "/" } }],
  });

  return (
    <SidebarInset>
      <PageBar>
        <SidebarTrigger className="mr-1" />
        <PageBreadcrumbs entries={breadcrumbs} />
      </PageBar>

      <section aria-label="Ledger history" className="border-b">
        <HomeKpis
          range={range}
          activeChart={activeChart}
          onActiveChartChange={setActiveChart}
        />

        <div className="flex flex-wrap items-center justify-between gap-2 border-t px-4 py-2.5 sm:px-6">
          <h2 className="font-serif text-xl leading-none tracking-[-0.01em]">
            {chartTitle}
          </h2>
          <DateRangePicker
            range={range}
            startingDate={user.startingDate}
            onPreset={setPreset}
            onCustomRange={setCustomRange}
          />
        </div>

        <HomeChart range={range} activeChart={activeChart} />
      </section>

      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
        <div className="grid flex-1 grid-cols-1 lg:grid-cols-6 lg:grid-rows-[auto_1fr]">
          <section className="border-t lg:col-span-3 lg:border-t-0 lg:border-r">
            <RecentActivities />
          </section>
          <section className="border-t lg:col-span-3 lg:border-t-0">
            <RecentMovements />
          </section>
          <section className="border-t lg:col-span-2 lg:border-r">
            <CategoryBreakdown range={range} />
          </section>
          <section className="border-t lg:col-span-2 lg:border-r">
            <AccountsOverview />
          </section>
          <section className="border-t lg:col-span-2">
            <FundsOverview />
          </section>
        </div>
      </div>
    </SidebarInset>
  );
}

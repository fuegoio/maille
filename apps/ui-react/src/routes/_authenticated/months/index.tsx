import { createFileRoute } from "@tanstack/react-router";

import { MonthsTable } from "@/components/months/months-table";
import {
  PageBreadcrumbs,
  usePageBreadcrumbs,
} from "@/components/navigation/breadcrumbs";
import { LedgerHeaderStrip, PageBar } from "@/components/shared/page-bars";
import { SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";

export const Route = createFileRoute("/_authenticated/months/")({
  component: RouteComponent,
});

function RouteComponent() {
  const breadcrumbs = usePageBreadcrumbs({
    contextual: false,
    routeKey: "/months",
    entries: [{ key: "months", label: "Months", target: { to: "/months" } }],
  });

  return (
    <>
      <SidebarInset>
        <PageBar>
          <SidebarTrigger className="mr-1" />
          <PageBreadcrumbs entries={breadcrumbs} />
        </PageBar>

        <LedgerHeaderStrip className="gap-6">
          <div>Month</div>
          <div className="flex-1" />
          <div className="w-32 text-right">Balance</div>
          <div className="hidden w-32 text-right md:block">Revenue</div>
          <div className="hidden w-32 text-right md:block">Investment</div>
          <div className="hidden w-32 text-right md:block">Expenses</div>
        </LedgerHeaderStrip>

        <MonthsTable />
      </SidebarInset>
    </>
  );
}

import { createFileRoute } from "@tanstack/react-router";

import { MonthsTable } from "@/components/months/months-table";
import {
  PageBreadcrumbs,
  usePageBreadcrumbs,
} from "@/components/navigation/breadcrumbs";
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
        <header className="flex h-12 shrink-0 items-center gap-2 border-b pr-2 pl-4">
          <SidebarTrigger className="mr-1" />
          <PageBreadcrumbs entries={breadcrumbs} />
        </header>

        <header className="flex h-8 items-center gap-6 border-b bg-muted/50 pr-6 pl-6 text-xs font-medium text-muted-foreground">
          <div>Month</div>
          <div className="flex-1" />
          <div className="w-32 text-right">Balance</div>
          <div className="w-32 text-right">Revenue</div>
          <div className="w-32 text-right">Investment</div>
          <div className="w-32 text-right">Expenses</div>
        </header>

        <MonthsTable />
      </SidebarInset>
    </>
  );
}

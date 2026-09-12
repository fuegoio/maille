import { createFileRoute } from "@tanstack/react-router";
import { Plus } from "lucide-react";

import { CreateFundDialog } from "@/components/funds/create-fund-dialog";
import { FundsTable } from "@/components/funds/funds-table";
import {
  PageBreadcrumbs,
  usePageBreadcrumbs,
} from "@/components/navigation/breadcrumbs";
import { Button } from "@/components/ui/button";
import { SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";

export const Route = createFileRoute("/_authenticated/funds/")({
  component: FundsPage,
});

function FundsPage() {
  const breadcrumbs = usePageBreadcrumbs({
    contextual: false,
    routeKey: "/funds",
    entries: [{ key: "funds", label: "Funds", target: { to: "/funds" } }],
  });

  return (
    <SidebarInset>
      <header className="flex h-12 shrink-0 items-center gap-2 border-b pr-4 pl-4">
        <SidebarTrigger className="mr-1" />
        <PageBreadcrumbs entries={breadcrumbs} />
        <div className="flex-1" />
        <CreateFundDialog>
          <Button
            variant="outline"
            aria-label="New fund"
            className="w-8 px-0 sm:w-auto sm:px-2.5"
          >
            <Plus />
            <span className="hidden sm:inline">New fund</span>
          </Button>
        </CreateFundDialog>
      </header>

      <header className="flex h-8 items-center gap-4 border-b bg-muted/50 pr-6 pl-6 text-xs font-medium text-muted-foreground">
        <div>Fund</div>
        <div className="flex-1" />
        <div className="w-32 text-right">Balance</div>
      </header>

      <FundsTable />
    </SidebarInset>
  );
}

import { createFileRoute } from "@tanstack/react-router";
import { Plus } from "lucide-react";

import { CreateFundDialog } from "@/components/funds/create-fund-dialog";
import { FundsTable } from "@/components/funds/funds-table";
import {
  PageBreadcrumbs,
  usePageBreadcrumbs,
} from "@/components/navigation/breadcrumbs";
import { LedgerHeaderStrip, PageBar } from "@/components/shared/page-bars";
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
      <PageBar>
        <SidebarTrigger className="mr-1" />
        <PageBreadcrumbs entries={breadcrumbs} />
        <div className="flex-1" />
        <CreateFundDialog>
          <Button
            aria-label="New fund"
            className="w-8 px-0 sm:w-auto sm:px-2.5"
          >
            <Plus />
            <span className="hidden sm:inline">New fund</span>
          </Button>
        </CreateFundDialog>
      </PageBar>

      <LedgerHeaderStrip>
        <div>Fund</div>
        <div className="flex-1" />
        <div className="w-32 text-right">Balance</div>
      </LedgerHeaderStrip>

      <FundsTable />
    </SidebarInset>
  );
}

import { createFileRoute } from "@tanstack/react-router";
import { Plus, Wallet } from "lucide-react";

import { CreateFundDialog } from "@/components/funds/create-fund-dialog";
import { FundsTable } from "@/components/funds/funds-table";
import {
  PageBreadcrumbs,
  usePageBreadcrumbs,
} from "@/components/navigation/breadcrumbs";
import { LedgerHeaderStrip, PageBar } from "@/components/shared/page-bars";
import { Button } from "@/components/ui/button";
import { SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

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
    <SidebarInset className="min-w-0">
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

      <Tabs value="all" className="min-h-0 flex-1">
        <header className="flex h-11 shrink-0 items-center gap-2 border-b bg-muted/30 px-2 sm:pr-4 sm:pl-7">
          <TabsList
            height="full"
            className="min-w-0 justify-start overflow-x-auto overflow-y-hidden sm:ml-5 [&_[data-slot=tabs-trigger]]:after:bottom-0"
          >
            <TabsTrigger value="all">
              <Wallet />
              All funds
            </TabsTrigger>
          </TabsList>
        </header>

        <TabsContent value="all" className="flex h-full flex-col">
          <LedgerHeaderStrip>
            <div>Fund</div>
            <div className="flex-1" />
            <div className="w-32 text-right">Balance</div>
          </LedgerHeaderStrip>

          <FundsTable />
        </TabsContent>
      </Tabs>
    </SidebarInset>
  );
}

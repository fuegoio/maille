import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Plus, Wallet } from "lucide-react";
import z from "zod";

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
import { CustomViewActions } from "@/components/views/custom-view-actions";
import { useViewMutations } from "@/components/views/view-mutations";
import {
  CustomViewTabs,
  CustomViewTabsContent,
  useSelectedView,
} from "@/components/views/view-tabs";

const searchParamsSchema = z.object({
  /** "all", or a custom view's id. */
  view: z.string().optional(),
});

export const Route = createFileRoute("/_authenticated/funds/")({
  component: FundsPage,
  validateSearch: searchParamsSchema,
});

/** The scope this page's custom views attach to. */
const viewScope = { kind: "page", page: "funds" } as const;

function FundsPage() {
  const navigate = useNavigate();
  const { view } = Route.useSearch();
  const selectedTab = view ?? "all";
  const selectedCustomView = useSelectedView(viewScope, selectedTab);
  const { updateViewConfig } = useViewMutations();

  const breadcrumbs = usePageBreadcrumbs({
    contextual: false,
    routeKey: "/funds",
    entries: [{ key: "funds", label: "Funds", target: { to: "/funds" } }],
  });

  const selectTab = (value: string) => {
    navigate({
      to: ".",
      search: (prev) => ({
        ...prev,
        view: value === "all" ? undefined : value,
      }),
    });
  };

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

      <Tabs
        value={selectedTab}
        onValueChange={selectTab}
        className="min-h-0 flex-1"
      >
        <header className="flex h-11 shrink-0 items-center gap-2 border-b bg-muted/30 px-2 sm:pr-4 sm:pl-7">
          <TabsList
            height="full"
            className="min-w-0 justify-start overflow-x-auto overflow-y-hidden sm:ml-5 [&_[data-slot=tabs-trigger]]:after:bottom-0"
          >
            <TabsTrigger value="all">
              <Wallet />
              All funds
            </TabsTrigger>
            <CustomViewTabs scope={viewScope} onSelect={selectTab} />
          </TabsList>
          <div className="flex-1" />
          {selectedCustomView !== null && (
            <CustomViewActions
              view={selectedCustomView}
              onConfigChange={(config) =>
                updateViewConfig(selectedCustomView, config)
              }
            />
          )}
        </header>

        <TabsContent value="all" className="flex h-full flex-col">
          <LedgerHeaderStrip>
            <div>Fund</div>
            <div className="flex-1" />
            <div className="w-32 text-right">Balance</div>
          </LedgerHeaderStrip>

          <FundsTable />
        </TabsContent>

        <CustomViewTabsContent scope={viewScope} />
      </Tabs>
    </SidebarInset>
  );
}

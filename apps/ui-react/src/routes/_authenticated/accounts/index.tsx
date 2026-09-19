import { createFileRoute } from "@tanstack/react-router";
import { Plus } from "lucide-react";

import { AccountsTable } from "@/components/accounts/accounts-table";
import { CreateAccountDialog } from "@/components/accounts/create-account-dialog";
import {
  PageBreadcrumbs,
  usePageBreadcrumbs,
} from "@/components/navigation/breadcrumbs";
import { LedgerHeaderStrip, PageBar } from "@/components/shared/page-bars";
import { Button } from "@/components/ui/button";
import { SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";

export const Route = createFileRoute("/_authenticated/accounts/")({
  component: AccountsPage,
});

function AccountsPage() {
  const breadcrumbs = usePageBreadcrumbs({
    contextual: false,
    routeKey: "/accounts",
    entries: [
      { key: "accounts", label: "Accounts", target: { to: "/accounts" } },
    ],
  });

  return (
    <SidebarInset>
      <PageBar>
        <SidebarTrigger className="mr-1" />
        <PageBreadcrumbs entries={breadcrumbs} />
        <div className="flex-1" />
        <CreateAccountDialog>
          <Button
            aria-label="Create account"
            className="w-8 px-0 sm:w-auto sm:px-2.5"
          >
            <Plus />
            <span className="hidden sm:inline">Create account</span>
          </Button>
        </CreateAccountDialog>
      </PageBar>

      <LedgerHeaderStrip>
        <div>Account</div>
        <div className="flex-1" />
        <div className="text-right">Transactions</div>
        <div className="w-32 text-right">Balance</div>
      </LedgerHeaderStrip>

      <AccountsTable />
    </SidebarInset>
  );
}

import { createFileRoute } from "@tanstack/react-router";
import { Plus } from "lucide-react";

import { AccountsTable } from "@/components/accounts/accounts-table";
import { CreateAccountDialog } from "@/components/accounts/create-account-dialog";
import {
  PageBreadcrumbs,
  usePageBreadcrumbs,
} from "@/components/navigation/breadcrumbs";
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
      <header className="flex h-12 shrink-0 items-center gap-2 border-b pr-4 pl-4">
        <SidebarTrigger className="mr-1" />
        <PageBreadcrumbs entries={breadcrumbs} />
        <div className="flex-1" />
        <CreateAccountDialog>
          <Button variant="default" aria-label="Create account">
            <Plus />
            <span className="hidden sm:inline">Create account</span>
          </Button>
        </CreateAccountDialog>
      </header>

      <AccountsTable />
    </SidebarInset>
  );
}

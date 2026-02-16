import { createFileRoute } from "@tanstack/react-router";
import { Plus } from "lucide-react";

import { AccountsTable } from "@/components/accounts/accounts-table";
import { Button } from "@/components/ui/button";
import { SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";

export const Route = createFileRoute("/_authenticated/_workspace/accounts/")({
  component: AccountsPage,
});

function AccountsPage() {
  return (
    <SidebarInset>
      <header className="flex h-12 shrink-0 items-center gap-2 border-b pr-4 pl-4">
        <SidebarTrigger className="mr-1" />
        <div className="truncate font-medium">Accounts</div>
        <div className="flex-1" />
        <Button variant="default">
          <Plus />
          Create account
        </Button>
      </header>

      <div className="flex flex-1 flex-col">
        <AccountsTable />
      </div>
    </SidebarInset>
  );
}

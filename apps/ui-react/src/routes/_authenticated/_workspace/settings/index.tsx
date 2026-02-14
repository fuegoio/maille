import { AccountType } from "@maille/core/accounts";
import { createFileRoute } from "@tanstack/react-router";

import { AccountTypeSection } from "@/components/settings/account-type-section";
import { SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";

export const Route = createFileRoute("/_authenticated/_workspace/settings/")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <SidebarInset>
      <header className="flex h-12 shrink-0 items-center gap-2 border-b pr-2 pl-4">
        <SidebarTrigger className="mr-1" />
        <div className="truncate font-medium">Settings</div>
      </header>

      <div className="flex-1 overflow-auto px-2">
        <div className="border-b px-4 py-8">
          <div className="text-3xl font-medium text-foreground">Accounts</div>
          <div className="mt-3 text-sm text-foreground">
            Manage your different bank and virtual accounts.
          </div>

          <div className="mt-5 max-w-lg text-xs leading-normal text-muted-foreground">
            Accounts define from and to your money can come and go. They can
            represent bank accounts, investment supports, liabilities pockets,
            or anything that you want to analyse as an account.
          </div>
        </div>

        {[
          AccountType.BANK_ACCOUNT,
          AccountType.INVESTMENT_ACCOUNT,
          AccountType.CASH,
          AccountType.LIABILITIES,
          AccountType.EXPENSE,
          AccountType.REVENUE,
        ].map((accountType) => (
          <AccountTypeSection key={accountType} accountType={accountType} />
        ))}
      </div>
    </SidebarInset>
  );
}

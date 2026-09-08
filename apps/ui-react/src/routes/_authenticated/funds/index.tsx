import { createFileRoute } from "@tanstack/react-router";
import { Plus } from "lucide-react";

import { CreateFundDialog } from "@/components/funds/create-fund-dialog";
import { FundsTable } from "@/components/funds/funds-table";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";

export const Route = createFileRoute("/_authenticated/funds/")({
  component: FundsPage,
});

function FundsPage() {
  return (
    <SidebarInset>
      <header className="flex h-12 shrink-0 items-center gap-2 border-b pr-4 pl-4">
        <SidebarTrigger className="mr-1" />
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbPage>Funds</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        <div className="flex-1" />
        <CreateFundDialog>
          <Button>
            <Plus />
            <span>New fund</span>
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

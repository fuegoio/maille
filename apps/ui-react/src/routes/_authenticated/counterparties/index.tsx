import { createFileRoute } from "@tanstack/react-router";
import { Plus } from "lucide-react";

import { AddCounterpartyModal } from "@/components/counterparties/add-counterparty-modal";
import { CounterpartiesTable } from "@/components/counterparties/counterparties-table";
import { SearchBar } from "@/components/search-bar";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";

export const Route = createFileRoute("/_authenticated/counterparties/")({
  component: CounterpartiesPage,
});

function CounterpartiesPage() {
  return (
    <SidebarInset className="min-w-0 shrink">
      <header className="flex h-12 shrink-0 items-center gap-1 border-b pr-2 pl-3 sm:gap-2 sm:pl-4">
        <SidebarTrigger className="mr-1" />
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbPage>Counterparties</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        <div className="flex-1" />
        <SearchBar />
        <AddCounterpartyModal>
          <Button size="sm">
            <Plus />
            Add counterparty
          </Button>
        </AddCounterpartyModal>
      </header>

      <CounterpartiesTable grouping="account" />
    </SidebarInset>
  );
}

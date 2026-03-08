import { SearchBar } from "./search-bar";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
} from "./ui/breadcrumb";
import { Separator } from "./ui/separator";
import { SidebarTrigger } from "./ui/sidebar";

export function Header({
  title,
  searchBarEnabled = true,
  actionButton,
}: {
  title: string;
  searchBarEnabled?: boolean;
  actionButton?: React.ReactNode;
}) {
  return (
    <header className="flex h-12 shrink-0 items-center gap-2">
      <div className="flex items-center gap-2 px-4">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mr-2" />
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem className="hidden md:block">
              <BreadcrumbPage>{title}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>
      <div className="flex-1" />
      <div className="flex items-center gap-2 pr-4">
        {searchBarEnabled && <SearchBar />}
        {actionButton}
      </div>
    </header>
  );
}

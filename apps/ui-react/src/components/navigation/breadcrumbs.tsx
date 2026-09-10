import { Link, useRouter, useRouterState } from "@tanstack/react-router";
import { Fragment, useCallback, useEffect, type ComponentProps } from "react";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { cn } from "@/lib/utils";
import {
  captureBreadcrumbContext,
  commitBreadcrumbs,
  resolveBreadcrumbs,
  type BreadcrumbEntry,
  type BreadcrumbsPage,
} from "@/stores/breadcrumbs";

interface RouterStateWithKey {
  key?: string;
  __TSR_key?: string;
}

function useBreadcrumbEntryKey(): string | undefined {
  return useRouterState({
    select: ({ location }) =>
      (location.state as RouterStateWithKey | undefined)?.key ??
      (location.state as RouterStateWithKey | undefined)?.__TSR_key,
  });
}

/**
 * Declare a page's breadcrumb trail and resolve it against the client
 * navigation state. Returns the entries to render with `PageBreadcrumbs`.
 *
 * For contextual pages (`contextual: true`), the trail is the context
 * captured when the page was opened plus the page's own entry — e.g. a
 * movement opened from an account's movements tab shows
 * "Accounts > Account name > Movements > Movement name", with every crumb
 * navigating back to where it came from.
 */
export function usePageBreadcrumbs(page: BreadcrumbsPage): BreadcrumbEntry[] {
  const entryKey = useBreadcrumbEntryKey();
  const { entries } = resolveBreadcrumbs(page, entryKey);

  useEffect(() => {
    // The page object is rebuilt each render; committing keeps the stored
    // trail (used as context by outgoing ContextLinks) up to date. Nothing
    // subscribes to the store's trail, so this cannot cause render loops.
    commitBreadcrumbs(page, entryKey);
  });

  return entries;
}

/** Renders the trail declared by `usePageBreadcrumbs`. */
export function PageBreadcrumbs({
  entries,
  className,
}: {
  entries: BreadcrumbEntry[];
  className?: string;
}) {
  if (entries.length === 0) {
    return null;
  }

  return (
    <Breadcrumb className={cn("min-w-0", className)}>
      <BreadcrumbList>
        {entries.map((entry, index) => {
          const isCurrent = index === entries.length - 1;
          return (
            <Fragment key={entry.key}>
              {index > 0 && <BreadcrumbSeparator className="shrink-0" />}
              <BreadcrumbItem className={isCurrent ? "min-w-0" : "shrink-0"}>
                {!isCurrent && entry.target ? (
                  <BreadcrumbLink asChild>
                    <Link
                      to={entry.target.to as never}
                      params={entry.target.params as never}
                      search={entry.target.search as never}
                    >
                      {entry.label}
                    </Link>
                  </BreadcrumbLink>
                ) : (
                  <BreadcrumbPage className="truncate" title={entry.title}>
                    {entry.label}
                  </BreadcrumbPage>
                )}
              </BreadcrumbItem>
            </Fragment>
          );
        })}
      </BreadcrumbList>
    </Breadcrumb>
  );
}

type LooseLinkProps = Omit<ComponentProps<typeof Link>, "params" | "search"> & {
  params?: Record<string, unknown>;
  search?: Record<string, unknown>;
};

/**
 * A `Link` that carries the current breadcrumb trail to the target page, so
 * it renders within the same context ("Account > Name > Movements > ...")
 * instead of its default chain.
 */
export function ContextLink(props: LooseLinkProps) {
  const { onClick } = props;
  return (
    <Link
      {...props}
      params={props.params as never}
      search={props.search as never}
      onClick={(event) => {
        onClick?.(event);
        if (
          !event.defaultPrevented &&
          event.button === 0 &&
          !event.metaKey &&
          !event.ctrlKey &&
          !event.shiftKey &&
          !event.altKey &&
          typeof props.to === "string"
        ) {
          captureBreadcrumbContext(props.to);
        }
      }}
    />
  );
}

/** Programmatic counterpart of `ContextLink`. */
export function useContextNavigate() {
  const router = useRouter();
  return useCallback(
    (
      options: Omit<
        Parameters<typeof router.navigate>[0],
        "params" | "search"
      > & {
        params?: Record<string, unknown>;
        search?: Record<string, unknown>;
      },
    ) => {
      if (typeof options.to === "string") {
        captureBreadcrumbContext(options.to);
      }
      return router.navigate(options as Parameters<typeof router.navigate>[0]);
    },
    [router],
  );
}

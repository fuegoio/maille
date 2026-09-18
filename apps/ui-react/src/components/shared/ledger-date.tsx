import { format } from "date-fns";

/** Full dates keep non-calendar groups readable across months and years. */
export function LedgerDate({
  date,
  full = false,
}: {
  date: Date;
  full?: boolean;
}) {
  const dateTime = format(date, "yyyy-MM-dd");
  const title = date.toLocaleDateString(undefined, { dateStyle: "long" });
  if (full) {
    return (
      <time
        dateTime={dateTime}
        title={title}
        className="mx-1 w-24 shrink-0 text-xs whitespace-nowrap text-muted-foreground"
      >
        {format(date, "dd MMM yyyy")}
      </time>
    );
  }
  return (
    <>
      <time
        dateTime={dateTime}
        title={title}
        className="mx-1 hidden w-12 shrink-0 whitespace-nowrap text-muted-foreground lg:block"
      >
        {format(date, "dd EEE")}
      </time>
      <time
        dateTime={dateTime}
        title={title}
        className="ml-1 w-8 shrink-0 whitespace-nowrap text-muted-foreground lg:hidden"
      >
        {format(date, "dd EEEEE")}
      </time>
    </>
  );
}

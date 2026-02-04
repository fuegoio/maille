import * as React from "react";
import { AccountLabel } from "@/components/accounts/account-label";
import { getCurrencyFormatter } from "@/lib/utils";
import type { Liability } from "@maille/core/liabilities";

interface LiabilityLineProps {
  liability: Liability;
  className?: string;
  onClick?: () => void;
}

export function LiabilityLine({ liability, className, onClick }: LiabilityLineProps) {
  const currencyFormatter = getCurrencyFormatter();

  const handleClick = () => {
    if (onClick) {
      onClick();
    }
  };

  const formattedDate = React.useMemo(() => {
    return liability.date.toLocaleDateString(undefined, {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  }, [liability.date]);

  const formattedDateMobile = React.useMemo(() => {
    return liability.date.toLocaleDateString(undefined, {
      day: "2-digit",
      month: "2-digit",
    });
  }, [liability.date]);

  return (
    <div
      className={`h-10 flex items-center gap-2 pr-2 sm:pr-6 border-b text-sm flex-shrink-0 transition-colors hover:bg-primary-800/20 pl-4 sm:pl-2 ${className || ""}`}
      onClick={handleClick}
    >
      <div className="hidden sm:block text-primary-100 w-20 shrink-0 ml-4">
        {formattedDate}
      </div>
      <div className="sm:hidden text-primary-100 w-10 shrink-0">
        {formattedDateMobile}
      </div>

      <AccountLabel accountId={liability.account} />

      <div className="ml-1 text-primary-100 text-ellipsis overflow-hidden whitespace-nowrap">
        {liability.name}
      </div>

      <div className="flex-1" />
      <div className="text-white text-right whitespace-nowrap font-mono">
        {currencyFormatter.format(liability.amount)}
      </div>
    </div>
  );
}
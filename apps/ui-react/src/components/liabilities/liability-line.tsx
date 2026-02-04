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
      className={`hover:bg-primary-800/20 flex h-10 flex-shrink-0 items-center gap-2 border-b pr-2 pl-4 text-sm transition-colors sm:pr-6 sm:pl-2 ${className || ""}`}
      onClick={handleClick}
    >
      <div className="text-primary-100 ml-4 hidden w-20 shrink-0 sm:block">{formattedDate}</div>
      <div className="text-primary-100 w-10 shrink-0 sm:hidden">{formattedDateMobile}</div>

      <AccountLabel accountId={liability.account} />

      <div className="text-primary-100 ml-1 overflow-hidden text-ellipsis whitespace-nowrap">
        {liability.name}
      </div>

      <div className="flex-1" />
      <div className="text-right font-mono whitespace-nowrap text-white">
        {currencyFormatter.format(liability.amount)}
      </div>
    </div>
  );
}

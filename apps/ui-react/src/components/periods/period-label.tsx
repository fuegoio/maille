import { usePeriodsStore } from "@/stores/periods";
import type { Period } from "@/types/periods";
import { useMemo } from "react";

interface PeriodLabelProps {
  period: Period;
}

export function PeriodLabel({ period }: PeriodLabelProps) {
  const { getPeriodLabel } = usePeriodsStore();

  const label = useMemo(() => {
    return getPeriodLabel(period);
  }, [period, getPeriodLabel]);

  const chipClass = useMemo(() => {
    if (label === "Completed") {
      return "bg-primary-100 text-primary-600 border";
    } else if (label === "Current") {
      return "bg-primary-400 text-white";
    }
    return "bg-primary-100 text-primary-300 border";
  }, [label]);

  return <span className={`rounded px-2.5 py-1 text-xs ${chipClass}`}>{label}</span>;
}

import { useState, useMemo } from "react";
import { useRouter, useParams } from "@tanstack/react-router";
import { usePeriodsStore } from "@/stores/periods";
import { PeriodLabel } from "./period-label";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { CalendarClock, CalendarCheck, CalendarArrowRight } from "lucide-react";
import type { Period } from "@/types/periods";

interface PeriodsMenuProps {
  className?: string;
}

export function PeriodsMenu({ className }: PeriodsMenuProps) {
  const router = useRouter();
  const params = useParams();
  const { periodsAvailable, getPeriodLabel } = usePeriodsStore();
  const [open, setOpen] = useState(false);

  const period = params.period as string;

  const periodDate = useMemo(() => {
    let periodDate: Date;
    if (period === "current") periodDate = new Date();
    else if (period === "past") {
      periodDate = new Date();
      periodDate.setMonth(periodDate.getMonth() - 1);
    } else periodDate = new Date(period);

    return periodDate;
  }, [period]);

  const periodDateString = useMemo(() => {
    return `${periodDate.getFullYear()}-${String(periodDate.getMonth() + 1).padStart(2, '0')}`;
  }, [periodDate]);

  const periodDateLabel = useMemo(() => {
    return getPeriodLabel({
      month: periodDate.getMonth(),
      year: periodDate.getFullYear(),
    });
  }, [periodDate, getPeriodLabel]);

  const periodsList = useMemo<(Period & { label: string; date: Date })[]>(() => {
    return periodsAvailable
      .sort((a, b) => b.year - a.year || b.month - a.month)
      .filter((p, i, arr) => {
        const label = getPeriodLabel(p);
        if (label === "Current" || label === "Completed") return true;

        if (arr[i + 1]) {
          return getPeriodLabel(arr[i + 1]) === "Current";
        } else {
          return true;
        }
      })
      .map((p) => {
        return {
          ...p,
          label: getPeriodLabel(p),
          date: new Date(p.year, p.month, 1),
        };
      });
  }, [periodsAvailable, getPeriodLabel]);

  const handleInput = (newDate: string) => {
    router.push(`/${newDate}`);
    setOpen(false);
  };

  const getPeriodIcon = (label: string) => {
    switch (label) {
      case "Current":
        return <CalendarClock className="text-primary-100 text-xl mr-3 mt-1" />;
      case "Completed":
        return <CalendarCheck className="text-primary-100 text-xl mr-3 mt-1" />;
      case "Future":
        return <CalendarArrowRight className="text-primary-100 text-xl mr-3 mt-1" />;
      default:
        return <CalendarClock className="text-primary-100 text-xl mr-3 mt-1" />;
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          className={`relative rounded px-3 text-left h-8 hover:bg-primary-700 flex items-center mx-2 ${className || ''}`}
        >
          {getPeriodIcon(periodDateLabel)}
          <span className="text-white text-sm truncate font-semibold">
            {periodDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
          </span>
        </Button>
      </PopoverTrigger>

      <PopoverContent
        className="w-80 z-50 max-h-60 overflow-auto rounded-md bg-primary-700 py-1 shadow-lg border focus:outline-none text-sm"
        align="start"
      >
        {periodsList.map((periodItem, index) => {
          const isSelected = 
            periodItem.date.getMonth() === periodDate.getMonth() &&
            periodItem.date.getFullYear() === periodDate.getFullYear();

          return (
            <div
              key={index}
              className={`relative select-none py-2 px-4 flex items-center cursor-pointer ${
                isSelected
                  ? 'bg-primary-400 text-white'
                  : 'text-primary-100 hover:bg-primary-600'
              }`}
              onClick={() => handleInput(`${periodItem.date.getFullYear()}-${String(periodItem.date.getMonth() + 1).padStart(2, '0')}`)}
            >
              {getPeriodIcon(periodItem.label)}

              <span
                className={`${
                  isSelected ? 'font-medium' : 'font-normal'
                } block truncate`}
              >
                {periodItem.date.toLocaleString('default', { month: 'long', year: 'numeric' })}
              </span>
              <div className="flex-1" />

              <PeriodLabel period={periodItem} />
            </div>
          );
        })}
      </PopoverContent>
    </Popover>
  );
}
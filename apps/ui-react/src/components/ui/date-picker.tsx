import { format } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";
import type { PropsSingle } from "react-day-picker";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

interface DatePickerProps {
  value: Date;
  onChange: (date: Date | undefined) => void;
  className?: string;
}

export function DatePicker({
  value,
  onChange,
  className,
  ...props
}: Omit<PropsSingle, "mode"> & DatePickerProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant={"outline"}
          className={cn(
            "justify-start text-left font-normal",
            !value && "text-muted-foreground",
            className,
          )}
        >
          <CalendarIcon className="h-4 w-4" />
          {value ? format(value, "PPP") : <span>Pick a date</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0">
        <Calendar
          mode="single"
          selected={value}
          onSelect={onChange}
          {...props}
        />
      </PopoverContent>
    </Popover>
  );
}

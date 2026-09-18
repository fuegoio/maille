import type { TransactionFilter } from "@maille/core/views";

import {
  ArrowDownUp,
  Calendar,
  CircleDotDashed,
  DollarSign,
  type LucideIcon,
} from "lucide-react";

export const TransactionFilterIcons: Record<
  TransactionFilter["field"],
  LucideIcon
> = {
  date: Calendar,
  amount: DollarSign,
  direction: ArrowDownUp,
  status: CircleDotDashed,
};

import type { MovementFilter } from "@maille/core/movements";
import {
  Calendar,
  DollarSign,
  Folder,
  TextCursor,
  type LucideIcon,
} from "lucide-react";

export const MovementFilterIcons: Record<MovementFilter["field"], LucideIcon> =
  {
    name: TextCursor,
    date: Calendar,
    amount: DollarSign,
    account: Folder,
    status: Folder,
  };
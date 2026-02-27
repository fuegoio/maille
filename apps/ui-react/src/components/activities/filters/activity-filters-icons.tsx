import type { ActivityFilter } from "@maille/core/activities";
import {
  ArrowRightLeft,
  Calendar,
  DollarSign,
  Folder,
  Tag,
  TextCursor,
  TextSelect,
  type LucideIcon,
} from "lucide-react";

export const ActivityFilterIcons: Record<ActivityFilter["field"], LucideIcon> =
  {
    name: TextCursor,
    description: TextSelect,
    date: Calendar,
    amount: DollarSign,
    type: ArrowRightLeft,
    category: Tag,
    subcategory: Tag,
    from_account: Folder,
    to_account: Folder,
  };

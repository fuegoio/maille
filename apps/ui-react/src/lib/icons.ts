import {
  ArrowRightLeft,
  BookMarked,
  CircleDashed,
  CreditCard,
  Landmark,
  Layers,
  Tag,
  Tags,
  TentTree,
  Wallet,
} from "lucide-react";

/**
 * One icon per concept, defined once so that changing what a concept
 * looks like is a single edit. Components render these instead of
 * importing lucide directly.
 */
export const ActivityIcon = BookMarked;
export const MovementIcon = CreditCard;
export const TransactionIcon = ArrowRightLeft;
export const AccountIcon = Landmark;
export const FundIcon = Wallet;
export const CategoryIcon = Tag;
export const SubcategoryIcon = Tags;
export const ProjectIcon = TentTree;
export const UntrackedIcon = CircleDashed;
export const MixedFundsIcon = Layers;

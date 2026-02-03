import { add, isAfter, isBefore, isEqual, startOfDay, sub } from "date-fns";
import {
  OperatorsWithoutValue,
  type Activity,
  type ActivityFilter,
} from "./types.js";

const hasValue = (
  filter: ActivityFilter,
): filter is ActivityFilter & {
  operator: Exclude<
    (typeof filter)["operator"],
    (typeof OperatorsWithoutValue)[number]
  >;
  value: NonNullable<(typeof filter)["value"]>;
} => {
  return (
    filter.value !== undefined ||
    OperatorsWithoutValue.includes(filter.operator as any)
  );
};

export const verifyActivityFilter = (
  filter: ActivityFilter,
  activity: Activity,
): boolean => {
  if (filter.operator === undefined) return true;
  else if (!hasValue(filter)) return true;

  if (filter.field === "date") {
    let comparator = startOfDay(new Date());
    if ((filter.value as string).includes("ago")) {
      const [number, period] = (filter.value as string).split(" ");
      // @ts-ignore
      comparator = sub(comparator, { [period]: parseInt(number!) });
    } else if ((filter.value as string).includes("from now")) {
      const [number, period] = (filter.value as string).split(" ");
      // @ts-ignore
      comparator = add(comparator, { [period]: parseInt(number!) });
    }

    if (filter.operator === "before") {
      return (
        isBefore(activity.date, comparator) ||
        isEqual(activity.date, comparator)
      );
    } else if (filter.operator === "after") {
      return (
        isAfter(activity.date, comparator) || isEqual(activity.date, comparator)
      );
    } else {
      throw Error("operator not valid");
    }
  } else if (filter.field === "amount") {
    if (filter.operator === "less") return activity.amount < filter.value;
    else if (filter.operator === "less or equal")
      return activity.amount <= filter.value;
    else if (filter.operator === "equal")
      return activity.amount === filter.value;
    else if (filter.operator === "not equal")
      return activity.amount !== filter.value;
    else if (filter.operator === "greater or equal")
      return activity.amount >= filter.value;
    else if (filter.operator === "greater")
      return activity.amount > filter.value;
    else throw Error("operator not valid");
  } else if (filter.field === "name" || filter.field === "description") {
    const value = activity[filter.field];
    if (filter.operator === "is")
      return value?.toLowerCase() === filter.value.toLowerCase();
    else if (filter.operator === "is not")
      return value?.toLowerCase() !== filter.value.toLowerCase();
    else if (filter.operator === "contains")
      return !!value?.toLowerCase().includes(filter.value.toLowerCase());
    else if (filter.operator === "does not contain")
      return !value?.toLowerCase().includes(filter.value.toLowerCase());
    else throw Error("operator not valid");
  } else if (filter.field === "type") {
    if (filter.operator === "is any of")
      return filter.value.includes(activity.type);
    else if (filter.operator === "is not")
      return !filter.value.includes(activity.type);
    else throw Error("operator not valid");
  } else if (filter.field === "category" || filter.field === "subcategory") {
    const value = activity[filter.field];
    if (filter.operator === "is any of") {
      if (value === null) return false;
      return filter.value.includes(value);
    } else if (filter.operator === "is not") {
      if (value === null) return false;
      return !filter.value.includes(value);
    } else if (filter.operator === "is defined") {
      return value !== null;
    } else if (filter.operator === "is not defined") {
      return value === null;
    } else throw Error("operator not valid");
  } else if (filter.field === "from_account") {
    if (filter.operator === "is any of") {
      return activity.transactions.some(
        (t) => t.fromAccount !== null && filter.value.includes(t.fromAccount),
      );
    } else if (filter.operator === "is not") {
      return activity.transactions.every(
        (t) => t.fromAccount === null || !filter.value.includes(t.fromAccount),
      );
    } else throw Error("operator not valid");
  } else if (filter.field === "to_account") {
    if (filter.operator === "is any of") {
      return activity.transactions.some(
        (t) => t.toAccount !== null && filter.value.includes(t.toAccount),
      );
    } else if (filter.operator === "is not") {
      return activity.transactions.every(
        (t) => t.toAccount === null || !filter.value.includes(t.toAccount),
      );
    } else throw Error("operator not valid");
  } else {
    throw Error("field not valid");
  }
};

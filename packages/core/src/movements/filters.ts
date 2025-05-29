import dayjs, { type ManipulateType } from "dayjs";

import { type Movement, type MovementFilter } from "./types.js";

const hasValue = (
  filter: MovementFilter,
): filter is MovementFilter & {
  operator: (typeof filter)["operator"];
  value: NonNullable<(typeof filter)["value"]>;
} => {
  return filter.value !== undefined;
};

export const verifyMovementFilter = (
  filter: MovementFilter,
  movement: Movement,
): boolean => {
  if (filter.operator === undefined) return true;
  else if (!hasValue(filter)) return true;

  if (filter.field === "date") {
    let comparator = dayjs().startOf("day");
    if ((filter.value as string).includes("ago")) {
      const [number, period] = (filter.value as string).split(" ");
      comparator = comparator.subtract(
        parseInt(number!),
        period as ManipulateType,
      );
    } else if ((filter.value as string).includes("from now")) {
      const [number, period] = (filter.value as string).split(" ");
      comparator = comparator.add(parseInt(number!), period as ManipulateType);
    }

    if (filter.operator === "before") {
      return (
        movement.date.isBefore(comparator, "day") ||
        movement.date.isSame(comparator, "day")
      );
    } else if (filter.operator === "after") {
      return (
        movement.date.isAfter(comparator, "day") ||
        movement.date.isSame(comparator, "day")
      );
    } else {
      throw Error("operator not valid");
    }
  } else if (filter.field === "amount") {
    if (filter.operator === "less") return movement.amount < filter.value;
    else if (filter.operator === "less or equal")
      return movement.amount <= filter.value;
    else if (filter.operator === "equal")
      return movement.amount === filter.value;
    else if (filter.operator === "not equal")
      return movement.amount !== filter.value;
    else if (filter.operator === "greater or equal")
      return movement.amount >= filter.value;
    else if (filter.operator === "greater")
      return movement.amount > filter.value;
    else throw Error("operator not valid");
  } else if (filter.field === "name") {
    const value = movement[filter.field];
    if (filter.operator === "is")
      return value?.toLowerCase() === filter.value.toLowerCase();
    else if (filter.operator === "is not")
      return value?.toLowerCase() !== filter.value.toLowerCase();
    else if (filter.operator === "contains")
      return !!value?.toLowerCase().includes(filter.value.toLowerCase());
    else if (filter.operator === "does not contain")
      return !value?.toLowerCase().includes(filter.value.toLowerCase());
    else throw Error("operator not valid");
  } else if (filter.field === "account") {
    if (filter.operator === "is any of") {
      return filter.value.includes(movement.account);
    } else if (filter.operator === "is not") {
      return !filter.value.includes(movement.account);
    } else throw Error("operator not valid");
  } else if (filter.field === "status") {
    if (filter.operator === "is any of") {
      return filter.value.includes(movement.status);
    } else if (filter.operator === "is not") {
      return !filter.value.includes(movement.status);
    } else throw Error("operator not valid");
  } else {
    throw Error("field not valid");
  }
};
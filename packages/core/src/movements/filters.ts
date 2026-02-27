import { type Movement, type MovementFilter } from "./types";
import { add, isAfter, isBefore, isEqual, startOfDay, sub } from "date-fns";

const hasValue = (
  filter: MovementFilter,
): filter is MovementFilter & {
  operator: (typeof filter)["operator"];
  value: NonNullable<(typeof filter)["value"]>;
} => {
  return filter.value !== undefined;
};

export const verifyMovementFilter = (filter: MovementFilter, movement: Movement): boolean => {
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
      return isBefore(movement.date, comparator) || isEqual(movement.date, comparator);
    } else if (filter.operator === "after") {
      return isAfter(movement.date, comparator) || isEqual(movement.date, comparator);
    } else {
      throw Error("operator not valid");
    }
  } else if (filter.field === "amount") {
    if (filter.operator === "less") return movement.amount < filter.value;
    else if (filter.operator === "less or equal") return movement.amount <= filter.value;
    else if (filter.operator === "equal") return movement.amount === filter.value;
    else if (filter.operator === "not equal") return movement.amount !== filter.value;
    else if (filter.operator === "greater or equal") return movement.amount >= filter.value;
    else if (filter.operator === "greater") return movement.amount > filter.value;
    else throw Error("operator not valid");
  } else if (filter.field === "name") {
    const value = movement[filter.field];
    if (filter.operator === "is") return value?.toLowerCase() === filter.value.toLowerCase();
    else if (filter.operator === "is not")
      return value?.toLowerCase() !== filter.value.toLowerCase();
    else if (filter.operator === "contains")
      return !!value?.toLowerCase().includes(filter.value.toLowerCase());
    else if (filter.operator === "does not contain")
      return !value?.toLowerCase().includes(filter.value.toLowerCase());
    else throw Error("operator not valid");
  } else if (filter.field === "account") {
    if (filter.operator === "is any of") {
      if (filter.value.length === 0) return true;
      return filter.value.includes(movement.account);
    } else if (filter.operator === "is not") {
      if (filter.value.length === 0) return true;
      return !filter.value.includes(movement.account);
    } else throw Error("operator not valid");
  } else if (filter.field === "status") {
    if (filter.operator === "is any of") {
      if (filter.value.length === 0) return true;
      return filter.value.includes(movement.status);
    } else if (filter.operator === "is not") {
      if (filter.value.length === 0) return true;
      return !filter.value.includes(movement.status);
    } else throw Error("operator not valid");
  } else {
    throw Error("field not valid");
  }
};

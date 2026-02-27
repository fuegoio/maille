import {
  ActivityFilterFields,
  OperatorsWithoutValue,
  type ActivityFilter,
} from "@maille/core/activities";
import { X } from "lucide-react";
import { useEffect, useRef } from "react";

import { Button } from "@/components/ui/button";

import { ActivityFilterOperatorMenu } from "./activity-filter-operator-menu";
import { ActivityFilterValueMenu } from "./activity-filter-value-menu";
import { ActivityFilterIcons } from "./activity-filters-icons";

interface ActivityFilterProps {
  modelValue: ActivityFilter;
  onUpdateModelValue: (value: ActivityFilter) => void;
  onDelete: () => void;
}

export function ActivityFilter({
  modelValue,
  onUpdateModelValue,
  onDelete,
}: ActivityFilterProps) {
  const operatorMenuRef = useRef<{ click: () => void }>(null);
  const valueMenuRef = useRef<{ click: () => void }>(null);

  useEffect(() => {
    if (modelValue.operator === undefined) {
      operatorMenuRef.current?.click();
    } else if (modelValue.value === undefined) {
      if (valueMenuRef.current) {
        valueMenuRef.current.click();
      }
    }
  }, [modelValue]);

  useEffect(() => {
    if (modelValue.operator !== undefined && modelValue.value === undefined) {
      setTimeout(() => {
        if (valueMenuRef.current) {
          valueMenuRef.current.click();
        }
      }, 0);
    }
  }, [modelValue.operator, modelValue.value]);

  const activityFilterField = ActivityFilterFields.find(
    (aff) => aff.value === modelValue.field,
  );

  if (!activityFilterField) return null;

  const showValueMenu =
    modelValue.operator !== undefined &&
    !OperatorsWithoutValue.includes(modelValue.operator as any);

  const Icon = ActivityFilterIcons[activityFilterField.value];

  return (
    <div className="flex h-6 w-fit max-w-full items-center overflow-hidden rounded border border-input">
      <div className="flex h-7 items-center border-r border-input bg-input/30 px-2 text-xs">
        <Icon className="mr-1 size-3" />
        {activityFilterField.text}
      </div>

      <ActivityFilterOperatorMenu
        ref={operatorMenuRef}
        modelValue={modelValue.operator}
        field={modelValue.field}
        onUpdateModelValue={(operator) => {
          onUpdateModelValue({ ...modelValue, operator } as ActivityFilter);
        }}
      />

      {showValueMenu && (
        <ActivityFilterValueMenu
          ref={valueMenuRef}
          modelValue={modelValue.value}
          field={modelValue.field}
          onUpdateModelValue={(value) => {
            onUpdateModelValue({ ...modelValue, value } as ActivityFilter);
          }}
        />
      )}

      <Button
        onClick={onDelete}
        aria-label="Delete filter"
        variant="ghost"
        size="icon"
        className="size-6 rounded-none border-r-0 border-l-0 bg-input/30 hover:bg-input/50"
      >
        <X className="size-3.5" />
      </Button>
    </div>
  );
}

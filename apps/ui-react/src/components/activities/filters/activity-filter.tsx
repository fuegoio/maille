import { useEffect, useRef } from "react";
import {
  ActivityFilterFields,
  OperatorsWithoutValue,
  type ActivityFilter,
} from "@maille/core/activities";
import { X } from "lucide-react";
import { ActivityFilterOperatorMenu } from "./activity-filter-operator-menu";
import { ActivityFilterValueMenu } from "./activity-filter-value-menu";

interface ActivityFilterProps {
  modelValue: ActivityFilter;
  onUpdateModelValue: (value: ActivityFilter) => void;
  onDelete: () => void;
}

export function ActivityFilter({ modelValue, onUpdateModelValue, onDelete }: ActivityFilterProps) {
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
  }, [modelValue.operator]);

  const handleCloseOperator = () => {
    if (modelValue.operator === undefined) {
      onDelete();
    }
  };

  const handleCloseValue = () => {
    if (
      modelValue.value === undefined ||
      (Array.isArray(modelValue.value) && modelValue.value.length === 0)
    ) {
      onDelete();
    }
  };

  const activityFilterField = ActivityFilterFields.find((aff) => aff.value === modelValue.field);

  if (!activityFilterField) return null;

  const showValueMenu =
    modelValue.operator !== undefined &&
    !OperatorsWithoutValue.includes(modelValue.operator as any);

  return (
    <div className="bg-primary-800 flex h-7 w-fit max-w-full items-center overflow-hidden rounded border">
      <div className="flex h-7 items-center border-r px-2 text-sm font-medium text-white">
        <i className={`mdi mt-0.5 ${activityFilterField.icon}`} aria-hidden="true" />
        <span className="mr-1 ml-2">{activityFilterField.text}</span>
      </div>

      <ActivityFilterOperatorMenu
        ref={operatorMenuRef}
        modelValue={modelValue.operator}
        field={modelValue.field}
        onUpdateModelValue={(operator: any) => {
          onUpdateModelValue({ ...modelValue, operator });
        }}
        onClose={handleCloseOperator}
      />

      {showValueMenu && (
        <ActivityFilterValueMenu
          ref={valueMenuRef}
          modelValue={modelValue.value}
          field={modelValue.field}
          onUpdateModelValue={(value: any) => {
            onUpdateModelValue({ ...modelValue, value });
          }}
          onClose={handleCloseValue}
        />
      )}

      <button
        className="text-md hover:bg-primary-700 flex h-7 w-7 shrink-0 items-center justify-center transition-colors hover:text-white"
        onClick={onDelete}
        aria-label="Delete filter"
      >
        <X className="mt-0.5 size-4" />
      </button>
    </div>
  );
}

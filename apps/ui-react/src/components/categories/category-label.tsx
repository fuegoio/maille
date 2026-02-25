import { useActivities, ACTIVITY_TYPES_COLOR } from "@/stores/activities";

export function CategoryLabel({ categoryId }: { categoryId: string }) {
  const category = useActivities((state) =>
    state.getActivityCategoryById(categoryId),
  );

  if (!category) {
    return (
      <div className="text-sm font-medium text-destructive">
        Unknown Category
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <div
        className={`mr-1 h-3 w-3 shrink-0 rounded-xl ${ACTIVITY_TYPES_COLOR[category.type]}`}
      />
      {category.emoji && <span className="text-xl">{category.emoji}</span>}
      <div className="text-sm font-medium">{category.name}</div>
    </div>
  );
}


import { useActivities } from "@/stores/activities";

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
      {category.emoji && <span className="text-sm">{category.emoji}</span>}
      <div className="text-sm font-medium">{category.name}</div>
    </div>
  );
}

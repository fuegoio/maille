import type { ActivityType } from "@maille/core/activities";
import { Plus, ChevronUp, ChevronDown, Trash2 } from "lucide-react";
import { useState, useMemo } from "react";
import { useStore } from "zustand";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  createActivityCategoryMutation,
  createActivitySubCategoryMutation,
  deleteActivityCategoryMutation,
  deleteActivitySubCategoryMutation,
} from "@/mutations/activities";
import { activitiesStore } from "@/stores/activities";
import { syncStore } from "@/stores/sync";
import { workspacesStore } from "@/stores/workspaces";

// Define activity type colors and names similar to the Vue version
const ACTIVITY_TYPES_COLOR = {
  expense: "bg-red-300",
  revenue: "bg-green-300",
  investment: "bg-orange-400",
  neutral: "bg-stone-200",
};

const ACTIVITY_TYPES_NAME = {
  expense: "Expenses",
  revenue: "Revenues",
  investment: "Investments",
  neutral: "Neutral",
};

interface ActivityTypeSectionProps {
  activityType: ActivityType;
}

export function ActivityTypeSection({
  activityType,
}: ActivityTypeSectionProps) {
  const {
    activityCategories,
    activitySubcategories,
    activities,
    addActivityCategory,
    addActivitySubcategory,
    deleteActivityCategory,
    deleteActivitySubcategory,
  } = useStore(activitiesStore, (state) => ({
    activityCategories: state.activityCategories,
    activitySubcategories: state.activitySubcategories,
    activities: state.activities,
    addActivityCategory: state.addActivityCategory,
    addActivitySubcategory: state.addActivitySubcategory,
    deleteActivityCategory: state.deleteActivityCategory,
    deleteActivitySubcategory: state.deleteActivitySubcategory,
  }));

  const mutate = useStore(syncStore, (state) => state.mutate);
  const currentWorkspace = useStore(
    workspacesStore,
    (state) => state.currentWorkspace,
  );

  const [expanded, setExpanded] = useState<string | null>(null);
  const [newCategory, setNewCategory] = useState({
    show: false,
    name: "",
  });
  const [newSubCategory, setNewSubCategory] = useState({
    show: false,
    name: "",
  });

  const toggleExpand = (categoryId: string) => {
    setExpanded(expanded === categoryId ? null : categoryId);
    setNewSubCategory({ show: false, name: "" });
  };

  const sortedCategories = useMemo(() => {
    return [...activityCategories]
      .filter((c) => c.type === activityType)
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [activityCategories, activityType]);

  const cancelNewCategory = () => {
    setNewCategory({ show: false, name: "" });
  };

  const cancelNewSubCategory = () => {
    setNewSubCategory({ show: false, name: "" });
  };

  const getActivitiesLinkedToCategory = (categoryId: string) => {
    return activities.filter((a) => a.category === categoryId).length;
  };

  const getActivitiesLinkedToSubCategory = (subcategoryId: string) => {
    return activities.filter((a) => a.subcategory === subcategoryId).length;
  };

  const handleAddNewCategory = async () => {
    if (!newCategory.name) return;

    const category = addActivityCategory({
      name: newCategory.name,
      type: activityType,
    });

    mutate({
      name: "createActivityCategory",
      mutation: createActivityCategoryMutation,
      variables: {
        ...category,
        workspace: currentWorkspace?.id,
      },
      rollbackData: undefined,
    });

    cancelNewCategory();
  };

  const handleAddNewSubCategory = async () => {
    if (!newSubCategory.name || !expanded) return;

    const subcategory = addActivitySubcategory({
      name: newSubCategory.name,
      category: expanded,
    });

    mutate({
      name: "createActivitySubCategory",
      mutation: createActivitySubCategoryMutation,
      variables: {
        ...subcategory,
        workspace: currentWorkspace?.id,
      },
      rollbackData: undefined,
    });

    cancelNewSubCategory();
  };

  const handleDeleteCategory = async (categoryId: string) => {
    const categoryActivities = activities
      .filter((a) => a.category === categoryId)
      .map((a) => a.id);
    const categoryActivitiesSubcategories = activities
      .filter((a) => a.category === categoryId)
      .map((a) => a.subcategory);
    const category = activityCategories.find((c) => c.id === categoryId);
    if (!category) return;

    deleteActivityCategory(categoryId);

    mutate({
      name: "deleteActivityCategory",
      mutation: deleteActivityCategoryMutation,
      variables: { id: category.id },
      rollbackData: {
        category: category,
        activities: categoryActivities,
        activitiesSubcategories: categoryActivitiesSubcategories.reduce(
          (acc, sc) => {
            if (sc) acc[sc] = sc;
            return acc;
          },
          {} as Record<string, string>,
        ),
      },
    });
  };

  const handleDeleteSubCategory = async (subcategoryId: string) => {
    const subcategoryActivities = activities
      .filter((a) => a.subcategory === subcategoryId)
      .map((a) => a.id);
    const subcategory = activitySubcategories.find(
      (c) => c.id === subcategoryId,
    );
    if (!subcategory) return;

    deleteActivitySubcategory(subcategoryId);

    mutate({
      name: "deleteActivitySubCategory",
      mutation: deleteActivitySubCategoryMutation,
      variables: { id: subcategory.id },
      rollbackData: {
        subcategory: subcategory,
        activities: subcategoryActivities,
      },
    });
  };

  return (
    <div className="pb-10">
      <div className="mb-2 flex items-center px-2">
        <div
          className={`mr-2 size-3 shrink-0 rounded sm:mr-3 ${ACTIVITY_TYPES_COLOR[activityType]}`}
        />
        <div className="text-primary-400 text-sm font-medium">
          {ACTIVITY_TYPES_NAME[activityType]}
        </div>

        <div className="flex-1" />
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => setNewCategory({ show: true, name: "" })}
        >
          <Plus className="text-primary-500 h-4 w-4" />
        </Button>
      </div>

      {newCategory.show && (
        <div className="bg-primary-900 my-2 flex h-12 w-full items-center rounded border px-4">
          <Input
            value={newCategory.name}
            onChange={(e) =>
              setNewCategory({ ...newCategory, name: e.target.value })
            }
            placeholder="Name"
            autoFocus
            className="flex-1 border-none bg-transparent focus:ring-0 focus:outline-none"
          />

          <div className="flex-1" />
          <Button
            variant="outline"
            className="mr-2"
            onClick={cancelNewCategory}
          >
            Cancel
          </Button>
          <Button onClick={handleAddNewCategory}>Save</Button>
        </div>
      )}

      {sortedCategories.map((category) => (
        <div
          key={category.id}
          className="group my-2 w-full rounded border px-2"
        >
          <div className="flex h-10 w-full items-center px-2">
            <div className="text-primary-200 text-sm font-medium">
              {category.name}
            </div>
            <div className="text-primary-600 ml-1 text-sm">
              · {getActivitiesLinkedToCategory(category.id)} activities
            </div>

            <div className="flex-1" />

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <button className="mx-1">
                  <Trash2 className="text-primary-700 hover:text-primary-300 h-4 w-4" />
                </button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Category</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to delete this category? All
                    activities linked will lose this category and all
                    subcategories will be deleted as well.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => handleDeleteCategory(category.id)}
                  >
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>

            <button className="ml-2" onClick={() => toggleExpand(category.id)}>
              {expanded === category.id ? (
                <ChevronUp className="text-primary-500 hover:text-primary-300 h-4 w-4" />
              ) : (
                <ChevronDown className="text-primary-500 hover:text-primary-300 h-4 w-4" />
              )}
            </button>
          </div>

          {expanded === category.id && (
            <div className="border-t py-4">
              <div className="mb-2 flex items-center px-2">
                <div className="text-primary-600 text-xs font-medium">
                  Subcategories
                </div>
                <div className="flex-1" />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-5 w-5"
                  onClick={() => setNewSubCategory({ show: true, name: "" })}
                >
                  <Plus className="text-primary-500 h-3 w-3" />
                </Button>
              </div>

              {newSubCategory.show && (
                <div className="bg-primary-900 my-2 flex h-12 w-full items-center rounded border px-2">
                  <Input
                    value={newSubCategory.name}
                    onChange={(e) =>
                      setNewSubCategory({
                        ...newSubCategory,
                        name: e.target.value,
                      })
                    }
                    placeholder="Name"
                    autoFocus
                    className="flex-1 border-none bg-transparent focus:ring-0 focus:outline-none"
                  />

                  <div className="flex-1" />
                  <Button
                    variant="outline"
                    className="mr-2"
                    onClick={cancelNewSubCategory}
                  >
                    Cancel
                  </Button>
                  <Button onClick={handleAddNewSubCategory}>Save</Button>
                </div>
              )}

              {activitySubcategories.filter((sc) => sc.category === category.id)
                .length === 0 && (
                <div className="text-primary-600 px-2 text-xs">
                  No subcategory for this category.
                </div>
              )}

              {activitySubcategories
                .filter((sc) => sc.category === category.id)
                .map((subcategory) => (
                  <div
                    key={subcategory.id}
                    className="bg-primary-950 my-2 flex h-10 w-full items-center rounded border px-2"
                  >
                    <div className="text-primary-400 text-sm font-medium">
                      {subcategory.name}
                    </div>
                    <div className="text-primary-600 ml-1 text-sm">
                      · {getActivitiesLinkedToSubCategory(subcategory.id)}{" "}
                      activities
                    </div>

                    <div className="flex-1" />

                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <button>
                          <Trash2 className="text-primary-700 hover:text-primary-300 mx-1 h-4 w-4" />
                        </button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>
                            Delete Subcategory
                          </AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete this subcategory?
                            All activities linked will lose this subcategory.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() =>
                              handleDeleteSubCategory(subcategory.id)
                            }
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

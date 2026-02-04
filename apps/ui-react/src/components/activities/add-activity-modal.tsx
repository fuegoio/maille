import * as React from "react";
import { useStore } from "zustand";
import { activitiesStore } from "@/stores/activities";
import { ActivityType } from "@maille/core/activities";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";
import type { UUID } from "crypto";

// Activity type colors mapping
const ACTIVITY_TYPES_COLOR = {
  [ActivityType.EXPENSE]: "red",
  [ActivityType.REVENUE]: "green",
  [ActivityType.INVESTMENT]: "orange",
  [ActivityType.NEUTRAL]: "slate",
};

// Activity type names mapping
const ACTIVITY_TYPES_NAME = {
  [ActivityType.EXPENSE]: "Expense",
  [ActivityType.REVENUE]: "Revenue",
  [ActivityType.INVESTMENT]: "Investment",
  [ActivityType.NEUTRAL]: "Neutral",
};

interface AddActivityModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: string;
  onActivityAdded?: (activity: any) => void;
}

export function AddActivityModal({ open, onOpenChange, user, onActivityAdded }: AddActivityModalProps) {
  const { categories, subcategories } = useStore(activitiesStore, (state) => ({
    categories: state.activityCategories,
    subcategories: state.activitySubcategories,
  }));

  const [name, setName] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [date, setDate] = React.useState<Date | undefined>(new Date());
  const [type, setType] = React.useState<ActivityType | undefined>(undefined);
  const [category, setCategory] = React.useState<string | undefined>(undefined);
  const [subcategory, setSubcategory] = React.useState<string | undefined>(undefined);
  const [amount, setAmount] = React.useState("");

  const filteredCategories = React.useMemo(() => {
    if (!type) return categories;
    return categories.filter((c) => c.type === type);
  }, [type, categories]);

  const filteredSubcategories = React.useMemo(() => {
    if (!category) return [];
    return subcategories.filter((sc) => sc.category === category);
  }, [category, subcategories]);

  const resetForm = () => {
    setName("");
    setDescription("");
    setDate(new Date());
    setType(undefined);
    setCategory(undefined);
    setSubcategory(undefined);
    setAmount("");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!name || !date || !type || !amount) {
      return;
    }

    const newActivity = activitiesStore.getState().addActivity({
      user,
      number: activitiesStore.getState().activities.length + 1,
      name,
      description: description || null,
      date,
      type,
      category: category ? (category as UUID) : null,
      subcategory: subcategory ? (subcategory as UUID) : null,
      project: null,
      transactions: [],
      movements: [],
    });

    if (onActivityAdded) {
      onActivityAdded(newActivity);
    }

    resetForm();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[625px] bg-primary-900 border-primary-700">
        <DialogHeader>
          <DialogTitle className="text-white">Add New Activity</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right text-primary-100">
              Name
            </Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="col-span-3 bg-primary-800 border-primary-700 text-white"
              required
            />
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="description" className="text-right text-primary-100">
              Description
            </Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="col-span-3 bg-primary-800 border-primary-700 text-white"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="date" className="text-right text-primary-100">
              Date
            </Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant={"outline"}
                  className={cn(
                    "col-span-3 justify-start text-left font-normal bg-primary-800 border-primary-700 text-white",
                    !date && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {date ? format(date, "PPP") : <span>Pick a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 bg-primary-800 border-primary-700">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={setDate}
                  initialFocus
                  className="bg-primary-800 text-white"
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="type" className="text-right text-primary-100">
              Type
            </Label>
            <Select onValueChange={(value) => setType(value as ActivityType)} value={type}>
              <SelectTrigger className="col-span-3 bg-primary-800 border-primary-700 text-white">
                <SelectValue placeholder="Select activity type" />
              </SelectTrigger>
              <SelectContent className="bg-primary-800 border-primary-700">
                {Object.values(ActivityType).map((activityType) => (
                  <SelectItem key={activityType} value={activityType}>
                    <div className="flex items-center">
                      <div
                        className={`h-3 w-3 rounded-full shrink-0 mr-3 bg-${ACTIVITY_TYPES_COLOR[activityType]}-500`}
                      />
                      <span>{ACTIVITY_TYPES_NAME[activityType]}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="category" className="text-right text-primary-100">
              Category
            </Label>
            <Select
              onValueChange={setCategory}
              value={category}
              disabled={!type || filteredCategories.length === 0}
            >
              <SelectTrigger className="col-span-3 bg-primary-800 border-primary-700 text-white">
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent className="bg-primary-800 border-primary-700">
                {filteredCategories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="subcategory" className="text-right text-primary-100">
              Subcategory
            </Label>
            <Select
              onValueChange={setSubcategory}
              value={subcategory}
              disabled={!category || filteredSubcategories.length === 0}
            >
              <SelectTrigger className="col-span-3 bg-primary-800 border-primary-700 text-white">
                <SelectValue placeholder="Select subcategory" />
              </SelectTrigger>
              <SelectContent className="bg-primary-800 border-primary-700">
                {filteredSubcategories.map((subcat) => (
                  <SelectItem key={subcat.id} value={subcat.id}>
                    {subcat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="amount" className="text-right text-primary-100">
              Amount
            </Label>
            <Input
              id="amount"
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="col-span-3 bg-primary-800 border-primary-700 text-white font-mono"
              required
              step="0.01"
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="default">
              Add Activity
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
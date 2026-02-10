import * as React from "react";
import { useActivities } from "@/stores/activities";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { getCurrencyFormatter } from "@/lib/utils";
import { Plus, Trash2 } from "lucide-react";

interface SplitActivityModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  activityId: string;
}

export function SplitActivityModal({ open, onOpenChange, activityId }: SplitActivityModalProps) {
  const activity = useActivities((state) => state.getActivityById(activityId as string));
  const currencyFormatter = getCurrencyFormatter();

  const [splitAmounts, setSplitAmounts] = React.useState<number[]>([activity?.amount || 0]);
  const [splitNames, setSplitNames] = React.useState<string[]>([activity?.name || ""]);

  React.useEffect(() => {
    if (activity) {
      setSplitAmounts([activity.amount]);
      setSplitNames([activity.name]);
    }
  }, [activity]);

  const addSplit = () => {
    setSplitAmounts([...splitAmounts, 0]);
    setSplitNames([...splitNames, ""]);
  };

  const removeSplit = (index: number) => {
    if (splitAmounts.length <= 1) return;
    const newAmounts = [...splitAmounts];
    const newNames = [...splitNames];
    newAmounts.splice(index, 1);
    newNames.splice(index, 1);
    setSplitAmounts(newAmounts);
    setSplitNames(newNames);
  };

  const updateAmount = (index: number, value: string) => {
    const newAmounts = [...splitAmounts];
    newAmounts[index] = parseFloat(value) || 0;
    setSplitAmounts(newAmounts);
  };

  const updateName = (index: number, value: string) => {
    const newNames = [...splitNames];
    newNames[index] = value;
    setSplitNames(newNames);
  };

  const totalAmount = splitAmounts.reduce((sum, amount) => sum + amount, 0);
  const originalAmount = activity?.amount || 0;
  const difference = totalAmount - originalAmount;

  const handleSplit = () => {
    if (!activity) return;

    // In a real implementation, this would create new activities and handle the split logic
    console.log("Splitting activity:", {
      originalActivity: activity,
      splits: splitAmounts.map((amount, index) => ({
        amount,
        name: splitNames[index],
      })),
    });

    onOpenChange(false);
  };

  if (!activity) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-primary-900 border-primary-700 sm:max-w-[625px]">
        <DialogHeader>
          <DialogTitle className="text-white">Split Activity</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="text-primary-400 text-sm">
            Original amount: {currencyFormatter.format(originalAmount)}
          </div>

          <div className="space-y-3">
            {splitAmounts.map((amount, index) => (
              <div key={index} className="flex items-center gap-2">
                <Input
                  type="text"
                  value={splitNames[index]}
                  onChange={(e) => updateName(index, e.target.value)}
                  placeholder="Split name"
                  className="bg-primary-800 border-primary-700 flex-1 text-white"
                />
                <Input
                  type="number"
                  value={amount}
                  onChange={(e) => updateAmount(index, e.target.value)}
                  placeholder="Amount"
                  className="bg-primary-800 border-primary-700 w-32 font-mono text-white"
                  step="0.01"
                />
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => removeSplit(index)}
                  disabled={splitAmounts.length <= 1}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>

          <Button type="button" variant="outline" size="sm" onClick={addSplit} className="mt-2">
            <Plus className="mr-2 h-4 w-4" />
            <span>Add Split</span>
          </Button>

          <div className={`text-sm ${difference !== 0 ? "text-red-400" : "text-green-400"}`}>
            {difference !== 0 ? (
              <>Difference: {currencyFormatter.format(difference)}</>
            ) : (
              <>Balanced: {currencyFormatter.format(totalAmount)}</>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="button" variant="default" onClick={handleSplit} disabled={difference !== 0}>
            Split Activity
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

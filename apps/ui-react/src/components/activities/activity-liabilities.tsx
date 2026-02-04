import { type Activity } from "@maille/core/activities";
import { getCurrencyFormatter } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

interface ActivityLiabilitiesProps {
  activity: Activity;
}

export function ActivityLiabilities({ }: ActivityLiabilitiesProps) {
  const currencyFormatter = getCurrencyFormatter();

  // For now, we'll show a placeholder since liabilities are not directly part of the activity
  // In a real implementation, this would fetch and display related liabilities
  const liabilities: any[] = []; // This would come from a store or API

  return (
    <div className="py-6 px-4 sm:px-8">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium text-white">Liabilities</h3>
        <Button variant="outline" size="sm">
          <Plus className="h-4 w-4 mr-2" />
          <span>Add Liability</span>
        </Button>
      </div>

      {liabilities.length === 0 ? (
        <div className="text-center py-8 text-primary-400">
          No liabilities for this activity
        </div>
      ) : (
        <div className="space-y-4">
          {liabilities.map((liability: any) => (
            <div key={liability.id} className="border-b pb-4">
              <div className="flex justify-between items-center">
                <div>
                  <div className="font-medium text-white">
                    {liability.name}
                  </div>
                  <div className="text-sm text-primary-400">
                    {currencyFormatter.format(liability.amount)}
                  </div>
                </div>
                <div className="text-right">
                  <Button variant="ghost" size="icon">
                    <span className="sr-only">Edit</span>
                    {/* Edit icon would go here */}
                  </Button>
                  <Button variant="ghost" size="icon" className="ml-2">
                    <span className="sr-only">Delete</span>
                    {/* Delete icon would go here */}
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
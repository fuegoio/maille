import { type Activity } from "@maille/core/activities";

import { Button } from "@/components/ui/button";
import { getCurrencyFormatter } from "@/lib/utils";

interface ActivityLiabilitiesProps {
  activity: Activity;
}

export function ActivityLiabilities({ activity }: ActivityLiabilitiesProps) {
  const currencyFormatter = getCurrencyFormatter();

  const liabilities: any[] = []; // This would come from a store or API

  return (
    <div className="px-4 py-6 sm:px-8">
      <div className="flex items-center">
        <div className="text-sm font-medium">Liabilities</div>
      </div>

      {liabilities.length === 0 ? (
        <div className="py-4 text-sm text-muted-foreground">
          No transaction added for this activity.
        </div>
      ) : (
        <div className="space-y-4">
          {liabilities.map((liability: any) => (
            <div key={liability.id} className="border-b pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium text-white">{liability.name}</div>
                  <div className="text-primary-400 text-sm">
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


import { type Activity } from "@maille/core/activities";
import { getCurrencyFormatter } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

interface ActivityMovementsProps {
  activity: Activity;
}

export function ActivityMovements({ activity }: ActivityMovementsProps) {
  const currencyFormatter = getCurrencyFormatter();

  return (
    <div className="py-6 px-4 sm:px-8 border-b">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium text-white">Movements</h3>
        <Button variant="outline" size="sm">
          <Plus className="h-4 w-4 mr-2" />
          <span>Add Movement</span>
        </Button>
      </div>

      {activity.movements.length === 0 ? (
        <div className="text-center py-8 text-primary-400">
          No movements for this activity
        </div>
      ) : (
        <div className="space-y-4">
          {activity.movements.map((movement) => (
            <div key={movement.id} className="border-b pb-4">
              <div className="flex justify-between items-center">
                <div>
                  <div className="font-medium text-white">
                    {currencyFormatter.format(movement.amount)}
                  </div>
                  <div className="text-sm text-primary-400">
                    Movement: {movement.movement}
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
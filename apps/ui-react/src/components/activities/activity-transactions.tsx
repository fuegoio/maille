import { type Activity } from "@maille/core/activities";
import { getCurrencyFormatter } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

interface ActivityTransactionsProps {
  activity: Activity;
}

export function ActivityTransactions({ activity }: ActivityTransactionsProps) {
  const currencyFormatter = getCurrencyFormatter();

  return (
    <div className="border-b px-4 py-6 sm:px-8">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-medium text-white">Transactions</h3>
        <Button variant="outline" size="sm">
          <Plus className="mr-2 h-4 w-4" />
          <span>Add Transaction</span>
        </Button>
      </div>

      {activity.transactions.length === 0 ? (
        <div className="text-primary-400 py-8 text-center">No transactions for this activity</div>
      ) : (
        <div className="space-y-4">
          {activity.transactions.map((transaction) => (
            <div key={transaction.id} className="border-b pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium text-white">
                    {currencyFormatter.format(transaction.amount)}
                  </div>
                  <div className="text-primary-400 text-sm">From: {transaction.fromAccount}</div>
                  <div className="text-primary-400 text-sm">To: {transaction.toAccount}</div>
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


import { zodResolver } from "@hookform/resolvers/zod";
import { useState, type ReactNode } from "react";
import { useForm } from "react-hook-form";
import z from "zod";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { createInvestmentMutation } from "@/mutations/investments";
import { useSync } from "@/stores/sync";

// Define the form schema for creating an investment
const createInvestmentSchema = z.object({
  name: z.string().min(1, "Name is required"),
  symbol: z.string().optional(),
  initialQuantity: z.string().optional(),
  description: z.string().optional(),
});

type CreateInvestmentFormValues = z.infer<typeof createInvestmentSchema>;

interface AddInvestmentModalProps {
  accountId: string;
  children: ReactNode;
}

export function AddInvestmentModal({
  accountId,
  children,
}: AddInvestmentModalProps) {
  const mutate = useSync((state) => state.mutate);

  const [isOpen, setIsOpen] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<CreateInvestmentFormValues>({
    resolver: zodResolver(createInvestmentSchema),
    defaultValues: {
      name: "",
      symbol: "",
      initialQuantity: "",
      description: "",
    },
  });

  const onSubmit = async (data: CreateInvestmentFormValues) => {
    const initialQuantity = data.initialQuantity
      ? Number(data.initialQuantity)
      : 0;
    const investment = {
      id: crypto.randomUUID(),
      account: accountId,
      name: data.name,
      symbol: data.symbol || null,
      description: data.description || null,
      initialQuantity: Number.isFinite(initialQuantity) ? initialQuantity : 0,
    };

    mutate({
      name: "createInvestment",
      mutation: createInvestmentMutation,
      variables: investment,
      rollbackData: undefined,
      events: [
        {
          type: "createInvestment",
          payload: investment,
        },
      ],
    });

    setIsOpen(false);
    reset();
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add new investment</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Field>
            <FieldLabel>Name</FieldLabel>
            <FieldContent>
              <Input
                {...register("name")}
                placeholder="e.g., Apple, EuroFund PEA"
                autoFocus
              />
            </FieldContent>
            <FieldError>{errors.name?.message}</FieldError>
          </Field>

          <Field>
            <FieldLabel>Symbol (optional)</FieldLabel>
            <FieldContent>
              <Input
                {...register("symbol")}
                placeholder="e.g., AAPL, FR0010527"
              />
            </FieldContent>
            <FieldDescription>
              Ticker, ISIN or coin, however you identify it.
            </FieldDescription>
          </Field>

          <Field>
            <FieldLabel>Initial quantity (optional)</FieldLabel>
            <FieldContent>
              <Input
                {...register("initialQuantity")}
                type="number"
                step="any"
                placeholder="0"
              />
            </FieldContent>
            <FieldDescription>
              The units already held when the position starts tracking; buys and
              sells then derive the current quantity.
            </FieldDescription>
            <FieldError>{errors.initialQuantity?.message}</FieldError>
          </Field>

          <Field>
            <FieldLabel>Description (optional)</FieldLabel>
            <FieldContent>
              <Textarea
                {...register("description")}
                placeholder="Add any additional details about this investment..."
                rows={3}
              />
            </FieldContent>
          </Field>

          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline">
                Cancel
              </Button>
            </DialogClose>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Creating..." : "Create investment"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

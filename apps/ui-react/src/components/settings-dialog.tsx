import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { LoaderCircle, Settings } from "lucide-react";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import z from "zod";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { authClient } from "@/lib/auth";
import { useAuth } from "@/stores/auth";

import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";
import { DropdownMenuItem } from "./ui/dropdown-menu";

const formSchema = z.object({
  currency: z
    .string()
    .trim()
    .regex(/^[A-Za-z]{3}$/, "Use a three-letter currency code"),
  startingDate: z.date(),
});

export function SettingsDialog() {
  const [open, setOpen] = useState(false);
  const user = useAuth((state) => state.user);
  const updateUser = useAuth((state) => state.updateUser);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      currency: user?.currency || "EUR",
      startingDate: user?.startingDate || new Date(),
    },
  });

  const [loading, setLoading] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const onSubmit = async (data: z.infer<typeof formSchema>) => {
    setLoading(true);
    setSubmitError(null);

    try {
      const normalizedData = {
        ...data,
        currency: data.currency.toUpperCase(),
      };
      const response = await authClient.updateUser(normalizedData);
      if (!response.data?.status) {
        setSubmitError("Settings could not be saved. Please try again.");
        return;
      }

      updateUser(normalizedData);
      setOpen(false);
    } catch {
      setSubmitError("Settings could not be saved. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen);
        if (nextOpen) setSubmitError(null);
      }}
    >
      <DialogTrigger asChild>
        <DropdownMenuItem
          className="gap-2 px-3"
          onSelect={(e) => e.preventDefault()}
        >
          <Settings />
          Settings
        </DropdownMenuItem>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Ledger settings</DialogTitle>
          <DialogDescription>
            Choose the defaults used to calculate and display your ledger.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FieldGroup className="gap-4">
            <Controller
              name="currency"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="currency">Currency</FieldLabel>
                  <Input
                    {...field}
                    id="currency"
                    aria-invalid={fieldState.invalid}
                    autoCapitalize="characters"
                    autoComplete="off"
                    maxLength={3}
                    spellCheck={false}
                    className="h-9 font-mono uppercase"
                    placeholder="EUR"
                    onChange={(event) =>
                      field.onChange(event.target.value.toUpperCase())
                    }
                  />
                  <FieldDescription>
                    Three-letter ISO code used for every amount.
                  </FieldDescription>
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />

            <Controller
              name="startingDate"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="startingDate">Starting date</FieldLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        id="startingDate"
                        className="justify-start font-normal"
                      >
                        {field.value ? (
                          format(field.value, "PPP")
                        ) : (
                          <span>Pick a date</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        defaultMonth={field.value}
                      />
                    </PopoverContent>
                  </Popover>
                  <FieldDescription>
                    Transactions before this date are excluded from balances.
                  </FieldDescription>
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />
          </FieldGroup>

          {submitError && <FieldError>{submitError}</FieldError>}

          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button type="submit" disabled={loading}>
              {loading && <LoaderCircle className="size-4 animate-spin" />}
              {loading ? "Saving" : "Save changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

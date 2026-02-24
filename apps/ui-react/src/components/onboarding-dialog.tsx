import { zodResolver } from "@hookform/resolvers/zod";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { format } from "date-fns";
import { LoaderCircle } from "lucide-react";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import z from "zod";

import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Field,
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

const formSchema = z.object({
  currency: z.string().min(1, "Currency is required"),
  startingDate: z.date(),
});

export function OnboardingDialog() {
  const updateUser = useAuth((state) => state.updateUser);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      currency: "EUR",
      startingDate: new Date(),
    },
  });

  const [loading, setLoading] = useState(false);

  const onSubmit = async (data: z.infer<typeof formSchema>) => {
    setLoading(true);

    try {
      const response = await authClient.updateUser({
        currency: data.currency,
        startingDate: data.startingDate,
      });
      if (response.data?.status) {
        updateUser({
          ...data,
        });
      }
    } catch (error) {
      console.error("Failed to upate user:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-4 bg-muted">
      <Logo className="size-12 text-muted" />
      <div className="flex w-full max-w-sm flex-col justify-center gap-6 rounded-xl border bg-card p-6">
        <div className="text-center">
          <h1 className="text-xl font-medium text-foreground">
            Setup your account
          </h1>
          <div className="mt-2 text-sm text-muted-foreground">
            Set up your financial settings to get started.
          </div>
        </div>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
          <FieldGroup>
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
                    className="h-9"
                    placeholder="EUR"
                  />
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
                  <FieldLabel htmlFor="startingDate">Starting Date</FieldLabel>
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
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />
          </FieldGroup>

          <Button type="submit" className="w-full" disabled={loading} size="lg">
            {loading ? (
              <LoaderCircle className="ml-2 h-4 w-4 animate-spin" />
            ) : (
              "Continue"
            )}
          </Button>

          <div className="text-center text-sm text-muted-foreground">
            You can always change these settings later.
          </div>
        </form>
      </div>
    </div>
  );
}

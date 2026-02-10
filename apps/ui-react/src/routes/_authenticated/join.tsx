import { zodResolver } from "@hookform/resolvers/zod";
import { createFileRoute } from "@tanstack/react-router";
import { format } from "date-fns";
import { LoaderCircle } from "lucide-react";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import z from "zod";
import { useStore } from "zustand";

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
import { fetchWorkspaceData } from "@/data";
import { graphql } from "@/gql";
import { graphqlClient } from "@/gql/client";
import { useWorkspacesStore } from "@/stores/workspaces";

export const CreateWorkspaceMutation = graphql(`
  mutation CreateWorkspace(
    $name: String!
    $currency: String!
    $startingDate: Date!
  ) {
    createWorkspace(
      name: $name
      currency: $currency
      startingDate: $startingDate
    ) {
      id
      name
      currency
      startingDate
      createdAt
      users {
        id
        email
        name
        image
      }
    }
  }
`);

export const Route = createFileRoute("/_authenticated/join")({
  component: RouteComponent,
});

const formSchema = z.object({
  name: z.string().min(1, "Workspace name is required"),
  currency: z.string().min(1, "Currency is required"),
  startingDate: z.date(),
});

function RouteComponent() {
  const { user } = Route.useRouteContext();
  const navigate = Route.useNavigate();

  const createWorkspace = useWorkspacesStore((state) => state.createWorkspace);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      currency: "EUR",
      startingDate: new Date(),
    },
  });

  const [loading, setLoading] = useState(false);

  const onSubmit = async (data: z.infer<typeof formSchema>) => {
    setLoading(true);

    try {
      const response = await graphqlClient.request(CreateWorkspaceMutation, {
        name: data.name,
        currency: data.currency,
        startingDate: data.startingDate.toISOString().split("T")[0],
      });

      createWorkspace({
        ...response.createWorkspace,
        startingDate: new Date(response.createWorkspace.startingDate),
      });

      await fetchWorkspaceData(response.createWorkspace.id);
      navigate({ to: "/" });
    } catch (error) {
      console.error("Failed to create workspace:", error);
      form.setError("name", {
        message:
          error instanceof Error ? error.message : "Failed to create workspace",
      });
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
            Create your Workspace
          </h1>
          <div className="mt-2 text-sm text-muted-foreground">
            Set up your financial workspace to get started.
          </div>
        </div>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
          <FieldGroup>
            <Controller
              name="name"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="name">Workspace name</FieldLabel>
                  <Input
                    {...field}
                    id="name"
                    aria-invalid={fieldState.invalid}
                    autoComplete="organization"
                    className="h-9"
                    placeholder={user.name}
                  />
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />

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
              "Create Workspace"
            )}
          </Button>

          <div className="text-center text-sm text-muted-foreground">
            Already have a workspace? You'll be able to switch between them
            later.
          </div>
        </form>
      </div>
    </div>
  );
}

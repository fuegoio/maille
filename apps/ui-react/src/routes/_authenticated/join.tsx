import { useState } from "react";
import { Controller, useForm } from "react-hook-form";

import { zodResolver } from "@hookform/resolvers/zod";
import { createFileRoute } from "@tanstack/react-router";
import { LoaderCircle } from "lucide-react";
import z from "zod";

import { graphqlClient } from "@/gql/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Logo } from "@/components/logo";
import { graphql } from "@/gql";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { useStore } from "zustand";
import { workspacesStore } from "@/stores/workspaces";
import { fetchWorkspaceData } from "@/data";

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

  const createWorkspace = useStore(
    workspacesStore,
    (state) => state.createWorkspace,
  );

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
    <div className="h-full w-full flex items-center justify-center flex-col gap-4 bg-muted">
      <Logo className="text-muted size-12" />
      <div className="p-6 flex flex-col justify-center gap-6 max-w-sm w-full bg-card rounded-xl border">
        <div className="text-center">
          <h1 className="text-xl font-medium text-foreground">
            Create your Workspace
          </h1>
          <div className="text-sm text-muted-foreground mt-2">
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

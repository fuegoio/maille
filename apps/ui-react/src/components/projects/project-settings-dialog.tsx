import type { Project } from "@maille/core/projects";

import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import z from "zod";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/ui/date-picker";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { EmojiPicker } from "@/components/ui/emoji-picker";
import {
  Field,
  FieldContent,
  FieldError,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  deleteProjectMutation,
  updateProjectMutation,
} from "@/mutations/projects";
import { useActivities } from "@/stores/activities";
import { useSync } from "@/stores/sync";

const updateProjectSchema = z
  .object({
    name: z.string().min(1, "Project name is required"),
    emoji: z.string().nullable().optional(),
    startDate: z.date().nullable().optional(),
    endDate: z.date().nullable().optional(),
  })
  .refine(
    (data) => {
      if (data.startDate && data.endDate) {
        return data.endDate >= data.startDate;
      }
      return true;
    },
    { message: "End date must be after start date", path: ["endDate"] },
  );

type UpdateProjectFormValues = z.infer<typeof updateProjectSchema>;

interface ProjectSettingsDialogProps {
  project: Project;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children?: React.ReactNode;
}

export function ProjectSettingsDialog({
  project,
  open: externalOpen,
  onOpenChange,
  children,
}: ProjectSettingsDialogProps) {
  const mutate = useSync((state) => state.mutate);
  const activities = useActivities((state) => state.activities);
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const toDate = (value: Date | string | null | undefined): Date | null => {
    if (!value) return null;
    return value instanceof Date ? value : new Date(value);
  };

  const {
    control,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<UpdateProjectFormValues>({
    resolver: zodResolver(updateProjectSchema),
    defaultValues: {
      name: project.name,
      emoji: project.emoji,
      startDate: toDate(project.startDate),
      endDate: toDate(project.endDate),
    },
  });

  const startDate = watch("startDate");

  const handleOpenChange = (value: boolean) => {
    setOpen(value);
    onOpenChange?.(value);
  };

  const onSubmit = (data: UpdateProjectFormValues) => {
    const startDate = data.startDate ?? null;
    const endDate = startDate ? (data.endDate ?? null) : null;

    mutate({
      name: "updateProject",
      mutation: updateProjectMutation,
      variables: {
        id: project.id,
        name: data.name,
        emoji: data.emoji,
        startDate: startDate ? startDate.toISOString().split("T")[0] : null,
        endDate: endDate ? endDate.toISOString().split("T")[0] : null,
      },
      rollbackData: { ...project },
      events: [
        {
          type: "updateProject",
          payload: {
            id: project.id,
            name: data.name,
            emoji: data.emoji,
            startDate: startDate ? startDate.toISOString().split("T")[0] : null,
            endDate: endDate ? endDate.toISOString().split("T")[0] : null,
          },
        },
      ],
    });

    reset({ name: data.name, emoji: data.emoji, startDate, endDate });
    handleOpenChange(false);
  };

  const handleDelete = async () => {
    mutate({
      name: "deleteProject",
      mutation: deleteProjectMutation,
      variables: { id: project.id },
      rollbackData: {
        project,
        activities: activities
          .filter((a) => a.project === project.id)
          .map((a) => a.id),
      },
      events: [
        {
          type: "deleteProject",
          payload: { id: project.id },
        },
      ],
    });

    await navigate({ to: "/projects" });
  };

  return (
    <Dialog
      open={externalOpen !== undefined ? externalOpen : open}
      onOpenChange={handleOpenChange}
    >
      {children && <DialogTrigger asChild>{children}</DialogTrigger>}
      <DialogContent onOpenAutoFocus={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle>Project settings</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="flex items-end gap-2">
            <Controller
              name="emoji"
              control={control}
              render={({ field }) => (
                <EmojiPicker
                  value={field.value || null}
                  onChange={field.onChange}
                />
              )}
            />
            <Field>
              <FieldLabel>Name</FieldLabel>
              <FieldContent>
                <Controller
                  name="name"
                  control={control}
                  render={({ field }) => (
                    <Input
                      {...field}
                      placeholder="Project name"
                      className={errors.name ? "border-destructive" : ""}
                      autoFocus
                    />
                  )}
                />
                <FieldError errors={[errors.name]} />
              </FieldContent>
            </Field>
          </div>

          <div className="flex gap-4">
            <Field className="flex-1">
              <FieldLabel>Start date</FieldLabel>
              <FieldContent>
                <Controller
                  name="startDate"
                  control={control}
                  render={({ field }) => (
                    <DatePicker
                      value={field.value ?? undefined}
                      onChange={(date) => {
                        field.onChange(date ?? null);
                        if (!date) setValue("endDate", null);
                      }}
                      className="w-full"
                    />
                  )}
                />
              </FieldContent>
            </Field>

            <Field className="flex-1">
              <FieldLabel>End date</FieldLabel>
              <FieldContent>
                <Controller
                  name="endDate"
                  control={control}
                  render={({ field }) => (
                    <DatePicker
                      value={field.value ?? undefined}
                      onChange={(date) => field.onChange(date ?? null)}
                      className="w-full"
                      disabled={!startDate}
                      fromDate={startDate ?? undefined}
                    />
                  )}
                />
                <FieldError errors={[errors.endDate]} />
              </FieldContent>
            </Field>
          </div>

          <DialogFooter>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button type="button" variant="destructive">
                  Delete
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete project</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to delete this project? This action
                    cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDelete}
                    variant="destructive"
                  >
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
            <div className="flex-1" />
            <DialogClose asChild>
              <Button type="button" variant="outline">
                Cancel
              </Button>
            </DialogClose>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : "Save changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

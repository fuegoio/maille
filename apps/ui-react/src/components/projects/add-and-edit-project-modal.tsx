import { zodResolver } from "@hookform/resolvers/zod";
import { XIcon } from "lucide-react";
import { useEffect, useRef } from "react";
import { useForm, Controller } from "react-hook-form";
import z from "zod";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { EmojiPicker } from "@/components/ui/emoji-picker";
import { Field, FieldError } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  createProjectMutation,
  updateProjectMutation,
} from "@/mutations/projects";
import { useProjects } from "@/stores/projects";
import { useSync } from "@/stores/sync";

// Form schema using zod
const formSchema = z.object({
  name: z.string().min(1, "Project name is required"),
  emoji: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface AddAndEditProjectModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId?: string;
  onCreate?: (projectId: string) => void;
}

export function AddAndEditProjectModal({
  open,
  onOpenChange,
  projectId,
  onCreate,
}: AddAndEditProjectModalProps) {
  const projects = useProjects((state) => state.projects);
  const addProject = useProjects((state) => state.addProject);
  const updateProject = useProjects((state) => state.updateProject);
  const mutate = useSync((state) => state.mutate);

  const nameInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      emoji: null,
    },
  });

  const { control, handleSubmit, reset, setValue, watch } = form;
  const emoji = watch("emoji");

  const project = projectId
    ? projects.find((p) => p.id === projectId)
    : undefined;

  const isEditMode = !!project;

  // Reset form when modal opens/closes or project changes
  useEffect(() => {
    if (open) {
      if (project) {
        reset({
          name: project.name,
          emoji: project.emoji || null,
        });
      } else {
        reset({
          name: "",
          emoji: null,
        });
      }

      // Focus the name input when modal opens
      setTimeout(() => {
        if (nameInputRef.current) {
          nameInputRef.current.focus();
        }
      }, 100);
    }
  }, [open, project, reset]);

  const onSubmit = (data: FormValues) => {
    if (isEditMode && project) {
      // Update existing project
      updateProject(project.id, {
        name: data.name,
        emoji: data.emoji,
      });

      mutate({
        name: "updateProject",
        mutation: updateProjectMutation,
        variables: {
          id: project.id,
          name: data.name,
          emoji: data.emoji,
        },
        rollbackData: { ...project },
      });
    } else {
      // Create new project
      const newProject = addProject({
        name: data.name,
        emoji: data.emoji,
        startDate: null,
        endDate: null,
      });

      mutate({
        name: "createProject",
        mutation: createProjectMutation,
        variables: {
          id: newProject.id,
          name: newProject.name,
          emoji: newProject.emoji,
          workspace: null, // This should be set to the current workspace
        },
        rollbackData: undefined,
      });

      if (onCreate) {
        onCreate(newProject.id);
      }
    }

    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-primary-800 border-primary-700 text-white sm:max-w-[600px]">
        <DialogHeader className="flex flex-row items-center justify-between">
          <DialogTitle className="bg-primary-400 flex h-6 items-center rounded px-2 text-sm font-medium text-white">
            {isEditMode ? "Edit project" : "New project"}
          </DialogTitle>
          <Button
            variant="ghost"
            size="icon"
            className="text-primary-500 hover:text-primary-100"
            onClick={() => onOpenChange(false)}
          >
            <XIcon className="h-4 w-4" />
          </Button>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="py-4">
          <div className="flex items-center gap-2">
            <EmojiPicker
              value={emoji || ""}
              onChange={(value) => setValue("emoji", value)}
              placeholder="📚"
              className="mr-2"
            />
            <Controller
              name="name"
              control={control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid} className="w-full">
                  <Input
                    {...field}
                    ref={nameInputRef}
                    placeholder="Project name"
                    className="placeholder-primary-400 w-full resize-none border-none bg-transparent text-2xl font-semibold break-words text-white focus-visible:ring-0 focus-visible:ring-offset-0"
                  />
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />
          </div>

          <DialogFooter className="border-primary-700 border-t pt-4">
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                className="text-primary-300 border-primary-600 hover:bg-primary-700"
                onClick={() => onOpenChange(false)}
                type="button"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-primary-400 hover:bg-primary-300 text-white"
              >
                {isEditMode ? "Save" : "Create"} project
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

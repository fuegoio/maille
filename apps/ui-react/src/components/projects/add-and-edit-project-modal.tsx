import { zodResolver } from "@hookform/resolvers/zod";
import { Plus } from "lucide-react";
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
  DialogTrigger,
  DialogClose,
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
  projectId?: string;
  onCreate?: (projectId: string) => void;
}

export function AddAndEditProjectModal({
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
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button>
          <Plus />
          Create project
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {isEditMode ? "Edit project" : "New project"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="mb-4 flex items-center gap-2">
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
                  />
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />
          </div>

          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline">
                Cancel
              </Button>
            </DialogClose>
            <DialogClose asChild>
              <Button type="submit">
                {isEditMode ? "Save" : "Create"} project
              </Button>
            </DialogClose>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

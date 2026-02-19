import { zodResolver } from "@hookform/resolvers/zod";
import { Plus } from "lucide-react";
import { useRef } from "react";
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
import { useWorkspaces } from "@/stores/workspaces";

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
  const mutate = useSync((state) => state.mutate);
  const workspaceId = useWorkspaces((state) => state.currentWorkspace!.id);

  const nameInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
    },
  });

  const { control, handleSubmit, setValue, watch } = form;
  const emoji = watch("emoji");

  const project = projectId
    ? projects.find((p) => p.id === projectId)
    : undefined;

  const isEditMode = !!project;

  const onSubmit = (data: FormValues) => {
    if (isEditMode && project) {
      mutate({
        name: "updateProject",
        mutation: updateProjectMutation,
        variables: {
          id: project.id,
          ...data,
        },
        rollbackData: { ...project },
        events: [
          {
            type: "updateProject",
            payload: {
              id: project.id,
              ...data,
            },
          },
        ],
      });
    } else {
      const newProject = {
        id: crypto.randomUUID(),
        ...data,
        emoji: data.emoji ?? null,
        workspace: workspaceId,
      };
      mutate({
        name: "createProject",
        mutation: createProjectMutation,
        variables: newProject,
        rollbackData: undefined,
        events: [
          {
            type: "createProject",
            payload: newProject,
          },
        ],
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

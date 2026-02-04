import { useState, useEffect, useRef } from "react";
import { useStore } from "zustand";
import { projectsStore } from "@/stores/projects";
import { eventsStore } from "@/stores/events";
import { createProjectMutation, updateProjectMutation } from "@/mutations/projects";
import type { UUID } from "crypto";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { EmojiPicker } from "@/components/ui/emoji-picker";
import { XIcon } from "lucide-react";

interface AddAndEditProjectModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId?: UUID;
  onCreate?: (projectId: UUID) => void;
}

export function AddAndEditProjectModal({
  open,
  onOpenChange,
  projectId,
  onCreate,
}: AddAndEditProjectModalProps) {
  const projects = useStore(projectsStore, (state) => state.projects);
  const addProject = useStore(projectsStore, (state) => state.addProject);
  const updateProject = useStore(projectsStore, (state) => state.updateProject);
  const sendEvent = useStore(eventsStore, (state) => state.sendEvent);

  const nameInputRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState("");
  const [emoji, setEmoji] = useState<string | null>(null);

  const project = projectId ? projects.find((p) => p.id === projectId) : undefined;

  const isEditMode = !!project;

  // Reset form when modal opens/closes or project changes
  useEffect(() => {
    if (open) {
      if (project) {
        setName(project.name);
        setEmoji(project.emoji);
      } else {
        setName("");
        setEmoji(null);
      }

      // Focus the name input when modal opens
      setTimeout(() => {
        if (nameInputRef.current) {
          nameInputRef.current.focus();
        }
      }, 100);
    }
  }, [open, project]);

  const validForm = name.trim() !== "";

  const handleSubmit = () => {
    if (!validForm) return;

    if (isEditMode && project) {
      // Update existing project
      updateProject(project.id, {
        name: name,
        emoji: emoji,
      });

      sendEvent({
        name: "updateProject",
        mutation: updateProjectMutation,
        variables: {
          id: project.id,
          name: name,
          emoji: emoji,
        },
        rollbackData: { ...project },
      });
    } else {
      // Create new project
      const newProject = addProject({
        name: name,
        emoji: emoji,
        startDate: null,
        endDate: null,
      });

      sendEvent({
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

        <div className="py-4">
          <div className="flex items-center gap-2">
            <EmojiPicker value={emoji} onChange={setEmoji} placeholder="📚" className="mr-2" />
            <Input
              ref={nameInputRef}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Project name"
              className="placeholder-primary-400 w-full resize-none border-none bg-transparent text-2xl font-semibold break-words text-white focus-visible:ring-0 focus-visible:ring-offset-0"
            />
          </div>
        </div>

        <DialogFooter className="border-primary-700 border-t pt-4">
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              className="text-primary-300 border-primary-600 hover:bg-primary-700"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              disabled={!validForm}
              className="bg-primary-400 hover:bg-primary-300 text-white"
              onClick={handleSubmit}
            >
              {isEditMode ? "Save" : "Create"} project
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

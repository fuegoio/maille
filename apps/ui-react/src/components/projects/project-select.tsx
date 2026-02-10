import { useStore } from "zustand";
import { projectsStore } from "@/stores/projects";
import { Select, SelectContent, SelectItem, SelectTrigger } from "@/components/ui/select";
import { useMemo } from "react";
import { ChevronDown } from "lucide-react";

interface ProjectSelectProps {
  modelValue: string | null;
  onUpdateModelValue: (value: string | null) => void;
}

export function ProjectSelect({ modelValue, onUpdateModelValue }: ProjectSelectProps) {
  const projects = useStore(projectsStore, (state) => state.projects);

  const allProjects = [{ id: null, name: "No project", emoji: null }, ...projects];

  const selectedProject = useMemo(() => {
    if (!modelValue) return allProjects[0];
    return allProjects.find((p) => p.id === modelValue) || allProjects[0];
  }, [modelValue, allProjects]);

  return (
    <Select
      value={modelValue?.toString() || "null"}
      onValueChange={(value) => {
        onUpdateModelValue(value === "null" ? null : (value as string));
      }}
    >
      <SelectTrigger className="w-[180px]">
        <div className="flex items-center">
          {selectedProject.emoji && <span className="mr-2">{selectedProject.emoji}</span>}
          <span>{selectedProject.name}</span>
        </div>
        <ChevronDown className="size-4 text-muted-foreground" />
      </SelectTrigger>
      <SelectContent>
        {allProjects.map((project) => (
          <SelectItem key={project.id?.toString()} value={project.id?.toString() || "null"}>
            <div className="flex items-center">
              {project.emoji && <span className="w-6">{project.emoji}</span>}
              <span>{project.name}</span>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

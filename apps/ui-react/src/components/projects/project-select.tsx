import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useProjects } from "@/stores/projects";

interface ProjectSelectProps {
  value: string | null;
  onValueChange: (value: string | null) => void;
}

export function ProjectSelect({ value, onValueChange }: ProjectSelectProps) {
  const projects = useProjects((state) => state.projects);

  const allProjects = [
    { id: "clear", name: "No project", emoji: null },
    ...projects,
  ];

  return (
    <Select
      value={value || ""}
      onValueChange={(value) => {
        onValueChange(value === "clear" ? null : value);
      }}
    >
      <SelectTrigger>
        <SelectValue placeholder="Select a project" />
      </SelectTrigger>
      <SelectContent>
        {allProjects.map((project) => (
          <SelectItem key={project.id || "clear"} value={project.id || "clear"}>
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

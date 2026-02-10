import { useState } from "react";
import { useStore } from "zustand";
import { projectsStore } from "@/stores/projects";
import { syncStore } from "@/stores/sync";
import { updateProjectMutation } from "@/mutations/projects";
import type { string } from "crypto";
import { format } from "date-fns";

import { Button } from "@/components/ui/button";
import { CalendarIcon, XIcon, ArrowRightIcon } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";

interface ProjectDatesProps {
  projectId: string;
}

export function ProjectDates({ projectId }: ProjectDatesProps) {
  const projects = useStore(projectsStore, (state) => state.projects);
  const updateProject = useStore(projectsStore, (state) => state.updateProject);
  const sendEvent = useStore(syncStore, (state) => state.sendEvent);

  const project = projects.find((p) => p.id === projectId);

  if (!project) return null;

  const [startDateOpen, setStartDateOpen] = useState(false);
  const [endDateOpen, setEndDateOpen] = useState(false);

  const handleStartDateChange = (date: Date | undefined) => {
    const newStartDate = date || null;
    const newEndDate = newStartDate === null ? null : project.endDate;

    updateProject(project.id, {
      startDate: newStartDate,
      endDate: newEndDate,
    });

    sendEvent({
      name: "updateProject",
      mutation: updateProjectMutation,
      variables: {
        id: project.id,
        startDate: newStartDate ? newStartDate.toISOString().split("T")[0] : null,
        endDate: newEndDate ? newEndDate.toISOString().split("T")[0] : null,
      },
      rollbackData: { ...project },
    });
  };

  const handleEndDateChange = (date: Date | undefined) => {
    const newEndDate = date || null;

    updateProject(project.id, {
      endDate: newEndDate,
    });

    sendEvent({
      name: "updateProject",
      mutation: updateProjectMutation,
      variables: {
        id: project.id,
        endDate: newEndDate ? newEndDate.toISOString().split("T")[0] : null,
      },
      rollbackData: { ...project },
    });
  };

  return (
    <div className="flex items-center gap-1">
      <Popover open={startDateOpen} onOpenChange={setStartDateOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className={`flex h-8 items-center gap-1 px-2 ${
              startDateOpen ? "bg-primary-600" : "hover:bg-primary-600"
            }`}
          >
            <CalendarIcon className="h-4 w-4 text-white" />
            <span
              className={`text-sm whitespace-nowrap ${
                project.startDate ? "text-white" : "text-primary-200"
              }`}
            >
              {project.startDate ? format(project.startDate, "MMM dd") : "Start date"}
            </span>
            {startDateOpen && project.startDate && (
              <Button
                variant="ghost"
                size="icon"
                className="text-primary-100 h-6 w-6 hover:text-white"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleStartDateChange(undefined);
                }}
              >
                <XIcon className="h-3 w-3" />
              </Button>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0">
          <Calendar
            mode="single"
            selected={project.startDate || undefined}
            onSelect={handleStartDateChange}
            initialFocus
          />
        </PopoverContent>
      </Popover>

      <ArrowRightIcon className="text-primary-600 mx-1 h-4 w-4" />

      <Popover open={endDateOpen} onOpenChange={setEndDateOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className={`flex h-8 items-center gap-1 px-2 ${
              (endDateOpen ? "bg-primary-600" : "",
              project.startDate === null ? "cursor-not-allowed opacity-50" : "hover:bg-primary-600")
            }`}
            disabled={project.startDate === null}
          >
            <CalendarIcon
              className={`h-4 w-4 ${
                project.startDate === null ? "text-primary-400" : "text-primary-200"
              }`}
            />
            <span
              className={`text-sm whitespace-nowrap ${
                (project.endDate ? "text-white" : "text-primary-200",
                project.startDate === null ? "text-primary-400" : "")
              }`}
            >
              {project.endDate ? format(project.endDate, "MMM dd") : "End date"}
            </span>
            {endDateOpen && project.endDate && (
              <Button
                variant="ghost"
                size="icon"
                className="text-primary-100 h-6 w-6 hover:text-white"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleEndDateChange(undefined);
                }}
              >
                <XIcon className="h-3 w-3" />
              </Button>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0">
          <Calendar
            mode="single"
            selected={project.endDate || undefined}
            onSelect={handleEndDateChange}
            disabled={project.startDate === null}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}

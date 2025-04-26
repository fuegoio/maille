import dayjs from "dayjs";
import { defineStore } from "pinia";
import { ref } from "vue";
import { type UUID } from "crypto";
import type { Project, ProjectStatus } from "@maille/core/projects";
import type { ActivityType } from "@maille/core/activities";
import { useActivitiesStore } from "./activities";
import { useAuthStore } from "./auth";
import { useStorage } from "@vueuse/core";
import type { SyncEvent } from "@maille/core/sync";
import type { Mutation } from "@/mutations";

export const useProjectsStore = defineStore("projects", () => {
  const projects = useStorage<Project[]>("projects", [], undefined, {
    serializer: {
      read: (v: string) => {
        if (!v) return null;
        return JSON.parse(v).map((a: any) => {
          return {
            ...a,
            startDate: a.startDate ? dayjs(a.startDate) : null,
            endDate: a.endDate ? dayjs(a.endDate) : null,
          };
        });
      },
      write: (v: Project[]) => JSON.stringify(v),
    },
  });

  const viewFilters = ref({
    category: null as UUID | null,
    subcategory: null as UUID | null,
    activityType: null as ActivityType | null,
  });

  const getProjectStatus = (project: Project): ProjectStatus => {
    const now = dayjs();
    if (
      project.startDate !== null &&
      project.startDate.startOf("day") < now &&
      project.endDate === null
    ) {
      return "in progress";
    } else if (project.endDate !== null && now > project.endDate.endOf("day")) {
      return "completed";
    }
    return "scheduled";
  };

  const getProjectById = (projectId: UUID): Project | undefined => {
    return projects.value.find((p) => p.id === projectId);
  };

  const addNewProject = (name: string, emoji: string | null): Project => {
    const { user } = useAuthStore();
    const newProject = {
      id: window.crypto.randomUUID(),
      user: user!.id,
      name,
      emoji,
    };

    return addProject(newProject);
  };

  const addProject = (input: {
    id: UUID;
    name: string;
    emoji: string | null;
  }) => {
    const project = { ...input, startDate: null, endDate: null };
    projects.value.push(project);
    return project;
  };

  const deleteProject = (projectId: UUID) => {
    const project = getProjectById(projectId);
    if (!project) return;

    useActivitiesStore()
      .activities.filter((activity) => activity.project === project.id)
      .forEach((activity) => (activity.project = null));

    projects.value.splice(projects.value.indexOf(project), 1);
  };

  const updateProject = (projectId: UUID, input: Partial<Project>) => {
    const project = getProjectById(projectId);
    if (!project) return;

    if (input.name) project.name = input.name;
    if (input.emoji !== undefined) project.emoji = input.emoji;
    if (input.startDate !== undefined) project.startDate = input.startDate;
    if (input.endDate !== undefined) project.endDate = input.endDate;

    return project;
  };

  const restoreProject = (rollbackData: {
    project: Project;
    activities: UUID[];
  }) => {
    projects.value.push(rollbackData.project);

    useActivitiesStore()
      .activities.filter((activity) =>
        rollbackData.activities.includes(activity.id),
      )
      .forEach((activity) => (activity.project = rollbackData.project.id));
  };

  // Events
  const handleEvent = (event: SyncEvent) => {
    if (event.type === "createProject") {
      addProject({
        ...event.payload,
      });
    } else if (event.type === "updateProject") {
      updateProject(event.payload.id, {
        ...event.payload,
        startDate:
          event.payload.startDate !== null &&
          event.payload.startDate !== undefined
            ? dayjs(event.payload.startDate)
            : event.payload.startDate,
        endDate:
          event.payload.endDate !== null && event.payload.endDate !== undefined
            ? dayjs(event.payload.endDate)
            : event.payload.endDate,
      });
    } else if (event.type === "deleteProject") {
      deleteProject(event.payload.id);
    }
  };

  // Mutations
  const handleMutationSuccess = (event: Mutation) => {
    if (!event.result) return;
  };

  const handleMutationError = (event: Mutation) => {
    if (event.name === "createProject") {
      deleteProject(event.variables.id);
    } else if (event.name === "updateProject") {
      updateProject(event.variables.id, {
        ...event.rollbackData,
        startDate: event.rollbackData.startDate
          ? dayjs(event.rollbackData.startDate)
          : null,
        endDate: event.rollbackData.endDate
          ? dayjs(event.rollbackData.endDate)
          : null,
      });
    } else if (event.name === "deleteProject") {
      restoreProject(event.rollbackData);
    }
  };

  return {
    projects,
    viewFilters,

    getProjectStatus,

    getProjectById,

    addNewProject,
    deleteProject,

    handleEvent,
    handleMutationSuccess,
    handleMutationError,
  };
});

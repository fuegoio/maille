import { createStore } from "zustand";
import { persist } from "zustand/middleware";
import type { Project } from "@maille/core/projects";
import type { UUID } from "crypto";
import type { SyncEvent } from "@maille/core/sync";
import type { Mutation } from "@/mutations";
import type { ActivityType } from "@maille/core/activities";
import { activitiesStore } from "./activities";
import { storage } from "./storage";

interface ProjectsState {
  projects: Project[];
  viewFilters: {
    category: UUID | null;
    subcategory: UUID | null;
    activityType: ActivityType | null;
  };

  getProjectById: (projectId: UUID) => Project | undefined;

  addProject: (params: {
    id?: UUID;
    name: string;
    emoji: string | null;
    startDate: Date | null;
    endDate: Date | null;
  }) => Project;

  updateProject: (
    projectId: UUID,
    update: {
      name?: string;
      emoji?: string | null;
      startDate?: Date | null;
      endDate?: Date | null;
    },
  ) => void;

  deleteProject: (projectId: UUID) => void;
  restoreProject: (payload: { project: Project; activities: UUID[] }) => void;

  handleEvent: (event: SyncEvent) => void;
  handleMutationSuccess: (event: any) => void;
  handleMutationError: (event: any) => void;
  resetViewFilters: () => void;
}

export const projectsStore = createStore<ProjectsState>()(
  persist(
    (set, get) => ({
      projects: [],
      viewFilters: {
        category: null,
        subcategory: null,
        activityType: null,
      },

      getProjectById: (projectId: UUID): Project | undefined => {
        return get().projects.find((p) => p.id === projectId);
      },

      addProject: ({
        id,
        name,
        emoji,
        startDate,
        endDate,
      }: {
        id?: UUID;
        name: string;
        emoji: string | null;
        startDate: Date | null;
        endDate: Date | null;
      }): Project => {
        const newProject = {
          id: id ?? crypto.randomUUID(),
          name,
          emoji,
          startDate,
          endDate,
          workspace: null,
        };

        set((state) => ({
          projects: [...state.projects, newProject],
        }));

        return newProject;
      },

      updateProject: (
        projectId: UUID,
        update: {
          name?: string;
          emoji?: string | null;
          startDate?: Date | null;
          endDate?: Date | null;
        },
      ) => {
        set((state) => ({
          projects: state.projects.map((project) => {
            if (project.id === projectId) {
              return {
                ...project,
                name: update.name !== undefined ? update.name : project.name,
                emoji: update.emoji !== undefined ? update.emoji : project.emoji,
                startDate: update.startDate !== undefined ? update.startDate : project.startDate,
                endDate: update.endDate !== undefined ? update.endDate : project.endDate,
              };
            }
            return project;
          }),
        }));
      },

      deleteProject: (projectId: UUID) => {
        set((state) => ({
          projects: state.projects.filter((project) => project.id !== projectId),
        }));
      },

      restoreProject: (payload) => {
        set((state) => ({
          projects: [...state.projects, payload.project],
        }));

        activitiesStore.getState().activities.forEach((activity) => {
          if (payload.activities.includes(activity.id)) {
            activitiesStore.getState().updateActivity(activity.id, {
              project: payload.project.id,
            });
          }
        });
      },

      handleEvent: (event: SyncEvent) => {
        if (event.type === "createProject") {
          get().addProject({
            ...event.payload,
            startDate: null,
            endDate: null,
          });
        } else if (event.type === "updateProject") {
          get().updateProject(event.payload.id, {
            ...event.payload,
            startDate:
              event.payload.startDate !== null && event.payload.startDate !== undefined
                ? new Date(event.payload.startDate)
                : event.payload.startDate,
            endDate:
              event.payload.endDate !== null && event.payload.endDate !== undefined
                ? new Date(event.payload.endDate)
                : event.payload.endDate,
          });
        } else if (event.type === "deleteProject") {
          get().deleteProject(event.payload.id);
        }
      },

      handleMutationSuccess: (event: Mutation) => {
        if (!event.result) return;
      },

      handleMutationError: (event: Mutation) => {
        if (event.name === "createProject") {
          get().deleteProject(event.variables.id);
        } else if (event.name === "updateProject") {
          get().updateProject(event.variables.id, {
            ...event.rollbackData,
          });
        } else if (event.name === "deleteProject") {
          get().restoreProject(event.rollbackData);
        }
      },

      resetViewFilters: () => {
        set({
          viewFilters: {
            category: null,
            subcategory: null,
            activityType: null,
          },
        });
      },
    }),
    {
      name: "projects",
      storage,
    },
  ),
);

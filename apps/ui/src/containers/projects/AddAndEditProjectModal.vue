<script setup lang="ts">
import { computed, nextTick, ref, watch } from "vue";

import {
  TransitionRoot,
  TransitionChild,
  Dialog,
  DialogPanel,
} from "@headlessui/vue";

import { useProjectsStore } from "@/stores/projects";
import type { UUID } from "crypto";
import { useEventsStore } from "@/stores/events";
import {
  createProjectMutation,
  updateProjectMutation,
} from "@/mutations/projects";

const projectsStore = useProjectsStore();
const eventsStore = useEventsStore();

const props = withDefaults(
  defineProps<{
    modelValue: boolean;
    projectId?: UUID;
  }>(),
  { projectId: undefined },
);
const emit = defineEmits(["create", "update:modelValue"]);

const nameInput = ref<HTMLInputElement | null>(null);

const addNewProjectDialog = ref({
  show: props.modelValue,
  name: undefined as string | undefined,
  emoji: null as string | null,
});

const resetAddNewProjectDialog = () => {
  addNewProjectDialog.value.show = false;

  setTimeout(() => {
    if (addNewProjectDialog.value.show) return;
    addNewProjectDialog.value = {
      show: false,
      name: undefined,
      emoji: null,
    };
    emit("update:modelValue", false);
  }, 200);
};

const validForm = computed(() => {
  if (
    addNewProjectDialog.value.name === undefined ||
    addNewProjectDialog.value.name === ""
  )
    return false;
  return true;
});

const project = computed(() =>
  props.projectId !== undefined
    ? projectsStore.getProjectById(props.projectId)
    : undefined,
);

const addOrEditProject = async () => {
  if (!validForm.value) return;

  if (project.value) {
    project.value.emoji = addNewProjectDialog.value.emoji;
    project.value.name = addNewProjectDialog.value.name!;

    eventsStore.sendEvent({
      name: "updateProject",
      mutation: updateProjectMutation,
      variables: {
        id: project.value.id,
        name: project.value.name,
        emoji: project.value.emoji,
      },
      rollbackData: { ...project.value },
    });
  } else {
    const newProject = projectsStore.addNewProject(
      addNewProjectDialog.value.name!,
      addNewProjectDialog.value.emoji,
      null,
      null,
    );

    eventsStore.sendEvent({
      name: "createProject",
      mutation: createProjectMutation,
      variables: {
        id: newProject.id,
        name: newProject.name,
        emoji: newProject.emoji,
      },
      rollbackData: undefined,
    });

    emit("create", newProject.id);
  }
  resetAddNewProjectDialog();
};

const openDialog = () => {
  addNewProjectDialog.value.show = true;
  if (project.value) {
    addNewProjectDialog.value.emoji = project.value.emoji;
    addNewProjectDialog.value.name = project.value.name;
  }

  nextTick(() => {
    if (nameInput.value) nameInput.value.focus();
  });
};

watch(
  () => props.modelValue,
  (show: boolean) => {
    if (show) {
      openDialog();
    } else {
      resetAddNewProjectDialog();
    }
  },
  { immediate: true },
);
</script>

<template>
  <TransitionRoot appear :show="addNewProjectDialog.show" as="template">
    <Dialog as="div" class="relative z-50" @close="resetAddNewProjectDialog">
      <div class="fixed inset-0 overflow-y-auto">
        <div
          class="flex min-h-full items-start sm:items-center justify-center p-4 text-center"
        >
          <TransitionChild
            as="template"
            enter="duration-100 ease-out"
            enter-from="opacity-0 scale-95"
            enter-to="opacity-100 scale-100"
            leave="duration-100 ease-in"
            leave-from="opacity-100 scale-100"
            leave-to="opacity-0 scale-95"
          >
            <DialogPanel
              class="w-full max-w-2xl transform overflow-hidden rounded-lg bg-primary-800 text-left align-middle shadow-2xl transition-all border"
            >
              <div class="px-4 sm:px-8 pt-4 flex items-center">
                <div class="flex min-w-0">
                  <div
                    class="text-sm bg-primary-400 px-2 h-6 flex items-center text-white rounded min-w-0 font-medium"
                  >
                    <template v-if="project">Edit projet</template>
                    <template v-else>New project</template>
                  </div>
                </div>

                <div class="flex-1" />
                <button
                  class="inline-flex items-center justify-center w-6 h-6 transition text-primary-500 hover:text-primary-100 min-w-6 shrink-0"
                  @click="resetAddNewProjectDialog"
                >
                  <i class="mdi mdi-close text-lg" />
                </button>
              </div>

              <div class="px-4 sm:px-8 pt-6 pb-3 flex items-center">
                <TEmojiPicker
                  v-model="addNewProjectDialog.emoji"
                  placeholder="mdi-book-multiple"
                  class="mr-2"
                />
                <input
                  ref="nameInput"
                  v-model="addNewProjectDialog.name"
                  name="project-name"
                  class="text-2xl text-white font-semibold w-full break-words resize-none bg-transparent"
                  placeholder="Project name"
                />
              </div>

              <div class="border-t px-4 sm:px-8 py-4 flex justify-end">
                <TBtn outlined class="mr-3" @click="resetAddNewProjectDialog">
                  Cancel
                </TBtn>
                <TBtn :disabled="!validForm" @click="addOrEditProject">
                  <template v-if="project">Save</template>
                  <template v-else>Create</template>
                  project
                </TBtn>
              </div>
            </DialogPanel>
          </TransitionChild>
        </div>
      </div>
    </Dialog>
  </TransitionRoot>
</template>

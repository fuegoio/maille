<script setup lang="ts">
import { ref } from "vue";

const emit = defineEmits(["file"]);

const overDrop = ref(false);
const fileUploadInput = ref<HTMLElement | null>(null);

const handleDropEvent = (event: DragEvent) => {
  if (event.dataTransfer) {
    emitFile(event.dataTransfer.files[0]);
  }
};

const handleFileInputEvent = (event: Event) => {
  if (event.target) {
    emitFile((event.target as HTMLInputElement).files![0]);
  }
};

const emitFile = (file: File) => {
  emit("file", file);
};
</script>

<template>
  <div
    class="py-4 flex flex-col items-center outline-dotted outline-primary-200 outline-2 rounded"
    :class="overDrop ? 'bg-primary-900' : ''"
    @drop.prevent="handleDropEvent($event)"
    @dragover.prevent="overDrop = true"
    @dragleave.prevent="overDrop = false"
  >
    <div class="my-2">
      <i class="mdi mdi-upload text-primary-100 text-4xl" />
    </div>
    <div class="text-primary-100 text-xs">Drag and drop here, or</div>

    <input
      ref="fileUploadInput"
      name="upload-file"
      type="file"
      hidden
      onclick="this.value = null;"
      @change="handleFileInputEvent($event)"
    />
    <TBtn class="mt-5" @click="fileUploadInput!.click()">
      Select from your computer
    </TBtn>

    <div class="mt-8 text-xs text-primary-200">File should be a valid CSV.</div>
  </div>
</template>

<style scoped></style>

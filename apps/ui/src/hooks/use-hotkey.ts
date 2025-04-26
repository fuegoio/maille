import { onKeyStroke, type KeyFilter } from "@vueuse/core";

export const useHotkey = (
  key: KeyFilter,
  handler: (event: KeyboardEvent) => void
): void => {
  onKeyStroke(
    key,
    (e) => {
      if (
        !["input", "select", "textarea"].includes(
          document.activeElement!.tagName.toLowerCase()
        )
      ) {
        e.preventDefault();
        handler(e);
      }
    },
    { target: document.getElementById("app") }
  );

  onKeyStroke(
    key,
    (e) => {
      if (document.activeElement!.tagName.toLowerCase() === "body") {
        e.preventDefault();
        handler(e);
      }
    },
    { target: document }
  );
};

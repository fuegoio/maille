import type { App } from "vue";

import TSelect from "./TSelect.vue";
import TProgressCircle from "./TProgressCircle.vue";
import TMenu from "./TMenu.vue";
import TTextField from "./TTextField.vue";
import TDatePicker from "./TDatePicker.vue";
import TPeriodPicker from "./TPeriodPicker.vue";
import TBtn from "./TBtn.vue";
import TAmountInput from "./TAmountInput.vue";
import TDeleteConfirmation from "./TDeleteConfirmation.vue";
import TTooltip from "./TTooltip.vue";
import TEmojiPicker from "./TEmojiPicker.vue";

export const registerDesignSystem = (app: App<Element>) => {
  app.component("TSelect", TSelect);
  app.component("TProgressCircle", TProgressCircle);
  app.component("TMenu", TMenu);
  app.component("TTextField", TTextField);
  app.component("TDatePicker", TDatePicker);
  app.component("TPeriodPicker", TPeriodPicker);
  app.component("TBtn", TBtn);
  app.component("TAmountInput", TAmountInput);
  app.component("TDeleteConfirmation", TDeleteConfirmation);
  app.component("TTooltip", TTooltip);
  app.component("TEmojiPicker", TEmojiPicker);
};

import TSelect from "@/components/designSystem/TSelect.vue";
import TProgressCircle from "@/components/designSystem/TProgressCircle.vue";
import TMenu from "@/components/designSystem/TMenu.vue";
import TTextField from "@/components/designSystem/TTextField.vue";
import TDatePicker from "@/components/designSystem/TDatePicker.vue";
import TPeriodPicker from "@/components/designSystem/TPeriodPicker.vue";
import TBtn from "@/components/designSystem/TBtn.vue";
import TAmountInputVue from "@/components/designSystem/TAmountInput.vue";
import TDeleteConfirmation from "@/components/designSystem/TDeleteConfirmation.vue";
import TTooltip from "@/components/designSystem/TTooltip.vue";
import TEmojiPicker from "@/components/designSystem/TEmojiPicker.vue";

declare module "@vue/runtime-core" {
  export interface GlobalComponents {
    TSelect: typeof TSelect;
    TProgressCircle: typeof TProgressCircle;
    TMenu: typeof TMenu;
    TTextField: typeof TTextField;
    TDatePicker: typeof TDatePicker;
    TPeriodPicker: typeof TPeriodPicker;
    TBtn: typeof TBtn;
    TAmountInput: typeof TAmountInputVue;
    TDeleteConfirmation: typeof TDeleteConfirmation;
    TTooltip: typeof TTooltip;
    TEmojiPicker: typeof TEmojiPicker;
  }
}

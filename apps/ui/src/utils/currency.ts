import { useSettingsStore } from "@/stores/settings";

export const getCurrencyFormatter = () => {
  const settingsStore = useSettingsStore();

  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: settingsStore.settings.currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

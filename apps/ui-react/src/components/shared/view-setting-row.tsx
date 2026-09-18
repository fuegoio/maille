import { Switch } from "@/components/ui/switch";

/**
 * One row of the view settings panel: a labeled switch, the panel's only
 * control vocabulary.
 */
export function ViewSettingRow({
  label,
  description,
  checked,
  onCheckedChange,
}: {
  label: string;
  description?: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
}) {
  return (
    <label className="flex cursor-pointer items-start justify-between gap-4 border-b px-4 py-3 last:border-b-0">
      <span className="min-w-0">
        <span className="block text-sm font-medium">{label}</span>
        {description && (
          <span className="mt-0.5 block text-sm text-muted-foreground">
            {description}
          </span>
        )}
      </span>
      <span className="pt-0.5">
        <Switch checked={checked} onCheckedChange={onCheckedChange} />
      </span>
    </label>
  );
}

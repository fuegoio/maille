import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { useAssets } from "@/stores/assets";

interface AssetSelectProps {
  value: string | null | undefined;
  onValueChange: (value: string) => void;
  accountId: string;
  className?: string;
}

export function AssetSelect({
  accountId,
  value,
  onValueChange,
  className,
}: AssetSelectProps) {
  const assets = useAssets((state) => state.assets);
  const accountAssets = assets.filter((a) => a.account === accountId);

  return (
    <Select value={value || undefined} onValueChange={onValueChange}>
      <SelectTrigger className={cn("w-full", className)}>
        <SelectValue placeholder="Select a asset" />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          <SelectLabel>Assets</SelectLabel>
          {accountAssets.map((asset) => (
            <SelectItem key={asset.id} value={asset.id}>
              {asset.name}
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  );
}

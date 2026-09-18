import { ChevronDownIcon, PlusIcon } from "lucide-react";
import { useState } from "react";

import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { selectTriggerClass } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { createAssetMutation } from "@/mutations/assets";
import { useAssets } from "@/stores/assets";
import { useSync } from "@/stores/sync";

interface AssetSelectProps {
  value: string | null | undefined;
  onValueChange: (value: string) => void;
  accountId: string;
  className?: string;
  size?: "sm" | "default";
  placeholder?: string;
}

export function AssetSelect({
  accountId,
  value,
  onValueChange,
  className,
  size = "default",
  placeholder = "Select an asset",
}: AssetSelectProps) {
  const assets = useAssets((state) => state.assets);
  const mutate = useSync((state) => state.mutate);
  const accountAssets = assets.filter((a) => a.account === accountId);

  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const selectedAsset = accountAssets.find((a) => a.id === value);
  const trimmedSearch = search.trim();

  // Offer creation only for names that don't already exist on this account,
  // so typing an existing asset's name just selects it
  const canCreate =
    trimmedSearch.length > 0 &&
    !accountAssets.some(
      (asset) => asset.name.toLowerCase() === trimmedSearch.toLowerCase(),
    );

  const handleSelect = (assetId: string) => {
    onValueChange(assetId);
    setSearch("");
    setOpen(false);
  };

  const handleCreate = () => {
    const asset = {
      id: crypto.randomUUID(),
      account: accountId,
      name: trimmedSearch,
      description: null,
      location: null,
    };

    mutate({
      name: "createAsset",
      mutation: createAssetMutation,
      variables: asset,
      rollbackData: undefined,
      events: [
        {
          type: "createAsset",
          payload: asset,
        },
      ],
    });

    handleSelect(asset.id);
  };

  return (
    <Popover
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen);
        if (!nextOpen) setSearch("");
      }}
    >
      <PopoverTrigger asChild>
        <button
          type="button"
          data-size={size}
          aria-label="Asset"
          className={cn(selectTriggerClass, className)}
        >
          <span
            className={cn(
              "truncate",
              !selectedAsset && "text-muted-foreground",
            )}
          >
            {selectedAsset?.name || placeholder}
          </span>
          <ChevronDownIcon className="pointer-events-none size-4 text-muted-foreground" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-56 p-0" align="start">
        <Command>
          <CommandInput
            value={search}
            onValueChange={setSearch}
            placeholder="Search or create an asset ..."
          />
          <CommandList>
            <CommandEmpty>
              {accountAssets.length === 0 && !trimmedSearch
                ? "No assets yet. Type a name to create one."
                : "No asset found."}
            </CommandEmpty>
            {accountAssets.length > 0 && (
              <CommandGroup heading="Assets">
                {accountAssets.map((asset) => (
                  <CommandItem
                    key={asset.id}
                    value={asset.name}
                    onSelect={() => handleSelect(asset.id)}
                  >
                    {asset.name}
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
            {canCreate && (
              <CommandGroup>
                <CommandItem
                  value={`create ${trimmedSearch}`}
                  onSelect={handleCreate}
                >
                  <PlusIcon />
                  Create "{trimmedSearch}"
                </CommandItem>
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

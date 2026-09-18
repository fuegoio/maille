import { Plus, Search } from "lucide-react";
import * as React from "react";

import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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

  const [open, setOpen] = React.useState(false);
  const [searchTerm, setSearchTerm] = React.useState("");
  const searchInputRef = React.useRef<HTMLInputElement>(null);
  const [highlightedIndex, setHighlightedIndex] = React.useState(-1);

  React.useEffect(() => {
    setHighlightedIndex(-1);
  }, [searchTerm]);

  React.useEffect(() => {
    if (open) {
      const isTouchDevice = window.matchMedia("(pointer: coarse)").matches;
      if (isTouchDevice) return;
      const frame = requestAnimationFrame(() =>
        searchInputRef.current?.focus(),
      );
      return () => cancelAnimationFrame(frame);
    } else {
      setSearchTerm("");
      setHighlightedIndex(-1);
    }
  }, [open]);

  // Filter assets based on the search term
  const filteredAssets = React.useMemo(() => {
    return accountAssets.filter((asset) =>
      asset.name.toLowerCase().includes(searchTerm.toLowerCase()),
    );
  }, [accountAssets, searchTerm]);

  const handleAssetChange = (assetId: string) => {
    if (assetId === "create-new") {
      handleCreate();
    } else {
      onValueChange(assetId);
    }
  };

  // Creating from the select skips the modal: the asset lands on the
  // account optimistically and is selected right away
  const handleCreate = () => {
    const asset = {
      id: crypto.randomUUID(),
      account: accountId,
      name: searchTerm.trim(),
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

    onValueChange(asset.id);
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightedIndex((i) => Math.min(i + 1, filteredAssets.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightedIndex((i) => Math.max(i - 1, -1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const index = highlightedIndex >= 0 ? highlightedIndex : 0;
      if (filteredAssets[index]) {
        onValueChange(filteredAssets[index].id);
        setOpen(false);
      } else if (searchTerm) {
        handleCreate();
        setOpen(false);
      }
    }
  };

  return (
    <Select
      value={value || ""}
      onValueChange={handleAssetChange}
      open={open}
      onOpenChange={setOpen}
    >
      <SelectTrigger size={size} className={className} aria-label="Asset">
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent
        position="popper"
        onPointerDownOutside={(e) => {
          if (document.activeElement === searchInputRef.current)
            e.preventDefault();
        }}
      >
        {/* Search input */}
        <InputGroup className="gap-1 rounded-none border-t-0 border-r-0 border-b border-l-0 bg-background! ring-0!">
          <InputGroupInput
            ref={searchInputRef}
            type="text"
            placeholder="Search ..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={handleSearchKeyDown}
          />
          <InputGroupAddon>
            <Search className="size-3 text-muted-foreground" />
          </InputGroupAddon>
        </InputGroup>

        {accountAssets.map((asset) => {
          const visibleIndex = filteredAssets.findIndex(
            (f) => f.id === asset.id,
          );
          const isHidden = visibleIndex === -1;
          const isHighlighted = visibleIndex === highlightedIndex;
          return (
            <SelectItem
              key={asset.id}
              value={asset.id}
              className={cn(
                "px-2",
                isHidden && "hidden",
                isHighlighted && "bg-accent text-accent-foreground",
              )}
            >
              <span>{asset.name}</span>
            </SelectItem>
          );
        })}

        {/* Assets list */}
        {filteredAssets.length === 0 && (
          <>
            {searchTerm ? (
              <SelectItem value="create-new" className="px-2">
                <Plus />
                Create new asset:{" "}
                <span className="text-muted-foreground">"{searchTerm}"</span>
              </SelectItem>
            ) : (
              <p className="px-2 py-1 text-xs text-muted-foreground">
                No assets available.
              </p>
            )}
          </>
        )}
      </SelectContent>
    </Select>
  );
}

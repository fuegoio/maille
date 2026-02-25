import emojibaseData from "emojibase-data/en/data.json";
import emojibaseMessages from "emojibase-data/en/messages.json";
import { Search } from "lucide-react";
import { useState, useMemo } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

interface EmojiPickerProps {
  value: string | null;
  onChange: (emoji: string | null) => void;
  placeholder?: string;
  className?: string;
}

// Group emojis by category
const groupEmojisByCategory = () => {
  const categories = new Map<number, { emoji: string; keywords: string[] }[]>();

  Object.values(emojibaseData).forEach((emojiData) => {
    if (emojiData.emoji && emojiData.group) {
      const category = emojiData.group;
      if (!categories.has(category)) {
        categories.set(category, []);
      }

      const keywords = (emojiData.tags ?? []).concat(emojiData.label);
      categories.get(category)?.push({
        emoji: emojiData.emoji,
        keywords: keywords,
      });
    }
  });

  return categories;
};

export function EmojiPicker({
  value,
  onChange,
  placeholder = "📚",
  className,
}: EmojiPickerProps) {
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const emojiCategories = useMemo(() => groupEmojisByCategory(), []);

  // Filter emojis based on search term
  const filteredCategories = useMemo(() => {
    if (!searchTerm) return emojiCategories;

    const filtered = new Map<number, { emoji: string; keywords: string[] }[]>();

    emojiCategories.forEach((emojis, category) => {
      const filteredEmojis = emojis.filter(({ emoji, keywords }) => {
        const searchLower = searchTerm.toLowerCase();
        const emojiMatches = emoji.toLowerCase().includes(searchLower);
        const keywordMatches = keywords.some((keyword) =>
          keyword.toLowerCase().includes(searchLower),
        );
        return emojiMatches || keywordMatches;
      });

      if (filteredEmojis.length > 0) {
        filtered.set(category, filteredEmojis);
      }
    });

    return filtered;
  }, [searchTerm, emojiCategories]);

  // Get all categories for tabs
  const categories = Array.from(filteredCategories.keys());

  const getCategoryDisplayName = (categoryId: number) => {
    return emojibaseMessages.groups[categoryId].message
      .replace(/-/g, " ")
      .replace(/\b\w/g, (l) => l.toUpperCase());
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={cn("h-8 w-8 rounded-full", className)}
        >
          {value || placeholder}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[350px] p-0">
        <div className="flex h-[400px] flex-col">
          {/* Search input */}
          <div className="border-b p-2">
            <div className="relative">
              <Search className="absolute top-2 left-2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search emojis..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="h-8 pl-8 text-sm"
                autoFocus
              />
            </div>
          </div>

          <div className="flex min-h-0 flex-1 flex-col">
            {/* Emoji grid */}
            <div className="min-h-0 flex-1 overflow-y-scroll p-2">
              {categories.map((category) => (
                <div key={category} className="mb-8 space-y-2">
                  <div className="px-1 text-xs font-medium text-muted-foreground">
                    {getCategoryDisplayName(category)}
                  </div>
                  <div className="grid grid-cols-8 gap-1">
                    {filteredCategories.get(category)?.map(({ emoji }) => (
                      <Button
                        key={emoji}
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-lg hover:bg-muted"
                        onClick={() => {
                          onChange(emoji);
                          setOpen(false);
                        }}
                      >
                        {emoji}
                      </Button>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Clear button */}
            <div className="flex justify-end border-t p-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  onChange(null);
                  setOpen(false);
                }}
                className="text-destructive hover:text-destructive"
              >
                Clear
              </Button>
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

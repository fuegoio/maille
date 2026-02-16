import { Button } from "@/components/ui/button";
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

// Common emojis for projects
const commonEmojis = [
  "📚",
  "💼",
  "🏠",
  "🚀",
  "💻",
  "📊",
  "🎯",
  "🔧",
  "📝",
  "📅",
  "💰",
  "🛒",
  "📦",
  "🚛",
  "🏢",
  "🌱",
  "🎨",
  "📈",
  "🔍",
  "💡",
  "🛠️",
  "📱",
  "🖥️",
  "🌐",
  "📁",
  "📂",
  "📃",
  "📄",
  "📋",
  "📌",
  "📍",
  "📎",
];

export function EmojiPicker({
  value,
  onChange,
  placeholder = "📚",
  className,
}: EmojiPickerProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={cn("h-8 w-8 rounded-full", className)}
        >
          {value || placeholder}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="grid w-64 grid-cols-8 gap-1 p-2">
        {commonEmojis.map((emoji) => (
          <Button
            key={emoji}
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-lg"
            onClick={() => onChange(emoji)}
          >
            {emoji}
          </Button>
        ))}
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-lg"
          onClick={() => onChange(null)}
        >
          ❌
        </Button>
      </PopoverContent>
    </Popover>
  );
}

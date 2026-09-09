import { Upload } from "lucide-react";
import { useState, useRef } from "react";

import { Button } from "@/components/ui/button";

interface UploadDropZoneProps {
  onFile: (file: File) => void;
}

export function UploadDropZone({ onFile }: UploadDropZoneProps) {
  const [overDrop, setOverDrop] = useState(false);
  const fileUploadInput = useRef<HTMLInputElement>(null);

  const handleDropEvent = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    if (event.dataTransfer) {
      emitFile(event.dataTransfer.files[0]);
    }
    setOverDrop(false);
  };

  const handleFileInputEvent = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      emitFile(event.target.files[0]);
    }
  };

  const emitFile = (file: File) => {
    onFile(file);
  };

  return (
    <div
      className={`flex flex-col items-center rounded border-2 border-dashed py-4 transition-colors ${
        overDrop ? "border-primary bg-primary/5" : "border-muted-foreground/30"
      }`}
      onDrop={handleDropEvent}
      onDragOver={(e) => {
        e.preventDefault();
        setOverDrop(true);
      }}
      onDragLeave={(e) => {
        e.preventDefault();
        setOverDrop(false);
      }}
    >
      <div className="my-2">
        <Upload className="size-10 text-muted-foreground" />
      </div>
      <div className="text-xs text-muted-foreground">
        Drag and drop here, or
      </div>

      <input
        ref={fileUploadInput}
        name="upload-file"
        type="file"
        hidden
        accept=".csv"
        onClick={(e) => {
          // @ts-ignore
          e.target.value = null;
        }}
        onChange={handleFileInputEvent}
      />
      <Button
        className="mt-5"
        variant="outline"
        onClick={() => fileUploadInput.current?.click()}
      >
        Select from your computer
      </Button>

      <div className="mt-8 text-xs text-muted-foreground">
        File should be a valid CSV.
      </div>
    </div>
  );
}

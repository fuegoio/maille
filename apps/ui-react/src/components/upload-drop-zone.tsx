import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Upload } from "lucide-react";

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
      className={`outline-primary-200 flex flex-col items-center rounded py-4 outline-2 outline-dotted ${
        overDrop ? "bg-primary-900" : ""
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
        <Upload className="text-primary-100 size-10" />
      </div>
      <div className="text-primary-100 text-xs">Drag and drop here, or</div>

      <input
        ref={fileUploadInput}
        name="upload-file"
        type="file"
        hidden
        onClick={(e) => {
          // @ts-ignore
          e.target.value = null;
        }}
        onChange={handleFileInputEvent}
      />
      <Button className="mt-5" variant="outline" onClick={() => fileUploadInput.current?.click()}>
        Select from your computer
      </Button>

      <div className="text-primary-200 mt-8 text-xs">File should be a valid CSV.</div>
    </div>
  );
}

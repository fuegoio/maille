import { useState } from "react";
import { Button } from "@/components/ui/button";
import { PlusIcon } from "lucide-react";
import { AddAndEditProjectModal } from "./add-and-edit-project-modal";

interface AddProjectButtonProps {
  onCreate?: (projectId: string) => void;
  className?: string;
}

export function AddProjectButton({ onCreate, className }: AddProjectButtonProps) {
  const [showModal, setShowModal] = useState(false);

  const handleCreate = (projectId: string) => {
    setShowModal(false);
    if (onCreate) {
      onCreate(projectId);
    }
  };

  return (
    <>
      <Button
        className={className}
        size="sm"
        onClick={() => setShowModal(true)}
      >
        <PlusIcon className="h-4 w-4 mr-2" />
        <span>New project</span>
      </Button>

      <AddAndEditProjectModal
        open={showModal}
        onOpenChange={setShowModal}
        onCreate={handleCreate}
      />
    </>
  );
}
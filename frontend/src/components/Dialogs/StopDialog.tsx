import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { StopServer } from "@/wailsjs/go/main/App";

interface StopDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function StopDialog({ isOpen, onClose, onSuccess }: StopDialogProps) {
  const handleStop = () => {
    StopServer().then((success) => {
      if (success && onSuccess) {
        onSuccess();
      }
    });

    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[28rem]">
        <DialogHeader>
          <DialogTitle>Are you sure?</DialogTitle>
          <DialogDescription>
            <p>
              This will stop the server and close all connections.
              <br />
              The world will be saved.
            </p>
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button onClick={onClose}>Cancel</Button>
          <Button variant={"destructive"} type="submit" onClick={handleStop}>
            Stop
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

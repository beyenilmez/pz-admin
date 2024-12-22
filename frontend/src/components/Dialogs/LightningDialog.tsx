import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Lightning } from "@/wailsjs/go/main/App";

interface LightningDialogProps {
  isOpen: boolean;
  onClose: () => void;
  names: string[];
}

export function LightningDialog({ isOpen, onClose, names }: LightningDialogProps) {
  const handleLightning = () => {
    onClose();

    Lightning(names);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[28rem]">
        <DialogHeader>
          <DialogTitle>Trigger Lightning</DialogTitle>
          <DialogDescription>
            <p>{"You will trigger lightning for " + names.join(", ") + "."}</p>
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button type="submit" onClick={handleLightning}>
            Trigger Lightning
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

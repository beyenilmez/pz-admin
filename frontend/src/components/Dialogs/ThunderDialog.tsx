import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Thunder } from "@/wailsjs/go/main/App";

interface ThunderDialogProps {
  isOpen: boolean;
  onClose: () => void;
  names: string[];
}

export function ThunderDialog({ isOpen, onClose, names }: ThunderDialogProps) {
  const handleThunder = () => {
    onClose();

    Thunder(names);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[28rem]">
        <DialogHeader>
          <DialogTitle>Trigger Thunder</DialogTitle>
          <DialogDescription>
            <p>{"You will trigger thunder for " + names.join(", ") + "."}</p>
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button type="submit" onClick={handleThunder}>
            Trigger Thunder
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

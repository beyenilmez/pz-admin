import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { UnbanUsers } from "@/wailsjs/go/main/App";

interface UnbanUserDialogProps {
  isOpen: boolean;
  onClose: () => void;
  names: string[];
}

export function UnbanUserDialog({ isOpen, onClose, names }: UnbanUserDialogProps) {
  const handleBan = () => {
    onClose();
    
    UnbanUsers(names);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[28rem]">
        <DialogHeader>
          <DialogTitle>{names.length > 1 ? "Unban Users" : "Unban User"}</DialogTitle>
          <DialogDescription>
            <p>{"You will unban " + names.join(", ") + "."}</p>
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button type="submit" onClick={handleBan}>
            Unban
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

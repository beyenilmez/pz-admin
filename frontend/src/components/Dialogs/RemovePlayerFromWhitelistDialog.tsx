import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { useEffect, useState } from "react";
import { RemovePlayersFromWhitelist } from "@/wailsjs/go/main/App";

interface RemovePlayerFromWhitelistDialogProps {
  isOpen: boolean;
  onClose: () => void;
  names: string[];
  setRowSelection: React.Dispatch<React.SetStateAction<string[]>>;
}

export function RemovePlayerFromWhitelistDialog({
  isOpen,
  onClose,
  names,
  setRowSelection,
}: RemovePlayerFromWhitelistDialogProps) {
  const [removeFromList, setRemoveFromList] = useState(false);

  const handleRemove = () => {
    onClose();

    RemovePlayersFromWhitelist(names, removeFromList).then((successCount) => {
      if (removeFromList && successCount > 0) {
        setRowSelection([]);
      }
    });
  };

  useEffect(() => {
    setRemoveFromList(false);
  }, [isOpen]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[28rem]">
        <DialogHeader>
          <DialogTitle>
            {names.length > 1 ? "Remove Players From Whitelist" : "Remove Player From Whitelist"}
          </DialogTitle>
          <DialogDescription>
            <p>{"You will remove: " + names.join(", ") + "."}</p>
          </DialogDescription>
        </DialogHeader>
        <div className="flex items-center space-x-2">
          <Checkbox
            id="w-remove-list"
            checked={removeFromList}
            onCheckedChange={(value: boolean) => setRemoveFromList(value)}
          />
          <label
            htmlFor="w-remove-list"
            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
          >
            Remove from players list too
          </label>
        </div>
        <DialogFooter>
          <Button type="submit" onClick={handleRemove}>
            Remove {names.length > 1 ? "Players" : "Player"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

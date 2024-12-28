import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useEffect, useState } from "react";
import { Input } from "../ui/input";
import { CreateHorde } from "@/wailsjs/go/main/App";

interface CreateHordeDialogProps {
  isOpen: boolean;
  onClose: () => void;
  names: string[];
}

export function CreateHordeDialog({ isOpen, onClose, names }: CreateHordeDialogProps) {
  const [count, setCount] = useState("");

  const handleCreateHorde = () => {
    onClose();

    // Check if count is a number
    if (isNaN(parseInt(count))) {
      return;
    }

    CreateHorde(names, parseInt(count));
  };

  useEffect(() => {
    setCount("");
  }, [isOpen]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[28rem]">
        <DialogHeader>
          <DialogTitle>{names.length > 1 ? "Ban Users" : "Ban User"}</DialogTitle>
          <DialogDescription>
            <p>{"You will create a horde near " + names.join(", ") + "."}</p>
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-1">
          <Label htmlFor="horde-size" className="text-right">
            Horde Size
          </Label>
          <Input
            value={count}
            onChange={(e) => setCount(e.target.value)}
            min={0}
            id="horde-size"
            type="number"
            placeholder="150"
          />
        </div>
        <DialogFooter>
          <Button
            type="submit"
            onClick={handleCreateHorde}
            disabled={count === "" || isNaN(parseInt(count)) || parseInt(count) < 0}
          >
            Create Horde
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

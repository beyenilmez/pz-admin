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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { SetAccessLevel } from "@/wailsjs/go/main/App";
import { useEffect, useState } from "react";

interface SetAccessLevelDialogProps {
  isOpen: boolean;
  onClose: () => void;
  names: string[];
  defaultValue?: string;
}

export function SetAccessLevelDialog({ isOpen, onClose, names, defaultValue }: SetAccessLevelDialogProps) {
  const [value, setValue] = useState(defaultValue!);

  const handleSetAccessLevel = () => {
    onClose();

    SetAccessLevel(names, value ? value : defaultValue!);
  };

  useEffect(() => {
    setValue("");
  }, [isOpen]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[28rem]">
        <DialogHeader>
          <DialogTitle>Set Access Level</DialogTitle>
          <DialogDescription>
            <p>{"You will set access level of " + names.join(", ") + "."}</p>
          </DialogDescription>
        </DialogHeader>
        <RadioGroup defaultValue={defaultValue!} onValueChange={setValue}>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="player" id="radio-player" />
            <Label htmlFor="radio-player">Player</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="observer" id="radio-observer" />
            <Label htmlFor="radio-observer" className="dark:text-slate-400 text-slate-500">
              Observer
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="gm" id="radio-gm" />
            <Label htmlFor="radio-gm" className="text-amber-600">
              GM
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="overseer" id="radio-overseer" />
            <Label htmlFor="radio-overseer" className="text-sky-600">
              Overseer
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="moderator" id="radio-moderator" />
            <Label htmlFor="radio-moderator" className="text-emerald-600">
              Moderator
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="admin" id="radio-admin" />
            <Label htmlFor="radio-admin" className="text-rose-500">
              Admin
            </Label>
          </div>
        </RadioGroup>
        <DialogFooter>
          <Button type="submit" onClick={handleSetAccessLevel} disabled={!defaultValue && !value}>
            Set Access Level
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

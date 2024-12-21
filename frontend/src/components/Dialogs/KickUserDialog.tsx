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
import { Textarea } from "../ui/textarea";
import { KickUsers } from "@/wailsjs/go/main/App";
import { useEffect, useState } from "react";

interface KickUserDialogProps {
  isOpen: boolean;
  onClose: () => void;
  names: string[];
}

export function KickUserDialog({ isOpen, onClose, names }: KickUserDialogProps) {
  const [reason, setReason] = useState("");

  const handleBan = () => {
    onClose();

    KickUsers(names, reason);
  };

  useEffect(() => {
    setReason("");
  }, [isOpen]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[28rem]">
        <DialogHeader>
          <DialogTitle>{names.length > 1 ? "Kick Users" : "Kick User"}</DialogTitle>
          <DialogDescription>
            <p>{"You will kick " + names.join(", ") + "."}</p>
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-1">
          <Label htmlFor="kick-reason" className="text-right">
            Reason
          </Label>
          <Textarea
            value={reason}
            onChange={(e) => setReason(e.target.value.replace(/[\\"']/g, ""))}
            id="kick-reason"
            placeholder="Spam, etc."
            className="col-span-3 max-h-64"
          />
        </div>
        <DialogFooter>
          <Button type="submit" onClick={handleBan}>
            Kick
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

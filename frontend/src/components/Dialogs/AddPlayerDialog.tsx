import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { AddPlayer } from "@/wailsjs/go/main/App";
import { useEffect, useState } from "react";
import { useRcon } from "@/contexts/rcon-provider";
import { Input } from "../ui/input";
import { useTranslation } from "react-i18next";

interface AddPlayerDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AddPlayerDialog({ isOpen, onClose }: AddPlayerDialogProps) {
  const { t } = useTranslation();
  const { players } = useRcon();
  const [name, setName] = useState("");

  const handleAddPlayer = () => {
    onClose();

    AddPlayer(name);
  };

  useEffect(() => {
    setName("");
  }, [isOpen]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[28rem]">
        <DialogHeader>
          <DialogTitle>{t("admin_panel.tabs.players.dialogs.add_missing_player.title")}</DialogTitle>
        </DialogHeader>
        <div className="space-y-1">
          <Label htmlFor="reason" className="text-right">
            {t("admin_panel.tabs.players.dialogs.add_missing_player.name")}
          </Label>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value.replace(/[\\"']/g, ""))}
            id="reason"
            placeholder="John Doe"
          />
          <p className="text-sm font-medium text-destructive h-4">
            {players.some((player) => player.name === name) && "Player already exists in list"}
          </p>
        </div>
        <DialogFooter>
          <Button
            type="submit"
            onClick={handleAddPlayer}
            disabled={!name || players.some((player) => player.name === name)}
          >
            {t("admin_panel.tabs.players.dialogs.add_missing_player.submit")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { AddPlayerToWhitelist } from "@/wailsjs/go/main/App";
import { useEffect, useState } from "react";
import { Input } from "../ui/input";
import { useTranslation } from "react-i18next";

interface AddPlayerToWhitelistDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AddPlayerToWhitelistDialog({ isOpen, onClose }: AddPlayerToWhitelistDialogProps) {
  const { t } = useTranslation();
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");

  const handleAddPlayer = () => {
    onClose();

    AddPlayerToWhitelist(name, password);
  };

  useEffect(() => {
    setName("");
    setPassword("");
  }, [isOpen]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[28rem] gap-0">
        <DialogHeader>
          <DialogTitle>{t("admin_panel.tabs.players.dialogs.addplayertowhitelist.title")}</DialogTitle>
        </DialogHeader>
        <div className="py-4">
          <div className="space-y-1">
            <Label htmlFor="w-name" className="text-right">
              {t("admin_panel.tabs.players.dialogs.addplayertowhitelist.name")}
            </Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value.replace(/[\\"']/g, ""))}
              id="w-name"
              placeholder="John Doe"
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="w-pass" className="text-right">
              {t("admin_panel.tabs.players.dialogs.addplayertowhitelist.password")}
            </Label>
            <Input value={password} onChange={(e) => setPassword(e.target.value.replace(/[\\"']/g, ""))} id="w-pass" />
          </div>
        </div>
        <DialogFooter>
          <Button
            type="submit"
            onClick={handleAddPlayer}
            disabled={!name || !password || name.length < 3 || password.length < 1}
          >
            {t("admin_panel.tabs.players.dialogs.addplayertowhitelist.submit")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

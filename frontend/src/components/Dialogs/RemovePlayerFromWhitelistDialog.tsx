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
import { useTranslation } from "react-i18next";

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
  const { t } = useTranslation();
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
            {names.length > 1
              ? t("admin_panel.tabs.players.dialogs.removeplayersfromwhitelist.title_multiple")
              : t("admin_panel.tabs.players.dialogs.removeplayersfromwhitelist.title")}
          </DialogTitle>
          <DialogDescription>
            <p>
              {t("admin_panel.tabs.players.dialogs.removeplayersfromwhitelist.players", { players: names.join(", ") })}
            </p>
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
            {t("admin_panel.tabs.players.dialogs.removeplayersfromwhitelist.remove_from_players_list")}
          </label>
        </div>
        <DialogFooter>
          <Button type="submit" onClick={handleRemove}>
            {names.length > 1
              ? t("admin_panel.tabs.players.dialogs.removeplayersfromwhitelist.submit_multiple")
              : t("admin_panel.tabs.players.dialogs.removeplayersfromwhitelist.submit")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

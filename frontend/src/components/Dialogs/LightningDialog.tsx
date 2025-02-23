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
import { useTranslation } from "react-i18next";

interface LightningDialogProps {
  isOpen: boolean;
  onClose: () => void;
  names: string[];
}

export function LightningDialog({ isOpen, onClose, names }: LightningDialogProps) {
  const { t } = useTranslation();
  const handleLightning = () => {
    onClose();

    Lightning(names);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[28rem]">
        <DialogHeader>
          <DialogTitle>{t("admin_panel.tabs.players.dialogs.lightning.title")}</DialogTitle>
          <DialogDescription>
            <p>{t("admin_panel.tabs.players.dialogs.lightning.players", { players: names.join(", ") })}</p>
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button type="submit" onClick={handleLightning}>
            {t("admin_panel.tabs.players.dialogs.lightning.submit")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

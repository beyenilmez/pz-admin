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
import { useTranslation } from "react-i18next";

interface ThunderDialogProps {
  isOpen: boolean;
  onClose: () => void;
  names: string[];
}

export function ThunderDialog({ isOpen, onClose, names }: ThunderDialogProps) {
  const { t } = useTranslation();
  const handleThunder = () => {
    onClose();

    Thunder(names);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[28rem]">
        <DialogHeader>
          <DialogTitle>{t("admin_panel.tabs.players.dialogs.thunder.title")}</DialogTitle>
          <DialogDescription>
            <p>{t("admin_panel.tabs.players.dialogs.thunder.players", { players: names.join(", ") })}</p>
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button type="submit" onClick={handleThunder}>
            {t("admin_panel.tabs.players.dialogs.thunder.submit")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

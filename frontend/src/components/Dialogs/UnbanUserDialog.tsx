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
import { useTranslation } from "react-i18next";

interface UnbanUserDialogProps {
  isOpen: boolean;
  onClose: () => void;
  names: string[];
}

export function UnbanUserDialog({ isOpen, onClose, names }: UnbanUserDialogProps) {
  const { t } = useTranslation();
  const handleBan = () => {
    onClose();

    UnbanUsers(names);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[28rem]">
        <DialogHeader>
          <DialogTitle>
            {names.length > 1
              ? t("admin_panel.tabs.players.dialogs.unbanuser.title_multiple")
              : t("admin_panel.tabs.players.dialogs.unbanuser.title")}
          </DialogTitle>
          <DialogDescription>
            <p>{t("admin_panel.tabs.players.dialogs.unbanuser.players", { players: names.join(", ") })}</p>
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button type="submit" onClick={handleBan}>
            {t("admin_panel.tabs.players.dialogs.unbanuser.submit")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

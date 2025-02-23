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
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "../ui/textarea";
import { BanUsers } from "@/wailsjs/go/main/App";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

interface BanUserDialogProps {
  isOpen: boolean;
  onClose: () => void;
  names: string[];
}

export function BanUserDialog({ isOpen, onClose, names }: BanUserDialogProps) {
  const { t } = useTranslation();
  const [reason, setReason] = useState("");
  const [banIp, setBanIp] = useState(false);

  const handleBan = () => {
    onClose();

    BanUsers(names, reason, banIp);
  };

  useEffect(() => {
    setReason("");
    setBanIp(false);
  }, [isOpen]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[28rem]">
        <DialogHeader>
          <DialogTitle>
            {names.length > 1
              ? t("admin_panel.tabs.players.dialogs.banuser.title_multiple")
              : t("admin_panel.tabs.players.dialogs.banuser.title")}
          </DialogTitle>
          <DialogDescription>
            <p>{t("admin_panel.tabs.players.dialogs.banuser.players", { players: names.join(", ") })}</p>
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-1">
          <Label htmlFor="ban-reason" className="text-right">
            {t("admin_panel.tabs.players.dialogs.banuser.reason")}
          </Label>
          <Textarea
            value={reason}
            onChange={(e) => setReason(e.target.value.replace(/[\\"'\n\r]/g, ""))}
            id="ban-reason"
            placeholder={t("admin_panel.tabs.players.dialogs.banuser.reason_placeholder")}
            className="col-span-3 max-h-64"
          />
        </div>
        <div className="flex items-center space-x-2">
          <Checkbox id="ban-ip" checked={banIp} onCheckedChange={(value: boolean) => setBanIp(value)} />
          <label
            htmlFor="ban-ip"
            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
          >
            {t("admin_panel.tabs.players.dialogs.banuser.ban_ip")}
          </label>
        </div>
        <DialogFooter>
          <Button type="submit" onClick={handleBan}>
            {t("admin_panel.tabs.players.dialogs.banuser.submit")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

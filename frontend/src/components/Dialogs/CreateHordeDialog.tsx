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
import { useTranslation } from "react-i18next";

interface CreateHordeDialogProps {
  isOpen: boolean;
  onClose: () => void;
  names: string[];
}

export function CreateHordeDialog({ isOpen, onClose, names }: CreateHordeDialogProps) {
  const { t } = useTranslation();
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
          <DialogTitle>{t("admin_panel.tabs.players.dialogs.createhorde.title")}</DialogTitle>
          <DialogDescription>
            <p>{t("admin_panel.tabs.players.dialogs.createhorde.players", { players: names.join(", ") })}</p>
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-1">
          <Label htmlFor="horde-size" className="text-right">
            {t("admin_panel.tabs.players.dialogs.createhorde.horde_size")}
          </Label>
          <Input
            value={count}
            onChange={(e) => {
              const parsedValue = parseInt(e.target.value);

              if (!isNaN(parsedValue)) {
                setCount(Math.max(0, Math.min(parsedValue, 2147483647)).toString());
              } else {
                setCount(e.target.value);
              }
            }}
            min={0}
            max={2147483647}
            id="horde-size"
            type="number"
            placeholder="150"
          />
        </div>
        <DialogFooter>
          <Button
            type="submit"
            onClick={handleCreateHorde}
            disabled={count === "" || isNaN(parseInt(count)) || parseInt(count) < 0 || parseFloat(count) % 1 !== 0}
          >
            {t("admin_panel.tabs.players.dialogs.createhorde.submit")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

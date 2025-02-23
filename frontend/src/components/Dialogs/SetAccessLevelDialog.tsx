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
import { ScrollArea } from "../ui/scroll-area";
import { useTranslation } from "react-i18next";

interface SetAccessLevelDialogProps {
  isOpen: boolean;
  onClose: () => void;
  names: string[];
  defaultValue?: string;
}

export function SetAccessLevelDialog({ isOpen, onClose, names, defaultValue }: SetAccessLevelDialogProps) {
  const { t } = useTranslation();
  const [value, setValue] = useState(defaultValue || "");

  const permissions = t("admin_panel.tabs.players.dialogs.setaccesslevel.permissions", {
    returnObjects: true,
  }) as Record<string, string[]>;

  useEffect(() => {
    setValue(defaultValue || "");
  }, [isOpen, defaultValue]);

  const handleSetAccessLevel = () => {
    SetAccessLevel(names, value);
    onClose();
  };

  const roles = [
    {
      value: "player",
      label: t("admin_panel.tabs.players.columns.access_level.player"),
    },
    {
      value: "observer",
      label: t("admin_panel.tabs.players.columns.access_level.observer"),
      className: "dark:text-slate-400 text-slate-500",
    },
    { value: "gm", label: t("admin_panel.tabs.players.columns.access_level.gm"), className: "text-amber-600" },
    {
      value: "overseer",
      label: t("admin_panel.tabs.players.columns.access_level.overseer"),
      className: "text-sky-600",
    },
    {
      value: "moderator",
      label: t("admin_panel.tabs.players.columns.access_level.moderator"),
      className: "text-emerald-600",
    },
    { value: "admin", label: t("admin_panel.tabs.players.columns.access_level.admin"), className: "text-rose-500" },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("admin_panel.tabs.players.dialogs.setaccesslevel.title")}</DialogTitle>
          <DialogDescription>
            <p>{t("admin_panel.tabs.players.dialogs.setaccesslevel.players", { players: names.join(", ") })}</p>
          </DialogDescription>
        </DialogHeader>
        <div className="flex gap-16">
          <RadioGroup defaultValue={defaultValue} onValueChange={setValue}>
            {roles.map(({ value, label, className }) => (
              <div key={value} className="flex items-center space-x-2">
                <RadioGroupItem value={value} id={`radio-${value}`} />
                <Label htmlFor={`radio-${value}`} className={className}>
                  {label}
                </Label>
              </div>
            ))}
          </RadioGroup>
          <ScrollArea className="w-full h-48">
            <ul className="list-disc pl-5">
              {permissions[value]?.map((permission, index) => (
                <li key={index} className="text-sm">
                  {permission}
                </li>
              ))}
            </ul>
          </ScrollArea>
        </div>
        <DialogFooter>
          <Button type="submit" onClick={handleSetAccessLevel} disabled={!value}>
            {t("admin_panel.tabs.players.dialogs.setaccesslevel.submit")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

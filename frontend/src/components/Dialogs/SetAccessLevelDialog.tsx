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

interface SetAccessLevelDialogProps {
  isOpen: boolean;
  onClose: () => void;
  names: string[];
  defaultValue?: string;
}

const permissions: Record<string, string[]> = {
  player: [],
  observer: [
    "Toggle god mode and invisibility (self only)",
    "View connected players (/players)",
    "Teleport to players or coordinates",
    "Use noclip (self only)",
    "View server settings",
    "Open locked doors and enter safehouses",
    "Bypass lag kick and join full servers",
    "Chat while invisible",
    "See invisible players",
    "Immune to player attacks",
    "Start invisible/invincible",
    "View player stats (read-only)",
  ],
  gm: [
    "All Observer permissions",
    "Toggle god mode, invisibility, and noclip (self and others)",
    "Teleport players to each other",
    "Trigger alarms, gunshots, thunder, and choppers",
    "Control rain",
    "Add items and XP",
  ],
  overseer: [
    "All GM permissions",
    "Create hordes",
    "Kick users",
    "Send server-wide messages",
    "View player connection info",
    "Disconnect players",
    "Adjust night length",
    "Edit player stats",
    "Ban players from chat",
  ],
  moderator: [
    "All Overseer permissions",
    "Ban/unban users (including by Steam ID)",
    "Manage whitelist",
    "Assign safehouses",
    "Change access levels (except admin)",
  ],
  admin: [
    "All Moderator permissions",
    "Save and quit the world",
    "Change any access level",
    "Reload server settings and Lua files",
    "Bypass Lua checksum",
    "Send server pulses",
  ],
};

export function SetAccessLevelDialog({ isOpen, onClose, names, defaultValue }: SetAccessLevelDialogProps) {
  const [value, setValue] = useState(defaultValue || "");

  useEffect(() => {
    setValue(defaultValue || "");
  }, [isOpen, defaultValue]);

  const handleSetAccessLevel = () => {
    SetAccessLevel(names, value);
    onClose();
  };

  const roles = [
    { value: "player", label: "Player" },
    { value: "observer", label: "Observer", className: "dark:text-slate-400 text-slate-500" },
    { value: "gm", label: "GM", className: "text-amber-600" },
    { value: "overseer", label: "Overseer", className: "text-sky-600" },
    { value: "moderator", label: "Moderator", className: "text-emerald-600" },
    { value: "admin", label: "Admin", className: "text-rose-500" },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Set Access Level</DialogTitle>
          <DialogDescription>
            <p>{"You will set access level of " + names.join(", ") + "."}</p>
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
            Set Access Level
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

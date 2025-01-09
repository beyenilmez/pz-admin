import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TeleportToCoordinates, TeleportToUser } from "@/wailsjs/go/main/App";
import { main } from "@/wailsjs/go/models";
import { BrowserOpenURL } from "@/wailsjs/runtime/runtime";
import { useEffect, useState } from "react";
import { Combobox } from "../ui/combobox";
import { useRcon } from "@/contexts/rcon-provider";
import { useTranslation } from "react-i18next";

interface TeleportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  names: string[];
}

export function TeleportDialog({ isOpen, onClose, names }: TeleportDialogProps) {
  const { t } = useTranslation();
  const [tab, setTab] = useState("coordinates");
  const [coordinates, setCoordinates] = useState({} as main.Coordinates);
  const [player, setPlayer] = useState("");
  const { players } = useRcon();

  const handleTeleport = () => {
    onClose();

    if (tab === "coordinates") {
      TeleportToCoordinates(names, coordinates);
    } else {
      TeleportToUser(names, player);
    }
  };

  useEffect(() => {
    setCoordinates({} as main.Coordinates);
    setTab("coordinates");
  }, [isOpen]);

  const handlePlayerChange = (player: string) => {
    setCoordinates({} as main.Coordinates);
    setPlayer(player);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose} modal={false}>
      <div className="fixed inset-0 bg-black bg-opacity-80" hidden={!isOpen} />
      <DialogContent className="max-w-[28rem]">
        <DialogHeader>
          <DialogTitle>
            {names.length > 1
              ? t("admin_panel.tabs.players.dialogs.teleport.title_multiple")
              : t("admin_panel.tabs.players.dialogs.teleport.title")}
          </DialogTitle>
          <DialogDescription>
            <p>{t("admin_panel.tabs.players.dialogs.teleport.players", { players: names.join(", ") })}</p>
          </DialogDescription>
        </DialogHeader>
        <Tabs value={tab} className="w-[400px]">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="coordinates" onClick={() => setTab("coordinates")}>
              {t("admin_panel.tabs.players.dialogs.teleport.coordinates_tab")}
            </TabsTrigger>
            <TabsTrigger value="player" onClick={() => setTab("player")}>
              {t("admin_panel.tabs.players.dialogs.teleport.player_tab")}
            </TabsTrigger>
          </TabsList>
          <TabsContent value="coordinates" className="h-24">
            <div className="grid grid-cols-3 gap-10 pt-6 pb-2">
              <div className="flex items-center gap-2">
                <Label htmlFor="teleport_x">X</Label>
                <Input
                  value={coordinates.x}
                  onChange={(e) => setCoordinates({ ...coordinates, x: parseInt(e.target.value) })}
                  id="teleport_x"
                  type="number"
                />
              </div>
              <div className="flex items-center gap-2">
                <Label htmlFor="teleport_y">Y</Label>
                <Input
                  value={coordinates.y}
                  onChange={(e) => setCoordinates({ ...coordinates, y: parseInt(e.target.value) })}
                  id="teleport_y"
                  type="number"
                />
              </div>
              <div className="flex items-center gap-2">
                <Label htmlFor="teleport_z">Z</Label>
                <Input
                  value={coordinates.z}
                  onChange={(e) => setCoordinates({ ...coordinates, z: parseInt(e.target.value) })}
                  placeholder="0"
                  id="teleport_z"
                  type="number"
                />
              </div>
            </div>
            <Button
              variant={"link"}
              onClick={() =>
                BrowserOpenURL(
                  `https://map.projectzomboid.com/${
                    coordinates.x && coordinates.y ? "#" + coordinates.x + "x" + coordinates.y : ""
                  }`
                )
              }
            >
              {t("admin_panel.tabs.players.dialogs.teleport.preview_in_map_website")}
            </Button>
          </TabsContent>
          <TabsContent value="player" className="h-24">
            <div className="pt-6">
              <Combobox
                mandatory
                elements={players
                  .filter((player) => player.online)
                  .map((player) => ({
                    value: player.name,
                    label: player.name,
                  }))}
                placeholder={t("admin_panel.tabs.players.dialogs.teleport.player_combobox.placeholder")}
                searchPlaceholder={t("admin_panel.tabs.players.dialogs.teleport.player_combobox.search_placeholder")}
                nothingFoundMessage={t("admin_panel.tabs.players.dialogs.teleport.player_combobox.search_not_found")}
                onChange={handlePlayerChange}
              />
            </div>
          </TabsContent>
        </Tabs>
        <DialogFooter>
          <Button
            type="submit"
            onClick={handleTeleport}
            disabled={(tab == "coordinates" && (!coordinates.x || !coordinates.y)) || (tab == "player" && !player)}
          >
            {t("admin_panel.tabs.players.dialogs.teleport.submit")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

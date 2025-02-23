"use client";

import { SaveWorld } from "@/wailsjs/go/main/App";
import { Button } from "./ui/button";
import { ScrollArea } from "./ui/scroll-area";
import { useState } from "react";
import { SendMessageDialog } from "./Dialogs/SendMessageDialog";
import { StopDialog } from "./Dialogs/StopDialog";
import { WeatherControl } from "./WeatherControl";
import { RandomButtons } from "./RandomButtons";
import { OtherButtons } from "./OtherButtons";
import { useTranslation } from "react-i18next";
import { useConfig } from "@/contexts/config-provider";

export function ManagementTab() {
  const { config } = useConfig();
  const { t } = useTranslation();
  const [saving, setSaving] = useState(false);
  const handleSave = async () => {
    setSaving(true);
    await SaveWorld();
    setSaving(false);
  };

  const [isSendMessageDialogOpen, setIsSendMessageDialogOpen] = useState(false);
  const [isStopDialogOpen, setIsStopDialogOpen] = useState(false);
  const [disableStop, setDisableStop] = useState(false);

  return (
    <>
      <div
        className={`w-full ${
          config?.useSystemTitleBar ? "h-[calc(100vh-3.5rem)]" : "h-[calc(100vh-5.5rem)]"
        } dark:bg-black/20 bg-white/20 p-2`}
      >
        <div className="w-[calc(100%-1rem)]">
          <div className="flex mb-2 justify-between">
            <div className="space-x-2">
              <Button className="bg-success text-success-foreground" onClick={handleSave} disabled={saving}>
                {t("save")}
              </Button>
              <Button variant={"destructive"} onClick={() => setIsStopDialogOpen(true)} disabled={disableStop}>
                {t("stop")}
              </Button>
            </div>
            <Button onClick={() => setIsSendMessageDialogOpen(true)}>
              {t("admin_panel.tabs.management.send_message")}
            </Button>
          </div>
          <ScrollArea className={`w-full ${config?.useSystemTitleBar ? "h-[calc(100vh-7.5rem)]" : "h-[calc(100vh-9.5rem)]"}`}>
            <div>
              <WeatherControl />
              <RandomButtons />
              <OtherButtons />
            </div>
          </ScrollArea>
        </div>
      </div>

      <SendMessageDialog isOpen={isSendMessageDialogOpen} onClose={() => setIsSendMessageDialogOpen(false)} />
      <StopDialog
        isOpen={isStopDialogOpen}
        onClose={() => setIsStopDialogOpen(false)}
        onSuccess={() => setDisableStop(true)}
      />
    </>
  );
}

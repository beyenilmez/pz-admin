import ModeToggle from "@/components/ModeToggle";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import TitleBar from "./components/TitleBar";
import Settings from "./components/Settings";
import { useTranslation } from "react-i18next";
import { useEffect, useLayoutEffect, useState } from "react";
import { useStorage } from "./contexts/storage-provider";
import { Toaster } from "./components/ui/sonner";
import { toast } from "sonner";
import { OpenFileInExplorer, SendNotification, SendWindowsNotification } from "@/wailsjs/go/main/App";
import React from "react";
import { useConfig } from "./contexts/config-provider";
import { EventsOff, EventsOn, LogDebug } from "@/wailsjs/runtime/runtime";
import AdminPanel from "./components/AdminPanel";
import { Progress } from "./components/ui/progress";
import { useProgress } from "./contexts/progress-provider";
import { useRcon } from "./contexts/rcon-provider";
import { main } from "./wailsjs/go/models";

function App() {
  const { config, initialConfig } = useConfig();
  const { t } = useTranslation();
  const { setValue } = useStorage();
  const [tab, setTab] = useState("admin-panel");

  const { progress, setProgress } = useProgress();
  const { setIsConnected } = useRcon();

  useLayoutEffect(() => {
    if (
      config &&
      initialConfig &&
      config.windowScale !== undefined &&
      config.opacity !== undefined &&
      initialConfig.windowEffect !== undefined
    ) {
      document.documentElement.style.fontSize = config.windowScale * (16 / 100) + "px";

      document.documentElement.style.setProperty(
        "--opacity",
        ((initialConfig.windowEffect === 1 ? 100 : config.opacity) / 100).toString()
      );
    }
  }, [config?.windowScale, config?.opacity, initialConfig?.windowEffect]);

  useEffect(() => {
    EventsOn("toast", (data: main.Notification) => {
      const props = {
        description: t(data.message),
        action: data.path
          ? {
              label: data.path.startsWith("__") ? t("show") : t("show_in_explorer"),
              onClick: () => handleToastGotoPath(data.path),
            }
          : undefined,
      };
      switch (data.variant) {
        case "message":
          toast.message(t(data.title), props);
          break;
        case "success":
          toast.success(t(data.title), props);
          break;
        case "info":
          toast.info(t(data.title), props);
          break;
        case "warning":
          toast.warning(t(data.title), props);
          break;
        case "error":
          toast.error(t(data.title), props);
          break;
        default:
          toast(t(data.title), props);
          break;
      }
    });

    EventsOn("sendNotification", (data: main.Notification) => {
      SendWindowsNotification({
        title: t(data.title),
        message: t(data.message),
        path: data.path,
        variant: data.variant,
      });
    });

    EventsOn("rconDisconnected", () => {
      SendNotification({
        title: "RCON connection lost",
        variant: "error",
      } as main.Notification);
      setIsConnected(false);
      setProgress(0);
    });

    return () => {
      EventsOff("toast");
      EventsOff("sendNotification");
      EventsOff("rconDisconnected");
    };
  }, []);

  const handleToastGotoPath = (path: string) => {
    if (path.startsWith("__")) {
      window.goto(path.substring(2));
    } else {
      OpenFileInExplorer(path);
    }
  };

  window.goto = (path: string) => {
    LogDebug("window.goto: " + path);
    const pathArray = path.split("__");

    setTab(pathArray[0]);

    for (let i = 0; i < pathArray.length - 1; i++) {
      setValue(pathArray[i], pathArray[i + 1]);
    }
  };

  useEffect(() => {
    setValue("path1", tab);
  }, [tab]);

  window.setProgress = (value: number) => {
    setProgress(value);
  };

  return (
    <React.Fragment>
      <div className="flex flex-col h-dvh">
        <TitleBar />
        <Tabs value={tab} className="flex flex-col w-full h-full">
          <div>
            <TabsList className="justify-between px-3 py-7 rounded-none w-full h-12">
              <div>
                <TabsTrigger value="admin-panel" onClick={() => setTab("admin-panel")} className="px-6">
                  {t("Admin Panel")}
                </TabsTrigger>
                <TabsTrigger value="settings" onClick={() => setTab("settings")} className="px-6">
                  {t("nav.settings")}
                </TabsTrigger>
              </div>
              <ModeToggle />
            </TabsList>
            <div className="h-0">
              <Progress className="z-30 bg-transparent h-[1px]" value={progress} />
            </div>
          </div>

          {/* Tab Content */}
          <div className="w-full h-full relative">
            <div className={tab === "admin-panel" ? "block h-full" : "hidden"}>
              <AdminPanel />
            </div>
            <div className={tab === "settings" ? "block h-full" : "hidden"}>
              <Settings />
            </div>
          </div>
        </Tabs>
      </div>
      <Toaster expand />
    </React.Fragment>
  );
}

export default App;

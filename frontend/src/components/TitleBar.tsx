import { RestartApplication } from "@/wailsjs/go/main/App";
import { WindowMinimise, WindowToggleMaximise, Quit } from "@/wailsjs/runtime/runtime";
import { Minus, Copy, X, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import icon from "../assets/appicon.png";
import { useEffect, useState } from "react";
import { useRestart } from "@/contexts/restart-provider";
import { useStorage } from "@/contexts/storage-provider";
import { useConfig } from "@/contexts/config-provider";

export default function TitleBar() {
  const { initialConfig } = useConfig();
  const [useSystemTitleBar, setUseSystemTitleBar] = useState(false);
  const { restartRequired } = useRestart();
  const { getValue } = useStorage();

  useEffect(() => {
    if (initialConfig && initialConfig.useSystemTitleBar !== undefined) {
      setUseSystemTitleBar(initialConfig.useSystemTitleBar);
    }
  }, [initialConfig?.useSystemTitleBar]);

  return (
    !useSystemTitleBar && (
      <header
        className="flex justify-between items-center bg-muted pl-3 w-full h-8 wails-drag"
        onDoubleClick={() => WindowToggleMaximise()}
      >
        <h1 className="flex items-center gap-1.5 mt-2.5 font-semibold select-none">
          <img src={icon} className="w-5 h-5" />
          {document.title}
        </h1>
        <div className="wails-nodrag">
          <Button
            size={"icon"}
            onClick={() => WindowMinimise()}
            variant={"ghost"}
            className="hover:dark:brightness-150 hover:brightness-75 rounded-none h-8 cursor-default"
          >
            <Minus size={"1rem"} />
          </Button>
          <Button
            size={"icon"}
            onClick={() => WindowToggleMaximise()}
            variant={"ghost"}
            className="hover:dark:brightness-150 hover:brightness-75 rounded-none h-8 cursor-default"
          >
            <Copy size={"1rem"} className="rotate-90" />
          </Button>
          <Button
            size={"icon"}
            onClick={() =>
              RestartApplication([
                "--goto",
                getValue("path1") + (getValue("path2") !== undefined ? "__" + getValue("path2") : ""),
              ])
            }
            variant={"ghost"}
            className={`${restartRequired ? "" : "w-0"} transition-all
              hover:dark:brightness-150 hover:brightness-75 rounded-none h-8 cursor-default`}
          >
            <RotateCcw size={"1rem"} />
          </Button>
          <Button
            size={"icon"}
            onClick={() => Quit()}
            variant={"ghost"}
            className="hover:bg-destructive rounded-none h-8 cursor-default"
          >
            <X size={"1rem"} />
          </Button>
        </div>
      </header>
    )
  );
}

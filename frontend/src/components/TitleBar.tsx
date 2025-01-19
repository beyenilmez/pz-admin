import { RestartApplication } from "@/wailsjs/go/main/App";
import { WindowMinimise, WindowToggleMaximise, Quit, WindowIsMaximised } from "@/wailsjs/runtime/runtime";
import { Minus, Copy, X, RotateCcw, Square } from "lucide-react";
import { Button } from "@/components/ui/button";
import icon from "../assets/appicon.png";
import { useEffect, useState } from "react";
import { useRestart } from "@/contexts/restart-provider";
import { useStorage } from "@/contexts/storage-provider";
import { useConfig } from "@/contexts/config-provider";
import { useOs } from "@/contexts/os-provider";

export default function TitleBar() {
  const { os } = useOs();
  const { initialConfig } = useConfig();
  const [useSystemTitleBar, setUseSystemTitleBar] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);
  const { restartRequired } = useRestart();
  const { getValue } = useStorage();

  useEffect(() => {
    if (initialConfig && initialConfig.useSystemTitleBar !== undefined) {
      setUseSystemTitleBar(initialConfig.useSystemTitleBar);
    }
  }, [initialConfig?.useSystemTitleBar]);

  useEffect(() => {
    handleWindowChange();

    window.addEventListener("resize", handleWindowChange);
  }, []);

  const handleWindowChange = () => {
    WindowIsMaximised().then((isMaximized) => setIsMaximized(isMaximized));
  };

  return (
    !useSystemTitleBar && (
      <header
        className="flex justify-between items-center bg-muted pl-3 w-full h-8 wails-drag"
        onDoubleClick={() => {
          WindowToggleMaximise();
          handleWindowChange();
        }}
      >
        {os === "darwin" && (
          <div className="wails-nodrag flex items-center gap-2">
            <Button
              size={"icon"}
              onClick={() => Quit()}
              className="rounded-full h-4 w-4 bg-destructive hover:dark:brightness-110 hover:brightness-90"
            />
            <Button
              size={"icon"}
              onClick={() => WindowMinimise()}
              className="rounded-full h-4 w-4 bg-warning hover:dark:brightness-110 hover:brightness-90"
            />
            <Button
              size={"icon"}
              onClick={() => WindowToggleMaximise()}
              className="rounded-full h-4 w-4 bg-success hover:dark:brightness-110 hover:brightness-90"
            />
          </div>
        )}
        <h1
          className={`flex items-center gap-1.5 mt-2.5 font-semibold select-none ${
            os === "darwin" ? "justify-center w-full" : ""
          }`}
        >
          {os !== "darwin" ? (
            <>
              <img src={icon} className="w-5 h-5" />
              {document.title}
            </>
          ) : (
            <text className="mr-12">PZ Admin</text>
          )}
        </h1>
        {os !== "darwin" && (
          <div className="wails-nodrag">
            <Button
              size={"icon"}
              onClick={() => {
                WindowMinimise();
                handleWindowChange();
              }}
              variant={"ghost"}
              className="hover:dark:brightness-150 hover:brightness-75 rounded-none h-8 cursor-default"
            >
              <Minus size={"1rem"} />
            </Button>
            <Button
              size={"icon"}
              onClick={() => {
                WindowToggleMaximise();
                handleWindowChange();
              }}
              variant={"ghost"}
              className="hover:dark:brightness-150 hover:brightness-75 rounded-none h-8 cursor-default"
            >
              {isMaximized ? <Copy size={"1rem"} className="rotate-90" /> : <Square size={"1rem"} />}
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
        )}
      </header>
    )
  );
}

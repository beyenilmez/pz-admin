import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ConnectRcon, DisconnectRcon } from "@/wailsjs/go/main/App";
import TerminalPage from "./Terminal";

export default function AdminPanel() {
  const { t } = useTranslation();
  const [tab, setTab] = useState("connect");

  const [ip, setIp] = useState("");
  const [port, setPort] = useState("");
  const [password, setPassword] = useState("");

  const [connected, setConnected] = useState(false);

  const [settingsState, setSettingsState] = useState<number>(0);
  const [sandboxState, setSandboxState] = useState<number>(0);
  const [terminalState, setTerminalState] = useState<number>(0);

  const handleConnect = () => {
    if (!ip || !password) {
      return;
    }

    ConnectRcon(ip, port || "16261", password).then((connected) => {
      if (connected) {
        setConnected(true);

        setSettingsState(settingsState + 1);
        setSandboxState(sandboxState + 1);
        setTerminalState(terminalState + 1);

        setTab("terminal");
      }
    });
  };

  const handleDisconnect = () => {
    DisconnectRcon().then((disconnected) => {
      if (disconnected) {
        setConnected(false);
        setTab("connect");

        setSettingsState(settingsState + 1);
        setSandboxState(sandboxState + 1);
        setTerminalState(terminalState + 1);
      }
    });
  };

  return (
    <Tabs value={tab} className="flex w-full h-full">
      <TabsList defaultValue={"settings"} className="h-full backdrop-brightness-0 rounded-none min-w-52 p-2">
        <div className="flex flex-col justify-between w-full h-full">
          <div>
            <TabsTrigger
              value="settings"
              onClick={() => setTab("settings")}
              className="px-6 w-full"
              disabled={!connected}
            >
              {t("Settings")}
            </TabsTrigger>
            <TabsTrigger
              value="sandbox"
              onClick={() => setTab("sandbox")}
              className="px-6 w-full"
              disabled={!connected}
            >
              {t("Sandbox")}
            </TabsTrigger>
            <TabsTrigger
              value="terminal"
              onClick={() => setTab("terminal")}
              className="px-6 w-full"
              disabled={!connected}
            >
              {t("Terminal")}
            </TabsTrigger>
          </div>
          {connected && (
            <div className="text-xs space-y-2 w-full">
              <p>
                Connected to {ip}:{port}
              </p>
              <Button className="w-full" variant={"destructive"} onClick={handleDisconnect}>
                End Connection
              </Button>
            </div>
          )}
        </div>
      </TabsList>
      {/* Tab Content */}
      <div className="w-full h-full relative">
        <div className={tab === "settings" ? "block" : "hidden"} key={"settings" + settingsState}>
          <div>Settingsaaaaaaaaaaaaaaaaaaaaaaa</div>
        </div>
        <div className={tab === "sandbox" ? "block" : "hidden"} key={"sandbox" + sandboxState}>
          <div>Sandbox</div>
        </div>
        <div className={tab === "terminal" ? "block" : "hidden"} key={"terminal" + terminalState}>
          <TerminalPage />
        </div>
        <div className={tab === "connect" ? "block" : "hidden"}>
          <div className="flex w-full h-[calc(100vh-12rem)] items-center justify-center">
            <Card className="bg-transparent border-none w-1/2">
              <CardHeader>
                <CardTitle className="text-2xl">Connect to your server</CardTitle>
                <CardDescription>Enter your server details below to connect</CardDescription>
              </CardHeader>
              <CardContent>
                <form>
                  <div className="flex flex-col gap-6">
                    <div className="grid gap-2">
                      <Label htmlFor="ip">Server IP or Domain</Label>
                      <Input
                        onChange={(e) => setIp(e.target.value)}
                        id="ip"
                        type="text"
                        placeholder="127.0.0.1"
                        required
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="port">RCON Port</Label>
                      <Input
                        onChange={(e) => setPort(e.target.value)}
                        id="port"
                        type="text"
                        placeholder="16261"
                        required
                      />
                    </div>
                    <div className="grid gap-2">
                      <div className="flex items-center">
                        <Label htmlFor="password">RCON Password</Label>
                      </div>
                      <Input onChange={(e) => setPassword(e.target.value)} id="password" type="text" required />
                    </div>
                    <Button type="button" className="w-full" onClick={handleConnect} disabled={!ip || !password}>
                      Connect
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Tabs>
  );
}

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import TerminalPage from "./Terminal";
import { useRcon } from "@/contexts/rcon-provider";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { main } from "@/wailsjs/go/models";
import { Checkbox } from "./ui/checkbox";
import { DeleteCredentials, LoadCredentials, SaveCredentials } from "@/wailsjs/go/main/App";
import { useConfig } from "@/contexts/config-provider";
import { LoaderCircle } from "lucide-react";

export default function AdminPanel() {
  const { isConnected, disconnect, ip, port, players } = useRcon();

  const { t } = useTranslation();
  const [tab, setTab] = useState("connection");

  const [playersState, setPlayersState] = useState<number>(0);
  const [sandboxState, setSandboxState] = useState<number>(0);
  const [terminalState, setTerminalState] = useState<number>(0);

  useEffect(() => {
    if (isConnected && tab === "terminal") {
      setPlayersState(playersState + 1);
      setSandboxState(sandboxState + 1);
    }
  }, [tab]);

  useEffect(() => {
    if (isConnected) {
      setPlayersState(playersState + 1);
      setSandboxState(sandboxState + 1);
      setTerminalState(terminalState + 1);
      setTab("terminal");
    } else {
      setTab("connection");
      setPlayersState(playersState + 1);
      setSandboxState(sandboxState + 1);
      setTerminalState(terminalState + 1);
    }
  }, [isConnected]);

  const handleDisconnect = async () => {
    disconnect();
  };

  return (
    <Tabs value={tab} className="flex w-full h-full">
      <TabsList defaultValue={"connection"} className="h-full backdrop-brightness-0 rounded-none min-w-52 p-2">
        <div className="flex flex-col justify-between w-full h-full">
          <div>
            <TabsTrigger
              value="players"
              onClick={() => setTab("players")}
              className="px-6 w-full"
              disabled={!isConnected}
            >
              {t("Players")}
            </TabsTrigger>
            <TabsTrigger
              value="sandbox"
              onClick={() => setTab("sandbox")}
              className="px-6 w-full"
              disabled={!isConnected}
            >
              {t("Sandbox")}
            </TabsTrigger>
            <TabsTrigger
              value="terminal"
              onClick={() => setTab("terminal")}
              className="px-6 w-full"
              disabled={!isConnected}
            >
              {t("Terminal")}
            </TabsTrigger>
          </div>
          {isConnected && (
            <div className="text-xs space-y-2 w-full">
              <p>
                Connected to {ip}:{port}
              </p>
              <Button className="w-full" variant={"destructive"} onClick={handleDisconnect}>
                Disconnect
              </Button>
            </div>
          )}
        </div>
      </TabsList>
      {/* Tab Content */}
      <div className="w-full h-full relative">
        <div className={tab === "players" ? "block" : "hidden"} key={"players" + playersState}>
          <div>
            {players &&
              players.map((player, index) => (
                <div key={index}>
                  {player.name}, {player.online ? "Online" : "Offline"}
                </div>
              ))}
          </div>
        </div>
        <div className={tab === "sandbox" ? "block" : "hidden"} key={"sandbox" + sandboxState}>
          <div>Sandbox</div>
        </div>
        <div className={tab === "terminal" ? "block" : "hidden"} key={"terminal" + terminalState}>
          <TerminalPage />
        </div>
        <div className={tab === "connection" ? "block" : "hidden"}>
          <ConnectionForm />
        </div>
      </div>
    </Tabs>
  );
}

function isIpOrDomain(value: string): boolean {
  // Validates IPv4
  const ipRegex =
    /^(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)$/;
  // Validates Domain
  const domainRegex = /^(?!-)([a-zA-Z0-9-]{1,63}(?<!-)\.)+[a-zA-Z]{2,63}$/;

  return ipRegex.test(value) || domainRegex.test(value);
}

interface ConnectionFormProps {
  defaultValues?: main.Credentials;
}

function ConnectionForm({ defaultValues }: ConnectionFormProps) {
  const { isConnected, isConnecting, connect } = useRcon();
  const { t } = useTranslation();

  const { config, setConfigField } = useConfig();
  const [oneTime, setOneTime] = useState(true);

  useEffect(() => {
    if (config && oneTime) {
      setOneTime(false);
      LoadCredentials().then((credentials) => {
        if (credentials && credentials.ip && credentials.password)
          form.reset({
            ip: credentials?.ip || "",
            port: credentials?.port || "",
            password: credentials?.password || "",
          });

        if (config?.autoConnect) {
          connect({ ip: credentials.ip, port: credentials.port || "27015", password: credentials.password });
        }
      });
    }
  }, [oneTime, config]);

  // Define form schema
  const formSchema = z.object({
    ip: z
      .string()
      .min(1, { message: t("(IP or Domain is required)") })
      .max(253, { message: t("(IP or Domain is too long)") })
      .refine((value) => isIpOrDomain(value), { message: t("(Invalid IP or Domain)") }),
    port: z.string().refine((value) => !isNaN(Number(value)) && Number(value) <= 65535 && Number(value) >= 0, {
      message: t("(Invalid port)"),
    }),
    password: z.string().min(1, { message: t("(Password is required)") }),
  });

  // Initialize form
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      ip: defaultValues?.ip || "",
      port: defaultValues?.port || "",
      password: defaultValues?.password || "",
    },
  });

  // Handle form submission
  function onSubmit(data: z.infer<typeof formSchema>) {
    if (!isConnected) {
      connect({ ip: data.ip, port: data.port || "27015", password: data.password }).then((success) => {
        if (success && config?.rememberCredentials) {
          SaveCredentials(data);
        } else if (!config?.rememberCredentials) {
          DeleteCredentials();
        }
      });
    }
  }

  return (
    <>
      {isConnecting && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[50]">
          <LoaderCircle className="w-20 h-20 animate-spin" />
        </div>
      )}

      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className={`flex w-full h-[calc(100vh-12rem)] items-center justify-center ${
            isConnecting ? "pointer-events-none blur-[1px] select-none opacity-80" : ""
          }`}
          autoComplete="off"
        >
          <div className="w-1/2 space-y-4">
            {/* Header */}
            <h1 className="text-2xl font-semibold leading-none tracking-tight">{t("Connect to your server")}</h1>
            <p className="text-sm text-muted-foreground">{t("Enter your server details to connect")}</p>

            {/* IP or Domain Field */}
            <FormField
              control={form.control}
              name="ip"
              render={({ field }) => (
                <FormItem className="flex flex-col w-full space-y-0">
                  <div className="flex h-8 items-center gap-1">
                    <FormLabel>{t("Server IP or Domain")}</FormLabel>
                    <FormMessage />
                  </div>
                  <FormControl>
                    <Input type="text" placeholder={t("127.0.0.1")} {...field} />
                  </FormControl>
                </FormItem>
              )}
            />

            {/* Port Field */}
            <FormField
              control={form.control}
              name="port"
              render={({ field }) => (
                <FormItem className="flex flex-col w-full space-y-0">
                  <div className="flex h-8 items-center gap-1">
                    <FormLabel>{t("RCON Port")}</FormLabel>
                    <FormMessage />
                  </div>
                  <FormControl>
                    <Input type="number" inputMode="numeric" min={0} max={65535} placeholder={t("27015")} {...field} />
                  </FormControl>
                </FormItem>
              )}
            />

            {/* Password Field */}
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem className="flex flex-col w-full space-y-0">
                  <div className="flex h-8 items-center gap-1">
                    <FormLabel>{t("RCON Password")}</FormLabel>
                    <FormMessage />
                  </div>
                  <FormControl>
                    <Input type="password" {...field} />
                  </FormControl>
                </FormItem>
              )}
            />

            {/* Checkboxes */}
            <div className="flex items-center space-x-2">
              <Checkbox
                checked={config?.rememberCredentials || false}
                onCheckedChange={(state: boolean) => setConfigField("rememberCredentials", state)}
                id="save-credentials"
              />
              <label
                htmlFor="save-credentials"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Save credentials
              </label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                checked={config?.autoConnect || false}
                onCheckedChange={(state: boolean) => setConfigField("autoConnect", state)}
                id="auto-connect"
                disabled={config?.rememberCredentials === false}
              />
              <label
                htmlFor="auto-connect"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Automatically connect on startup
              </label>
            </div>

            {/* Submit Button */}
            <Button type="submit" className="w-full" disabled={isConnecting || isConnected}>
              {t("Connect")}
            </Button>
          </div>
        </form>
      </Form>
    </>
  );
}

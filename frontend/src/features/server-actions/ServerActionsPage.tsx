import { useMemo, useState, type ReactNode, type SyntheticEvent } from "react";
import {
  Badge,
  Button,
  Group,
  Modal,
  NumberInput,
  Stack,
  Text,
  TextInput,
  Title,
  Tooltip,
  VisuallyHidden,
} from "@mantine/core";
import { useTranslation } from "react-i18next";
import { ID as FeatureID } from "@bindings/internal/feature/models";
import {
  ReloadAllLua,
  ReloadLua,
  ReloadOptions,
  SaveWorld,
  SendMessage,
  StartRain,
  StartStorm,
  StopRain,
  StopServer,
  StopWeather,
  TriggerGunshot,
  TriggerHelicopter,
  TriggerLightning,
  TriggerThunder,
} from "@bindings/internal/serveraction/service";
import { GameMessageEditor } from "@/features/messages/components/GameMessageEditor";
import { isGameBuild, latestGameBuild } from "@/features/game/types";
import { usePlayers } from "@/features/players/PlayersProvider";
import { isOnline } from "@/features/players/status";
import { useSession } from "@/features/session/SessionProvider";
import { PageContainer } from "@/shared/layout/PageContainer";
import { MAXIMUM_RCON_COMMAND_BYTES } from "@/shared/lib/rcon";
import { utf8ByteLength } from "@/shared/lib/text";
import { dialogEditorViewport, dialogSizes } from "@/shared/layout/dialogs";
import { useServerAction } from "./hooks/useServerAction";
import classes from "./ServerActionsPage.module.css";

type DialogName = "message" | "stop";
const SERVER_MESSAGE_MAX_BYTES =
  MAXIMUM_RCON_COMMAND_BYTES - utf8ByteLength('servermsg ""');

function valueOrAutomatic(value: string | number) {
  return typeof value === "number" ? value : 0;
}

function CommandInfo({
  description,
  title,
}: {
  description: string;
  title: string;
}) {
  return (
    <Stack gap={2} miw={0}>
      <Text fw={600}>{title}</Text>
      <Text c="dimmed" size="sm">
        {description}
      </Text>
    </Stack>
  );
}

interface DialogActionsProps {
  busy: boolean;
  children: ReactNode;
  onClose: () => void;
}

function DialogActions({ busy, children, onClose }: DialogActionsProps) {
  const { t } = useTranslation("common");
  return (
    <Group className={classes.dialogActions} gap="xs" justify="flex-end">
      <Button disabled={busy} onClick={onClose} type="button" variant="default">
        {t("actions.cancel")}
      </Button>
      {children}
    </Group>
  );
}

export function ServerActionsPage() {
  const { i18n, t } = useTranslation(["serverActions", "common"]);
  const { players } = usePlayers();
  const { profile, supports } = useSession();
  const build =
    profile && isGameBuild(profile.version) ? profile.version : latestGameBuild;
  const { pending, run } = useServerAction();
  const [dialog, setDialog] = useState<DialogName | null>(null);
  const [message, setMessage] = useState("");
  const [rainIntensity, setRainIntensity] = useState<string | number>("");
  const [stormDuration, setStormDuration] = useState<string | number>("");
  const [luaFile, setLuaFile] = useState("");
  const playerListFormatter = useMemo(
    () =>
      new Intl.ListFormat(i18n.language, {
        style: "short",
        type: "unit",
      }),
    [i18n.language],
  );
  const onlinePlayers = players.filter(isOnline);
  const playerNames = playerListFormatter.format(
    onlinePlayers.map((player) => player.username),
  );
  const busy = pending !== null;
  const serializedMessage = message;
  const messageEmpty = serializedMessage.trim().length === 0;
  const messageTooLong =
    utf8ByteLength(serializedMessage) > SERVER_MESSAGE_MAX_BYTES;

  function closeDialog() {
    if (!busy) setDialog(null);
  }

  function submit(
    event: SyntheticEvent<HTMLFormElement, SubmitEvent>,
    id: string,
    operation: () => Promise<unknown>,
    successMessage: string,
    onSuccess?: () => void,
  ) {
    event.preventDefault();
    void run(id, operation, successMessage).then((succeeded) => {
      if (succeeded) onSuccess?.();
      return succeeded;
    });
  }

  const eventDisabled = busy || onlinePlayers.length === 0;

  return (
    <div aria-busy={busy} className={classes.page}>
      <VisuallyHidden>
        <h1>{t("page.title")}</h1>
      </VisuallyHidden>
      <PageContainer contentWidth="wide" p="md">
        <Stack gap="xl">
          <Group className={classes.toolbar} justify="space-between">
            <Group gap="xs">
              <Button
                disabled={busy}
                loading={pending === "save"}
                onClick={() =>
                  void run(
                    "save",
                    SaveWorld,
                    t("notifications.worldSaved.message"),
                  )
                }
              >
                {t("actions.saveWorld")}
              </Button>
              <Button
                color="red"
                disabled={busy}
                onClick={() => setDialog("stop")}
              >
                {t("actions.stopServer")}
              </Button>
            </Group>
            <Button
              disabled={busy}
              onClick={() => setDialog("message")}
              variant="default"
            >
              {t("actions.sendMessage")}
            </Button>
          </Group>

          <section>
            <Title className={classes.sectionTitle} order={2}>
              {t("sections.weather")}
            </Title>
            <div className={classes.commandRow}>
              <CommandInfo
                description={t("descriptions.startRain")}
                title={t("actions.startRain")}
              />
              <form
                className={classes.weatherControl}
                onSubmit={(event) =>
                  submit(
                    event,
                    "rain",
                    () => StartRain(valueOrAutomatic(rainIntensity)),
                    t("notifications.rainStarted.message"),
                    () => setRainIntensity(""),
                  )
                }
              >
                <NumberInput
                  allowDecimal={false}
                  clampBehavior="blur"
                  label={t("fields.intensity.label")}
                  max={100}
                  min={1}
                  name="rainIntensity"
                  onChange={setRainIntensity}
                  size="sm"
                  value={rainIntensity}
                />
                <Button
                  disabled={busy}
                  loading={pending === "rain"}
                  type="submit"
                >
                  {t("actions.startRain")}
                </Button>
              </form>
            </div>
            <div className={classes.commandRow}>
              <CommandInfo
                description={t("descriptions.startStorm")}
                title={t("actions.startStorm")}
              />
              <form
                className={classes.weatherControl}
                onSubmit={(event) =>
                  submit(
                    event,
                    "storm",
                    () => StartStorm(valueOrAutomatic(stormDuration)),
                    t("notifications.stormStarted.message"),
                  )
                }
              >
                <NumberInput
                  allowDecimal={false}
                  clampBehavior="blur"
                  label={t("fields.duration.label")}
                  min={1}
                  name="stormDuration"
                  onChange={setStormDuration}
                  size="sm"
                  value={stormDuration}
                />
                <Button
                  disabled={busy}
                  loading={pending === "storm"}
                  type="submit"
                >
                  {t("actions.startStorm")}
                </Button>
              </form>
            </div>
            <div className={classes.stopWeatherRow}>
              <Button
                disabled={busy}
                loading={pending === "stopRain"}
                onClick={() =>
                  void run(
                    "stopRain",
                    StopRain,
                    t("notifications.rainStopped.message"),
                  )
                }
                variant="default"
              >
                {t("actions.stopRain")}
              </Button>
              <Button
                disabled={busy}
                loading={pending === "stopWeather"}
                onClick={() =>
                  void run(
                    "stopWeather",
                    StopWeather,
                    t("notifications.weatherStopped.message"),
                  )
                }
                variant="default"
              >
                {t("actions.stopWeather")}
              </Button>
            </div>
          </section>

          <section>
            <Title className={classes.sectionTitle} order={2}>
              {t("sections.events")}
            </Title>
            <Text c="dimmed" size="sm">
              {t("descriptions.events")}
            </Text>
            <Group gap="xs" mt={6} wrap="nowrap">
              <Text fw={600} size="xs">
                {t("events.players.label")}
              </Text>
              <Badge
                color={onlinePlayers.length ? "green" : "gray"}
                size="sm"
                variant="light"
              >
                {onlinePlayers.length}
              </Badge>
              <Tooltip
                disabled={!playerNames}
                label={playerNames}
                maw={400}
                multiline
                withArrow
              >
                <Text className={classes.playerNames} c="dimmed" size="xs">
                  {playerNames || t("events.players.empty")}
                </Text>
              </Tooltip>
            </Group>
            <div className={classes.eventButtons}>
              <Button
                disabled={eventDisabled}
                loading={pending === "helicopter"}
                onClick={() =>
                  void run(
                    "helicopter",
                    TriggerHelicopter,
                    t("notifications.helicopter.message"),
                  )
                }
                variant="default"
              >
                {t("actions.helicopter")}
              </Button>
              <Button
                disabled={eventDisabled}
                loading={pending === "gunshot"}
                onClick={() =>
                  void run(
                    "gunshot",
                    TriggerGunshot,
                    t("notifications.gunshot.message"),
                  )
                }
                variant="default"
              >
                {t("actions.gunshot")}
              </Button>
              <Button
                disabled={eventDisabled}
                loading={pending === "lightning"}
                onClick={() =>
                  void run("lightning", TriggerLightning, (result) =>
                    t("notifications.lightning.message", {
                      target: result.target,
                    }),
                  )
                }
                variant="default"
              >
                {t("actions.lightning")}
              </Button>
              <Button
                disabled={eventDisabled}
                loading={pending === "thunder"}
                onClick={() =>
                  void run("thunder", TriggerThunder, (result) =>
                    t("notifications.thunder.message", {
                      target: result.target,
                    }),
                  )
                }
                variant="default"
              >
                {t("actions.thunder")}
              </Button>
            </div>
          </section>

          <section>
            <Title className={classes.sectionTitle} order={2}>
              {t("sections.reload")}
            </Title>
            <div className={classes.commandRow}>
              <CommandInfo
                description={t("descriptions.reloadOptions")}
                title={t("actions.reloadOptions")}
              />
              <Button
                disabled={busy}
                loading={pending === "reloadOptions"}
                onClick={() =>
                  void run(
                    "reloadOptions",
                    ReloadOptions,
                    t("notifications.optionsReloaded.message"),
                  )
                }
                variant="default"
              >
                {t("actions.reloadOptions")}
              </Button>
            </div>
            <div className={classes.commandRow}>
              <CommandInfo
                description={t("descriptions.reloadLua")}
                title={t("actions.reloadLua")}
              />
              <form
                className={classes.luaControl}
                onSubmit={(event) =>
                  submit(
                    event,
                    "reloadLua",
                    () => ReloadLua(luaFile),
                    t("notifications.luaReloaded.message"),
                    () => setLuaFile(""),
                  )
                }
              >
                <TextInput
                  autoComplete="off"
                  label={t("fields.luaFile.label")}
                  name="luaFile"
                  onChange={(event) => setLuaFile(event.currentTarget.value)}
                  spellCheck={false}
                  value={luaFile}
                />
                <Button
                  disabled={busy || !luaFile.trim()}
                  loading={pending === "reloadLua"}
                  type="submit"
                >
                  {t("actions.reloadFile")}
                </Button>
              </form>
            </div>
            {supports(FeatureID.ServerActionReloadAllLua) ? (
              <div className={classes.commandRow}>
                <CommandInfo
                  description={t("descriptions.reloadAllLua")}
                  title={t("actions.reloadAllLua")}
                />
                <Button
                  disabled={busy}
                  loading={pending === "reloadAllLua"}
                  onClick={() =>
                    void run(
                      "reloadAllLua",
                      ReloadAllLua,
                      t("notifications.allLuaReloaded.message"),
                    )
                  }
                  variant="default"
                >
                  {t("actions.reloadAllLua")}
                </Button>
              </div>
            ) : null}
          </section>
        </Stack>
      </PageContainer>

      <Modal
        closeOnClickOutside={!busy}
        closeOnEscape={!busy}
        opened={dialog === "message"}
        onClose={closeDialog}
        size={dialogSizes.editor}
        title={t("dialogs.message.title")}
        withCloseButton={!busy}
      >
        <form
          onSubmit={(event) =>
            submit(
              event,
              "message",
              () => SendMessage(serializedMessage),
              t("notifications.messageSent.message"),
              () => {
                setMessage("");
                setDialog(null);
              },
            )
          }
        >
          <Stack gap="md">
            <GameMessageEditor
              build={build}
              {...dialogEditorViewport}
              maxBytes={SERVER_MESSAGE_MAX_BYTES}
              onChange={setMessage}
              value={message}
            />
            <DialogActions busy={busy} onClose={closeDialog}>
              <Button
                disabled={messageEmpty || messageTooLong}
                loading={pending === "message"}
                type="submit"
              >
                {t("actions.sendMessage")}
              </Button>
            </DialogActions>
          </Stack>
        </form>
      </Modal>
      <Modal
        closeOnClickOutside={!busy}
        closeOnEscape={!busy}
        opened={dialog === "stop"}
        onClose={closeDialog}
        size={dialogSizes.compact}
        title={t("dialogs.stop.title")}
        withCloseButton={!busy}
      >
        <form
          onSubmit={(event) =>
            submit(
              event,
              "stop",
              StopServer,
              t("notifications.serverStopped.message"),
              () => setDialog(null),
            )
          }
        >
          <Stack gap="sm">
            <Text size="sm">{t("dialogs.stop.description")}</Text>
            <DialogActions busy={busy} onClose={closeDialog}>
              <Button color="red" loading={pending === "stop"} type="submit">
                {t("actions.stopServer")}
              </Button>
            </DialogActions>
          </Stack>
        </form>
      </Modal>
    </div>
  );
}

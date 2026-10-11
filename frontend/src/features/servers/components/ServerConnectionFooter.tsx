import { Button, Stack, Text } from "@mantine/core";
import { IconPlugOff } from "@tabler/icons-react";
import { useTranslation } from "react-i18next";
import type { Profile } from "@bindings/internal/profile/models";
import classes from "./ServerConnectionFooter.module.css";

type ServerConnectionState = "connected" | "disconnecting";

interface ServerConnectionFooterProps {
  onDisconnect: () => void;
  profile: Profile;
  state: ServerConnectionState;
}

export function ServerConnectionFooter({
  onDisconnect,
  profile,
  state,
}: ServerConnectionFooterProps) {
  const { t } = useTranslation("session");
  const disconnecting = state === "disconnecting";

  return (
    <Stack gap="xs">
      <Text fw={600} size="sm" lineClamp={1} title={profile.name}>
        {profile.name}
      </Text>
      <Text
        c="dimmed"
        ff="monospace"
        size="xs"
        lineClamp={1}
        title={`${profile.host}:${profile.port}`}
      >
        {profile.host}:{profile.port}
      </Text>
      <Button
        className={classes.disconnect}
        variant="default"
        size="xs"
        fullWidth
        leftSection={<IconPlugOff size={14} aria-hidden="true" />}
        loading={disconnecting}
        onClick={onDisconnect}
      >
        {t("actions.disconnect", { ns: "common" })}
      </Button>
    </Stack>
  );
}

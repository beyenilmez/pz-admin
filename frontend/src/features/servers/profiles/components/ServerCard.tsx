import {
  ActionIcon,
  Badge,
  Box,
  Button,
  Group,
  Menu,
  Paper,
  Stack,
  Text,
} from "@mantine/core";
import { IconDotsVertical, IconPencil, IconTrash } from "@tabler/icons-react";
import { useTranslation } from "react-i18next";
import type { Profile } from "@bindings/internal/profile/models";

interface ServerCardProps {
  connecting: boolean;
  disabled: boolean;
  onConnect: (profile: Profile) => void;
  profile: Profile;
  onDelete: (profile: Profile) => void;
  onEdit: (profile: Profile) => void;
}

export function ServerCard({
  connecting,
  disabled,
  onConnect,
  profile,
  onDelete,
  onEdit,
}: ServerCardProps) {
  const { t } = useTranslation(["servers", "common"]);
  let buildLabel = t("gameBuild.unknown", { ns: "common" });
  if (profile.version === "auto") {
    buildLabel = t("gameBuild.options.auto", { ns: "common" });
  } else if (profile.version) {
    buildLabel = t("gameBuild.value", {
      ns: "common",
      version: profile.version,
    });
  }

  return (
    <Paper
      component="article"
      withBorder
      p="md"
      style={{ display: "flex", minHeight: 112 }}
    >
      <Stack gap="sm" style={{ flex: 1, minWidth: 0 }}>
        <Group justify="space-between" align="flex-start" wrap="nowrap">
          <Box style={{ minWidth: 0 }}>
            <Text
              component="h2"
              fw={600}
              size="md"
              lineClamp={1}
              title={profile.name}
            >
              {profile.name}
            </Text>
            <Text
              size="sm"
              c="dimmed"
              ff="monospace"
              lineClamp={1}
              title={`${profile.host}:${profile.port}`}
            >
              {profile.host}:{profile.port}
            </Text>
          </Box>
          <Menu position="bottom-end" withinPortal shadow="md" width={160}>
            <Menu.Target>
              <ActionIcon
                variant="subtle"
                color="gray"
                aria-label={t("card.actions.label", {
                  serverName: profile.name,
                })}
                disabled={disabled}
              >
                <IconDotsVertical size={18} aria-hidden="true" />
              </ActionIcon>
            </Menu.Target>
            <Menu.Dropdown>
              <Menu.Item
                leftSection={<IconPencil size={14} aria-hidden="true" />}
                onClick={() => onEdit(profile)}
              >
                {t("actions.edit", { ns: "common" })}
              </Menu.Item>
              <Menu.Divider />
              <Menu.Item
                color="red"
                leftSection={<IconTrash size={14} aria-hidden="true" />}
                onClick={() => onDelete(profile)}
              >
                {t("actions.delete", { ns: "common" })}
              </Menu.Item>
            </Menu.Dropdown>
          </Menu>
        </Group>

        <Group justify="space-between" align="center" mt="auto">
          <Badge variant="light" color="gray">
            {buildLabel}
          </Badge>
          <Button
            size="xs"
            loading={connecting}
            disabled={disabled && !connecting}
            onClick={() => onConnect(profile)}
          >
            {t("actions.connect", { ns: "common" })}
          </Button>
        </Group>
      </Stack>
    </Paper>
  );
}

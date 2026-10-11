import { useState } from "react";
import {
  ActionIcon,
  CloseButton,
  Group,
  Popover,
  Text,
  Tooltip,
} from "@mantine/core";
import { IconInfoCircle } from "@tabler/icons-react";
import { useTranslation } from "react-i18next";
import { GameAttribution } from "@/features/game/components/GameAttribution";
import classes from "@/features/game/components/GameCreditsButton.module.css";

/** Place inside a positioned, non-scrolling feature container. */
export function GameCreditsButton() {
  const { t } = useTranslation("common");
  const [opened, setOpened] = useState(false);

  return (
    <Popover
      opened={opened}
      onChange={setOpened}
      onDismiss={() => setOpened(false)}
      position="top-end"
      width={360}
      shadow="md"
      trapFocus
      returnFocus
      withinPortal
    >
      <Tooltip label={t("attribution.label")} disabled={opened}>
        <Popover.Target>
          <ActionIcon
            aria-label={t("attribution.label")}
            className={classes.button}
            data-mantine-stop-propagation={opened || undefined}
            onClick={() => setOpened((value) => !value)}
            onKeyDown={(event) => {
              if (event.key === "Escape") setOpened(false);
            }}
            size={28}
            variant="default"
          >
            <IconInfoCircle size={17} aria-hidden="true" />
          </ActionIcon>
        </Popover.Target>
      </Tooltip>
      <Popover.Dropdown className={classes.dropdown}>
        <Group justify="space-between" mb="xs" wrap="nowrap">
          <Text size="sm" fw={600}>
            {t("attribution.label")}
          </Text>
          <CloseButton
            aria-label={t("actions.close")}
            data-mantine-stop-propagation
            onClick={() => setOpened(false)}
            size="sm"
          />
        </Group>
        <GameAttribution />
      </Popover.Dropdown>
    </Popover>
  );
}

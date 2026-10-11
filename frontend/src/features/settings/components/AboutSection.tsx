import { Anchor, Group, Stack, Text, Title } from "@mantine/core";
import { IconExternalLink } from "@tabler/icons-react";
import { Browser } from "@wailsio/runtime";
import { useTranslation } from "react-i18next";
import { NoticesButton } from "@/features/settings/components/NoticesButton";
import { GameAttribution } from "@/features/game/components/GameAttribution";

const projectLinks = [
  {
    label: "about.links.homepage",
    href: "https://beyenilmez.github.io/pz-admin/",
  },
  {
    label: "about.links.project",
    href: "https://github.com/beyenilmez/pz-admin",
  },
  {
    label: "about.links.issues",
    href: "https://github.com/beyenilmez/pz-admin/issues/new/choose",
  },
] as const;

export function AboutSection() {
  const { t } = useTranslation("settings");

  return (
    <Stack gap="sm" mt="md">
      <Title order={2}>{t("about.title")}</Title>
      <Stack gap={4}>
        <Group gap="sm" align="baseline">
          <Text fw={600}>PZ Admin</Text>
          <Text size="sm" c="dimmed">
            v{APP_VERSION}
          </Text>
        </Group>
        <Text size="sm" c="dimmed">
          {t("about.description")}
        </Text>
      </Stack>
      <Group gap="lg">
        {projectLinks.map(({ label, href }) => (
          <Anchor
            key={href}
            href={href}
            size="sm"
            onClick={(event) => {
              event.preventDefault();
              void Browser.OpenURL(href);
            }}
          >
            <Group component="span" gap={6} wrap="nowrap">
              {t(label)}
              <IconExternalLink size={14} aria-hidden="true" />
            </Group>
          </Anchor>
        ))}
      </Group>
      <GameAttribution />
      <NoticesButton />
    </Stack>
  );
}

import { useRef, useState } from "react";
import {
  Accordion,
  Alert,
  Anchor,
  Box,
  Button,
  CloseButton,
  Group,
  Loader,
  Modal,
  ScrollArea,
  Stack,
  Text,
  TextInput,
} from "@mantine/core";
import { IconExternalLink, IconSearch } from "@tabler/icons-react";
import { Browser } from "@wailsio/runtime";
import { useTranslation } from "react-i18next";
import { Report as getReport } from "@bindings/internal/notices/service";
import type {
  Entry,
  Report as NoticesReport,
} from "@bindings/internal/notices/models";
import { errorMessage } from "@/shared/lib/errors";
import classes from "@/features/settings/components/NoticesButton.module.css";

function NoticeDetails({ entry }: { entry: Entry }) {
  const { t } = useTranslation("settings");
  const source = entry.source;
  const externalSource = source && /^https?:\/\//i.test(source);

  return (
    <Stack gap="sm">
      {entry.note && (
        <Text size="sm" c="dimmed">
          {entry.note}
        </Text>
      )}
      {source &&
        (externalSource ? (
          <Anchor
            href={source}
            size="sm"
            className={classes.source}
            onClick={(event) => {
              event.preventDefault();
              void Browser.OpenURL(source);
            }}
          >
            {t("notices.actions.source")}
            <IconExternalLink size={14} aria-hidden="true" />
          </Anchor>
        ) : (
          <Text size="sm" className={classes.text}>
            {source}
          </Text>
        ))}
      {entry.text ? (
        <Text size="sm" className={classes.text} dir="auto">
          {entry.text}
        </Text>
      ) : (
        <Text size="sm" c="dimmed">
          {t("notices.missingText")}
        </Text>
      )}
    </Stack>
  );
}

export function NoticesButton() {
  const { t } = useTranslation(["settings", "common"]);
  const [opened, setOpened] = useState(false);
  const [report, setReport] = useState<NoticesReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const searchInputRef = useRef<HTMLInputElement>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const result = await getReport();
      result.entries.sort((left, right) => left.name.localeCompare(right.name));
      setReport(result);
    } catch (cause) {
      setError(errorMessage(cause));
    } finally {
      setLoading(false);
    }
  }

  const query = search.trim().toLowerCase();
  // Keep the original index as the identity: multiple entries can share a name.
  const entries =
    report?.entries
      .map((entry, index) => ({ entry, index }))
      .filter(({ entry }) =>
        `${entry.name} ${entry.identifier} ${entry.version ?? ""}`
          .toLowerCase()
          .includes(query),
      ) ?? [];

  return (
    <>
      <Group>
        <Button
          variant="default"
          size="sm"
          onClick={() => {
            setOpened(true);
            if (!report && !loading) void load();
          }}
        >
          {t("notices.title")}
        </Button>
      </Group>
      <Modal.Root
        opened={opened}
        onClose={() => setOpened(false)}
        size="xl"
        centered
      >
        <Modal.Overlay />
        <Modal.Content classNames={{ content: classes.dialog }}>
          <Modal.Header className={classes.header}>
            <Modal.Title fw={600}>{t("notices.title")}</Modal.Title>
            <Modal.CloseButton
              aria-label={t("actions.close", { ns: "common" })}
            />
          </Modal.Header>
          {report && report.entries.length > 0 && (
            <Box className={classes.toolbar}>
              <TextInput
                aria-label={t("notices.search.label")}
                placeholder={t("notices.search.placeholder")}
                ref={searchInputRef}
                name="notice-search"
                autoComplete="off"
                spellCheck={false}
                value={search}
                onChange={(event) => setSearch(event.currentTarget.value)}
                leftSection={<IconSearch size={16} aria-hidden="true" />}
                rightSection={
                  search ? (
                    <CloseButton
                      aria-label={t("search.clear", { ns: "common" })}
                      size="sm"
                      onClick={() => {
                        setSearch("");
                        searchInputRef.current?.focus();
                      }}
                    />
                  ) : null
                }
              />
            </Box>
          )}
          <ScrollArea.Autosize
            type="auto"
            scrollbars="y"
            className={classes.bodyScroll}
            overscrollBehavior="contain"
          >
            <Modal.Body className={classes.body}>
              <Stack gap="lg">
                {loading && (
                  <Group component="output">
                    <Loader size="sm" />
                    {t("notices.loading")}
                  </Group>
                )}
                {error && (
                  <Alert color="red" title={t("notices.errors.load.title")}>
                    <Stack align="flex-start" gap="xs">
                      {error}
                      <Button
                        size="xs"
                        variant="light"
                        onClick={() => void load()}
                      >
                        {t("actions.retry", { ns: "common" })}
                      </Button>
                    </Stack>
                  </Alert>
                )}
                {report && (
                  <>
                    <Accordion
                      order={3}
                      keepMounted={false}
                      variant="contained"
                      radius="md"
                      classNames={{
                        control: classes.control,
                        content: classes.noticeContent,
                      }}
                    >
                      <Accordion.Item value="application">
                        <Accordion.Control>
                          {t("notices.application")}
                        </Accordion.Control>
                        <Accordion.Panel>
                          <Text size="sm" className={classes.text} dir="auto">
                            {report.applicationLicense}
                          </Text>
                        </Accordion.Panel>
                      </Accordion.Item>
                    </Accordion>
                    {report.entries.length === 0 ? (
                      <Text c="dimmed" size="sm">
                        {t("notices.unavailable")}
                      </Text>
                    ) : (
                      <>
                        {entries.length === 0 ? (
                          <Text
                            c="dimmed"
                            size="sm"
                            component="output"
                            ta="center"
                            py="xl"
                          >
                            {t("notices.search.empty")}
                          </Text>
                        ) : (
                          <Accordion
                            order={3}
                            keepMounted={false}
                            classNames={{
                              control: classes.control,
                              content: classes.noticeContent,
                            }}
                          >
                            {entries.map(({ entry, index }) => (
                              <Accordion.Item key={index} value={String(index)}>
                                <Accordion.Control>
                                  <Text
                                    span
                                    size="sm"
                                    fw={500}
                                    className={classes.name}
                                  >
                                    {entry.name}
                                  </Text>
                                  <Text
                                    span
                                    display="block"
                                    size="xs"
                                    c="dimmed"
                                    mt={4}
                                    className={classes.name}
                                  >
                                    {entry.version
                                      ? `${entry.version} · ${entry.identifier}`
                                      : entry.identifier}
                                  </Text>
                                </Accordion.Control>
                                <Accordion.Panel>
                                  <NoticeDetails entry={entry} />
                                </Accordion.Panel>
                              </Accordion.Item>
                            ))}
                          </Accordion>
                        )}
                      </>
                    )}
                  </>
                )}
              </Stack>
            </Modal.Body>
          </ScrollArea.Autosize>
        </Modal.Content>
      </Modal.Root>
    </>
  );
}

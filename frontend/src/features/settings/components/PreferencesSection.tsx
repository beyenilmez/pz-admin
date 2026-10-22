import { useId, type ReactNode } from "react";
import {
  Alert,
  Badge,
  Button,
  Group,
  Input,
  Radio,
  Select,
  Skeleton,
  Stack,
  Switch,
} from "@mantine/core";
import { System } from "@wailsio/runtime";
import { IconAlertCircle } from "@tabler/icons-react";
import { useTranslation } from "react-i18next";
import {
  isThemeSetting,
  useAppConfig,
} from "@/features/config/AppConfigProvider";
import { defaultLanguage, isSupportedLanguage } from "@/i18n/locales";
import {
  languageCoverage,
  languageOptions,
} from "@/features/settings/lib/languages";
import rowClasses from "./SettingRow.module.css";

function renderControl(children: ReactNode) {
  return <div className={rowClasses.control}>{children}</div>;
}

function renderLanguageControl(input: ReactNode) {
  return (
    <div className={`${rowClasses.control} ${rowClasses.language}`}>
      {input}
    </div>
  );
}

export function PreferencesSection() {
  const updateInputId = useId();
  const { i18n, t } = useTranslation(["settings", "common"]);
  const {
    config,
    error,
    loading,
    reload,
    setLanguage,
    setTheme,
    setDownloadUpdatesOnStartup,
  } = useAppConfig();
  const percentFormatter = new Intl.NumberFormat(i18n.language, {
    style: "percent",
  });

  function handleThemeChange(theme: string) {
    if (isThemeSetting(theme)) void setTheme(theme);
  }

  function handleLanguageChange(language: string | null) {
    if (language && isSupportedLanguage(language)) void setLanguage(language);
  }

  return (
    <>
      {!loading && !config && (
        <Alert
          color="red"
          icon={<IconAlertCircle size={20} aria-hidden="true" />}
          title={t("errors.load.title")}
        >
          <Stack align="flex-start" gap="xs">
            {error}
            <Button onClick={reload} size="xs" variant="light">
              {t("actions.retry", { ns: "common" })}
            </Button>
          </Stack>
        </Alert>
      )}

      {(loading || config) && (
        <Stack aria-busy={loading}>
          {error && (
            <Alert
              color="red"
              icon={<IconAlertCircle size={20} aria-hidden="true" />}
              title={t("errors.save.title")}
              aria-live="polite"
            >
              {error} {t("errors.save.recovery")}
            </Alert>
          )}

          <Skeleton visible={loading}>
            <Radio.Group
              classNames={rowClasses}
              inputContainer={renderControl}
              name="theme"
              label={t("colorScheme.label")}
              description={t("colorScheme.description")}
              value={config?.theme ?? "system"}
              disabled={loading}
              onChange={handleThemeChange}
            >
              <Group gap="sm">
                <Radio value="system" label={t("colorScheme.options.system")} />
                <Radio value="light" label={t("colorScheme.options.light")} />
                <Radio value="dark" label={t("colorScheme.options.dark")} />
              </Group>
            </Radio.Group>
          </Skeleton>

          <Skeleton visible={loading}>
            <Select
              classNames={rowClasses}
              inputContainer={renderLanguageControl}
              label={t("language.label")}
              description={t("language.description")}
              data={languageOptions}
              value={config?.language ?? defaultLanguage}
              disabled={loading}
              allowDeselect={false}
              autoComplete="off"
              name="language"
              searchable
              renderOption={({ option }) => (
                <Group justify="space-between" wrap="nowrap" w="100%">
                  <span>{option.label}</span>
                  <Badge variant="default" fw={600} w={54} px="xs">
                    {percentFormatter.format(
                      (languageCoverage.get(option.value) ?? 0) / 100,
                    )}
                  </Badge>
                </Group>
              )}
              onChange={handleLanguageChange}
            />
          </Skeleton>
          {(System.IsWindows() || System.IsMac()) && (
            <Skeleton visible={loading}>
              <Input.Wrapper
                classNames={rowClasses}
                id={updateInputId}
                label={t("updates.downloadOnStartup.label")}
                description={t("updates.downloadOnStartup.description")}
              >
                <Switch
                  className={rowClasses.control}
                  id={updateInputId}
                  name="downloadUpdatesOnStartup"
                  aria-labelledby={`${updateInputId}-label`}
                  aria-describedby={`${updateInputId}-description`}
                  checked={config?.downloadUpdatesOnStartup ?? true}
                  disabled={loading}
                  onChange={(event) =>
                    void setDownloadUpdatesOnStartup(
                      event.currentTarget.checked,
                    )
                  }
                />
              </Input.Wrapper>
            </Skeleton>
          )}
        </Stack>
      )}
    </>
  );
}

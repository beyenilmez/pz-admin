import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { SettingsItem, SettingContent, SettingDescription, SettingLabel } from "@/components/ui/settings-group";
import { Combobox } from "@/components/ui/combobox";
import locales from "@/locales.json";
import { useConfig } from "@/contexts/config-provider";

export function LocaleSetting() {
  const { config, setConfigField } = useConfig();
  const { t, i18n } = useTranslation();
  const [{ isLoading, language }, setState] = useState({
    isLoading: true,
    language: "",
  });

  useEffect(() => {
    if (isLoading && config?.language !== undefined) {
      setState({ language: config.language, isLoading: false });
    }
  }, [isLoading, config?.language]);

  const handleLanguageChange = (value: string) => {
    setConfigField("language", value);
    i18n.changeLanguage(value);
    setState((prevState) => ({ ...prevState, language: value }));
  };

  return (
    <SettingsItem loading={isLoading}>
      <div>
        <SettingLabel>{t("settings.setting.language.label")}</SettingLabel>
        <SettingDescription>{t("settings.setting.language.description")}</SettingDescription>
      </div>
      <SettingContent>
        <Combobox
          disableSearch
          initialValue={language}
          mandatory
          elements={locales.locales.map((locale) => ({
            value: locale.code,
            label: locale.name,
          }))}
          placeholder={t("settings.setting.language.select_language")}
          searchPlaceholder={t("settings.setting.language.search_language")}
          nothingFoundMessage={t("settings.setting.language.no_languages_found")}
          onChange={handleLanguageChange}
        />
      </SettingContent>
    </SettingsItem>
  );
}

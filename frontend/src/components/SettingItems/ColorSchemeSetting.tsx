import { useTranslation } from "react-i18next";
import {
  SettingsItem,
  SettingContent,
  SettingDescription,
  SettingLabel,
} from "@/components/ui/settings-group";
import { Combobox } from "@/components/ui/combobox";
import colorSchemes from "@/colorSchemes.json";
import { ColorScheme, useColorScheme } from "@/contexts/color-scheme-provider";

export function ColorSchemeSetting() {
  const { colorScheme, setColorScheme, updateColorScheme } = useColorScheme();
  const { t } = useTranslation();

  const handleColorSchemeChange = (value: string) => {
    setColorScheme(value as ColorScheme);
  };

  return (
    <SettingsItem loading={colorScheme === undefined}>
      <div>
        <SettingLabel>{t("settings.setting.color_scheme.label")}</SettingLabel>
        <SettingDescription>
          {t("settings.setting.color_scheme.description")}
        </SettingDescription>
      </div>
      <SettingContent>
        <Combobox
          initialValue={colorScheme}
          mandatory
          elements={colorSchemes.colorSchemes.map((colorScheme) => ({
            value: colorScheme.code,
            label: t(
              "settings.setting.color_scheme.color_schemes." + colorScheme.code
            ),
          }))}
          placeholder={t("settings.setting.color_scheme.select_color_scheme")}
          searchPlaceholder={t(
            "settings.setting.color_scheme.search_color_scheme"
          )}
          nothingFoundMessage={t(
            "settings.setting.color_scheme.no_color_schemes_found"
          )}
          onChange={handleColorSchemeChange}
          onMouseEnter={(value) => {
            const root = document.documentElement;

            root.classList.remove(colorScheme);
            root.classList.add(value);
          }}
          onMouseLeave={(value) => {
            const root = document.documentElement;

            root.classList.remove(value);
            root.classList.add(colorScheme);
          }}
          onCollapse={() => {
            updateColorScheme();
          }}
        />
      </SettingContent>
    </SettingsItem>
  );
}

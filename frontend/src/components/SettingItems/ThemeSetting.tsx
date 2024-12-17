import { useTranslation } from "react-i18next";
import {
  SettingsItem,
  SettingContent,
  SettingDescription,
  SettingLabel,
} from "@/components/ui/settings-group";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Monitor, Moon, Sun } from "lucide-react";
import { Theme, useTheme } from "@/contexts/theme-provider";

export function ThemeSetting() {
  const { t } = useTranslation();
  const { theme, setTheme } = useTheme();

  const themes = [
    {
      value: "system",
      label: "Use system theme",
      icon: <Monitor className="w-4 h-4" />,
    },
    {
      value: "light",
      label: "Use light theme",
      icon: <Sun className="w-4 h-4" />,
    },
    {
      value: "dark",
      label: "Use dark theme",
      icon: <Moon className="w-4 h-4" />,
    },
  ];

  const handleThemeChange = (selectedTheme: string) => {
    setTheme(selectedTheme as Theme);
  };

  return (
    <SettingsItem>
      <div>
        <SettingLabel>{t("settings.setting.theme.label")}</SettingLabel>
        <SettingDescription>
          {t("settings.setting.theme.description")}
        </SettingDescription>
      </div>
      <SettingContent>
        <ToggleGroup type="single" value={theme}>
          {themes.map((item) => (
            <ToggleGroupItem
              key={item.value}
              value={item.value}
              aria-label={item.label}
              onClick={() => handleThemeChange(item.value)}
            >
              {item.icon}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </SettingContent>
    </SettingsItem>
  );
}

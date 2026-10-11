import type { Preview } from "@storybook/react-vite";
import { MantineProvider, Portal } from "@mantine/core";
import { Notifications, notifications } from "@mantine/notifications";
import { I18nextProvider } from "react-i18next";
import "@fontsource-variable/inter";
import "@fontsource-variable/jetbrains-mono";
import "@fontsource-variable/noto-sans";
import "@mantine/core/styles.css";
import "@mantine/tiptap/styles.css";
import "@mantine/notifications/styles.css";
import { createAppTheme } from "@/app/theme";
import i18n from "@/i18n";
import { defaultLanguage, isSupportedLanguage, locales } from "@/i18n/locales";
import { SessionProvider } from "@/features/session/SessionProvider";
import { PlayersProvider } from "@/features/players/PlayersProvider";
import { WindowFrame } from "./decorators/WindowFrame";

const preview: Preview = {
  parameters: { layout: "fullscreen" },
  globalTypes: {
    presentation: {
      description: "Optional window frame for screenshots",
      toolbar: {
        title: "Presentation",
        icon: "browser",
        dynamicTitle: true,
        items: [
          { value: "plain", title: "Normal preview" },
          { value: "window", title: "Window capture" },
        ],
      },
    },
    theme: {
      description: "Application color scheme",
      toolbar: {
        title: "Theme",
        icon: "circlehollow",
        dynamicTitle: true,
        items: [
          { value: "light", title: "Light" },
          { value: "dark", title: "Dark" },
        ],
      },
    },
    locale: {
      description:
        "Application language (missing translations fall back to English)",
      toolbar: {
        title: "Language",
        icon: "globe",
        dynamicTitle: true,
        items: locales.map(({ code, nativeName }) => ({
          value: code,
          title: nativeName,
        })),
      },
    },
  },
  initialGlobals: {
    theme: "light",
    locale: defaultLanguage,
    presentation: "plain",
  },
  loaders: [
    async ({ globals }) => {
      const locale = isSupportedLanguage(globals.locale)
        ? globals.locale
        : defaultLanguage;
      await i18n.changeLanguage(locale);
      document.documentElement.lang = locale;
      notifications.clean();
      return {};
    },
  ],
  decorators: [
    (Story, context) => {
      const theme = createAppTheme(i18n.t("actions.close"));
      const framed = context.globals.presentation === "window";
      if (framed) {
        theme.components = {
          ...theme.components,
          Portal: Portal.extend({
            defaultProps: { target: "#capture-content" },
          }),
        };
      }
      return (
        <I18nextProvider i18n={i18n}>
          <MantineProvider
            forceColorScheme={
              context.globals.theme === "dark" ? "dark" : "light"
            }
            theme={theme}
          >
            <Notifications />
            <SessionProvider
              key={`${context.id}:${context.globals.locale}:${context.globals.theme}:${context.globals.presentation}`}
            >
              <PlayersProvider>
                {framed ? (
                  <WindowFrame>
                    <Story />
                  </WindowFrame>
                ) : (
                  <div style={{ height: "100vh", minHeight: 480 }}>
                    <Story />
                  </div>
                )}
              </PlayersProvider>
            </SessionProvider>
          </MantineProvider>
        </I18nextProvider>
      );
    },
  ],
};
export default preview;

import { useMemo, type ReactElement, type ReactNode } from "react";
import { MantineProvider } from "@mantine/core";
import {
  render as testingLibraryRender,
  type RenderOptions,
} from "@testing-library/react";
import { I18nextProvider, useTranslation } from "react-i18next";
import { createAppTheme } from "@/app/theme";
import i18n from "@/i18n";

function TestMantineProvider({ children }: { children: ReactNode }) {
  const { t } = useTranslation("common");
  const closeButtonLabel = t("actions.close");
  const theme = useMemo(
    () => ({ ...createAppTheme(closeButtonLabel), respectReducedMotion: true }),
    [closeButtonLabel],
  );

  return (
    <MantineProvider env="test" theme={theme}>
      {children}
    </MantineProvider>
  );
}

function TestProvider({ children }: { children: ReactNode }) {
  return (
    <I18nextProvider i18n={i18n}>
      <TestMantineProvider>{children}</TestMantineProvider>
    </I18nextProvider>
  );
}

export function render(
  ui: ReactElement,
  options?: Omit<RenderOptions, "wrapper">,
) {
  return testingLibraryRender(ui, { wrapper: TestProvider, ...options });
}

export * from "@testing-library/react";
export { userEvent } from "@testing-library/user-event";

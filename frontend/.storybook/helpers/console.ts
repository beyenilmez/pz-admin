import { expect, userEvent, waitFor, within } from "storybook/test";
import i18n from "@/i18n";
import { Execute } from "../mocks/console";

export async function prepareConsoleShowcase(canvasElement: HTMLElement) {
  const canvas = within(canvasElement);
  const input = canvas.getByRole("textbox", {
    name: i18n.t("command.label", { ns: "console" }),
  });
  await userEvent.type(input, "players{Escape}{Enter}");
  await waitFor(async () => {
    await expect(canvas.findByText(/Players connected/)).resolves.toBeVisible();
  });
  Execute.mockResolvedValueOnce("User sawyer is now invisible.");
  await userEvent.type(input, 'invisibleplayer "sawyer" -true{Escape}{Enter}');
  await waitFor(() =>
    expect(canvas.getByText("User sawyer is now invisible.")).toBeVisible(),
  );
  Execute.mockResolvedValueOnce("World saved");
  await userEvent.type(input, "save{Escape}{Enter}");
  await waitFor(() => expect(canvas.getByText("World saved")).toBeVisible());
  await userEvent.type(input, "tele");
  await waitFor(() =>
    expect(within(document.body).getByRole("listbox")).toBeVisible(),
  );
}

import { expect, userEvent, waitFor, within } from "storybook/test";

export async function openStoryDialog(
  canvasElement: HTMLElement,
  opened: boolean,
  title: string,
) {
  // Storybook can preserve closed args when revisiting a story.
  if (!opened) {
    await userEvent.click(
      within(canvasElement).getByRole("button", { name: title }),
    );
  }
  const dialog = await within(document.body).findByRole("dialog");
  await waitFor(() => expect(dialog).toBeVisible());
  return dialog;
}

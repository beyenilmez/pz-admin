import { expect, userEvent, waitFor, within } from "storybook/test";
import i18n from "@/i18n";
import { gameMessageFontMetrics } from "@/features/messages/lib/gameMessageCodec";
import type { GameBuild } from "@/features/game/types";

export async function prepareMessageShowcase(
  canvasElement: HTMLElement,
  build: GameBuild,
) {
  const canvas = within(canvasElement);
  const editor = canvasElement.querySelector<HTMLElement>(
    '[contenteditable="true"]',
  );
  if (!editor) throw new Error("The message editor is not ready.");
  const sizes = gameMessageFontMetrics[build].sizes;
  const clipboard = new DataTransfer();
  clipboard.setData(
    "text/html",
    `
      <p style="text-align:center"><span style="font-size:${sizes.large};color:#00ffff">Riverside Community</span></p>
      <p style="text-align:center"><span style="color:#ffff00">Supply run - 19:00 UTC</span></p>
      <p><span style="color:#ffffff">Meet at the Riverside gas station.</span></p>
      <p><span style="color:#ffffff">Bring water, bandages and a spare fuel can.</span></p>
      <p><span style="font-size:${sizes.small};color:#00ff00">New survivors welcome. Ask jack or kate for help.</span></p>
    `,
  );
  await userEvent.click(editor);
  // Pasting preserves the first paragraph's existing alignment.
  await userEvent.click(
    canvas.getByRole("button", {
      name: i18n.t("editor.actions.align.center", { ns: "messages" }),
    }),
  );
  await userEvent.paste(clipboard);
  await waitFor(() => expect(editor).toHaveTextContent("Riverside Community"));
  await expect(editor.querySelector("p")).toHaveStyle({
    textAlign: "center",
  });
  const formatted = canvasElement.querySelector("pre");
  await expect(formatted).toHaveTextContent("<SIZE:large>");
  await expect(formatted).toHaveTextContent("<RGB:");
  await expect(formatted).toHaveTextContent(
    "Bring water, bandages and a spare fuel can.",
  );
  await expect(
    canvas.getByRole("button", { name: i18n.t("actions.copy") }),
  ).toBeEnabled();
  await userEvent.click(canvas.getByRole("heading", { level: 1 }));
}

import { expect, it, vi } from "vitest";
import { Type as ConnectionType } from "@bindings/internal/connection/models";
import { Profile } from "@bindings/internal/profile/models";
import i18n from "@/i18n";
import { fireEvent, render, screen, waitFor } from "@/test/render";
import { ServerFormModal } from "./ServerFormModal";

const profile = new Profile({
  connectionType: ConnectionType.TypeRCON,
  host: "server.example.com",
  id: "example",
  name: "Example server",
  port: 27015,
  version: "42",
});

function field(
  label:
    | "form.fields.name.label"
    | "form.fields.host.label"
    | "fields.password.label",
) {
  const text =
    label === "fields.password.label"
      ? i18n.t(label, { ns: "common" })
      : i18n.t(label, { ns: "servers" });
  return screen.getByLabelText(text, {
    exact: false,
    selector: "input",
  });
}

it("requires a password for new servers and submits the entered profile", async () => {
  const onClose = vi.fn();
  const onSave = vi.fn().mockResolvedValue(undefined);
  render(
    <ServerFormModal onClose={onClose} onSave={onSave} opened profile={null} />,
  );
  const submit = screen.getByRole("button", {
    name: i18n.t("form.add.submit", { ns: "servers" }),
  });

  fireEvent.change(field("form.fields.name.label"), {
    target: { value: "  New server  " },
  });
  fireEvent.change(field("form.fields.host.label"), {
    target: { value: "  new.example.com  " },
  });
  expect(submit).toBeDisabled();

  fireEvent.change(field("fields.password.label"), {
    target: { value: "secret" },
  });
  fireEvent.click(submit);

  await waitFor(() => expect(onSave).toHaveBeenCalledOnce());
  expect(onSave).toHaveBeenCalledWith(
    expect.objectContaining({
      connectionType: ConnectionType.TypeRCON,
      host: "new.example.com",
      id: "",
      name: "New server",
      port: 27015,
      version: "auto",
    }),
    "secret",
  );
  expect(onClose).toHaveBeenCalledOnce();
});

it("keeps an edit open and shows the error when saving fails", async () => {
  const onClose = vi.fn();
  const onSave = vi.fn().mockRejectedValue(new Error("save-failure"));
  render(
    <ServerFormModal
      onClose={onClose}
      onSave={onSave}
      opened
      profile={profile}
    />,
  );

  fireEvent.click(
    screen.getByRole("button", {
      name: i18n.t("actions.saveChanges", { ns: "common" }),
    }),
  );

  expect(onSave).toHaveBeenCalledWith(profile, "");
  expect(await screen.findByRole("alert")).toHaveTextContent("save-failure");
  expect(onClose).not.toHaveBeenCalled();
  expect(screen.getByRole("dialog")).toBeVisible();
});

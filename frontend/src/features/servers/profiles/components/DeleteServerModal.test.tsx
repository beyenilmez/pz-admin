import { afterEach, expect, it, vi } from "vitest";
import { notifications } from "@mantine/notifications";
import { Type } from "@bindings/internal/connection/models";
import type { Profile } from "@bindings/internal/profile/models";
import i18n from "@/i18n";
import { act, render, screen, userEvent, waitFor } from "@/test/render";
import { DeleteServerModal } from "./DeleteServerModal";

vi.mock("@mantine/notifications", () => ({
  notifications: { show: vi.fn() },
}));

const deleteName = i18n.t("actions.delete", { ns: "common" });

function deleteButton() {
  return screen.getByRole("button", { name: deleteName });
}

const profile: Profile = {
  id: "example-server",
  name: "Example Server",
  connectionType: Type.TypeRCON,
  host: "127.0.0.1",
  port: 27015,
  version: "42",
};

function deferred() {
  let resolve!: () => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<void>((nextResolve, nextReject) => {
    reject = nextReject;
    resolve = nextResolve;
  });
  return { promise, reject, resolve };
}

type DeleteAction = (profile: Profile) => Promise<void>;

afterEach(() => {
  vi.clearAllMocks();
});

it("disables repeat deletion and closes after success", async () => {
  const user = userEvent.setup();
  const onClose = vi.fn();
  const deleteRequest = deferred();
  const onDelete = vi.fn<DeleteAction>().mockReturnValue(deleteRequest.promise);

  render(
    <DeleteServerModal
      onClose={onClose}
      onDelete={onDelete}
      opened
      profile={profile}
    />,
  );

  expect(screen.getByRole("dialog")).toHaveTextContent(profile.name);
  expect(
    screen.getByRole("button", {
      name: i18n.t("actions.close", { ns: "common" }),
    }),
  ).toBeInTheDocument();

  await user.click(deleteButton());

  expect(onDelete).toHaveBeenCalledOnce();
  const [submittedProfile] = onDelete.mock.calls[0];
  expect(submittedProfile.id).toBe("example-server");
  expect(onClose).not.toHaveBeenCalled();
  expect(deleteButton()).toBeDisabled();

  await user.click(deleteButton());
  expect(onDelete).toHaveBeenCalledOnce();
  expect(onClose).not.toHaveBeenCalled();

  await act(async () => {
    deleteRequest.resolve();
    await deleteRequest.promise;
  });

  await waitFor(() => expect(onClose).toHaveBeenCalledOnce());
});

it("surfaces a normalized deletion failure", async () => {
  const user = userEvent.setup();
  const onClose = vi.fn();
  const deleteRequest = deferred();
  const deleteError = new Error("delete-context: delete-error-sentinel");
  const onDelete = vi.fn<DeleteAction>().mockReturnValue(deleteRequest.promise);

  render(
    <DeleteServerModal
      onClose={onClose}
      onDelete={onDelete}
      opened
      profile={profile}
    />,
  );

  await user.click(deleteButton());

  expect(notifications.show).not.toHaveBeenCalled();

  await act(async () => {
    deleteRequest.reject(deleteError);
    await expect(deleteRequest.promise).rejects.toBe(deleteError);
  });

  await waitFor(() => expect(notifications.show).toHaveBeenCalledOnce());
  expect(notifications.show).toHaveBeenCalledWith({
    color: "red",
    message: "delete-context: delete-error-sentinel",
    title: i18n.t("dialogs.delete.error.title", { ns: "servers" }),
  });
  expect(onClose).not.toHaveBeenCalled();
  expect(screen.getByRole("dialog")).toBeInTheDocument();
  expect(deleteButton()).toBeEnabled();
});

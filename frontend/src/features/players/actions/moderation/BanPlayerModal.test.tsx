import {
  afterAll,
  afterEach,
  beforeAll,
  describe,
  expect,
  it,
  vi,
} from "vitest";
import { Player } from "@bindings/internal/player/models";
import i18n from "@/i18n";
import { fireEvent, render, screen } from "@/test/render";
import { BanPlayerModal } from "./BanPlayerModal";

const players = [
  new Player({ id: "bravo", username: "Bob" }),
  new Player({ id: "alpha", username: "Alice" }),
];

type BanAction = (
  targets: Player[],
  reason: string,
  banIP: boolean,
) => Promise<boolean>;

const reasonName = i18n.t("fields.reason.label", { ns: "players" });
const banIpName = i18n.t("dialogs.ban.banIp.label", { ns: "players" });
const submitName = i18n.t("dialogs.ban.submit", { ns: "players" });

function submitButton() {
  return screen.getByRole("button", { name: submitName });
}

const originalFonts = Object.getOwnPropertyDescriptor(document, "fonts");

beforeAll(() => {
  Object.defineProperty(document, "fonts", {
    configurable: true,
    value: {
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    },
  });
});

afterAll(() => {
  if (originalFonts) Object.defineProperty(document, "fonts", originalFonts);
  else Reflect.deleteProperty(document, "fonts");
});

afterEach(() => {
  vi.clearAllMocks();
});

describe("BanPlayerModal", () => {
  it("forwards ordered targets and normalized form values", async () => {
    const onBan = vi.fn<BanAction>().mockResolvedValue(false);
    const onClose = vi.fn();
    render(
      <BanPlayerModal
        onBan={onBan}
        onClose={onClose}
        opened
        players={players}
      />,
    );

    expect(screen.getByRole("dialog")).toBeVisible();
    expect(onBan).not.toHaveBeenCalled();

    fireEvent.change(screen.getByRole("textbox", { name: reasonName }), {
      target: { value: "  reason-sentinel  " },
    });
    fireEvent.click(screen.getByRole("checkbox", { name: banIpName }));
    fireEvent.click(submitButton());

    expect(onBan).toHaveBeenCalledOnce();
    const [submittedTargets, submittedReason, submittedBanIP] =
      onBan.mock.calls[0];
    expect(submittedTargets.map((target) => target.id)).toEqual([
      "bravo",
      "alpha",
    ]);
    expect(submittedReason).toBe("reason-sentinel");
    expect(submittedBanIP).toBe(true);
    expect(onClose).not.toHaveBeenCalled();
  });
});

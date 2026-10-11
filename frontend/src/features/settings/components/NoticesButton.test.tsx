import { beforeEach, describe, expect, it, vi } from "vitest";
import { Browser } from "@wailsio/runtime";
import { Report as getReport } from "@bindings/internal/notices/service";
import i18n from "@/i18n";
import { fireEvent, render, screen } from "@/test/render";
import { NoticesButton } from "@/features/settings/components/NoticesButton";

vi.mock("@bindings/internal/notices/service", () => ({ Report: vi.fn() }));
vi.mock("@wailsio/runtime", () => ({ Browser: { OpenURL: vi.fn() } }));

const report = {
  applicationLicense: "Application license text",
  entries: [
    { name: "Zulu", identifier: "BSD-3-Clause", text: "Zulu license text" },
    {
      name: "Alpha",
      version: "1.0",
      identifier: "MIT",
      text: "Copyright Example\nPermission is granted.",
      source: "https://example.com/license",
      note: "Original attribution",
    },
    {
      name: "Alpha",
      identifier: "MIT",
      text: "Additional Alpha notice",
      source: "internal/example/LICENSE",
    },
  ],
};

function open() {
  fireEvent.click(
    screen.getByRole("button", {
      name: i18n.t("notices.title", { ns: "settings" }),
    }),
  );
}

describe("NoticesButton", () => {
  beforeEach(() => {
    vi.mocked(getReport).mockReset();
    vi.mocked(getReport).mockResolvedValue(structuredClone(report));
    vi.mocked(Browser.OpenURL).mockReset();
    vi.mocked(Browser.OpenURL).mockResolvedValue(undefined);
  });

  it("loads on demand, searches metadata, and keeps duplicate names distinct", async () => {
    render(<NoticesButton />);
    expect(getReport).not.toHaveBeenCalled();
    open();
    const search = await screen.findByRole("textbox", {
      name: i18n.t("notices.search.label", { ns: "settings" }),
    });
    const alpha = screen.getAllByRole("button", { name: /Alpha/ });
    expect(alpha).toHaveLength(2);
    expect(
      screen.queryByText("Additional Alpha notice"),
    ).not.toBeInTheDocument();
    fireEvent.click(alpha[1]);
    expect(await screen.findByText("Additional Alpha notice")).toBeVisible();
    expect(screen.getByText("internal/example/LICENSE").tagName).not.toBe("A");

    fireEvent.change(search, { target: { value: "BSD-3" } });
    expect(
      screen.queryByRole("button", { name: /Alpha/ }),
    ).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Zulu/ })).toBeVisible();
    fireEvent.change(search, { target: { value: "no-match" } });
    expect(
      screen.getByText(i18n.t("notices.search.empty", { ns: "settings" })),
    ).toBeVisible();
    fireEvent.click(
      screen.getByRole("button", {
        name: i18n.t("search.clear", { ns: "common" }),
      }),
    );
    expect(screen.getAllByRole("button", { name: /Alpha/ })).toHaveLength(2);
    expect(search).toHaveFocus();
    fireEvent.click(screen.getAllByRole("button", { name: /Alpha/ })[0]);
    expect(await screen.findByText("Original attribution")).toBeVisible();
    expect(screen.getByText(/Copyright Example/).textContent).toBe(
      report.entries[1].text,
    );
    fireEvent.click(
      screen.getByRole("link", {
        name: i18n.t("notices.actions.source", { ns: "settings" }),
      }),
    );
    expect(Browser.OpenURL).toHaveBeenCalledWith("https://example.com/license");
  });

  it("can retry loading and still shows the application license with an empty report", async () => {
    vi.mocked(getReport).mockRejectedValueOnce(new Error("Example failure"));
    vi.mocked(getReport).mockResolvedValueOnce({
      applicationLicense: report.applicationLicense,
      entries: [],
    });
    render(<NoticesButton />);
    open();
    expect(await screen.findByText("Example failure")).toBeVisible();
    fireEvent.click(
      screen.getByRole("button", {
        name: i18n.t("actions.retry", { ns: "common" }),
      }),
    );
    expect(
      await screen.findByText(
        i18n.t("notices.unavailable", { ns: "settings" }),
      ),
    ).toBeVisible();
    fireEvent.click(
      screen.getByRole("button", {
        name: i18n.t("notices.application", { ns: "settings" }),
      }),
    );
    expect(await screen.findByText(report.applicationLicense)).toBeVisible();
    expect(getReport).toHaveBeenCalledTimes(2);
  });
});

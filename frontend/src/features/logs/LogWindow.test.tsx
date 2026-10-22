import { CancellablePromise } from "@wailsio/runtime";
import { beforeEach, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@/test/render";
import { Read } from "@bindings/internal/logger/service";
import { Entry, Update } from "@bindings/internal/logger/models";
import { LogWindow } from "./LogWindow";
import { LogOutput } from "./components/LogOutput";

vi.mock("@bindings/internal/logger/service", () => ({
  Read: vi.fn(),
}));
beforeEach(() => {
  Object.defineProperty(document, "hidden", {
    configurable: true,
    value: false,
  });
  vi.mocked(Read).mockImplementation((afterID) =>
    CancellablePromise.resolve(
      new Update({
        entries:
          afterID === 0
            ? [
                new Entry({
                  id: 1,
                  text: "level=INFO application started",
                  level: "INFO",
                }),
              ]
            : [],
        firstID: 1,
      }),
    ),
  );
});
it("copies all retained entries including truncation indicators", async () => {
  vi.mocked(Read).mockResolvedValueOnce(
    new Update({
      firstID: 1,
      entries: [
        new Entry({
          id: 1,
          text: "level=INFO application started",
          level: "INFO",
        }),
        new Entry({
          id: 2,
          text: "level=DEBUG server response",
          level: "DEBUG",
        }),
        new Entry({
          id: 3,
          text: "level=WARN long response",
          level: "WARN",
          truncated: true,
        }),
      ],
    }),
  );
  const writeText = vi.fn(async (_text: string) => {});
  Object.defineProperty(navigator, "clipboard", {
    configurable: true,
    value: { writeText },
  });
  render(<LogWindow />);
  expect(
    await screen.findByText("level=INFO application started"),
  ).toBeInTheDocument();
  const button = screen.getByRole("button", { name: "Copy" });
  fireEvent.click(button);
  await waitFor(() =>
    expect(writeText).toHaveBeenCalledWith(
      "level=INFO application started\nlevel=DEBUG server response\nlevel=WARN long response [truncated]",
    ),
  );
});
it("shows read failures with a retry action", async () => {
  vi.mocked(Read).mockRejectedValueOnce(new Error("read failed"));
  render(<LogWindow />);
  expect(await screen.findByText("read failed")).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Try again" }));
  expect(
    await screen.findByText("level=INFO application started"),
  ).toBeInTheDocument();
});

it("keeps the scroll position until the user returns to the bottom", () => {
  const entries = [
    new Entry({ id: 1, text: "first entry", level: "INFO" }),
    new Entry({ id: 2, text: "second entry", level: "INFO" }),
  ];
  const { rerender } = render(<LogOutput entries={[]} loading={false} />);
  const viewport = screen.getByRole("region", { name: "Log entries" });
  Object.defineProperties(viewport, {
    clientHeight: { value: 100 },
    scrollHeight: { value: 300 },
  });

  viewport.scrollTop = 180;
  fireEvent.scroll(viewport);
  rerender(<LogOutput entries={entries.slice(0, 1)} loading={false} />);
  expect(viewport.scrollTop).toBe(180);

  viewport.scrollTop = 200;
  fireEvent.scroll(viewport);
  rerender(<LogOutput entries={entries} loading={false} />);
  expect(viewport.scrollTop).toBe(300);
});

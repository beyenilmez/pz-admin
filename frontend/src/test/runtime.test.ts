import { expect, it } from "vitest";
import { CancellablePromise, Create } from "@wailsio/runtime";

it("keeps Wails utilities available without initializing the desktop runtime", async () => {
  expect(Create.Array(Create.Any)([1, 2])).toEqual([1, 2]);
  await expect(CancellablePromise.resolve("ready")).resolves.toBe("ready");
  expect(window).not.toHaveProperty("_wails");
});

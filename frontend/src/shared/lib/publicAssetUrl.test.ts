import { afterEach, describe, expect, it, vi } from "vitest";
import { publicAssetUrl } from "./publicAssetUrl";

afterEach(() => vi.unstubAllEnvs());

describe("publicAssetUrl", () => {
  it("preserves desktop asset paths", () => {
    vi.stubEnv("BASE_URL", "/");
    expect(publicAssetUrl("/items/42/Base.Axe_0.png")).toBe(
      "/items/42/Base.Axe_0.png",
    );
  });

  it("resolves generated and relative paths under the website base", () => {
    vi.stubEnv("BASE_URL", "/pz-admin/");
    expect(publicAssetUrl("/vehicles/stats/doors.png")).toBe(
      "/pz-admin/vehicles/stats/doors.png",
    );
    expect(publicAssetUrl("items/42/Base.Axe_0.png")).toBe(
      "/pz-admin/items/42/Base.Axe_0.png",
    );
  });
});

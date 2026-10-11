import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Profile } from "@bindings/internal/profile/models";
import { Type } from "@bindings/internal/connection/models";
import { Delete, List, Save } from "@bindings/internal/profile/service";
import { useServerProfiles } from "./useServerProfiles";

vi.mock("@bindings/internal/profile/service", () => ({
  Delete: vi.fn(),
  List: vi.fn(),
  Save: vi.fn(),
}));

const alphaProfile: Profile = {
  id: "alpha",
  name: "Alpha",
  connectionType: Type.TypeRCON,
  host: "alpha.example.com",
  port: 27015,
  version: "42",
};

const zuluProfile: Profile = {
  id: "zulu",
  name: "Zulu",
  connectionType: Type.TypeRCON,
  host: "zulu.example.com",
  port: 27016,
  version: "41",
};

afterEach(() => {
  vi.resetAllMocks();
});

describe("useServerProfiles", () => {
  it("loads profiles through the Wails service and presents them by name", async () => {
    vi.mocked(List).mockResolvedValue([zuluProfile, alphaProfile]);

    const { result } = renderHook(() => useServerProfiles("en"));

    expect(result.current.loading).toBe(true);
    expect(result.current.profiles).toEqual([]);

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(List).toHaveBeenCalledOnce();
    expect(result.current.loadError).toBeNull();
    expect(result.current.profiles).toEqual([alphaProfile, zuluProfile]);
  });

  it("exposes a load failure and lets the user retry", async () => {
    vi.mocked(List)
      .mockRejectedValueOnce(new Error("profile store unavailable"))
      .mockResolvedValueOnce([alphaProfile]);

    const { result } = renderHook(() => useServerProfiles());

    await waitFor(() =>
      expect(result.current.loadError).toBe("profile store unavailable"),
    );
    expect(result.current.loading).toBe(false);
    expect(result.current.profiles).toEqual([]);

    await act(async () => {
      await result.current.load();
    });

    expect(List).toHaveBeenCalledTimes(2);
    expect(result.current.loadError).toBeNull();
    expect(result.current.profiles).toEqual([alphaProfile]);
  });

  it("adds and removes profiles after successful Wails mutations", async () => {
    vi.mocked(List).mockResolvedValue([alphaProfile]);
    vi.mocked(Save).mockResolvedValue(zuluProfile);
    vi.mocked(Delete).mockResolvedValue(undefined);

    const { result } = renderHook(() => useServerProfiles("en"));
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.save(zuluProfile, "secret");
    });

    expect(Save).toHaveBeenCalledWith(zuluProfile, "secret");
    expect(result.current.profiles).toEqual([alphaProfile, zuluProfile]);

    await act(async () => {
      await result.current.remove(alphaProfile);
    });

    expect(Delete).toHaveBeenCalledWith(alphaProfile.id);
    expect(result.current.profiles).toEqual([zuluProfile]);
  });

  it("replaces a saved profile by ID and preserves locale sorting", async () => {
    const submittedProfile = new Profile({
      connectionType: alphaProfile.connectionType,
      host: alphaProfile.host,
      id: alphaProfile.id,
      name: "Submitted name",
      port: alphaProfile.port,
      version: alphaProfile.version,
    });
    const savedProfile = new Profile({
      connectionType: submittedProfile.connectionType,
      host: submittedProfile.host,
      id: submittedProfile.id,
      name: "Bravo",
      port: submittedProfile.port,
      version: submittedProfile.version,
    });
    vi.mocked(List).mockResolvedValue([zuluProfile, alphaProfile]);
    vi.mocked(Save).mockResolvedValue(savedProfile);

    const { result } = renderHook(() => useServerProfiles("en"));
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.save(submittedProfile, "replacement secret");
    });

    expect(Save).toHaveBeenCalledWith(submittedProfile, "replacement secret");
    expect(result.current.profiles).toEqual([savedProfile, zuluProfile]);
  });
});

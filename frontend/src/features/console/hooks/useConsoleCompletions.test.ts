import { act, renderHook, waitFor } from "@/test/render";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { Player } from "@bindings/internal/player/models";
import {
  useAppConfig,
  type LanguageSetting,
} from "@/features/config/AppConfigProvider";
import type { GameBuild } from "@/features/game/types";
import { loadItemCatalog } from "@/features/items/catalog";
import type { ItemCatalog, ItemCatalogEntry } from "@/features/items/types";
import { usePlayers } from "@/features/players/PlayersProvider";
import { loadSkillCatalog } from "@/features/skills/catalog";
import type { SkillCatalog, SkillCatalogEntry } from "@/features/skills/types";
import { loadVehicleCatalog } from "@/features/vehicles/catalog";
import type {
  VehicleCatalog,
  VehicleCatalogEntry,
} from "@/features/vehicles/types";
import type { ConsoleCompletionSource } from "../types";
import { clearConsoleCommand } from "../lib/catalog";
import { useConsoleCompletions } from "./useConsoleCompletions";

vi.mock("@/features/config/AppConfigProvider", () => ({
  useAppConfig: vi.fn(),
}));

vi.mock("@/features/players/PlayersProvider", () => ({
  usePlayers: vi.fn(),
}));

vi.mock("@/features/items/catalog", () => ({
  loadItemCatalog: vi.fn(),
}));

vi.mock("@/features/skills/catalog", () => ({
  loadSkillCatalog: vi.fn(),
}));

vi.mock("@/features/vehicles/catalog", () => ({
  loadVehicleCatalog: vi.fn(),
}));

interface Deferred<Value> {
  promise: Promise<Value>;
  resolve: (value: Value) => void;
}

interface HookProps {
  activeSource: ConsoleCompletionSource | null;
  build: GameBuild | undefined;
}

function deferred<Value>(): Deferred<Value> {
  let resolve!: (value: Value) => void;
  const promise = new Promise<Value>((nextResolve) => {
    resolve = nextResolve;
  });
  return { promise, resolve };
}

function itemCatalog(
  build: GameBuild,
  language: string,
  ids: readonly string[],
): ItemCatalog {
  const items: ItemCatalogEntry[] = ids.map((id) => ({
    build,
    category: "Test",
    categoryId: "test",
    defaultName: `Default ${id}`,
    id,
    images: [],
    name: `Display ${id}`,
  }));
  return {
    build,
    categories: [],
    items,
    itemsById: new Map(items.map((item) => [item.id, item])),
    language,
    searchIndex: new Map(),
  };
}

function skillCatalog(
  build: GameBuild,
  language: string,
  ids: readonly string[],
): SkillCatalog {
  const skills: SkillCatalogEntry[] = ids.map((id) => ({
    id,
    image: "",
    name: `Display ${id}`,
    progressionId: "test",
  }));
  return {
    build,
    categories: [],
    language,
    progressions: new Map(),
    skills,
    skillsById: new Map(skills.map((skill) => [skill.id, skill])),
  };
}

function vehicleCatalog(
  build: GameBuild,
  ids: readonly string[],
): VehicleCatalog {
  const vehicles: VehicleCatalogEntry[] = ids.map((id) => ({
    build,
    category: "Test",
    id,
    image: null,
    name: `Display ${id}`,
    stats: {},
    variant: null,
  }));
  return {
    build,
    hierarchy: [],
    language: "en-US",
    lightbarAvailable: false,
    searchIndex: new Map(),
    statRanges: {},
    variantsByVehicleId: new Map(),
    vehicleIdsByHierarchyNode: new Map(),
    vehicles,
    vehiclesById: new Map(vehicles.map((vehicle) => [vehicle.id, vehicle])),
  };
}

function mockLanguage(language: LanguageSetting) {
  vi.mocked(useAppConfig).mockReturnValue({
    config: { language, theme: "system", downloadUpdatesOnStartup: true },
    error: null,
    loading: false,
    reload: vi.fn(),
    setDownloadUpdatesOnStartup: vi.fn(async () => undefined),
    setLanguage: vi.fn(async () => undefined),
    setTheme: vi.fn(async () => undefined),
  });
}

function mockPlayers(players: Player[]) {
  vi.mocked(usePlayers).mockReturnValue({
    error: null,
    loading: false,
    players,
    refresh: vi.fn(async () => undefined),
  });
}

function renderCompletions(initialProps: HookProps) {
  return renderHook(
    ({ activeSource, build }: HookProps) =>
      useConsoleCompletions(build, activeSource),
    { initialProps },
  );
}

beforeEach(() => {
  vi.resetAllMocks();
  mockLanguage("en-US");
  mockPlayers([]);
});

describe("useConsoleCompletions", () => {
  it("shapes skill and vehicle values and reuses vehicles across languages", async () => {
    vi.mocked(loadSkillCatalog).mockResolvedValue(
      skillCatalog("42", "en-US", ["Strength", "Aiming"]),
    );
    vi.mocked(loadVehicleCatalog).mockResolvedValue(
      vehicleCatalog("42", ["Base.Car10", "Base.Car2"]),
    );
    const hook = renderCompletions({ activeSource: "skills", build: "42" });

    await waitFor(() =>
      expect(hook.result.current.skills).toEqual(["Aiming=", "Strength="]),
    );
    expect(loadSkillCatalog).toHaveBeenCalledWith("42", "en-US");

    hook.rerender({ activeSource: "vehicles", build: "42" });
    await waitFor(() =>
      expect(hook.result.current.vehicles).toEqual(["Base.Car2", "Base.Car10"]),
    );
    expect(loadVehicleCatalog).toHaveBeenCalledOnce();
    expect(loadVehicleCatalog).toHaveBeenCalledWith("42");

    mockLanguage("tr-TR");
    hook.rerender({ activeSource: "vehicles", build: "42" });
    await waitFor(() =>
      expect(hook.result.current.vehicles).toEqual(["Base.Car2", "Base.Car10"]),
    );
    expect(loadVehicleCatalog).toHaveBeenCalledOnce();
  });

  it("isolates item values by language and build and ignores a late stale load", async () => {
    const initialRequest = deferred<ItemCatalog>();
    const languageRequest = deferred<ItemCatalog>();
    const buildRequest = deferred<ItemCatalog>();
    vi.mocked(loadItemCatalog)
      .mockReturnValueOnce(initialRequest.promise)
      .mockReturnValueOnce(languageRequest.promise)
      .mockReturnValueOnce(buildRequest.promise);
    const hook = renderCompletions({ activeSource: "items", build: "41" });

    await act(async () => {
      initialRequest.resolve(itemCatalog("41", "en-US", ["Base.Old"]));
      await initialRequest.promise;
    });
    expect(hook.result.current.items).toEqual(["Base.Old"]);

    mockLanguage("de");
    hook.rerender({ activeSource: "items", build: "41" });
    expect(hook.result.current.items).toEqual([]);
    expect(loadItemCatalog).toHaveBeenNthCalledWith(2, "41", "de");

    hook.rerender({ activeSource: "items", build: "42" });
    expect(hook.result.current.items).toEqual([]);
    expect(loadItemCatalog).toHaveBeenNthCalledWith(3, "42", "de");

    await act(async () => {
      languageRequest.resolve(itemCatalog("41", "de", ["Base.StaleLanguage"]));
      await languageRequest.promise;
    });
    expect(hook.result.current.items).toEqual([]);

    await act(async () => {
      buildRequest.resolve(itemCatalog("42", "de", ["Base.Current"]));
      await buildRequest.promise;
    });
    expect(hook.result.current.items).toEqual(["Base.Current"]);
  });

  it("separates online players and sorts names with locale-aware numerics", () => {
    mockLanguage("tr-TR");
    mockPlayers([
      new Player({
        id: "ipek",
        lastKnownOfflineAt: new Date(1),
        lastSeenOnlineAt: new Date(2),
        username: "İpek",
      }),
      new Player({
        id: "irmak-10",
        lastKnownOfflineAt: new Date(1),
        lastSeenOnlineAt: new Date(2),
        username: "Irmak10",
      }),
      new Player({
        id: "irmak-2",
        lastKnownOfflineAt: new Date(2),
        lastSeenOnlineAt: new Date(1),
        username: "Irmak2",
      }),
    ]);

    const { result } = renderCompletions({
      activeSource: "items",
      build: undefined,
    });

    expect(result.current.commands).toEqual([clearConsoleCommand]);
    expect(result.current.onlinePlayers).toEqual(["Irmak10", "İpek"]);
    expect(result.current.players).toEqual(["Irmak2", "Irmak10", "İpek"]);
    expect(loadItemCatalog).not.toHaveBeenCalled();
    expect(loadSkillCatalog).not.toHaveBeenCalled();
    expect(loadVehicleCatalog).not.toHaveBeenCalled();
  });
});

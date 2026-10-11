import { describe, expect, it } from "vitest";
import { rankedConsoleSuggestions } from "./matching";

describe("rankedConsoleSuggestions", () => {
  it("ranks prefixes before substrings and ordered word-part matches", () => {
    const candidates = [
      "server.reload-options",
      "reload-server",
      "server-reload",
      "server.restart",
    ];

    expect(rankedConsoleSuggestions(candidates, "server reload", 10)).toEqual([
      "server.reload-options",
      "server-reload",
    ]);
    expect(rankedConsoleSuggestions(candidates, "reload", 10)).toEqual([
      "reload-server",
      "server.reload-options",
      "server-reload",
    ]);
  });

  it("matches without regard to letter case while preserving suggestions", () => {
    expect(
      rankedConsoleSuggestions(["AddUser", "additem", "RemoveUser"], "ADD", 10),
    ).toEqual(["AddUser", "additem"]);
  });

  it("keeps source order among matches of equal quality", () => {
    expect(
      rankedConsoleSuggestions(["addxp", "adduser", "additem"], "add", 10),
    ).toEqual(["addxp", "adduser", "additem"]);
  });

  it("limits the number of suggestions", () => {
    expect(rankedConsoleSuggestions(["one", "two", "three"], "", 2)).toEqual([
      "one",
      "two",
    ]);
  });

  it("does not match query parts in reverse candidate order", () => {
    expect(
      rankedConsoleSuggestions(["reload-server"], "server reload", 10),
    ).toEqual([]);
  });
});

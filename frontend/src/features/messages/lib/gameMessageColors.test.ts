import { describe, expect, it } from "vitest";
import {
  decodeGameMessageRgb,
  defaultGameMessageColor,
  encodeGameMessageColorToken,
  encodeGameMessagePushColorToken,
  getGameMessageNamedColor,
} from "./gameMessageColors";

describe("game message color decoding", () => {
  it("clamps channels and rounds them to eight-bit RGB", () => {
    expect(decodeGameMessageRgb("-0.1", "0.5", "1.2")).toBe("#0080ff");
    expect(decodeGameMessageRgb("invalid", "0.501", "Infinity")).toBe(
      "#008000",
    );
  });

  it("looks up supported named colors without regard to case", () => {
    expect(getGameMessageNamedColor("42", "oRaNgE")).toBe("#e64d00");
    expect(getGameMessageNamedColor("41", "unknown")).toBeUndefined();
  });
});

describe("game message color encoding", () => {
  it("uses a shorter exact named token and RGB for other colors", () => {
    expect(encodeGameMessageColorToken("#ff0000", "42")).toBe("<RED>");
    expect(encodeGameMessageColorToken("#fe0000", "42")).toBe("<RED>");
    expect(encodeGameMessageColorToken("#fd0000", "42")).toBe("<RGB:0.99,0,0>");
    expect(encodeGameMessageColorToken(defaultGameMessageColor, "42")).toBe(
      "<RGB:0,0.5,1>",
    );
  });

  it("rounds RGB channel fractions to the game token precision", () => {
    expect(encodeGameMessageColorToken("#010203", "42")).toBe(
      "<RGB:0,0.01,0.01>",
    );
    expect(encodeGameMessagePushColorToken("#804020")).toBe(
      "<PUSHRGB:0.5,0.25,0.13>",
    );
  });

  it("falls back to the default color for invalid tokens", () => {
    expect(encodeGameMessageColorToken("not-a-color", "41")).toBe(
      "<RGB:0,0.5,1>",
    );
    expect(encodeGameMessagePushColorToken("not-a-color")).toBe(
      "<PUSHRGB:0,0.5,1>",
    );
  });
});

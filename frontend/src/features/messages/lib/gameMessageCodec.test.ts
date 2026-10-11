import { describe, expect, it } from "vitest";
import type { MessageDocument } from "@/features/messages/types";
import {
  containsForbiddenGameMessageCharacters,
  isGameMessageTextAllowed,
  parseGameMessage,
  sanitizeGameMessageText,
  serializeGameMessage,
} from "./gameMessageCodec";

describe("game message text validation", () => {
  it.each(["<", ">", '"', "\0"])("rejects %j", (character) => {
    const value = `before${character}after`;

    expect(containsForbiddenGameMessageCharacters(value)).toBe(true);
    expect(isGameMessageTextAllowed(value)).toBe(false);
  });

  it("accepts ordinary text", () => {
    expect(isGameMessageTextAllowed("Welcome, survivors!")).toBe(true);
  });

  it("removes every forbidden character", () => {
    expect(sanitizeGameMessageText('a<b>c"d\0e')).toBe("abcde");
  });
});

describe("parseGameMessage", () => {
  it("creates an empty document for an empty message", () => {
    expect(parseGameMessage("", "42")).toEqual({
      type: "doc",
      content: [{ type: "paragraph" }],
    });
  });

  it("applies a format preset and restores explicit paragraph alignment", () => {
    expect(parseGameMessage("<H1>Heading <LINE> <LEFT>Body", "42")).toEqual({
      type: "doc",
      content: [
        {
          type: "paragraph",
          attrs: { textAlign: "center" },
          content: [
            {
              type: "text",
              text: "Heading",
              marks: [
                {
                  type: "textStyle",
                  attrs: { color: "#ffffff", fontSize: "1.14em" },
                },
              ],
            },
          ],
        },
        {
          type: "paragraph",
          attrs: { textAlign: "left" },
          content: [
            {
              type: "text",
              text: "Body",
              marks: [
                {
                  type: "textStyle",
                  attrs: { color: "#ffffff", fontSize: "1.14em" },
                },
              ],
            },
          ],
        },
      ],
    });
  });

  it("preserves boundary spaces represented by SPACE tokens", () => {
    const document = parseGameMessage("<SPACE>Hello<SPACE>", "42");

    expect(document.content[0].content?.map((text) => text.text).join("")).toBe(
      " Hello ",
    );
  });
});

describe("serializeGameMessage", () => {
  it("sanitizes forbidden characters before encoding", () => {
    const document: MessageDocument = {
      type: "doc",
      content: [
        {
          type: "paragraph",
          attrs: { textAlign: "left" },
          content: [{ type: "text", text: '  Hello<world>"  ' }],
        },
      ],
    };

    expect(serializeGameMessage(document, "42")).toBe("<LEFT> Helloworld");
  });

  it("encodes significant spaces between differently styled text nodes", () => {
    const document: MessageDocument = {
      type: "doc",
      content: [
        {
          type: "paragraph",
          content: [
            { type: "text", text: "Hello" },
            {
              type: "text",
              text: " world",
              marks: [{ type: "textStyle", attrs: { color: "#ffffff" } }],
            },
          ],
        },
      ],
    };

    expect(serializeGameMessage(document, "42")).toBe(
      "<LEFT> Hello <RGB:1,1,1> <SPACE> world",
    );
  });
});

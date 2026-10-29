import { Editor } from "@tiptap/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { messageEditorExtensions } from "./messageEditorConfig";
import { serializeGameMessage } from "./gameMessageCodec";
import { toMessageDocument } from "./messageEditorAdapter";

describe("message editor", () => {
  let editor: Editor;

  beforeEach(() => {
    editor = new Editor({
      extensions: messageEditorExtensions,
      content: "<p>Hello</p>",
    });
  });

  afterEach(() => {
    editor.destroy();
  });

  it.each(["41", "42"] as const)(
    "inserts line breaks at the end for build %s",
    (build) => {
      const message = () =>
        serializeGameMessage(toMessageDocument(editor.getJSON()), build);

      editor.commands.setTextSelection(6);
      editor.commands.keyboardShortcut("Enter");
      expect(message()).toBe("<LEFT> Hello <LINE>");

      editor.commands.keyboardShortcut("Enter");
      expect(message()).toBe("<LEFT> Hello <BR>");

      editor.commands.insertContent("World");
      expect(message()).toBe("<LEFT> Hello <BR> World");
    },
  );

  it("inserts a line break inside text", () => {
    editor.commands.setTextSelection(3);
    editor.commands.keyboardShortcut("Enter");
    expect(editor.getText({ blockSeparator: "\n" })).toBe("He\nllo");
  });
});

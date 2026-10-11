import { Color } from "@tiptap/extension-color";
import { TextAlign } from "@tiptap/extension-text-align";
import { FontSize, TextStyle } from "@tiptap/extension-text-style";
import { StarterKit } from "@tiptap/starter-kit";
import { defaultGameMessageColor } from "./gameMessageColors";

export const messageEditorExtensions = [
  StarterKit.configure({
    blockquote: false,
    bold: false,
    bulletList: false,
    code: false,
    codeBlock: false,
    hardBreak: false,
    heading: false,
    horizontalRule: false,
    italic: false,
    link: false,
    listItem: false,
    orderedList: false,
    strike: false,
    underline: false,
  }),
  TextStyle,
  Color,
  FontSize,
  TextAlign.configure({
    alignments: ["left", "center", "right"],
    types: ["paragraph"],
  }),
];

export const messageColorSwatches = [
  "#ffffff",
  "#e64d00",
  "#ffff00",
  "#00ff00",
  "#00ffff",
  defaultGameMessageColor,
  "#0000ff",
  "#ff00ff",
  "#ff0000",
];

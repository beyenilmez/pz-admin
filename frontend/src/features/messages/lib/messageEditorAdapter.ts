import type {
  MessageAlignment,
  MessageDocument,
  MessageMark,
  MessageParagraph,
  MessageText,
} from "@/features/messages/types";

interface EditorJsonMark {
  attrs?: Record<string, unknown>;
  type?: string;
}

interface EditorJsonNode {
  attrs?: Record<string, unknown>;
  content?: EditorJsonNode[];
  marks?: EditorJsonMark[];
  text?: string;
  type?: string;
}

export function readStringAttribute(
  attributes: unknown,
  name: string,
): string | undefined {
  if (!isRecord(attributes)) return undefined;
  const value = attributes[name];
  return typeof value === "string" ? value : undefined;
}

export function toMessageDocument(document: EditorJsonNode): MessageDocument {
  return {
    type: "doc",
    content: (document.content ?? []).flatMap(toMessageParagraph),
  };
}

function toMessageParagraph(node: EditorJsonNode): MessageParagraph[] {
  if (node.type !== "paragraph") return [];

  const alignment = messageAlignment(node.attrs?.textAlign);
  const content = (node.content ?? []).flatMap(toMessageText);
  return [
    {
      type: "paragraph",
      ...(alignment ? { attrs: { textAlign: alignment } } : {}),
      ...(content.length > 0 ? { content } : {}),
    },
  ];
}

function toMessageText(node: EditorJsonNode): MessageText[] {
  if (node.type !== "text" || typeof node.text !== "string") return [];

  const marks = (node.marks ?? []).flatMap(toMessageMark);
  return [
    {
      type: "text",
      text: node.text,
      ...(marks.length > 0 ? { marks } : {}),
    },
  ];
}

function toMessageMark(mark: EditorJsonMark): MessageMark[] {
  if (mark.type !== "textStyle") return [];

  const color = readStringAttribute(mark.attrs, "color");
  const fontSize = readStringAttribute(mark.attrs, "fontSize");
  return [
    {
      type: "textStyle",
      attrs: {
        ...(color ? { color } : {}),
        ...(fontSize ? { fontSize } : {}),
      },
    },
  ];
}

function messageAlignment(value: unknown): MessageAlignment | undefined {
  return value === "left" || value === "center" || value === "right"
    ? value
    : undefined;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

import { describe, expect, it } from "vitest";
import type { MessageDocument } from "@/features/messages/types";
import { toMessageDocument } from "./messageEditorAdapter";

type EditorDocument = Parameters<typeof toMessageDocument>[0];

describe("toMessageDocument", () => {
  it("preserves the canonical editor document contract", () => {
    const document = {
      type: "doc",
      content: [
        {
          type: "paragraph",
          attrs: { textAlign: "center" },
          content: [
            {
              type: "text",
              text: "Styled",
              marks: [
                {
                  type: "textStyle",
                  attrs: { color: "#e64d00", fontSize: "1.14em" },
                },
              ],
            },
            { type: "text", text: " text" },
          ],
        },
        { type: "paragraph" },
        {
          type: "paragraph",
          attrs: { textAlign: "right" },
          content: [{ type: "text", text: "After break" }],
        },
      ],
    } satisfies EditorDocument;

    expect(toMessageDocument(document)).toEqual(document);
  });

  it("discards unsupported nodes, marks, and malformed attributes", () => {
    expect(
      toMessageDocument({
        type: "doc",
        content: [
          {
            type: "heading",
            content: [{ type: "text", text: "Unsupported block" }],
          },
          {
            type: "paragraph",
            attrs: { textAlign: "justify" },
            content: [
              {
                type: "text",
                text: "Safe text",
                marks: [
                  { type: "bold" },
                  { type: "italic" },
                  { type: "underline" },
                  { type: "strike" },
                  {
                    type: "textStyle",
                    attrs: { color: 42, fontSize: "0.86em" },
                  },
                ],
              },
              { type: "hardBreak" },
              { type: "text" },
            ],
          },
          {
            type: "paragraph",
            attrs: { textAlign: null },
            content: [{ type: "text", text: "Next paragraph" }],
          },
        ],
      }),
    ).toEqual({
      type: "doc",
      content: [
        {
          type: "paragraph",
          content: [
            {
              type: "text",
              text: "Safe text",
              marks: [
                {
                  type: "textStyle",
                  attrs: { fontSize: "0.86em" },
                },
              ],
            },
          ],
        },
        {
          type: "paragraph",
          content: [{ type: "text", text: "Next paragraph" }],
        },
      ],
    } satisfies MessageDocument);
  });
});

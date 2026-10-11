import type { MessageDocument } from "@/features/messages/types";

export function createEmptyMessageDocument(): MessageDocument {
  return { type: "doc", content: [{ type: "paragraph" }] };
}

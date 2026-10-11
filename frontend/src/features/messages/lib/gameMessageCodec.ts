import {
  decodeGameMessageRgb,
  defaultGameMessageColor,
  encodeGameMessageColorToken,
  encodeGameMessagePushColorToken,
  getGameMessageNamedColor,
} from "@/features/messages/lib/gameMessageColors";
import { createEmptyMessageDocument } from "@/features/messages/lib/messageDocument";
import type { GameBuild } from "@/features/game/types";
import type {
  MessageDocument,
  MessageAlignment,
  MessageParagraph,
  MessageSize,
  MessageText,
  MessageTextStyle,
} from "@/features/messages/types";

export const defaultGameMessageSize: MessageSize = "medium";
const MESSAGE_SIZES: readonly MessageSize[] = ["small", "medium", "large"];
const LINE_TOKEN = " <LINE> ";
const BR_TOKEN = " <BR> ";
const SPACE_TOKEN = " <SPACE> ";
const TOKEN_PATTERN = / *<([^<>]+)> */g;
const FORBIDDEN_CHARACTER_PATTERN = /[<>"\0]/;
const ALL_FORBIDDEN_CHARACTERS_PATTERN = /[<>"\0]/g;
const FORMAT_PRESETS = {
  H1: { alignment: "center", color: "#ffffff", size: "large" },
  H2: { alignment: "left", color: "#cccccc", size: "medium" },
  TEXT: { alignment: "left", color: "#b3b3b3", size: "medium" },
} as const satisfies Record<
  string,
  { alignment: MessageAlignment; color: string; size: MessageSize }
>;
interface GameMessageFontMetrics {
  family: string;
  lineHeights: Record<MessageSize, string>;
  sizes: Record<MessageSize, string>;
  weight: number;
}

export const gameMessageFontMetrics: Record<GameBuild, GameMessageFontMetrics> =
  {
    "41": {
      family: "Corbel",
      lineHeights: { small: "0.95rem", medium: "1.25rem", large: "1.5rem" },
      sizes: { small: "0.8em", medium: "1em", large: "1.2em" },
      weight: 700,
    },
    "42": {
      family: '"Noto Sans"',
      lineHeights: { small: "0.82rem", medium: "1.25rem", large: "1.42rem" },
      sizes: { small: "0.66em", medium: "1em", large: "1.14em" },
      weight: 600,
    },
  };

interface FormatState {
  alignment?: MessageAlignment;
  color?: string;
  colorStack?: (string | undefined)[];
  size?: MessageSize;
}

interface ResolvedFormat {
  color: string;
  size: MessageSize;
}

interface SerializationState extends ResolvedFormat {
  colorStack: string[];
}

interface FormattingToken {
  pattern: RegExp;
  apply(match: RegExpMatchArray, state: FormatState, build: GameBuild): void;
}

const formattingTokens: FormattingToken[] = [
  {
    pattern: /^(H1|H2|TEXT)$/,
    apply(match, state) {
      const name = match[1];
      if (!isFormatPreset(name)) return;
      const preset = FORMAT_PRESETS[name];
      state.alignment = preset.alignment;
      state.color = preset.color;
      state.size = preset.size;
    },
  },
  {
    pattern: /^PUSHRGB:([\d.]+),([\d.]+),([\d.]+)$/,
    apply(match, state) {
      state.colorStack ??= [];
      state.colorStack.push(state.color);
      state.color = decodeGameMessageRgb(match[1], match[2], match[3]);
    },
  },
  {
    pattern: /^POPRGB$/,
    apply(_match, state) {
      if (state.colorStack?.length) state.color = state.colorStack.pop();
    },
  },
  {
    pattern: /^RGB:([\d.]+),([\d.]+),([\d.]+)$/,
    apply(match, state) {
      state.color = decodeGameMessageRgb(match[1], match[2], match[3]);
    },
  },
  {
    pattern: /^SIZE:(small|medium|large)$/,
    apply(match, state) {
      const size = match[1];
      if (isMessageSize(size)) state.size = size;
    },
  },
  {
    pattern: /^(LEFT|CENTRE|RIGHT)$/,
    apply(match, state) {
      state.alignment = gameTokenToAlignment(match[1]);
    },
  },
  {
    pattern: /^([A-Za-z_]+)$/,
    apply(match, state, build) {
      const color = getGameMessageNamedColor(build, match[1]);
      if (color) state.color = color;
    },
  },
];

export function parseGameMessage(
  value: string,
  build: GameBuild,
): MessageDocument {
  if (!value) return createEmptyMessageDocument();

  const formatState: FormatState = {};
  const paragraphs: MessageParagraph[] = [createParagraph()];
  let textStart = 0;

  for (const tokenMatch of value.matchAll(TOKEN_PATTERN)) {
    appendText(
      currentParagraph(paragraphs),
      value.slice(textStart, tokenMatch.index),
      formatState,
      build,
    );
    applyToken(tokenMatch[1], paragraphs, formatState, build);
    textStart = tokenMatch.index + tokenMatch[0].length;
  }

  appendText(
    currentParagraph(paragraphs),
    value.slice(textStart),
    formatState,
    build,
  );
  return { type: "doc", content: paragraphs };
}

export function serializeGameMessage(
  document: MessageDocument,
  build: GameBuild,
): string {
  const serializationState = createDefaultFormat();
  let alignment: MessageAlignment | undefined;
  const texts = document.content.flatMap(
    (paragraph) => paragraph.content ?? [],
  );
  const values = normalizeMessageText(document.content);
  const serializedTexts = texts.filter((text) => values.get(text));
  if (serializedTexts.length === 0) return "";

  const remainingColors = serializedTexts.map(
    (text) => resolveTextFormat(findTextStyle(text), build).color,
  );

  const message = document.content
    .map((paragraph) => {
      const nextAlignment = paragraph.attrs?.textAlign ?? "left";
      const alignmentToken = encodeAlignmentTransition(
        alignment,
        nextAlignment,
      );
      alignment = nextAlignment;
      return (
        alignmentToken +
        (paragraph.content ?? [])
          .map((text) => {
            const value = values.get(text);
            return value
              ? serializeText(
                  text,
                  value,
                  serializationState,
                  build,
                  remainingColors,
                )
              : "";
          })
          .join("")
      );
    })
    .join(LINE_TOKEN)
    .split(LINE_TOKEN + LINE_TOKEN)
    .join(BR_TOKEN);

  const alignedMessage = alignment === "left" ? message : `${message} <LEFT> `;
  return optimizeFormatPresets(alignedMessage)
    .replace(/> +</g, "> <")
    .replace(/^ +(?=<)/, "")
    .replace(/(>) +$/, "$1");
}

function optimizeFormatPresets(message: string): string {
  return message
    .replace(/<CENTRE> +<RGB:1,1,1> +<SIZE:large>/g, "<H1>")
    .replace(/<LEFT> +<RGB:0\.8,0\.8,0\.8> +<SIZE:medium>/g, "<H2>")
    .replace(/<LEFT> +<RGB:0\.7,0\.7,0\.7> +<SIZE:medium>/g, "<TEXT>");
}

export function containsForbiddenGameMessageCharacters(value: string): boolean {
  return FORBIDDEN_CHARACTER_PATTERN.test(value);
}

export function isGameMessageTextAllowed(value: string): boolean {
  return !containsForbiddenGameMessageCharacters(value);
}

export function sanitizeGameMessageText(value: string): string {
  return value.replace(ALL_FORBIDDEN_CHARACTERS_PATTERN, "");
}

function applyToken(
  token: string,
  paragraphs: MessageParagraph[],
  format: FormatState,
  build: GameBuild,
) {
  if (token === "LINE") {
    paragraphs.push(createParagraph(format.alignment));
    return;
  }

  if (token === "BR") {
    paragraphs.push(
      createParagraph(format.alignment),
      createParagraph(format.alignment),
    );
    return;
  }

  if (token === "SPACE") {
    appendText(currentParagraph(paragraphs), " ", format, build);
    return;
  }

  for (const definition of formattingTokens) {
    const match = token.match(definition.pattern);
    if (!match) continue;
    const previousAlignment = format.alignment;
    definition.apply(match, format, build);
    if (format.alignment !== previousAlignment) {
      setParagraphAlignment(currentParagraph(paragraphs), format.alignment);
    }
    return;
  }
}

function appendText(
  paragraph: MessageParagraph,
  text: string,
  format: FormatState,
  build: GameBuild,
) {
  if (!text) return;

  const style = formatToTextStyle(format, build);
  paragraph.content ??= [];
  paragraph.content.push({
    type: "text",
    text,
    ...(style ? { marks: [{ type: "textStyle", attrs: style }] } : {}),
  });
}

function createParagraph(alignment?: MessageAlignment): MessageParagraph {
  return {
    type: "paragraph",
    ...(alignment ? { attrs: { textAlign: alignment } } : {}),
  };
}

function currentParagraph(paragraphs: MessageParagraph[]): MessageParagraph {
  return paragraphs[paragraphs.length - 1];
}

function serializeText(
  text: MessageText,
  value: string,
  current: SerializationState,
  build: GameBuild,
  remainingColors: string[],
): string {
  const next = resolveTextFormat(findTextStyle(text), build);
  remainingColors.shift();
  const prefix = encodeFormatTransition(current, next, build, remainingColors);

  current.color = next.color;
  current.size = next.size;
  return prefix + encodeBoundarySpaces(value);
}

function normalizeMessageText(
  paragraphs: MessageParagraph[],
): Map<MessageText, string> {
  const values = new Map<MessageText, string>();

  for (const paragraph of paragraphs) {
    const texts = paragraph.content ?? [];
    const normalized = texts.map((text) => ({
      text,
      value: sanitizeGameMessageText(text.text),
    }));

    for (const entry of normalized) {
      entry.value = entry.value.trimStart();
      if (entry.value) break;
    }

    for (let index = normalized.length - 1; index >= 0; index -= 1) {
      const entry = normalized[index];
      entry.value = entry.value.trimEnd();
      if (entry.value) break;
    }

    for (const entry of normalized) {
      values.set(entry.text, entry.value);
    }
  }

  return values;
}

function encodeFormatTransition(
  current: SerializationState,
  next: ResolvedFormat,
  build: GameBuild,
  remainingColors: string[],
): string {
  const tokens: string[] = [];
  if (next.color !== current.color) {
    tokens.push(
      encodeColorTransition(current, next.color, build, remainingColors),
    );
  }
  if (next.size !== current.size) {
    tokens.push(`<SIZE:${next.size}>`);
  }
  return tokens.length > 0 ? ` ${tokens.join(" ")} ` : "";
}

function encodeColorTransition(
  current: SerializationState,
  nextColor: string,
  build: GameBuild,
  remainingColors: string[],
): string {
  const directToken = encodeGameMessageColorToken(nextColor, build);
  const stackedColor = current.colorStack[current.colorStack.length - 1];

  if (stackedColor === nextColor && "<POPRGB>".length < directToken.length) {
    current.colorStack.pop();
    return "<POPRGB>";
  }

  const returnToken = encodeGameMessageColorToken(current.color, build);
  const pushToken = encodeGameMessagePushColorToken(nextColor);
  const returnsToCurrentColor = remainingColors.includes(current.color);
  if (
    returnsToCurrentColor &&
    pushToken.length + "<POPRGB>".length <
      directToken.length + returnToken.length
  ) {
    current.colorStack.push(current.color);
    return pushToken;
  }

  return directToken;
}

function encodeAlignmentTransition(
  current: MessageAlignment | undefined,
  next: MessageAlignment,
): string {
  if (current === next) return "";
  const token = next === "center" ? "CENTRE" : next.toUpperCase();
  return ` <${token}> `;
}

function findTextStyle(text: MessageText): MessageTextStyle | undefined {
  return text.marks?.find((mark) => mark.type === "textStyle")?.attrs;
}

function createDefaultFormat(): SerializationState {
  return {
    color: defaultGameMessageColor,
    colorStack: [],
    size: defaultGameMessageSize,
  };
}

function encodeBoundarySpaces(text: string): string {
  const leadingSpaces = text.length - text.trimStart().length;
  if (leadingSpaces === text.length) {
    return SPACE_TOKEN.repeat(leadingSpaces);
  }

  const trailingSpaces = text.length - text.trimEnd().length;
  const contentEnd = Math.max(leadingSpaces, text.length - trailingSpaces);
  const content = text.slice(leadingSpaces, contentEnd);

  return (
    SPACE_TOKEN.repeat(leadingSpaces) +
    content +
    SPACE_TOKEN.repeat(trailingSpaces)
  );
}

function formatToTextStyle(
  format: FormatState,
  build: GameBuild,
): MessageTextStyle | undefined {
  if (!format.color && !format.size) return undefined;
  return {
    ...(format.color ? { color: format.color } : {}),
    ...(format.size
      ? { fontSize: gameMessageFontMetrics[build].sizes[format.size] }
      : {}),
  };
}

function resolveTextFormat(
  style: MessageTextStyle | undefined,
  build: GameBuild,
): ResolvedFormat {
  return {
    color: style?.color ?? defaultGameMessageColor,
    size: fontSizeToMessageSize(style?.fontSize, build),
  };
}

function fontSizeToMessageSize(
  fontSize: string | undefined,
  build: GameBuild,
): MessageSize {
  for (const size of MESSAGE_SIZES) {
    if (gameMessageFontMetrics[build].sizes[size] === fontSize) return size;
  }
  return defaultGameMessageSize;
}

function gameTokenToAlignment(token: string): MessageAlignment {
  switch (token) {
    case "CENTRE":
      return "center";
    case "RIGHT":
      return "right";
    default:
      return "left";
  }
}

function isFormatPreset(value: string): value is keyof typeof FORMAT_PRESETS {
  return value === "H1" || value === "H2" || value === "TEXT";
}

function isMessageSize(value: string): value is MessageSize {
  return value === "small" || value === "medium" || value === "large";
}

function setParagraphAlignment(
  paragraph: MessageParagraph,
  alignment: MessageAlignment | undefined,
) {
  paragraph.attrs = alignment ? { textAlign: alignment } : undefined;
}

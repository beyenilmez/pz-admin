import { convertHsvaTo, isColorValid, parseColor } from "@mantine/core";
import type { GameBuild } from "@/features/game/types";

export const defaultGameMessageColor = "#0080ff";

const HEX_CHANNEL_OFFSETS = [0, 2, 4] as const;

// The welcome-message rich-text parser supports only these direct named colors.
const namedColors: Readonly<Record<string, string>> = {
  Green: "#00ff00",
  Orange: "#e64d00",
  Red: "#ff0000",
};

const namedColorsByLowercaseName = new Map(
  Object.entries(namedColors).map(([name, color]) => [
    name.toLowerCase(),
    color,
  ]),
);

export function getGameMessageNamedColor(
  _build: GameBuild,
  name: string,
): string | undefined {
  return namedColorsByLowercaseName.get(name.toLowerCase());
}

export function decodeGameMessageRgb(
  red: string,
  green: string,
  blue: string,
): string {
  const channels = [red, green, blue].map((channel) =>
    Math.round(clamp(Number.parseFloat(channel), 0, 1) * 255),
  );
  return `#${channels.map(toHexChannel).join("")}`;
}

export function encodeGameMessageColorToken(
  color: string,
  _build: GameBuild,
): string {
  const normalizedColor = normalizeColor(color);
  const rgb = encodeGameMessageRgb(normalizedColor);
  const rgbToken = `<RGB:${rgb}>`;
  const [red, green, blue] = rgb.split(",");
  const rgbColor =
    red !== undefined && green !== undefined && blue !== undefined
      ? decodeGameMessageRgb(red, green, blue)
      : normalizedColor;
  const namedColor = getClosestNamedColor(normalizedColor);
  const namedToken = `<${namedColor.name.toUpperCase()}>`;

  return namedToken.length < rgbToken.length &&
    colorDistance(namedColor.color, normalizedColor) <=
      colorDistance(rgbColor, normalizedColor)
    ? namedToken
    : rgbToken;
}

export function encodeGameMessagePushColorToken(color: string): string {
  return `<PUSHRGB:${encodeGameMessageRgb(normalizeColor(color))}>`;
}

function getClosestNamedColor(color: string): { color: string; name: string } {
  let closest = { color: namedColors.Red, name: "Red" };
  let closestDistance = Number.POSITIVE_INFINITY;

  for (const [name, namedColor] of Object.entries(namedColors)) {
    const distance = colorDistance(color, namedColor);
    if (distance < closestDistance) {
      closest = { color: namedColor, name };
      closestDistance = distance;
    }
  }

  return closest;
}

function colorDistance(first: string, second: string): number {
  const firstChannels = hexChannels(first);
  const secondChannels = hexChannels(second);
  return firstChannels.reduce((distance, channel, index) => {
    const difference = channel - secondChannels[index];
    return distance + difference * difference;
  }, 0);
}

function hexChannels(color: string): number[] {
  const hex = color.replace("#", "");
  return HEX_CHANNEL_OFFSETS.map((offset) =>
    Number.parseInt(hex.slice(offset, offset + 2), 16),
  );
}

function encodeGameMessageRgb(color: string): string {
  const hex = normalizeColor(color).replace("#", "");
  return HEX_CHANNEL_OFFSETS.map((offset) =>
    Number.parseInt(hex.slice(offset, offset + 2), 16),
  )
    .map((channel) => formatGameChannel(channel / 255))
    .join(",");
}

function normalizeColor(color: string): string {
  return isColorValid(color)
    ? convertHsvaTo("hex", parseColor(color)).toLowerCase()
    : defaultGameMessageColor;
}

function toHexChannel(channel: number): string {
  return channel.toString(16).padStart(2, "0");
}

function formatGameChannel(channel: number): string {
  return Number(channel.toFixed(2)).toString();
}

function clamp(value: number, minimum: number, maximum: number): number {
  if (!Number.isFinite(value)) return minimum;
  return Math.min(Math.max(value, minimum), maximum);
}

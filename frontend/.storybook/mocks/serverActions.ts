import { fn } from "storybook/test";
export const ReloadAllLua = fn(async () => {}).mockName("ReloadAllLua");
export const ReloadLua = fn(async (_file: string) => {}).mockName("ReloadLua");
export const ReloadOptions = fn(async () => {}).mockName("ReloadOptions");
export const SaveWorld = fn(async () => {}).mockName("SaveWorld");
export const SendMessage = fn(async (_message: string) => {}).mockName(
  "SendMessage",
);
export const StartRain = fn(async (_intensity: number) => {}).mockName(
  "StartRain",
);
export const StartStorm = fn(async (_duration: number) => {}).mockName(
  "StartStorm",
);
export const StopRain = fn(async () => {}).mockName("StopRain");
export const StopServer = fn(async () => {}).mockName("StopServer");
export const StopWeather = fn(async () => {}).mockName("StopWeather");
export const TriggerGunshot = fn(async () => {}).mockName("TriggerGunshot");
export const TriggerHelicopter = fn(async () => {}).mockName(
  "TriggerHelicopter",
);
export const TriggerLightning = fn(async () => ({
  target: "sawyer",
})).mockName("TriggerLightning");
export const TriggerThunder = fn(async () => ({
  target: "sawyer",
})).mockName("TriggerThunder");

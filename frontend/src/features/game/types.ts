export const gameBuilds = ["41", "42"] as const;

export type GameBuild = (typeof gameBuilds)[number];

export const latestGameBuild: GameBuild = gameBuilds[gameBuilds.length - 1];

export function isGameBuild(value: string): value is GameBuild {
  return gameBuilds.some((build) => build === value);
}

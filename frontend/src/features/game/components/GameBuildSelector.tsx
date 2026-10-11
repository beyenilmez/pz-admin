import { SegmentedControl } from "@mantine/core";
import { useTranslation } from "react-i18next";
import { gameBuilds, isGameBuild, type GameBuild } from "../types";

interface GameBuildSelectorProps {
  onChange: (build: GameBuild) => void;
  value: GameBuild;
}

export function GameBuildSelector({ onChange, value }: GameBuildSelectorProps) {
  const { t } = useTranslation("common");

  function handleChange(nextBuild: string) {
    if (isGameBuild(nextBuild)) onChange(nextBuild);
  }

  return (
    <SegmentedControl
      aria-label={t("gameBuild.label")}
      data={gameBuilds.map((build) => ({
        label: t("gameBuild.value", { version: build }),
        value: build,
      }))}
      onChange={handleChange}
      value={value}
    />
  );
}

import { Box, ScrollArea, type ScrollAreaAutosizeProps } from "@mantine/core";
import { GameCreditsButton } from "@/features/game/components/GameCreditsButton";

/** Keeps credits at the modal edge, outside its padded, scrolling body. */
export function GameCreditsScrollArea(props: ScrollAreaAutosizeProps) {
  return (
    <Box pos="relative" style={{ borderRadius: "inherit", overflow: "hidden" }}>
      <ScrollArea.Autosize {...props} />
      <GameCreditsButton />
    </Box>
  );
}

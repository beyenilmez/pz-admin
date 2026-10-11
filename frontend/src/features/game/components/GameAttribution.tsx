import { Anchor, Text } from "@mantine/core";
import { Browser } from "@wailsio/runtime";

const gameUrl = "https://projectzomboid.com/";
const termsUrl = "https://projectzomboid.com/blog/support/terms-conditions/";

export function GameAttribution() {
  // Keep the prescribed acknowledgment in its original English.
  return (
    <Text component="p" size="sm" m={0} lang="en" dir="ltr" translate="no">
      Thanks to The Indie Stone for creating Project Zomboid (
      <Anchor
        href={gameUrl}
        inherit
        data-mantine-stop-propagation
        onClick={(event) => {
          event.preventDefault();
          void Browser.OpenURL(gameUrl);
        }}
      >
        {gameUrl}
      </Anchor>
      ), which made this possible. This is an unofficial fan production for
      non-commercial purposes made under the{" "}
      <Anchor
        href={termsUrl}
        inherit
        data-mantine-stop-propagation
        onClick={(event) => {
          event.preventDefault();
          void Browser.OpenURL(termsUrl);
        }}
      >
        Indie Stone Terms
      </Anchor>
      .
    </Text>
  );
}

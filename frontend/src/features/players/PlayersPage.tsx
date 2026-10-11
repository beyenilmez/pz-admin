import { PlayerActionsProvider } from "./actions/PlayerActionsProvider";
import { PlayersWorkspace } from "./components/PlayersWorkspace";

export function PlayersPage() {
  return (
    <PlayerActionsProvider>
      <PlayersWorkspace />
    </PlayerActionsProvider>
  );
}

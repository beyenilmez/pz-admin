import { lazy, Suspense, useState } from "react";
import { Center, Loader } from "@mantine/core";
import { latestGameBuild, type GameBuild } from "@/features/game/types";
import classes from "./Tools.module.css";

const MessageEditorPage = lazy(() =>
  import("@/features/messages/MessageEditorPage").then((module) => ({
    default: module.MessageEditorPage,
  })),
);
const ItemsPage = lazy(() =>
  import("@/features/items/ItemsPage").then((module) => ({
    default: module.ItemsPage,
  })),
);
const VehiclesPage = lazy(() =>
  import("@/features/vehicles/VehiclesPage").then((module) => ({
    default: module.VehiclesPage,
  })),
);

const tools = [
  { value: "messages", component: MessageEditorPage },
  { value: "items", component: ItemsPage },
  { value: "vehicles", component: VehiclesPage },
] as const;

export default function Tools({
  activePage,
  visited,
}: {
  activePage: string;
  visited: readonly string[];
}) {
  const [build, setBuild] = useState<GameBuild>(latestGameBuild);
  return (
    <div className={classes.root}>
      {tools.map(({ value, component: ToolPage }) => (
        <div
          className={classes.panel}
          key={value}
          hidden={activePage !== value}
        >
          {visited.includes(value) ? (
            <Suspense
              fallback={
                <Center h="100%">
                  <Loader />
                </Center>
              }
            >
              <ToolPage build={build} onBuildChange={setBuild} />
            </Suspense>
          ) : null}
        </div>
      ))}
    </div>
  );
}

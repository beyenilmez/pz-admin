import { useState } from "react";
import { useTranslation } from "react-i18next";
import type { GameBuild } from "@/features/game/types";
import { GameToolPageLayout } from "@/features/game/components/GameToolPageLayout";
import { FormattedMessagePreview } from "@/features/messages/components/FormattedMessagePreview";
import { GameMessageEditor } from "@/features/messages/components/GameMessageEditor";
import classes from "./MessageEditorPage.module.css";

interface MessageEditorPageProps {
  build: GameBuild;
  onBuildChange: (build: GameBuild) => void;
}

export function MessageEditorPage({
  build,
  onBuildChange,
}: MessageEditorPageProps) {
  const { t } = useTranslation(["messages", "common"]);
  const [message, setMessage] = useState("");

  return (
    <GameToolPageLayout
      build={build}
      onBuildChange={onBuildChange}
      title={t("page.title")}
    >
      <GameMessageEditor
        key={build}
        build={build}
        className={classes.editor}
        onChange={setMessage}
        value={message}
      />

      <FormattedMessagePreview value={message} />
    </GameToolPageLayout>
  );
}

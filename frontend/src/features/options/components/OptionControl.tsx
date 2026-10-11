import { MessageEditorDialog } from "@/features/messages/components/MessageEditorDialog";
import { ItemEditorDialog } from "@/features/items/components/ItemEditorDialog";
import type { GameBuild } from "@/features/game/types";
import type { OptionDefinition } from "../catalog";
import { OptionInput, type OptionInputProps } from "./OptionInput";

export function optionControlSize(definition: OptionDefinition) {
  if (definition.type === "boolean") return "intrinsic";
  if (definition.choices && !definition.multiple) return "medium";
  if (definition.type === "integer" || definition.type === "number") {
    return "compact";
  }
  if (
    definition.type === "string" &&
    definition.maximumLength !== undefined &&
    definition.maximumLength <= 24
  ) {
    return "medium";
  }
  return "wide";
}

interface OptionControlProps extends OptionInputProps {
  build: GameBuild;
}

export function OptionControl({ build, ...props }: OptionControlProps) {
  if (props.definition.editor === "items") {
    return (
      <ItemEditorDialog
        build={build}
        descriptionId={props.descriptionId}
        disabled={props.disabled}
        invalid={Boolean(props.error)}
        maxBytes={props.definition.maximumBytes}
        onChange={props.onChange}
        value={typeof props.value === "string" ? props.value : ""}
      />
    );
  }

  if (props.definition.editor === "message") {
    return (
      <MessageEditorDialog
        build={build}
        descriptionId={props.descriptionId}
        disabled={props.disabled}
        invalid={Boolean(props.error)}
        labelId={props.labelId}
        maxBytes={props.definition.maximumBytes}
        onChange={props.onChange}
        value={typeof props.value === "string" ? props.value : ""}
      />
    );
  }

  return <OptionInput {...props} />;
}

import { Text } from "@mantine/core";
import { useTranslation } from "react-i18next";
import { CopyValueButton } from "@/shared/components/CopyValueButton";

interface VehicleIdCopyButtonProps {
  id: string;
}

export function VehicleIdCopyButton({ id }: VehicleIdCopyButtonProps) {
  const { t } = useTranslation("common");

  return (
    <CopyValueButton
      copiedLabel={t("actions.copied")}
      copyLabel={t("actions.copy")}
      value={id}
    >
      <Text
        ff="monospace"
        size="xs"
        style={{ overflowWrap: "anywhere" }}
        translate="no"
      >
        {id}
      </Text>
    </CopyValueButton>
  );
}

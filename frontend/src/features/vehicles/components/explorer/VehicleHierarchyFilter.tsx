import type { ReactNode } from "react";
import {
  Box,
  Group,
  Text,
  Tree,
  UnstyledButton,
  useTree,
  type TreeNodeData,
} from "@mantine/core";
import { IconChevronDown, IconChevronRight } from "@tabler/icons-react";
import { useTranslation } from "react-i18next";

function accessibleNodeName(label: ReactNode): string {
  return typeof label === "string" ? label : "";
}

interface VehicleHierarchyFilterProps {
  data: TreeNodeData[];
  onChange: (value: string | null) => void;
  value: string | null;
}

export function VehicleHierarchyFilter({
  data,
  onChange,
  value,
}: VehicleHierarchyFilterProps) {
  const { t } = useTranslation(["vehicles", "common"]);
  const tree = useTree({
    selectedState: value ? [value] : [],
    onSelectedStateChange: (values) => onChange(values[0] ?? null),
  });

  return (
    <Tree
      aria-label={t("filters.vehicle.label")}
      data={data}
      expandOnClick={false}
      levelOffset="xs"
      selectOnClick
      styles={{ label: { backgroundColor: "transparent" } }}
      tree={tree}
      renderNode={({
        elementProps,
        expanded,
        hasChildren,
        node,
        selected,
        tree: controller,
      }) => (
        <Group {...elementProps} gap={6} wrap="nowrap" py={3}>
          {hasChildren ? (
            <UnstyledButton
              aria-label={
                expanded
                  ? t("actions.collapseNamed", {
                      name: accessibleNodeName(node.label),
                      ns: "common",
                    })
                  : t("actions.expandNamed", {
                      name: accessibleNodeName(node.label),
                      ns: "common",
                    })
              }
              display="flex"
              style={{ flex: "0 0 14px" }}
              onClick={(event) => {
                event.stopPropagation();
                controller.toggleExpanded(node.value);
              }}
            >
              {expanded ? (
                <IconChevronDown size={14} aria-hidden="true" />
              ) : (
                <IconChevronRight size={14} aria-hidden="true" />
              )}
            </UnstyledButton>
          ) : (
            <Box style={{ flex: "0 0 14px" }} />
          )}
          <Text
            c={selected ? "blue" : undefined}
            fw={400}
            lineClamp={1}
            fz={13}
          >
            {node.label}
          </Text>
        </Group>
      )}
    />
  );
}

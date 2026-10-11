import { useEffect, useRef, useState } from "react";
import {
  ActionIcon,
  Box,
  Center,
  Group,
  NumberInput,
  Paper,
  ScrollArea,
  Stack,
  Text,
  TextInput,
  Title,
  Tooltip,
} from "@mantine/core";
import { IconPackage, IconPlus, IconX } from "@tabler/icons-react";
import { useTranslation } from "react-i18next";
import { ItemThumbnail } from "./ItemThumbnail";
import type { ItemSelectionController } from "@/features/items/hooks/useItemSelection";
import type { ItemCatalog } from "@/features/items/types";
import classes from "./ItemBrowser.module.css";

interface SelectedItemsPaneProps {
  catalog: ItemCatalog | null;
  selection: ItemSelectionController;
}

export function SelectedItemsPane({
  catalog,
  selection,
}: SelectedItemsPaneProps) {
  const { t } = useTranslation(["items", "common"]);
  const [customItemId, setCustomItemId] = useState("");
  const selectedItems = [...selection.selection];
  const customId = customItemId.trim();
  const scrollRegionRef = useRef<HTMLDivElement>(null);
  const wasAtBottom = useRef(true);
  const previousItemCount = useRef(selectedItems.length);

  useEffect(() => {
    const itemAdded = selectedItems.length > previousItemCount.current;
    previousItemCount.current = selectedItems.length;
    if (!itemAdded || !wasAtBottom.current) return;

    const scrollRegion = scrollRegionRef.current;
    scrollRegion?.scrollTo({
      behavior: "smooth",
      top: scrollRegion.scrollHeight,
    });
  }, [selectedItems.length]);

  function handleCustomItemAdd() {
    if (!customId) return;
    selection.add(customId);
    setCustomItemId("");
  }

  return (
    <Paper className={classes.pane} pb="sm" px="sm">
      <Stack gap="sm" h="100%" style={{ minHeight: 0 }}>
        <Group justify="space-between" wrap="nowrap">
          <Title order={2} size="h4" textWrap="nowrap">
            {t("selection.title")}
          </Title>
          <Tooltip label={t("actions.clear", { ns: "common" })}>
            <ActionIcon
              aria-label={t("actions.clear", { ns: "common" })}
              color="gray"
              disabled={selectedItems.length === 0}
              onClick={selection.clear}
              variant="subtle"
            >
              <IconX aria-hidden="true" size={18} />
            </ActionIcon>
          </Tooltip>
        </Group>

        <TextInput
          aria-label={t("selection.customItem.label")}
          autoCapitalize="none"
          autoComplete="off"
          name="custom-item-id"
          onChange={(event) => setCustomItemId(event.currentTarget.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") handleCustomItemAdd();
          }}
          placeholder={t("selection.customItem.placeholder")}
          rightSection={
            <ActionIcon
              aria-label={t("selection.customItem.actions.add")}
              disabled={!customId}
              onClick={handleCustomItemAdd}
              size="sm"
              variant="subtle"
            >
              <IconPlus aria-hidden="true" size={16} />
            </ActionIcon>
          }
          spellCheck={false}
          value={customItemId}
        />

        <ScrollArea
          className={classes.scrollRegion}
          offsetScrollbars="y"
          onScrollPositionChange={() => {
            const region = scrollRegionRef.current;
            if (region) {
              wasAtBottom.current =
                region.scrollHeight - region.scrollTop - region.clientHeight <=
                1;
            }
          }}
          overscrollBehavior="contain"
          scrollbars="y"
          scrollbarSize={10}
          type="auto"
          viewportRef={scrollRegionRef}
        >
          {selectedItems.length === 0 ? (
            <Center mih={180} p="md">
              <Stack align="center" gap="xs">
                <IconPackage aria-hidden="true" opacity={0.45} size={32} />
                <Text c="dimmed" size="sm" ta="center">
                  {t("selection.empty")}
                </Text>
              </Stack>
            </Center>
          ) : (
            <Box className={classes.selectedItemsGrid}>
              {selectedItems.map(([itemId, quantity]) => {
                const item = catalog?.itemsById.get(itemId);
                return (
                  <Group
                    className={classes.selectedItem}
                    key={itemId}
                    wrap="nowrap"
                  >
                    <Tooltip label={itemId} openDelay={500}>
                      <Box className={classes.thumbnail}>
                        <ItemThumbnail
                          fallbackSize={24}
                          images={item?.images ?? []}
                          size={40}
                        />
                      </Box>
                    </Tooltip>
                    <Box className={classes.itemText}>
                      <Text fw={500} lineClamp={1} size="sm">
                        {item?.name ?? itemId}
                      </Text>
                      {item ? (
                        <Text
                          c="dimmed"
                          fz="0.625rem"
                          lh={1.2}
                          translate="no"
                          truncate
                        >
                          {itemId}
                        </Text>
                      ) : null}
                    </Box>
                    <NumberInput
                      allowDecimal={false}
                      allowNegative={false}
                      aria-label={t("selection.quantity.label", {
                        name: item?.name ?? itemId,
                      })}
                      min={0}
                      onChange={(value) => {
                        if (typeof value === "number") {
                          selection.setQuantity(itemId, value);
                        }
                      }}
                      size="xs"
                      styles={{
                        input: {
                          fontVariantNumeric: "tabular-nums",
                          textAlign: "center",
                        },
                      }}
                      value={quantity}
                      w={56}
                    />
                  </Group>
                );
              })}
            </Box>
          )}
        </ScrollArea>
      </Stack>
    </Paper>
  );
}

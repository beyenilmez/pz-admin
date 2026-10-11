import { memo, useMemo, useRef, useState } from "react";
import {
  ActionIcon,
  Accordion,
  Box,
  Center,
  Group,
  Paper,
  ScrollArea,
  Skeleton,
  Stack,
  Text,
  TextInput,
  UnstyledButton,
} from "@mantine/core";
import { IconChevronRight, IconSearch, IconX } from "@tabler/icons-react";
import { useTranslation } from "react-i18next";
import { useSkeletonVisibility } from "@/shared/hooks/useSkeletonVisibility";
import { ItemThumbnail } from "./ItemThumbnail";
import type {
  ItemCatalogCategory,
  ItemCatalogEntry,
} from "@/features/items/types";
import classes from "./ItemBrowser.module.css";

interface ItemCatalogPaneProps {
  categories: ItemCatalogCategory[];
  loading: boolean;
  onItemAdd: (itemId: string) => void;
  onSearchChange: (search: string) => void;
  search: string;
  selectedQuantities: ReadonlyMap<string, number>;
  visibleItems: ItemCatalogEntry[];
}

const loadingRows = Array.from({ length: 10 }, (_, index) => index);

export const ItemCatalogPane = memo(function ItemCatalogPane({
  categories,
  loading,
  onItemAdd,
  onSearchChange,
  search,
  selectedQuantities,
  visibleItems,
}: ItemCatalogPaneProps) {
  const { t } = useTranslation(["items", "common"]);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const skeleton = useSkeletonVisibility(loading);
  const [expandedCategories, setExpandedCategories] = useState<string[]>([]);
  const itemsByCategory = useMemo(() => {
    const groupedItems = new Map<string, ItemCatalogEntry[]>();
    for (const item of visibleItems) {
      const items = groupedItems.get(item.categoryId);
      if (items) items.push(item);
      else groupedItems.set(item.categoryId, [item]);
    }
    return groupedItems;
  }, [visibleItems]);
  const visibleCategories = categories.filter(
    (category) => (itemsByCategory.get(category.id)?.length ?? 0) > 0,
  );

  return (
    <Paper aria-busy={loading} className={classes.catalogPane}>
      <Stack gap="xs" h="100%" style={{ minHeight: 0 }}>
        <TextInput
          aria-label={t("browser.search.label")}
          autoComplete="off"
          disabled={loading}
          leftSection={<IconSearch aria-hidden="true" size={15} />}
          name="item-search"
          onChange={(event) => onSearchChange(event.currentTarget.value)}
          onKeyDown={(event) => {
            if (event.key === "Escape" && search) onSearchChange("");
          }}
          placeholder={t("search.nameOrId.placeholder", { ns: "common" })}
          ref={searchInputRef}
          rightSection={
            search ? (
              <ActionIcon
                aria-label={t("search.clear", { ns: "common" })}
                color="gray"
                onClick={() => {
                  onSearchChange("");
                  searchInputRef.current?.focus();
                }}
                size="sm"
                variant="subtle"
              >
                <IconX aria-hidden="true" size={15} />
              </ActionIcon>
            ) : null
          }
          size="sm"
          spellCheck={false}
          value={search}
        />

        <ScrollArea
          className={classes.scrollRegion}
          offsetScrollbars="y"
          overscrollBehavior="contain"
          scrollbars="y"
          scrollbarSize={10}
          type="auto"
        >
          {skeleton.visible ? (
            <Stack gap={4}>
              {loadingRows.map((row) => (
                <Skeleton h={30} key={row} />
              ))}
            </Stack>
          ) : skeleton.active ? null : visibleCategories.length > 0 ? (
            <Accordion
              chevron={<IconChevronRight aria-hidden="true" size={14} />}
              chevronPosition="left"
              classNames={{
                chevron: classes.accordionChevron,
                content: classes.accordionContent,
                control: classes.accordionControl,
                item: classes.accordionItem,
                label: classes.accordionLabel,
              }}
              multiple
              onChange={setExpandedCategories}
              value={expandedCategories}
            >
              {visibleCategories.map((category) => {
                const items = itemsByCategory.get(category.id) ?? [];
                const expanded = expandedCategories.includes(category.id);
                return (
                  <Accordion.Item key={category.id} value={category.id}>
                    <Accordion.Control>
                      <Group gap="xs" justify="space-between" wrap="nowrap">
                        <Text fw={500} lineClamp={1} size="sm">
                          {category.name}
                        </Text>
                        <Text c="dimmed" size="xs">
                          {items.length}
                        </Text>
                      </Group>
                    </Accordion.Control>
                    <Accordion.Panel>
                      {expanded ? (
                        <Stack gap={0}>
                          {items.map((item) => {
                            const quantity =
                              selectedQuantities.get(item.id) ?? 0;
                            return (
                              <UnstyledButton
                                aria-label={t("browser.actions.addItem", {
                                  name: item.name,
                                })}
                                className={classes.catalogItem}
                                data-selected={quantity > 0 || undefined}
                                key={item.id}
                                onClick={() => onItemAdd(item.id)}
                                title={item.id}
                              >
                                <Box className={classes.thumbnail}>
                                  <ItemThumbnail
                                    fallbackSize={17}
                                    images={item.images}
                                    size={24}
                                  />
                                </Box>
                                <Text
                                  className={classes.itemName}
                                  fw={500}
                                  size="sm"
                                >
                                  {item.name}
                                </Text>
                                {quantity > 0 ? (
                                  <Text className={classes.itemCount} size="xs">
                                    {quantity}
                                  </Text>
                                ) : null}
                              </UnstyledButton>
                            );
                          })}
                        </Stack>
                      ) : null}
                    </Accordion.Panel>
                  </Accordion.Item>
                );
              })}
            </Accordion>
          ) : (
            <Center mih={120}>
              <Text c="dimmed" size="sm">
                {t("browser.search.empty")}
              </Text>
            </Center>
          )}
        </ScrollArea>
      </Stack>
    </Paper>
  );
});

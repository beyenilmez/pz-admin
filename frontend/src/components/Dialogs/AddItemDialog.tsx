import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import { Input } from "@/components/ui/input";
import { useState, useEffect, ImgHTMLAttributes, useMemo, useRef } from "react";
import { Combobox } from "../ui/combobox";
import { Copy, ListFilter, MinusCircle, PlusCircle, Search, XCircle } from "lucide-react";
import { ScrollArea } from "../ui/scroll-area";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import itemsData from "@/assets/items.json";
import { main } from "@/wailsjs/go/models";
import { AddItems, CopyToClipboard, LoadItemsDialog, SaveItemsDialog } from "@/wailsjs/go/main/App";
import { useTranslation } from "react-i18next";
import { Checkbox } from "../ui/checkbox";
import { Label } from "../ui/label";
import { useConfig } from "@/contexts/config-provider";

interface AddItemDialogProps {
  isOpen: boolean;
  onClose: () => void;
  names?: string[];
  mode?: "add" | "settings" | "tool";
  initialItems?: string;
  onSaveEdit?: (items: string) => void;
  height?: string;
}

type Item = {
  name: string;
  itemId: string;
  images: string[];
};

type Category = {
  name: string;
  items: Item[];
};

export function AddItemDialog({
  isOpen,
  onClose,
  names,
  initialItems,
  mode = "add",
  onSaveEdit,
  height,
}: AddItemDialogProps) {
  const { config } = useConfig();
  const { t } = useTranslation("items");
  const { t: tc } = useTranslation();

  const [showIds, setShowIds] = useState(false);

  const sortedItemsData = useMemo(
    () => itemsData.sort((a, b) => tc(`item_categories.${a.name}`).localeCompare(tc(`item_categories.${b.name}`))),
    []
  );

  const translateWithFallback = (key: string, fallback = key) => {
    const translation = t(key);
    return translation === key ? fallback : translation;
  };

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFilters, setSelectedFilters] = useState<string[]>([]);
  const [selectedItems, setSelectedItems] = useState<Record<string, number>>({});

  const [resetNum, setResetNum] = useState(0);

  const scrollRef = useRef<HTMLDivElement>(null);

  const filteredCategories: Category[] = useMemo(() => {
    if (!searchQuery && selectedFilters.length === 0) {
      return sortedItemsData;
    }

    const filterItems = (category: Category): Item[] => {
      if (!searchQuery) return category.items;
      const query = searchQuery.toLowerCase();
      return category.items.filter(
        (item) =>
          tc(`item_categories.${category.name}`).toLowerCase().includes(query) ||
          translateWithFallback(item.itemId, item.name).toLowerCase().includes(query)
      );
    };

    const filtered = sortedItemsData.map((category: Category) => ({
      ...category,
      items: filterItems(category),
    }));

    if (selectedFilters.length === 0) {
      return filtered;
    }

    return filtered.filter((category) => selectedFilters.includes(category.name));
  }, [searchQuery, selectedFilters]);

  const handleAddItems = () => {
    if (!names) return;

    const itemRecords: main.ItemRecord[] = Object.entries(selectedItems).map(([itemId, count]) =>
      main.ItemRecord.createFrom({ itemId, count })
    );

    AddItems(names, itemRecords);

    onClose();
  };

  const handleAddItem = (itemId: string) => {
    const count = selectedItems[itemId] || 0;

    setSelectedItems((prev) => ({
      ...prev,
      [itemId]: count + 1,
    }));

    if (count == 0) {
      setTimeout(() => {
        scrollRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 0);
    }
  };

  const handleRemoveItem = (itemId: string) => {
    if (mode === "settings") {
      setSelectedItems((prev) => {
        const updated = { ...prev };
        delete updated[itemId];
        return updated;
      });
    }

    setSelectedItems((prev) => {
      const updated = { ...prev };
      if (updated[itemId] > 1) {
        updated[itemId] -= 1;
      } else {
        delete updated[itemId];
      }
      return updated;
    });
  };

  const handleSetItem = (itemId: string, count: number) => {
    if (count < 0) {
      return;
    }

    setSelectedItems((prev) => ({
      ...prev,
      [itemId]: count,
    }));
  };

  const handleSaveItems = () => {
    const itemRecords: main.ItemRecord[] = Object.entries(selectedItems).map(([itemId, count]) =>
      main.ItemRecord.createFrom({ itemId, count })
    );

    SaveItemsDialog(itemRecords);
  };

  const handleLoadItems = () => {
    LoadItemsDialog().then((items) => {
      setSelectedItems(items.reduce((acc, item) => ({ ...acc, [item.itemId]: item.count }), {}));
    });
  };

  useEffect(() => {
    setSearchQuery("");
    setSelectedFilters([]);
    setSelectedItems({});
    setResetNum((prev) => prev + 1);
    setShowIds(false);

    if (config?.windowScale! >= 140 && mode !== "tool") {
      if (isOpen) {
        document.documentElement.style.fontSize = 130 * (16 / 100) + "px";
      } else {
        if (config?.windowScale) {
          document.documentElement.style.fontSize = config.windowScale * (16 / 100) + "px";
        }
      }
    }
  }, [isOpen]);

  useEffect(() => {
    if (!initialItems) return;

    setSelectedItems(initialItems.split(",").reduce((acc, item) => ({ ...acc, [item]: 1 }), {}));
  }, [initialItems, resetNum]);

  const handleSaveEdit = () => {
    onSaveEdit?.(
      Object.entries(selectedItems)
        .map(([itemId, _]) => `${itemId}`)
        .join(",")
    );
    onClose();
  };

  const handleResetEdit = () => {
    setResetNum((prev) => prev + 1);
  };

  const renderSelectedItems = () => {
    return Object.entries(selectedItems).map(([itemId, count]) => {
      const item = sortedItemsData.flatMap((category: Category) => category.items).find((i) => i.itemId === itemId);

      if (!item) return null;

      return (
        <div key={itemId} className="flex items-center gap-2 p-2 border">
          <Tooltip delayDuration={500}>
            <TooltipTrigger>
              <ImageSlide
                images={item.images}
                name={translateWithFallback(item.itemId, item.name)}
                className="h-8 w-8 object-contain cursor-default select-none"
              />
            </TooltipTrigger>
            <TooltipContent>{item.itemId}</TooltipContent>
          </Tooltip>
          <span className="flex-grow text-xs w-2 text-ellipsis overflow-clip">
            {showIds ? (
              <>{item.itemId}</>
            ) : (
              <>
                {translateWithFallback(item.itemId, item.name)}{" "}
                {item.name === "Map" || (item.name === "Map (item)" && `(${item.itemId})`)}
              </>
            )}{" "}
          </span>

          {mode !== "settings" ? (
            <>
              <Button
                variant="ghost"
                size="icon"
                className="rounded-full shrink-0"
                onClick={() => handleRemoveItem(itemId)}
                asChild
              >
                <MinusCircle className="h-4 w-4" />
              </Button>
              <Input
                value={count.toString()}
                type="number"
                className="w-12 text-xs text-center px-1"
                onChange={(e) => handleSetItem(itemId, parseInt(e.target.value))}
              />
              <Button
                variant="ghost"
                size="icon"
                className="rounded-full shrink-0"
                onClick={() => handleAddItem(itemId)}
                asChild
              >
                <PlusCircle className="h-4 w-4" />
              </Button>
            </>
          ) : (
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full shrink-0"
              onClick={() => handleRemoveItem(itemId)}
              asChild
            >
              <XCircle className="h-4 w-4" />
            </Button>
          )}
        </div>
      );
    });
  };

  const dialogContent = (
    <div className={`flex gap-10 ${mode === "tool" && "w-full"}`} style={{ height: height }}>
      <div>
        <div className="flex gap-2 mb-4">
          <div className="relative w-full">
            <Input
              className="peer ps-9"
              placeholder={tc("tools.item_browser.search_items_placeholder")}
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <div className="pointer-events-none absolute inset-y-0 start-0 flex items-center justify-center ps-3 text-muted-foreground/80 peer-disabled:opacity-50">
              <Search className="w-4 h-4" strokeWidth={2} />
            </div>
          </div>
          <Combobox
            elements={sortedItemsData.map((category: Category) => ({
              value: category.name,
              label: tc(`item_categories.${category.name}`),
            }))}
            multiSelect
            unselectAllButton
            unselectAllButtonText={tc("unselect_all")}
            hideDisplayText
            icon={<ListFilter className="w-4 h-4 opacity-80" />}
            onChange={setSelectedFilters}
            disableSearch
          />
        </div>
        <ScrollArea
          className="w-80 pr-4"
          style={{
            height: height ?? "30rem",
          }}
        >
          <Accordion type="multiple">
            {filteredCategories.map(
              (category) =>
                category.items.length > 0 && (
                  <AccordionItem key={category.name} value={category.name}>
                    <AccordionTrigger className="h-8">{tc(`item_categories.${category.name}`)}</AccordionTrigger>
                    <AccordionContent className="flex flex-col items-start ml-2">
                      {category.items.map((item) => (
                        <Button
                          variant="link"
                          key={item.itemId}
                          className={`group p-0 flex gap-1 h-fit w-full justify-start ${
                            selectedItems[item.itemId] > 0 ? "text-foreground" : "opacity-80"
                          }`}
                          onClick={() => handleAddItem(item.itemId)}
                        >
                          <ImageSlide
                            images={item.images}
                            name={translateWithFallback(item.itemId, item.name)}
                            className="h-6 w-6 object-contain"
                          />

                          <span className="text-sm w-64 text-ellipsis text-start overflow-clip group-hover:underline underline-offset-auto">
                            {translateWithFallback(item.itemId, item.name)}
                            {category.name === "Cartography" ? ` (${item.itemId})` : ""}
                          </span>

                          {selectedItems[item.itemId] > 0 && mode !== "settings" && (
                            <span>{selectedItems[item.itemId]}</span>
                          )}
                        </Button>
                      ))}
                    </AccordionContent>
                  </AccordionItem>
                )
            )}
          </Accordion>
        </ScrollArea>
      </div>
      <div className="w-full">
        <div className="w-full flex justify-between pr-4 mb-4">
          <div className="flex gap-6">
            <h3 className="text-lg font-semibold">{tc("tools.item_browser.selected_items")}</h3>
            <div className="flex gap-2 items-center h-8">
              <Checkbox id="show-ids" checked={showIds} onCheckedChange={(checked) => setShowIds(checked as boolean)} />
              <Label htmlFor="show-ids">{tc("tools.item_browser.show_ids")}</Label>
            </div>
          </div>
          <Button
            className="cursor-pointer select-none"
            variant="outline"
            size="sm"
            onClick={() => setSelectedItems({})}
            disabled={Object.entries(selectedItems).length === 0}
          >
            <div className="flex gap-1 items-center">
              <XCircle className="h-4 w-4 shrink-0 mt-0.5" /> {tc("clear")}
            </div>
          </Button>
        </div>
        <ScrollArea className="pr-4 mb-4" style={{ height: height ? `calc(${height} - 2.5rem)` : "31rem" }}>
          <div className="grid grid-cols-2 2xl:grid-cols-3">{renderSelectedItems()}</div>
          <div ref={scrollRef} />
        </ScrollArea>
        <div className="flex justify-between">
          <div className={`flex gap-2 ${mode === "tool" && "w-full"}`}>
            <Button variant={"outline"} onClick={handleSaveItems} disabled={Object.entries(selectedItems).length === 0}>
              {tc("tools.item_browser.save_items")}
            </Button>
            <Button variant={"outline"} onClick={handleLoadItems}>
              {tc("tools.item_browser.load_items")}
            </Button>

            {mode === "tool" && (
              <div className="relative w-full">
                <Input className="w-full pr-9" readOnly value={Object.keys(selectedItems).join(",")} />
                {Object.keys(selectedItems).length > 0 && (
                  <Button
                    className="bg-transparent absolute inset-y-0 end-0 flex h-full w-9 items-center justify-center rounded-e-lg text-muted-foreground transition-colors hover:text-foreground"
                    tooltip={tc("copy")}
                    onClick={() => CopyToClipboard(Object.keys(selectedItems).join(","), true)}
                  >
                    <Copy strokeWidth={2} aria-hidden="true" className="w-5 h-5 shrink-0" />
                  </Button>
                )}
              </div>
            )}
          </div>
          {mode === "add" && (
            <Button onClick={handleAddItems} disabled={Object.entries(selectedItems).length === 0}>
              {tc("tools.item_browser.mode.add.add_selected_items")}
            </Button>
          )}
          {mode === "settings" && (
            <div className="space-x-2">
              <Button onClick={handleResetEdit}>{tc("tools.item_browser.mode.edit.reset")}</Button>
              <Button onClick={handleSaveEdit}>{tc("tools.item_browser.mode.edit.save_edit")}</Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  if (mode === "tool") {
    return dialogContent;
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[80vw] max-h-full">
        <DialogHeader>
          <DialogTitle className="text-2xl">
            {mode === "add" ? tc("tools.item_browser.mode.add.name") : tc("tools.item_browser.mode.edit.name")}
          </DialogTitle>
          <DialogDescription>
            {mode === "add" && <p>{tc("tools.item_browser.mode.add.description", { names: names?.join(", ") })}</p>}
          </DialogDescription>
        </DialogHeader>
        {dialogContent}
      </DialogContent>
    </Dialog>
  );
}

interface ImageSlideProps extends ImgHTMLAttributes<HTMLImageElement> {
  images: string[];
  interval?: number;
  name: string;
}
const ImageSlide: React.FC<ImageSlideProps> = ({ images, interval = 3000, name, ...imgProps }) => {
  if (!images || images.length <= 1) return <img src={images?.[0] || ""} alt={name} {...imgProps} />;

  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (!images || images.length <= 1) return;

    const imageInterval = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % images.length);
    }, interval);

    return () => clearInterval(imageInterval);
  }, [images, interval]);

  return <img src={images[currentIndex] || ""} alt={name} {...imgProps} />;
};

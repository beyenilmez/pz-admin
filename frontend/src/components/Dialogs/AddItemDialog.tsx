import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import { Input } from "@/components/ui/input";
import { useState, useEffect, ImgHTMLAttributes, useMemo, useRef } from "react";
import { Combobox } from "../ui/combobox";
import { ListFilter, MinusCircle, PlusCircle } from "lucide-react";
import { ScrollArea } from "../ui/scroll-area";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import itemsData from "@/assets/items.json";
import { main } from "@/wailsjs/go/models";
import { AddItems, LoadItemsDialog, SaveItemsDialog } from "@/wailsjs/go/main/App";

interface AddItemDialogProps {
  isOpen: boolean;
  onClose: () => void;
  names: string[];
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

export function AddItemDialog({ isOpen, onClose, names }: AddItemDialogProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFilters, setSelectedFilters] = useState<string[]>([]);
  const [selectedItems, setSelectedItems] = useState<Record<string, number>>({});

  const scrollRef = useRef<HTMLDivElement>(null);

  const filteredCategories: Category[] = useMemo(() => {
    if (!searchQuery && selectedFilters.length === 0) {
      return itemsData;
    }

    const filterItems = (category: Category): Item[] => {
      if (!searchQuery) return category.items;
      const query = searchQuery.toLowerCase();
      return category.items.filter((item) => item.name.toLowerCase().includes(query));
    };

    const filtered = itemsData.map((category: Category) => ({
      ...category,
      items: filterItems(category),
    }));

    if (selectedFilters.length === 0) {
      return filtered;
    }

    return filtered.filter((category) => selectedFilters.includes(category.name));
  }, [searchQuery, selectedFilters]);

  const handleAddItems = () => {
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
  }, [isOpen]);

  const renderSelectedItems = () => {
    return Object.entries(selectedItems).map(([itemId, count]) => {
      const item = itemsData.flatMap((category: Category) => category.items).find((i) => i.itemId === itemId);

      if (!item) return null;

      return (
        <div key={itemId} className="flex items-center gap-2 p-2 border">
          <Tooltip delayDuration={500}>
            <TooltipTrigger>
              <ImageSlide
                images={item.images}
                name={item.name}
                className="h-8 w-8 object-contain cursor-default select-none"
              />
            </TooltipTrigger>
            <TooltipContent>{item.itemId}</TooltipContent>
          </Tooltip>

          <span className="flex-grow text-xs w-2 text-ellipsis overflow-clip">
            {item.name} {item.name === "Map" || (item.name === "Map (item)" && `(${item.itemId})`)}
          </span>
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
        </div>
      );
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[80vw] max-h-full">
        <DialogHeader>
          <DialogTitle className="text-2xl">Add Items</DialogTitle>
          <DialogDescription>
            <p>{"You will add items to " + names.join(", ") + "."}</p>
          </DialogDescription>
        </DialogHeader>
        <div className="flex gap-10">
          <div>
            <div className="flex gap-2 mb-4">
              <Input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search items..."
                className="flex-grow"
              />
              <Combobox
                elements={itemsData.map((category: Category) => ({
                  value: category.name,
                  label: category.name,
                }))}
                multiSelect
                placeholder="Select Category..."
                searchPlaceholder="Search Category..."
                nothingFoundMessage="No categories found"
                unselectAllButton
                unselectAllButtonText="Unselect All"
                hideDisplayText
                icon={<ListFilter className="w-4 h-4 opacity-80" />}
                onChange={setSelectedFilters}
              />
            </div>
            <ScrollArea className="w-80 pr-4 h-[30rem]">
              <Accordion type="multiple">
                {filteredCategories.map(
                  (category) =>
                    category.items.length > 0 && (
                      <AccordionItem key={category.name} value={category.name}>
                        <AccordionTrigger className="h-8">{category.name}</AccordionTrigger>
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
                              <ImageSlide images={item.images} name={item.name} className="h-6 w-6 object-contain" />

                              <span className="text-sm w-64 text-ellipsis text-start overflow-clip group-hover:underline underline-offset-auto">
                                {item.name}
                                {category.name === "Cartography" ? ` (${item.itemId})` : ""}
                              </span>

                              {selectedItems[item.itemId] > 0 && <span>{selectedItems[item.itemId]}</span>}
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
            <h3 className="text-lg font-semibold mb-4">Selected Items</h3>
            <ScrollArea className="h-[31rem] pr-4 mb-4">
              <div className="grid grid-cols-2 2xl:grid-cols-3">{renderSelectedItems()}</div>
              <div ref={scrollRef} />
            </ScrollArea>
            <div className="flex justify-between">
              <div className="flex gap-2">
                <Button onClick={handleSaveItems} disabled={Object.entries(selectedItems).length === 0}>
                  Save Items
                </Button>
                <Button onClick={handleLoadItems}>Load Items</Button>
              </div>
              <Button onClick={handleAddItems} disabled={Object.entries(selectedItems).length === 0}>
                Add Selected Items
              </Button>
            </div>
          </div>
        </div>
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

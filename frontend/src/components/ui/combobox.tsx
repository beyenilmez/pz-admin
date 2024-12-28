import * as React from "react";
import { ChevronsUpDown, Check, ListX } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

interface ComboboxProps {
  elements: { value: any; label: string }[];
  placeholder?: string;
  searchPlaceholder?: string;
  nothingFoundMessage?: string;
  mandatory?: boolean;
  initialValue?: any;
  multiSelect?: boolean;
  onChange: (value: any) => void;
  onCollapse?: (value: any) => void;
  onMouseEnter?: (value: any) => void;
  onMouseLeave?: (value: any) => void;
  disableSearch?: boolean;
  unselectAllButton?: boolean;
  unselectAllButtonText?: string;
  icon?: React.ReactNode;
  hideDisplayText?: boolean;
}

export function Combobox(props: ComboboxProps) {
  const [value, setValue] = React.useState(props.multiSelect ? props.initialValue || [] : props.initialValue);
  const [open, setOpen] = React.useState(false);

  React.useEffect(() => {
    props.onChange(value);
  }, [value]);

  React.useEffect(() => {
    if (!open) {
      props.onCollapse?.(value);
    }
  }, [open]);

  const unselectValues = () => {
    setValue(props.multiSelect ? [] : "");
    setOpen(false);
  };

  const toggleValue = (currentValue: any) => {
    if (props.multiSelect) {
      setValue((prev: any[]) => {
        if (prev.includes(currentValue)) {
          return prev.filter((item) => item !== currentValue);
        } else {
          return [...prev, currentValue];
        }
      });
    } else {
      setValue(!props.mandatory && currentValue === value ? "" : currentValue);
      setOpen(false);
    }
  };

  const isSelected = (currentValue: any) => {
    if (props.multiSelect) {
      return value.includes(currentValue);
    }
    return value === currentValue;
  };

  const displayValue = () => {
    if (props.multiSelect) {
      const selectedItems = props.elements.filter((element) => value.includes(element.value));
      return selectedItems.map((item) => item.label).join(", ") || props.placeholder || "Select...";
    }
    return props.elements.find((element) => element.value === value)?.label || props.placeholder || "Select...";
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size={props.hideDisplayText ? "icon" : "default"}
          role="combobox"
          aria-expanded={open}
          className={`justify-between ${props.hideDisplayText ? "w-12 flex justify-center items-center" : "w-[200px]"}`}
        >
          {!props.hideDisplayText && <span className="truncate">{displayValue()}</span>}
          {props.icon ? (
            props.icon
          ) : (
            <ChevronsUpDown className={`opacity-50 w-4 h-4 shrink-0 ${!props.hideDisplayText && "ml-2"}`} />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="p-0 w-[200px]">
        <Command>
          {!props.disableSearch && (
            <CommandInput
              placeholder={props.searchPlaceholder ? props.searchPlaceholder : "Search..."}
              className="h-9"
            />
          )}
          <CommandList>
            <CommandEmpty>{props.nothingFoundMessage ? props.nothingFoundMessage : "Nothing found..."}</CommandEmpty>
            <CommandGroup>
              <CommandItem
                onSelect={unselectValues}
                className={`transition-all ${
                  props.unselectAllButton && props.multiSelect && value.length > 0
                    ? "opacity-100"
                    : "opacity-0 h-0 py-0"
                }`}
              >
                {props.unselectAllButtonText ? props.unselectAllButtonText : "Unselect all"}
                <ListX className="ml-auto h-4 w-4" />
              </CommandItem>
              {props.elements.map((element) => (
                <CommandItem
                  key={element.value}
                  value={element.value}
                  onSelect={(currentValue) => toggleValue(currentValue)}
                  onMouseEnter={() => {
                    if (open) {
                      props.onMouseEnter?.(element.value);
                    }
                  }}
                  onMouseLeave={() => {
                    props.onMouseLeave?.(element.value);
                  }}
                >
                  {element.label}
                  <Check className={cn("ml-auto h-4 w-4", isSelected(element.value) ? "opacity-100" : "opacity-0")} />
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

"use client";

import { forwardRef, useMemo, useState } from "react";
import { RgbColorPicker, RgbColor } from "react-colorful";
import { cn } from "@/lib/utils";
import type { ButtonProps } from "@/components/ui/button";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";

interface ColorPickerProps {
  value: string;
  onChange: (value: string) => void;
  onFloatChange?: (value: { r: number; g: number; b: number }) => void; // Optional callback for float values
  onBlur?: () => void;
}

const parseRgbString = (value: string): RgbColor => {
  const [r, g, b] = value && value.split(",").length === 3 ? value.split(",").map(Number) : [7, 126, 245];
  return { r: r, g: g, b: b };
};

const formatRgbString = (color: RgbColor): string => {
  return `${color.r},${color.g},${color.b}`;
};

const clamp = (value: number, min: number, max: number): number => Math.max(min, Math.min(value, max));

const ColorPicker = forwardRef<HTMLInputElement, Omit<ButtonProps, "value" | "onChange" | "onBlur"> & ColorPickerProps>(
  ({ disabled, value, onChange, onFloatChange, onBlur, name, className, ...props }) => {
    const [open, setOpen] = useState(false);

    const parsedValue = useMemo(() => {
      return parseRgbString(value);
    }, [value]);

    const handleColorChange = (newColor: RgbColor) => {
      onChange(formatRgbString(newColor));
    };

    const handleInputChange = (key: keyof RgbColor, newValue: string) => {
      const numericValue = clamp(parseInt(newValue, 10) || 0, 0, 255);
      const updatedColor = { ...parsedValue, [key]: numericValue };
      onChange(formatRgbString(updatedColor));
    };

    return (
      <Popover onOpenChange={setOpen} open={open}>
        <PopoverTrigger asChild disabled={disabled} onBlur={onBlur}>
          <Button
            {...props}
            className={cn("block", className)}
            name={name}
            onClick={() => {
              setOpen(true);
            }}
            size="icon"
            style={{
              backgroundColor: `rgb(${parsedValue.r}, ${parsedValue.g}, ${parsedValue.b})`,
            }}
            variant="outline"
          >
            <div />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full">
          <div className="flex flex-col space-y-2">
            <RgbColorPicker color={parsedValue} onChange={handleColorChange} className="mb-4" />
            <div className="flex w-full justify-between">
              <Input
                type="number"
                min={0}
                max={255}
                value={parsedValue.r}
                onChange={(e) => handleInputChange("r", e.target.value)}
                placeholder="R"
                aria-label="Red"
                className="w-14"
              />
              <Input
                type="number"
                min={0}
                max={255}
                value={parsedValue.g}
                onChange={(e) => handleInputChange("g", e.target.value)}
                placeholder="G"
                aria-label="Green"
                className="w-14"
              />
              <Input
                type="number"
                min={0}
                max={255}
                value={parsedValue.b}
                onChange={(e) => handleInputChange("b", e.target.value)}
                placeholder="B"
                aria-label="Blue"
                className="w-14"
              />
            </div>
          </div>
        </PopoverContent>
      </Popover>
    );
  }
);

ColorPicker.displayName = "ColorPicker";

export { ColorPicker };

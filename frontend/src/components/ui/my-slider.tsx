import * as React from "react";
import * as SliderPrimitive from "@radix-ui/react-slider";
import { cn } from "@/lib/utils";

interface SliderProps extends React.ComponentProps<typeof SliderPrimitive.Root> {}


export const Slider: React.FC<SliderProps> = ({
  className,
  ...props
}) => {
  return (
    <SliderPrimitive.Root
      className={cn(
        "relative flex w-full touch-none select-none items-center",
        className
      )}
      {...props}
    >
      <SliderPrimitive.Track className="relative bg-secondary rounded-full w-full h-2 disabled:hover:cursor-default overflow-hidden grow">
        <SliderPrimitive.Range className="absolute bg-primary h-full" />
      </SliderPrimitive.Track>
      <SliderPrimitive.Thumb
        className="block border-0 border-primary bg-muted-foreground disabled:opacity-50 rounded-full w-5 h-5 transition-colors ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none"
      />
    </SliderPrimitive.Root>
  );
};
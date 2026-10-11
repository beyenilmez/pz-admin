import { memo, useRef, useSyncExternalStore } from "react";
import { IconPackage } from "@tabler/icons-react";

const listeners = new Set<() => void>();
let intervalId: number | null = null;
let tick = 0;

function subscribe(listener: () => void) {
  listeners.add(listener);
  if (intervalId === null) {
    intervalId = window.setInterval(() => {
      tick += 1;
      for (const notify of listeners) notify();
    }, 3000);
  }

  return () => {
    listeners.delete(listener);
    if (listeners.size === 0 && intervalId !== null) {
      window.clearInterval(intervalId);
      intervalId = null;
    }
  };
}

function getSnapshot() {
  return tick;
}

interface ItemThumbnailProps {
  fallbackSize: number;
  images: string[];
  size: number;
}

const CyclingImage = memo(function CyclingImage({
  images,
  size,
}: Pick<ItemThumbnailProps, "images" | "size">) {
  const initialTick = useRef(tick).current;
  const currentTick = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
  const image = images[(currentTick - initialTick) % images.length];

  return <img alt="" height={size} loading="lazy" src={image} width={size} />;
});

export const ItemThumbnail = memo(function ItemThumbnail({
  fallbackSize,
  images,
  size,
}: ItemThumbnailProps) {
  if (images.length > 1) return <CyclingImage images={images} size={size} />;
  if (images[0]) {
    return (
      <img alt="" height={size} loading="lazy" src={images[0]} width={size} />
    );
  }
  return <IconPackage aria-hidden="true" size={fallbackSize} />;
});

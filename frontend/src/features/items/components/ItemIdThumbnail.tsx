import { useState } from "react";
import { IconPackage } from "@tabler/icons-react";
import type { GameBuild } from "@/features/game/types";
import { publicAssetUrl } from "@/shared/lib/publicAssetUrl";

interface ItemIdThumbnailProps {
  build: GameBuild;
  itemId: string;
  size: number;
}

/** Resolves the first generated image without loading the item catalog. */
export function ItemIdThumbnail({ build, itemId, size }: ItemIdThumbnailProps) {
  const [failed, setFailed] = useState(false);

  if (failed) return <IconPackage aria-hidden="true" size={size * 0.65} />;

  return (
    <img
      alt=""
      height={size}
      loading="lazy"
      onError={() => setFailed(true)}
      src={publicAssetUrl(`/items/${build}/${itemId}_0.png`)}
      width={size}
    />
  );
}

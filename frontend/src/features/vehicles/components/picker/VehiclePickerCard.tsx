import { Box, Image, Text, UnstyledButton } from "@mantine/core";
import { IconCar } from "@tabler/icons-react";
import type { VehiclePickerImage } from "../../lib/pickerCatalog";
import classes from "./VehiclePicker.module.css";

interface VehiclePickerCardProps {
  images: VehiclePickerImage[];
  label: string;
  onClick: () => void;
}

export function VehiclePickerCard({
  images,
  label,
  onClick,
}: VehiclePickerCardProps) {
  return (
    <UnstyledButton className={classes.card} onClick={onClick}>
      {images.length > 0 ? (
        <Box className={classes.thumbnails} data-count={images.length}>
          {images.map((image) => (
            <Box className={classes.thumbnailCell} key={image.id}>
              <Image
                alt=""
                className={classes.thumbnail}
                fit="contain"
                h="100%"
                src={image.src}
                w="100%"
              />
            </Box>
          ))}
        </Box>
      ) : (
        <Box
          style={{
            alignItems: "center",
            display: "flex",
            height: "100%",
            justifyContent: "center",
            width: "100%",
          }}
        >
          <IconCar
            aria-hidden="true"
            color="var(--mantine-color-dimmed)"
            size={36}
          />
        </Box>
      )}
      <Text className={classes.cardLabel} fw={600} lineClamp={2} size="sm">
        {label}
      </Text>
    </UnstyledButton>
  );
}

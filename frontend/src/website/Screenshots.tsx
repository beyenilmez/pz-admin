import { useState } from "react";
import { Text, useComputedColorScheme } from "@mantine/core";
import { Carousel } from "@mantine/carousel";
import { useReducedMotion } from "@mantine/hooks";
import { useTranslation } from "react-i18next";
import manifest from "../../../assets/screenshots/manifest.json";

const imageUrls = import.meta.glob<string>(
  "../../../assets/screenshots/**/*.webp",
  { eager: true, query: "?url", import: "default" },
);
const imageUrl = (path: string) =>
  imageUrls[`../../../assets/screenshots/${path}`];

function hasScreenshotLanguage(
  language: string,
): language is keyof (typeof manifest.images)[number]["captions"] {
  return manifest.images.every((screenshot) =>
    Object.keys(screenshot.captions).includes(language),
  );
}

export function Screenshots() {
  const { i18n } = useTranslation();
  const theme = useComputedColorScheme("light");
  const reducedMotion = useReducedMotion();
  const [selected, setSelected] = useState(0);
  const language = [i18n.language, manifest.defaultLanguage].find(
    hasScreenshotLanguage,
  )!;

  return (
    <section className="screenshot-gallery" aria-label="Screenshots">
      <Carousel
        withIndicators
        controlSize={36}
        emblaOptions={{ loop: true, duration: reducedMotion ? 0 : 25 }}
        onSlideChange={setSelected}
        nextControlProps={{ "aria-label": "Next screenshot" }}
        previousControlProps={{ "aria-label": "Previous screenshot" }}
        getIndicatorProps={(index) => ({
          "aria-label": manifest.images[index].captions[language],
          "aria-current": selected === index ? "true" : undefined,
        })}
      >
        {manifest.images.map((screenshot, index) => {
          const files = screenshot.files.filter(
            (file) =>
              file.presentation === "desktop" &&
              file.language === language &&
              file.theme === theme &&
              file.format === "webp",
          );
          const fullSizeUrl = imageUrl(
            files.find((file) => file.width === 1280)!.path,
          );
          return (
            <Carousel.Slide key={screenshot.id}>
              <img
                className="screenshot-image"
                src={fullSizeUrl}
                srcSet={files
                  .map((file) => `${imageUrl(file.path)} ${file.width}w`)
                  .join(", ")}
                sizes="(max-width: 75rem) calc(100vw - 2rem), 1100px"
                width={1280}
                height={800}
                alt={screenshot.alt[language]}
                loading={index === 0 ? "eager" : "lazy"}
              />
            </Carousel.Slide>
          );
        })}
      </Carousel>
      <Text size="sm" c="dimmed" ta="center" mt="xs" aria-live="polite">
        {manifest.images[selected].captions[language]}
      </Text>
    </section>
  );
}

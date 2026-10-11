import type { ChangeEvent } from "react";
import { CloseButton, Text, TextInput, UnstyledButton } from "@mantine/core";
import { IconSearch } from "@tabler/icons-react";
import { useTranslation } from "react-i18next";
import type { OptionCategory } from "../catalog";
import { useOptionTranslations } from "../hooks/useOptionTranslations";
import classes from "./OptionsNavigation.module.css";

interface OptionsNavigationProps {
  activeCategory: string;
  categories: readonly OptionCategory[];
  onCategoryChange: (category: string) => void;
  onQueryChange: (query: string) => void;
  query: string;
  searching: boolean;
}

export function OptionsNavigation({
  activeCategory,
  categories,
  onCategoryChange,
  onQueryChange,
  query,
  searching,
}: OptionsNavigationProps) {
  const { t } = useTranslation(["options", "common"]);
  const labels = useOptionTranslations();

  function handleCategoryChange(category: OptionCategory) {
    onQueryChange("");
    onCategoryChange(category.id);
  }

  function handleSearchChange(event: ChangeEvent<HTMLInputElement>) {
    onQueryChange(event.currentTarget.value);
  }

  return (
    <div className={classes.root}>
      <nav aria-label={t("navigation.label")} className={classes.categories}>
        {categories.map((category) => (
          <UnstyledButton
            aria-current={
              !searching && category.id === activeCategory ? "page" : undefined
            }
            key={category.id}
            className={classes.section}
            data-active={
              !searching && category.id === activeCategory ? true : undefined
            }
            onClick={() => handleCategoryChange(category)}
          >
            <span className={classes.label}>
              {labels.categoryLabel(category.id)}
            </span>
            <Text component="span" className={classes.count}>
              {category.sections.reduce(
                (count, section) => count + section.options.length,
                0,
              )}
            </Text>
          </UnstyledButton>
        ))}
      </nav>

      <TextInput
        aria-label={t("navigation.search.label")}
        className={classes.search}
        leftSection={<IconSearch size={15} aria-hidden="true" />}
        placeholder={t("navigation.search.placeholder")}
        rightSection={
          query ? (
            <CloseButton
              aria-label={t("search.clear", { ns: "common" })}
              size="sm"
              onClick={() => onQueryChange("")}
            />
          ) : null
        }
        value={query}
        onChange={handleSearchChange}
      />
    </div>
  );
}

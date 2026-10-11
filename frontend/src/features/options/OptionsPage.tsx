import {
  Activity,
  useLayoutEffect,
  useRef,
  useState,
  type SyntheticEvent,
} from "react";
import {
  Alert,
  Box,
  Button,
  Group,
  Skeleton,
  Stack,
  Text,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { IconAlertCircle } from "@tabler/icons-react";
import { useTranslation } from "react-i18next";
import { isGameBuild, latestGameBuild } from "@/features/game/types";
import { useSession } from "@/features/session/SessionProvider";
import { useSkeletonVisibility } from "@/shared/hooks/useSkeletonVisibility";
import { errorMessage } from "@/shared/lib/errors";
import { PageContainer } from "@/shared/layout/PageContainer";
import { optionCatalogs } from "./catalog";
import { OptionsActions } from "./components/OptionsActions";
import { OptionsNavigation } from "./components/OptionsNavigation";
import { OptionsSection } from "./components/OptionsSection";
import { useOptionsEditor } from "./hooks/useOptionsEditor";
import { useOptionsSearch } from "./hooks/useOptionsSearch";
import classes from "./OptionsPage.module.css";

const skeletonCategories = [
  { id: "general", width: 88 },
  { id: "players", width: 104 },
  { id: "world", width: 92 },
  { id: "network", width: 116 },
  { id: "advanced", width: 96 },
];
const skeletonSections = [
  {
    headingWidth: 130,
    id: "primary",
    showTitle: true,
    rows: [
      {
        controlWidth: 112,
        descriptionWidth: "58%",
        id: "first",
        titleWidth: "32%",
      },
      {
        controlWidth: 220,
        descriptionWidth: "66%",
        id: "second",
        titleWidth: "41%",
      },
      {
        controlWidth: 112,
        descriptionWidth: "74%",
        id: "third",
        titleWidth: "50%",
      },
    ],
  },
  {
    headingWidth: 165,
    id: "secondary",
    showTitle: false,
    rows: [
      {
        controlWidth: 300,
        descriptionWidth: "58%",
        id: "first",
        titleWidth: "32%",
      },
      {
        controlWidth: 220,
        descriptionWidth: "66%",
        id: "second",
        titleWidth: "41%",
      },
      {
        controlWidth: 112,
        descriptionWidth: "74%",
        id: "third",
        titleWidth: "50%",
      },
    ],
  },
];

function OptionsPageSkeleton() {
  return (
    <PageContainer contentWidth="wide" h="100%" px={0}>
      <div className={classes.root} aria-busy="true">
        <div className={classes.skeletonNavigation} aria-hidden="true">
          <div className={classes.skeletonCategories}>
            {skeletonCategories.map((category) => (
              <Skeleton h={34} key={category.id} w={category.width} />
            ))}
          </div>
          <Skeleton className={classes.skeletonSearch} h={36} />
        </div>

        <div className={classes.content} aria-hidden="true">
          <div className={classes.scroller}>
            <Stack gap="xl">
              {skeletonSections.map((section) => (
                <Stack gap="sm" key={section.id}>
                  <Stack gap={5}>
                    {section.showTitle ? <Skeleton h={22} w={180} /> : null}
                    <Skeleton h={18} w={section.headingWidth} />
                  </Stack>
                  <div className={classes.skeletonSection}>
                    {section.rows.map((row) => (
                      <div className={classes.skeletonOptionRow} key={row.id}>
                        <Stack flex={1} gap={6}>
                          <Skeleton h={14} w={row.titleWidth} />
                          <Skeleton h={10} w={row.descriptionWidth} />
                        </Stack>
                        <Skeleton h={36} w={row.controlWidth} />
                      </div>
                    ))}
                  </div>
                </Stack>
              ))}
            </Stack>
          </div>
          <div className={classes.actions}>
            <Skeleton h={14} w={120} />
            <Group gap="sm" ml="auto">
              <Skeleton h={32} w={76} />
              <Skeleton h={32} w={92} />
            </Group>
          </div>
        </div>
      </div>
    </PageContainer>
  );
}

export function OptionsPage({ active }: { active: boolean }) {
  const { t } = useTranslation(["options", "common"]);
  const { profile } = useSession();
  const build =
    profile && isGameBuild(profile.version) ? profile.version : latestGameBuild;
  const editor = useOptionsEditor(optionCatalogs[build], active);
  const skeleton = useSkeletonVisibility(
    editor.loading && editor.categories.length === 0,
  );
  const search = useOptionsSearch(editor.categories);
  const [requestedCategory, setRequestedCategory] = useState("");
  const scrollerRef = useRef<HTMLDivElement>(null);
  const activeCategory =
    editor.categories.find((category) => category.id === requestedCategory) ??
    editor.categories[0];
  const searchCategories = search.results ?? [];
  const hasSearchResults = searchCategories.some(
    (category) => category.sections.length > 0,
  );

  useLayoutEffect(() => {
    // Category content replaces the current list; retaining its scroll offset
    // would open the next category at an arbitrary position.
    scrollerRef.current?.scrollTo({ top: 0 });
  }, [activeCategory?.id]);

  async function handleSave() {
    try {
      const outcome = await editor.save();
      if (!outcome) return;
      const { result } = outcome;

      const failedCount = Object.keys(result.failed).length;
      if (failedCount === 0) {
        notifications.show({
          color: "green",
          title: t("notifications.updated.title"),
          message: t("notifications.updated.message", {
            count: result.updated.length,
          }),
        });
      } else if (result.updated.length > 0) {
        notifications.show({
          color: "yellow",
          title: t("notifications.partiallyUpdated.title"),
          message: t("notifications.partiallyUpdated.message", {
            failed: failedCount,
            updated: result.updated.length,
          }),
        });
      } else {
        notifications.show({
          color: "red",
          title: t("notifications.updateFailed.title"),
          message: t("notifications.updateFailed.message", {
            count: failedCount,
          }),
        });
      }
      if (!outcome.refreshed) {
        notifications.show({
          color: "yellow",
          title: t("notifications.refreshFailed.title"),
          message: t("notifications.refreshFailed.message"),
        });
      }
    } catch (saveError) {
      notifications.show({
        color: "red",
        title: t("notifications.updateFailed.title"),
        message: errorMessage(saveError),
      });
    }
  }

  function handleSubmit(event: SyntheticEvent<HTMLFormElement, SubmitEvent>) {
    event.preventDefault();
    void handleSave();
  }

  if (skeleton.active) {
    return skeleton.visible ? <OptionsPageSkeleton /> : null;
  }

  if (editor.loadError) {
    return (
      <Box p="xl">
        <Alert
          color="red"
          icon={<IconAlertCircle size={18} aria-hidden="true" />}
          title={t("errors.load.title")}
        >
          <Stack gap="sm">
            <Text size="sm">{errorMessage(editor.loadError)}</Text>
            <Button
              variant="light"
              size="xs"
              w="fit-content"
              onClick={() => void editor.load()}
            >
              {t("actions.retry", { ns: "common" })}
            </Button>
          </Stack>
        </Alert>
      </Box>
    );
  }

  return (
    <PageContainer contentWidth="wide" h="100%" px={0}>
      <form
        className={classes.root}
        aria-busy={editor.saving}
        onSubmit={handleSubmit}
      >
        <OptionsNavigation
          activeCategory={activeCategory?.id ?? ""}
          categories={editor.categories}
          onCategoryChange={setRequestedCategory}
          onQueryChange={search.changeQuery}
          query={search.query}
          searching={search.searching}
        />

        <div className={classes.content}>
          <div ref={scrollerRef} className={classes.scroller}>
            {search.results ? (
              hasSearchResults ? (
                <Stack gap="xl">
                  {searchCategories.map((category) =>
                    category.sections.map((section, index) => (
                      <OptionsSection
                        build={build}
                        key={`${category.id}:${section.id}`}
                        category={category}
                        form={editor.form}
                        highlight={search.term}
                        section={section}
                        showCategory={index === 0}
                      />
                    )),
                  )}
                </Stack>
              ) : (
                <Text c="dimmed" size="sm" ta="center" py="xl">
                  {t("navigation.search.empty")}
                </Text>
              )
            ) : (
              <Stack gap="xl">
                {editor.categories.map((category) => (
                  <Activity
                    key={category.id}
                    mode={
                      category.id === activeCategory?.id ? "visible" : "hidden"
                    }
                  >
                    <Stack gap="xl">
                      {category.sections.map((section, index) => (
                        <OptionsSection
                          build={build}
                          key={section.id}
                          category={category}
                          form={editor.form}
                          section={section}
                          showCategory={index === 0}
                        />
                      ))}
                    </Stack>
                  </Activity>
                ))}
              </Stack>
            )}
          </div>
          <div className={classes.actions}>
            <OptionsActions
              definitions={editor.definitions}
              form={editor.form}
              onReset={() => editor.reset()}
              saving={editor.saving}
            />
          </div>
        </div>
      </form>
    </PageContainer>
  );
}

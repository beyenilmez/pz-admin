import {
  lazy,
  Suspense,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import {
  Anchor,
  Container,
  Group,
  List,
  Loader,
  NativeSelect,
  Stack,
  Text,
  Title,
  useMantineColorScheme,
} from "@mantine/core";
import { useTranslation } from "react-i18next";
import { languageOptions } from "@/features/settings/lib/languages";
import { isSupportedLanguage } from "@/i18n/locales";
import icon from "../../../build/appicon.svg";
import { projectName, repositoryUrl } from "./content";
import { Screenshots } from "./Screenshots";
import { Downloads } from "./Downloads";
const Tools = lazy(() => import("./Tools"));
const pages = [
  { value: "home", label: "Overview" },
  { value: "download", label: "Download" },
  { value: "messages", label: "Message editor" },
  { value: "items", label: "Item browser" },
  { value: "vehicles", label: "Vehicle browser" },
] as const;
type Page = (typeof pages)[number]["value"];
function currentPage(): Page {
  const hash = location.hash.slice(1);
  if (hash === "tools") return "messages";
  if (hash === "download") return "home";
  return pages.find((page) => page.value === hash)?.value ?? "home";
}
export function Website() {
  const { i18n } = useTranslation();
  const { colorScheme, setColorScheme } = useMantineColorScheme();
  const [page, setPage] = useState(currentPage);
  const [visited, setVisited] = useState<Page[]>([page]);
  const headerRef = useRef<HTMLElement>(null);

  useLayoutEffect(() => {
    const header = headerRef.current!;
    const updateHeight = () => {
      document.documentElement.style.setProperty(
        "--site-header-height",
        `${header.offsetHeight}px`,
      );
    };
    updateHeight();
    const observer = new ResizeObserver(updateHeight);
    observer.observe(header);
    return () => {
      observer.disconnect();
      document.documentElement.style.removeProperty("--site-header-height");
    };
  }, []);

  useEffect(() => {
    function navigate() {
      const next = currentPage();
      setPage(next);
      setVisited((previous) =>
        previous.includes(next) ? previous : [...previous, next],
      );
      requestAnimationFrame(() => {
        if (location.hash === "#download")
          document.getElementById("download")?.scrollIntoView();
        else window.scrollTo(0, 0);
      });
    }
    navigate();
    window.addEventListener("hashchange", navigate);
    return () => window.removeEventListener("hashchange", navigate);
  }, []);
  return (
    <>
      <link rel="icon" href={icon} />
      <a
        className="skip-link"
        href="#main"
        onClick={(event) => {
          event.preventDefault();
          document.getElementById("main")?.focus();
        }}
      >
        Skip to content
      </a>
      <header ref={headerRef} className="site-header">
        <Container size="lg">
          <Group
            className="header-row"
            justify="space-between"
            gap="sm"
            py="sm"
          >
            <Anchor
              href="#home"
              className="brand"
              c="inherit"
              underline="never"
            >
              <img src={icon} width={32} height={32} alt="" />
              <Text component="span" fw={700}>
                {projectName}
              </Text>
            </Anchor>
            <nav className="site-navigation" aria-label="Website">
              {pages.map(({ value, label }) => (
                <Anchor
                  key={value}
                  href={`#${value}`}
                  aria-current={page === value ? "page" : undefined}
                >
                  {label}
                </Anchor>
              ))}
            </nav>
            <Group gap="xs" className="preferences">
              <NativeSelect
                aria-label="Tool language"
                data={languageOptions}
                value={i18n.language}
                onChange={(event) => {
                  if (isSupportedLanguage(event.currentTarget.value))
                    void i18n.changeLanguage(event.currentTarget.value);
                }}
              />
              <NativeSelect
                aria-label="Color scheme"
                value={colorScheme}
                data={[
                  {
                    value: "auto",
                    label: "System",
                  },
                  {
                    value: "light",
                    label: "Light",
                  },
                  {
                    value: "dark",
                    label: "Dark",
                  },
                ]}
                onChange={(event) => {
                  const value = event.currentTarget.value;
                  if (value === "auto" || value === "light" || value === "dark")
                    setColorScheme(value);
                }}
              />
            </Group>
          </Group>
        </Container>
      </header>
      <main id="main" tabIndex={-1}>
        {page === "home" ? (
          <Container size="lg" py="xl">
            <Stack gap="xl">
              <section id="home">
                <Title order={1} size="h2" mb="xs">
                  {projectName}
                </Title>
                <Text maw="75ch" lh={1.65}>
                  PZ Admin is a desktop application for managing Project Zomboid
                  servers. Manage players, edit server options, and run console
                  commands from one interface.
                </Text>
              </section>
              <Screenshots />
              <section className="features-section">
                <Title order={2} size="h3" mb="sm">
                  Features
                </Title>
                <List spacing="sm" style={{ lineHeight: 1.65 }}>
                  <List.Item>
                    Manage players: assign roles, grant XP, teleport, and
                    perform moderation actions.
                  </List.Item>
                  <List.Item>
                    Give items to players and spawn vehicles using searchable
                    catalogs.
                  </List.Item>
                  <List.Item>
                    Edit server options and run console commands.
                  </List.Item>
                  <List.Item>
                    Compose messages with a rich text editor that supports
                    Project Zomboid formatting.
                  </List.Item>
                  <List.Item>
                    Control the weather, trigger server events, and save the
                    world.
                  </List.Item>
                  <List.Item>
                    Connect to your servers through RCON and save connection
                    profiles.
                  </List.Item>
                </List>
                <Text size="sm" mt="sm">
                  Server management requires a running Project Zomboid server
                  with RCON enabled.
                </Text>
                <Text size="sm" mt="sm">
                  The item browser, vehicle browser, and message editor can also
                  be used without connecting to a server. PZ Admin includes
                  catalogs and options for Builds 41 and 42.
                </Text>
              </section>
              <Downloads />
            </Stack>
          </Container>
        ) : null}
        <div
          className="tools-page"
          lang={i18n.language}
          hidden={page === "home" || page === "download"}
        >
          <Suspense
            fallback={
              <Group justify="center" p="md" component="output">
                <Loader size="sm" />
                <Text>Loading tools…</Text>
              </Group>
            }
          >
            {visited.some(
              (value) => value !== "home" && value !== "download",
            ) ? (
              <Tools activePage={page} visited={visited} />
            ) : null}
          </Suspense>
        </div>
      </main>
      <footer className="site-footer">
        <Container size="lg" py="lg">
          <Group gap="md" mb="sm">
            <Anchor href={repositoryUrl} size="sm">
              GitHub
            </Anchor>
            <Anchor href={`${repositoryUrl}/issues`} size="sm">
              Report an issue
            </Anchor>
            <Anchor href={`${repositoryUrl}/blob/main/LICENSE`} size="sm">
              License
            </Anchor>
            <Anchor
              href={`${import.meta.env.BASE_URL}licenses/frontend.json`}
              size="sm"
            >
              Dependency notices
            </Anchor>
          </Group>
          <Stack gap="sm" lang="en" translate="no" maw="95ch">
            <Text size="sm" c="dimmed">
              Thanks to The Indie Stone for creating Project Zomboid (
              <Anchor size="sm" href="https://projectzomboid.com/">
                https://projectzomboid.com/
              </Anchor>
              ), which made this possible. This is an unofficial fan production
              for non-commercial purposes made under the{" "}
              <Anchor
                size="sm"
                href="https://projectzomboid.com/blog/support/terms-conditions/"
              >
                Indie Stone Terms
              </Anchor>
              .
            </Text>
            <Text size="sm" c="dimmed">
              Catalogs include material by{" "}
              <Anchor size="sm" href="https://pzwiki.net/">
                PZwiki contributors
              </Anchor>
              , adapted for PZ Admin under{" "}
              <Anchor
                size="sm"
                href="https://creativecommons.org/licenses/by-nc-sa/3.0/"
              >
                CC BY-NC-SA 3.0
              </Anchor>
              .{" "}
              <Anchor
                size="sm"
                href={`${repositoryUrl}/blob/main/frontend/src/data/README.md`}
              >
                Sources and changes
              </Anchor>
              .
            </Text>
            <Text size="sm" c="dimmed">
              Linux package repository hosting is provided free of charge by{" "}
              <Anchor size="sm" href="https://cloudsmith.com">
                Cloudsmith
              </Anchor>
              , a hosted service for storing and distributing software packages.
            </Text>
          </Stack>
        </Container>
      </footer>
    </>
  );
}

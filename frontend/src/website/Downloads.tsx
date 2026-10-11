import { Anchor, Group, Table, Tabs, Text, Title } from "@mantine/core";
import {
  distributionLinks,
  downloadPlatforms,
  downloadUrl,
  repositoryUrl,
  type DownloadPlatform,
} from "./content";
import { InstallationInstructions } from "./InstallationInstructions";

function detectedPlatform(): DownloadPlatform {
  const userAgent = navigator.userAgent.toLowerCase();
  if (userAgent.includes("mac")) return "macos";
  if (userAgent.includes("linux")) return "linux";
  return "windows";
}

export function Downloads() {
  return (
    <section
      id="download"
      aria-labelledby="download-title"
      className="site-section download-section"
    >
      <Group justify="space-between" align="center" mb="sm">
        <Title order={2} id="download-title">
          Downloads
        </Title>
        <Text size="sm" c="dimmed">
          v{APP_VERSION}
        </Text>
      </Group>
      <Text c="dimmed" mb="md">
        Choose your operating system and processor.
      </Text>
      <Tabs defaultValue={detectedPlatform()}>
        <Tabs.List aria-label="Platform" mb="lg">
          {downloadPlatforms.map((platform) => (
            <Tabs.Tab key={platform.id} value={platform.id}>
              {platform.label}
            </Tabs.Tab>
          ))}
        </Tabs.List>
        {downloadPlatforms.map((platform) => (
          <Tabs.Panel key={platform.id} value={platform.id}>
            <Table.ScrollContainer minWidth={280}>
              <Table layout="fixed" verticalSpacing="xs" horizontalSpacing="xs">
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th scope="col">Package</Table.Th>
                    <Table.Th scope="col">x64 (amd64)</Table.Th>
                    <Table.Th scope="col">ARM64</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {platform.packages.map((download) => (
                    <Table.Tr key={download.suffix}>
                      <Table.Th scope="row">{download.label}</Table.Th>
                      {(["x64", "arm64"] as const).map((architecture) => (
                        <Table.Td key={architecture}>
                          <Anchor
                            href={downloadUrl(
                              platform.id,
                              architecture,
                              download.suffix,
                            )}
                            aria-label={`Download: ${platform.label} ${download.label} ${architecture}`}
                          >
                            {architecture === "x64" ? "x64" : "ARM64"}
                          </Anchor>
                        </Table.Td>
                      ))}
                    </Table.Tr>
                  ))}
                </Table.Tbody>
              </Table>
            </Table.ScrollContainer>
            <InstallationInstructions platform={platform.id} />
            {platform.id === "linux" ? (
              <Group mt="md" gap="lg">
                {distributionLinks.map(({ label, href }) =>
                  href ? (
                    <Anchor href={href} key={label}>
                      {label}
                    </Anchor>
                  ) : (
                    <Group key={label} gap="xs">
                      <Text fw={500}>{label}</Text>
                      <Text size="sm" c="dimmed">
                        Coming soon
                      </Text>
                    </Group>
                  ),
                )}
              </Group>
            ) : null}
          </Tabs.Panel>
        ))}
      </Tabs>
      <Anchor
        display="inline-block"
        mt="md"
        href={`${repositoryUrl}/releases`}
        size="sm"
      >
        All releases and release notes
      </Anchor>
    </section>
  );
}

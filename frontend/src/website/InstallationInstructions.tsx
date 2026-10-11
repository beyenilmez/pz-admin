import {
  Accordion,
  Anchor,
  Box,
  Code,
  Stack,
  Table,
  Text,
  Title,
} from "@mantine/core";
import { CopyValueButton } from "@/shared/components/CopyValueButton";

import type { DownloadPlatform } from "./content";

// Keep package repository commands aligned with README.md.
const debianVariables = "distro=ubuntu\ncodename=noble";
const debianCommands = String.raw`sudo apt update
sudo apt install ca-certificates curl
sudo install -d -m 0755 /etc/apt/keyrings
curl -fsSL https://dl.cloudsmith.io/public/beyenilmez/pz-admin/gpg.05F68F53EE637374.key \
  | sudo tee /etc/apt/keyrings/pz-admin.asc > /dev/null
sudo chmod 0644 /etc/apt/keyrings/pz-admin.asc
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/pz-admin.asc] https://dl.cloudsmith.io/public/beyenilmez/pz-admin/deb/$distro $codename main" \
  | sudo tee /etc/apt/sources.list.d/beyenilmez-pz-admin.list > /dev/null
sudo apt update
sudo apt install pz-admin`;
const fedoraCommands = String.raw`sudo tee /etc/yum.repos.d/beyenilmez-pz-admin.repo > /dev/null <<'EOF'
[pz-admin]
name=PZ Admin
baseurl=https://dl.cloudsmith.io/public/beyenilmez/pz-admin/rpm/fedora/$releasever/$basearch
enabled=1
skip_if_unavailable=0
gpgcheck=1
repo_gpgcheck=1
gpgkey=https://dl.cloudsmith.io/public/beyenilmez/pz-admin/gpg.05F68F53EE637374.key
sslverify=1
EOF
sudo dnf install pz-admin`;

function Commands({ value }: { value: string }) {
  return (
    <Box pos="relative" style={{ minWidth: 0 }}>
      <Code block pr="5rem" style={{ overflowX: "auto" }}>
        {value}
      </Code>
      <Box pos="absolute" top={8} right={8}>
        <CopyValueButton value={value} copyLabel="Copy" copiedLabel="Copied">
          <Text size="xs">Copy</Text>
        </CopyValueButton>
      </Box>
    </Box>
  );
}

export function InstallationInstructions({
  platform,
}: {
  platform: DownloadPlatform;
}) {
  return (
    <Stack gap="md" mt="xl">
      <Title order={3} size="h4">
        Installation instructions
      </Title>
      {platform === "windows" ? (
        <Stack gap="sm">
          <Text size="sm">Run the installer.</Text>
          <Text size="sm">
            Windows releases are unsigned. If SmartScreen shows “Windows
            protected your PC”, choose More info → Run anyway, if available,
            only if you trust the download from this project’s GitHub Releases.
          </Text>
        </Stack>
      ) : null}
      {platform === "macos" ? (
        <Stack gap="sm">
          <Text size="sm">
            Open the DMG and drag PZ Admin into Applications.
          </Text>
          <Text size="sm">
            The app is not signed with an Apple Developer ID or notarized. If
            macOS blocks it because the developer cannot be verified, try
            opening it once, then go to System Settings → Privacy &amp; Security
            → Open Anyway. Only approve a download you trust.
          </Text>
          <Anchor size="sm" href="https://support.apple.com/en-us/102445">
            Apple’s instructions for opening apps from an unidentified developer
          </Anchor>
        </Stack>
      ) : null}
      {platform === "linux" ? (
        <Stack gap="md">
          <Accordion multiple>
            <Accordion.Item value="debian">
              <Accordion.Control>
                Debian, Ubuntu and derivatives
              </Accordion.Control>
              <Accordion.Panel>
                <Stack gap="sm">
                  <Text size="sm">
                    Requires Debian 13+ or Ubuntu 24.04+, including compatible
                    derivatives such as Linux Mint 22, Pop!_OS 24.04, elementary
                    OS 8, Kubuntu and Xubuntu.
                  </Text>
                  <Text size="sm">
                    Use the repository matching your distribution’s base:
                  </Text>
                  <Table.ScrollContainer minWidth={300}>
                    <Table>
                      <Table.Thead>
                        <Table.Tr>
                          <Table.Th scope="col">Distribution base</Table.Th>
                          <Table.Th scope="col">
                            <Code>distro</Code>
                          </Table.Th>
                          <Table.Th scope="col">
                            <Code>codename</Code>
                          </Table.Th>
                        </Table.Tr>
                      </Table.Thead>
                      <Table.Tbody>
                        <Table.Tr>
                          <Table.Th scope="row">Ubuntu 24.04+</Table.Th>
                          <Table.Td>
                            <Code>ubuntu</Code>
                          </Table.Td>
                          <Table.Td>
                            <Code>noble</Code>
                          </Table.Td>
                        </Table.Tr>
                        <Table.Tr>
                          <Table.Th scope="row">Debian 13+</Table.Th>
                          <Table.Td>
                            <Code>debian</Code>
                          </Table.Td>
                          <Table.Td>
                            <Code>trixie</Code>
                          </Table.Td>
                        </Table.Tr>
                      </Table.Tbody>
                    </Table>
                  </Table.ScrollContainer>
                  <Text size="sm">Set these two values from the table:</Text>
                  <Commands value={debianVariables} />
                  <Text size="sm">Then run in the same terminal:</Text>
                  <Commands value={debianCommands} />
                  <Text size="sm">
                    These repository channels contain PZ Admin packages only. On
                    Ubuntu and its flavors, enable the universe repository if
                    required dependencies are unavailable.
                  </Text>
                </Stack>
              </Accordion.Panel>
            </Accordion.Item>
            <Accordion.Item value="fedora">
              <Accordion.Control>Fedora</Accordion.Control>
              <Accordion.Panel>
                <Stack gap="sm">
                  <Text size="sm">
                    For standard Fedora installations, including Workstation and
                    KDE:
                  </Text>
                  <Commands value={fedoraCommands} />
                  <Text size="sm">
                    Other RPM distributions may need different instructions.
                    These commands do not apply to Fedora Atomic desktops.
                  </Text>
                </Stack>
              </Accordion.Panel>
            </Accordion.Item>
          </Accordion>
          <div>
            <Anchor
              size="sm"
              href="https://cloudsmith.io/~beyenilmez/repos/pz-admin/setup/"
            >
              Cloudsmith’s setup instructions for other distributions
            </Anchor>
            <Text size="sm" mt="xs">
              Cloudsmith generates and maintains these instructions. They may
              not work for every distribution, and package compatibility is not
              guaranteed.
            </Text>
          </div>
        </Stack>
      ) : null}
    </Stack>
  );
}

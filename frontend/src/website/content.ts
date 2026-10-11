export const projectName = "PZ Admin";
export const repositoryUrl = "https://github.com/beyenilmez/pz-admin";

// Release asset names follow the packaging configuration in build/.
export const downloadPlatforms = [
  {
    id: "windows",
    label: "Windows",
    packages: [{ label: "Installer (.exe)", suffix: "-installer.exe" }],
  },
  {
    id: "macos",
    label: "macOS",
    packages: [{ label: "DMG", suffix: ".dmg" }],
  },
  {
    id: "linux",
    label: "Linux",
    packages: [
      { label: "DEB", suffix: ".deb" },
      { label: "RPM", suffix: ".rpm" },
      { label: "Arch", suffix: ".pkg.tar.zst" },
      { label: "Flatpak", suffix: ".flatpak" },
    ],
  },
] as const;

export type DownloadPlatform = (typeof downloadPlatforms)[number]["id"];

export function downloadUrl(
  platform: DownloadPlatform,
  architecture: "x64" | "arm64",
  suffix: string,
): string {
  return `${repositoryUrl}/releases/download/v${APP_VERSION}/pz-admin-${APP_VERSION}-${platform}-${architecture}${suffix}`;
}

// Set these URLs when the distribution listings are published.
export const distributionLinks: { label: string; href: string | null }[] = [
  { label: "AUR", href: null },
  { label: "Flathub", href: null },
];

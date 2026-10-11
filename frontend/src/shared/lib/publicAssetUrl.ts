/** Resolve generated public asset paths for desktop and subdirectory hosting. */
export function publicAssetUrl(path: string): string {
  return `${import.meta.env.BASE_URL}${path.replace(/^\//, "")}`;
}

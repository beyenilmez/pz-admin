// The website only needs the external-link API used by the shared game credits.
export const Browser = {
  OpenURL(url: string): Promise<void> {
    window.open(url, "_blank", "noopener,noreferrer");
    return Promise.resolve();
  },
};

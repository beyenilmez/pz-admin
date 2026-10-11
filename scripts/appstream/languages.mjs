export function buildLanguagesXml(languages) {
  const entries = languages
    .filter(({ percentage }) => percentage > 0)
    .map(
      ({ code, percentage }) =>
        `    <lang percentage="${percentage}">${code}</lang>`,
    );
  return `  <languages>\n${entries.join("\n")}\n  </languages>\n`;
}

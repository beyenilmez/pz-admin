export function replaceMarker(
  template,
  markerName,
  content,
  commentStyle = "xml",
) {
  const marker =
    commentStyle === "xml" ? `<!-- x-${markerName} -->` : `# x-${markerName}`;
  const templateLines = template.split("\n");
  const index = templateLines.findIndex((line) => line.trim() === marker);
  if (index < 0 || template.split(marker).length !== 2) {
    throw new Error(
      `Missing, duplicate, or non-standalone ${markerName} marker`,
    );
  }
  templateLines.splice(index, 1, ...(content ? [content.trimEnd()] : []));
  return templateLines.join("\n");
}

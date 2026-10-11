function plainText(text) {
  return text
    .replace(
      /\s*\(\[[\da-f]{7,40}\]\(https?:\/\/[^\s)]+\/commit\/[^\s)]+\)\)/gi,
      "",
    )
    .replace(/\[([^\]]+)\]\([^\s)]+\)/g, "$1")
    .replace(/\*\*(.+?)\*\*/g, "$1")
    .replace(/`+([^`]+)`+/g, "$1")
    .replace(/&(?!(?:amp|lt|gt|quot|apos|#\d+|#x[\da-f]+);)/gi, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

// Convert Release Please's headings, bullet lists, and paragraphs, not arbitrary Markdown.
function description(notes) {
  const blocks = [];
  let current;
  for (const line of notes.split(/\r?\n/)) {
    const heading = line.match(/^#{3,6}\s+(.+)/);
    const bullet = line.match(/^\s*[-*]\s+(.+)/);
    if (!line.trim()) {
      current = undefined;
    } else if (heading || bullet || !current) {
      current = {
        type: heading ? "heading" : bullet ? "li" : "p",
        text: heading?.[1] ?? bullet?.[1] ?? line.trim(),
      };
      blocks.push(current);
    } else {
      current.text += ` ${line.trim()}`;
    }
  }

  const output = [];
  let inList = false;
  for (const { type, text } of blocks) {
    if (inList && type !== "li") output.push("        </ul>");
    if (!inList && type === "li") output.push("        <ul>");
    inList = type === "li";
    if (type === "li") output.push(`          <li>${plainText(text)}</li>`);
    else if (type === "heading")
      output.push(`        <p><em>${plainText(text)}</em></p>`);
    else output.push(`        <p>${plainText(text)}</p>`);
  }
  if (inList) output.push("        </ul>");
  return output.length
    ? `      <description>\n${output.join("\n")}\n      </description>\n`
    : "";
}

export function buildReleasesXml(changelog, version, repository) {
  // Release Please uses a plain first-release heading and linked later headings.
  const releaseHeading =
    /^## \[?(\d+\.\d+\.\d+(?:[-+][\w.+-]+)?)\]?(?:\([^)]+\))? \((\d{4}-\d{2}-\d{2})\)\r?$/gm;
  const releases = [...changelog.matchAll(releaseHeading)];
  if (releases[0]?.[1] !== version) {
    throw new Error(
      `CHANGELOG.md must start with a release for VERSION (${version})`,
    );
  }

  const entries = releases.map((release, index) => {
    const [, releaseVersion, date] = release;
    const type = releaseVersion.split("+")[0].includes("-")
      ? "development"
      : "stable";
    const notes = changelog.slice(
      release.index + release[0].length,
      releases[index + 1]?.index,
    );
    const url = `${repository.replace(/\/$/, "")}/releases/tag/v${releaseVersion}`;
    return `    <release version="${releaseVersion}" date="${date}" type="${type}">\n      <url type="details">${url}</url>\n${description(notes)}    </release>`;
  });
  return `  <releases>\n${entries.join("\n")}\n  </releases>\n`;
}

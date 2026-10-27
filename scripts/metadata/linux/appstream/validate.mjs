import { spawnSync } from "node:child_process";

const filename = process.argv[2];
if (!filename) throw new Error("Pass the AppStream metadata file to validate");

const result = spawnSync("appstreamcli", ["validate", "--no-net", filename], {
  encoding: "utf8",
  env: { ...process.env, LC_ALL: "C", NO_COLOR: "1" },
});
if (result.error) throw result.error;
process.stdout.write(result.stdout);
process.stderr.write(result.stderr);
if (result.status === 0) process.exit(0);

// Preserve attribution URLs, matching Flathub's exception for this warning.
const issues = result.stdout.match(/^[EW]: .+$/gm) ?? [];
const attributionOnly =
  result.status === 3 &&
  issues.length > 0 &&
  issues.every((issue) =>
    /^W: [^:]*:(?:\d+:)? description-has-plaintext-url(?:\s|$)/.test(issue),
  );
if (attributionOnly) {
  console.log(
    "Accepted description-has-plaintext-url warnings for attribution.",
  );
} else {
  process.exit(result.status || 1);
}

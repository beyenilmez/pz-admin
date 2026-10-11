import { execFileSync } from "node:child_process";
import {
  appendFileSync,
  copyFileSync,
  mkdirSync,
  writeFileSync,
} from "node:fs";
import path from "node:path";

function collectDependencies(directory) {
  // REUSE covers our module; ignoring its entries still follows external imports.
  const args = [".", "--ignore", "github.com/beyenilmez/pz-admin"];
  const report = execFileSync("go-licenses", ["report", ...args], {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "inherit"],
  });
  // A misconfigured Go environment can make the collector silently find nothing.
  if (!report.trim()) {
    throw new Error("Go license collection returned no dependencies");
  }
  writeFileSync(
    path.join(directory, "dependencies.csv"),
    `${report.trimEnd()}\n`,
  );
  execFileSync(
    "go-licenses",
    ["save", ...args, "--save_path", path.join(directory, "texts"), "--force"],
    { stdio: "inherit" },
  );
}

function collectAdditionalLicenses(directory, goRoot) {
  // The collector skips the standard library and our copied Tailscale packages.
  for (const [name, file, source] of [
    [
      "Go standard library",
      path.join(goRoot, "LICENSE"),
      "https://go.dev/LICENSE",
    ],
    [
      "Tailscale adapted code",
      "internal/third_party/tailscale.com/LICENSE",
      "https://github.com/beyenilmez/pz-admin/blob/main/internal/third_party/tailscale.com/LICENSE",
    ],
  ]) {
    const destination = path.join(directory, "texts", name);
    mkdirSync(destination, { recursive: true });
    copyFileSync(file, path.join(destination, "LICENSE"));
    appendFileSync(
      path.join(directory, "dependencies.csv"),
      `${name},${source},BSD-3-Clause\n`,
    );
  }
}

function main() {
  // Run from the repo root. The caller supplies GOOS, GOARCH, CGO and build tags.
  const go = JSON.parse(
    execFileSync("go", ["env", "-json", "GOOS", "GOARCH", "GOROOT"], {
      encoding: "utf8",
    }),
  );
  const directory = path.join(
    ".generated/licenses/backend",
    `${go.GOOS}-${go.GOARCH}`,
  );
  mkdirSync(directory, { recursive: true });
  collectDependencies(directory);
  collectAdditionalLicenses(directory, go.GOROOT);
}

main();

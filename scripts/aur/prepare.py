"""Generate an AUR recipe from the published Arch release packages."""

import argparse
import hashlib
import re
import shlex
import subprocess
from pathlib import Path

parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument("release_tag")
parser.add_argument("repository", help="GitHub owner/repository")
parser.add_argument("packages", type=Path)
parser.add_argument("output", type=Path)
args = parser.parse_args()

if not re.fullmatch(r"v[0-9]+\.[0-9]+\.[0-9]+", args.release_tag):
    parser.error("a stable release tag (vX.Y.Z) is required")
if not re.fullmatch(r"[A-Za-z0-9_.-]+/[A-Za-z0-9_.-]+", args.repository):
    parser.error("repository must be a GitHub owner/repository")

version = args.release_tag[1:]
root = Path(__file__).resolve().parents[2]
recipe = (root / "build/linux/aur/PKGBUILD.in").read_text()
recipe = recipe.replace("@VERSION@", version).replace("@REPOSITORY@", args.repository)

for arch, filename_arch in (("x86_64", "x64"), ("aarch64", "arm64")):
    package = args.packages / f"pz-admin-{version}-linux-{filename_arch}.pkg.tar.zst"
    metadata = subprocess.check_output(
        ["tar", "--zstd", "-xOf", str(package), ".PKGINFO"], text=True
    )
    fields = [line.split(" = ", 1) for line in metadata.splitlines() if " = " in line]
    values = dict(fields)
    if (
        values.get("pkgname") != "pz-admin"
        or values.get("arch") != arch
        or values.get("pkgver", "").rsplit("-", 1)[0] != version
    ):
        parser.error(f"unexpected package metadata in {package}")
    dependencies = [value for key, value in fields if key == "depend"]
    if not dependencies:
        parser.error(f"missing dependencies in {package}")
    with package.open("rb") as source:
        checksum = hashlib.file_digest(source, "sha256").hexdigest()
    recipe = recipe.replace(f"@DEPENDS_{arch.upper()}@", shlex.join(dependencies))
    recipe = recipe.replace(f"@SHA256_{arch.upper()}@", checksum)

args.output.mkdir(parents=True, exist_ok=True)
(args.output / "PKGBUILD").write_text(recipe)
print(f"Prepared {args.output / 'PKGBUILD'} for {args.release_tag}")

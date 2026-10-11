# AUR package

`pz-admin-bin` repackages the GitHub release's Arch assets for x86_64 and ARM64.
The generator copies their dependencies and calculates SHA-256 checksums. The
recipe preserves all package contents.

To prepare locally, download both `.pkg.tar.zst` assets into `packages/`, then run
from the project root (requires Python 3.11+, tar, and zstd):

```sh
python3 scripts/aur/prepare.py v2.0.0 beyenilmez/pz-admin packages .generated/aur
cd .generated/aur
makepkg -si
makepkg --printsrcinfo > .SRCINFO
```

Run `makepkg` on Arch Linux or Arch Linux ARM.

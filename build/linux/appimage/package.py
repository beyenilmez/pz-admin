#!/usr/bin/env python3
"""Stage GTK4/WebKit resources, add notices, and create an AppImage."""

import json
import os
import shutil
import subprocess
import sys
from pathlib import Path


def run(*args, **kwargs):
    return subprocess.run(args, check=True, text=True, **kwargs)


def output(*args):
    return run(*args, stdout=subprocess.PIPE).stdout.strip()


def package_files(package):
    return [
        Path(p)
        for p in output("dpkg-query", "-L", package).splitlines()
        if p.startswith("/")
    ]


def stage(appdir):
    def copy(source, relative):
        source = Path(source)
        destination = appdir / relative
        destination.parent.mkdir(parents=True, exist_ok=True)
        if source.is_dir():
            shutil.copytree(source, destination)
        else:
            shutil.copy2(source, destination)

    libdir = Path(output("pkg-config", "--variable=libdir", "gtk4"))
    # WebKit locates these subprocesses and its injected bundle through AppRun.
    webkit_process = next(
        p for p in package_files("libwebkitgtk-6.0-4") if p.name == "WebKitWebProcess"
    )
    copy(webkit_process.parent, "usr/libexec/webkitgtk-6.0")
    for directory in ("gio/modules", "gstreamer-1.0"):
        if (libdir / directory).is_dir():
            copy(libdir / directory, Path("usr/lib") / directory)
    scanner = libdir / "gstreamer1.0/gstreamer-1.0/gst-plugin-scanner"
    if scanner.exists():
        copy(scanner, "usr/libexec/gst-plugin-scanner")
    copy("/usr/share/icons/Adwaita", "usr/share/icons/Adwaita")
    copy("/usr/share/icons/hicolor/index.theme", "usr/share/icons/hicolor/index.theme")
    run("gio-querymodules", str(appdir / "usr/lib/gio/modules"))


def add_native_notices(appdir):
    # Include notices for resources copied by us or plugins, not just linked libraries.
    libdir = Path(output("pkg-config", "--variable=libdir", "gtk4"))
    sources = {
        "/" + str(p.relative_to(appdir)) for p in appdir.rglob("*") if p.is_file()
    }
    sources.update(
        str(libdir / p.relative_to(appdir / "usr/lib"))
        for p in (appdir / "usr/lib").rglob("*")
        if p.is_file()
    )
    docroot = appdir / "usr/share/doc"
    # linuxdeploy cannot resolve liblzo2's /lib versus /usr/lib package path.
    additional = {"liblzo2-2", "libwebkitgtk-6.0-4"}
    for filelist in Path("/var/lib/dpkg/info").glob("*.list"):
        if sources.intersection(filelist.read_text().splitlines()):
            additional.add(filelist.name.removesuffix(".list").split(":")[0])
    for name in sorted(additional):
        (docroot / name).mkdir(parents=True, exist_ok=True)
        shutil.copy2(
            Path("/usr/share/doc") / name / "copyright", docroot / name / "copyright"
        )
    shutil.copytree(
        "/usr/share/common-licenses",
        appdir / "usr/share/common-licenses",
        symlinks=False,
    )
    packages = sorted(p.parent.name for p in docroot.glob("*/copyright"))
    rows = output(
        "dpkg-query",
        "-W",
        "-f=${binary:Package}\t${Version}\t${source:Package}\t${source:Version}\n",
        *packages,
    )
    appimage_docs = docroot / "appimage"
    appimage_docs.mkdir(parents=True, exist_ok=True)
    (appimage_docs / "native-packages.tsv").write_text(
        "Package\tVersion\tSource\tSource-Version\n" + rows + "\n"
    )
    return appimage_docs


def relocate_webkit(appdir):
    # Release WebKit ignores WEBKIT_EXEC_PATH; relocate its compiled-in helper path.
    process = next(
        p for p in package_files("libwebkitgtk-6.0-4") if p.name == "WebKitWebProcess"
    )
    original = str(process.parent).encode() + b"\0"
    replacement = b"./usr/libexec/webkitgtk-6.0\0"
    library = (appdir / "usr/lib/libwebkitgtk-6.0.so.4").resolve()
    data = library.read_bytes()
    if data.count(original) != 1 or len(replacement) > len(original):
        raise RuntimeError("WebKit helper path changed; review AppImage relocation")
    library.write_bytes(data.replace(original, replacement.ljust(len(original), b"\0")))


def main():
    appdir, destination = map(Path, sys.argv[1:])
    arch = output("dpkg", "--print-architecture")
    appimage_arch = {"amd64": "x86_64", "arm64": "aarch64"}[arch]
    stage(appdir)
    desktop = "com.bedirhanyenilmez.pzadmin.desktop"
    files = {
        "build/linux/appimage/runtime-hook.sh": "apprun-hooks/pz-admin.sh",
        f"build/linux/{desktop}": f"usr/share/applications/{desktop}",
        "build/appicon.svg": "usr/share/icons/hicolor/scalable/apps/pz-admin.svg",
        "build/linux/com.bedirhanyenilmez.pzadmin.metainfo.xml": "usr/share/metainfo/com.bedirhanyenilmez.pzadmin.metainfo.xml",
    }
    for icon in Path("build/linux/icons").glob("*/pz-admin.png"):
        files[str(icon)] = f"usr/share/icons/hicolor/{icon.parent.name}/apps/pz-admin.png"
    for source, relative in files.items():
        target = appdir / relative
        target.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(source, target)
    (appdir / desktop).symlink_to(f"usr/share/applications/{desktop}")
    (appdir / "pz-admin.svg").symlink_to(
        "usr/share/icons/hicolor/scalable/apps/pz-admin.svg"
    )
    (appdir / "pz-admin.png").symlink_to(
        "usr/share/icons/hicolor/256x256/apps/pz-admin.png"
    )
    (appdir / ".DirIcon").symlink_to("pz-admin.png")
    # Ubuntu's libraries are already stripped; older bundled strip tools reject RELR sections.
    run(
        "/opt/tools/linuxdeploy/squashfs-root/AppRun",
        "--appdir",
        str(appdir),
        "--plugin",
        "gtk",
        env={**os.environ, "NO_STRIP": "1", "DEPLOY_GTK_VERSION": "4"},
    )
    # The plugin forces X11; keep GTK's default selection and user overrides.
    hook = appdir / "apprun-hooks/linuxdeploy-plugin-gtk.sh"
    hook.write_text(
        "\n".join(
            line
            for line in hook.read_text().splitlines()
            if not line.startswith("export GDK_BACKEND=")
        )
        + "\n"
    )
    appimage_docs = add_native_notices(appdir)
    relocate_webkit(appdir)
    docs = appdir / "usr/share/doc/pz-admin"
    docs.mkdir(parents=True, exist_ok=True)
    shutil.copy2("LICENSE", docs / "LICENSE")
    report = Path(".generated/licenses/THIRD-PARTY-NOTICES.json")
    if not json.loads(report.read_text()):
        raise RuntimeError("The application notice report is empty")
    shutil.copy2(report, docs / "THIRD-PARTY-NOTICES.json")
    shutil.copytree(
        "/opt/tools/runtime-notices", appimage_docs, dirs_exist_ok=True
    )
    (appdir / "licenses").symlink_to("usr/share/doc")
    (appdir / "usr/share/doc/common-licenses").symlink_to("../common-licenses")

    image = destination / "pz-admin.AppImage"
    # appimagetool 1.9.1 only checks the legacy .appdata.xml filename; we ship .metainfo.xml.
    run(
        "/opt/tools/appimagetool/squashfs-root/AppRun",
        "--no-appstream",
        "--runtime-file",
        "/opt/tools/runtime",
        str(appdir),
        str(image),
        env={
            **os.environ,
            "ARCH": appimage_arch,
            "VERSION": Path("VERSION").read_text().strip(),
        },
    )
    # Inspect the final SquashFS, rather than only trusting the staging directory.
    offset = output(str(image), "--appimage-offset")
    for relative in (
        "usr/share/doc/pz-admin/LICENSE",
        "usr/share/doc/pz-admin/THIRD-PARTY-NOTICES.json",
        "usr/share/doc/appimage/native-packages.tsv",
        "usr/share/doc/libgtk-4-1/copyright",
        "usr/share/doc/libwebkitgtk-6.0-4/copyright",
    ):
        run(
            "unsquashfs",
            "-o",
            offset,
            "-cat",
            str(image),
            relative,
            stdout=subprocess.DEVNULL,
        )
    shutil.copy2(appimage_docs / "native-packages.tsv", destination / "native-packages.tsv")
    # Retain a relocatable staging directory for inspection and smoke tests.
    staged = destination / "pz-admin.AppDir"
    if staged.exists():
        shutil.rmtree(staged)
    shutil.copytree(appdir, staged, symlinks=True)


if __name__ == "__main__":
    main()

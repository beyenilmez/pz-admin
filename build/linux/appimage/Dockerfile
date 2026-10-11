ARG GO_VERSION
ARG NODE_VERSION
FROM docker.io/library/golang:${GO_VERSION}-bookworm AS go
FROM docker.io/library/node:${NODE_VERSION}-bookworm-slim AS node
FROM docker.io/library/ubuntu:24.04@sha256:008173c23f95b170204355c12626cb5a965d779a7e1283b09e9cffbb1bf33ca3

# Build environment
RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        build-essential ca-certificates curl file libgtk-4-dev libwebkitgtk-6.0-dev \
        librsvg2-common glib-networking pkg-config python3 squashfs-tools \
    && rm -rf /var/lib/apt/lists/*

COPY --from=go /usr/local/go /usr/local/go
COPY --from=node /usr/local/ /usr/local/
ENV PATH="/usr/local/go/bin:/opt/bin:${PATH}"
ARG PNPM_VERSION
ARG WAILS_VERSION
ARG GO_LICENSES_VERSION
RUN npm install --global pnpm@${PNPM_VERSION} \
    && GOBIN=/opt/bin go install github.com/wailsapp/wails/v3/cmd/wails3@${WAILS_VERSION} \
    && GOBIN=/opt/bin go install github.com/google/go-licenses/v2@${GO_LICENSES_VERSION}

# AppImage tools
COPY tools.tsv /opt/tools/SOURCES.tsv
RUN set -eu; \
    dpkg_arch=$(dpkg --print-architecture); \
    case "$dpkg_arch" in amd64|arm64) ;; *) exit 1;; esac; \
    cd /opt/tools; \
    while IFS="$(printf '\t')" read -r target name url checksum; do \
        case "$target" in ''|'#'*) continue;; esac; \
        [ "$target" = all ] || [ "$target" = "$dpkg_arch" ] || continue; \
        curl -fL --retry 3 -o "$name" "$url"; \
        printf '%s  %s\n' "$checksum" "$name" | sha256sum -c -; \
        chmod +x "$name"; \
    done < SOURCES.tsv; \
    mkdir linuxdeploy appimagetool; \
    cd linuxdeploy; ../linuxdeploy.AppImage --appimage-extract >/dev/null; \
    cd ../appimagetool; ../appimagetool.AppImage --appimage-extract >/dev/null; \
    cp /opt/tools/linuxdeploy-plugin-gtk.sh /opt/bin/linuxdeploy-plugin-gtk.sh

# Packaged notices
COPY runtime-notices.tsv /opt/tools/runtime-notices.tsv
RUN set -eu; mkdir -p /opt/tools/runtime-notices; cd /opt/tools/runtime-notices \
    && while read -r name url; do curl -fL --retry 3 -o "$name" "$url"; done < /opt/tools/runtime-notices.tsv

WORKDIR /source
ENTRYPOINT ["wails3", "task", "linux:appimage:build:container"]

#!/bin/sh
# Extend linuxdeploy's launcher for WebKit, TLS modules and media plugins.
export LD_LIBRARY_PATH="$APPDIR/usr/lib:$APPDIR${LD_LIBRARY_PATH:+:$LD_LIBRARY_PATH}"
export GIO_EXTRA_MODULES="$APPDIR/usr/lib/gio/modules"
export WEBKIT_INJECTED_BUNDLE_PATH="$APPDIR/usr/libexec/webkitgtk-6.0/injected-bundle"
export GST_PLUGIN_SYSTEM_PATH_1_0="$APPDIR/usr/lib/gstreamer-1.0"
export GST_PLUGIN_SCANNER="$APPDIR/usr/libexec/gst-plugin-scanner"
# WebKit needs its relative helpers and this directory visible inside its sandbox.
cd "$APPDIR"

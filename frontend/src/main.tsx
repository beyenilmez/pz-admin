import React from "react";
import ReactDOM from "react-dom/client";
import "@fontsource-variable/inter";
import "@fontsource-variable/jetbrains-mono";
import "@fontsource-variable/noto-sans";
import "@mantine/core/styles.css";
import "@mantine/tiptap/styles.css";
import "@mantine/notifications/styles.css";
import "@/i18n";
import { App } from "./app/App";
import { AppProviders } from "./app/AppProviders";
import {
  installFrontendErrorReporting,
  reportFrontendError,
} from "./app/lib/frontendErrorReporting";

installFrontendErrorReporting();

const rootElement = document.getElementById("root");

if (!rootElement) {
  throw new Error("Root element not found");
}

ReactDOM.createRoot(rootElement, {
  onCaughtError(error, errorInfo) {
    reportFrontendError("react_caught", error, errorInfo.componentStack ?? "");
  },
  onRecoverableError(error, errorInfo) {
    reportFrontendError(
      "react_recoverable",
      error,
      errorInfo.componentStack ?? "",
    );
  },
  onUncaughtError(error, errorInfo) {
    reportFrontendError(
      "react_uncaught",
      error,
      errorInfo.componentStack ?? "",
    );
  },
}).render(
  <React.StrictMode>
    <AppProviders>
      <App />
    </AppProviders>
  </React.StrictMode>,
);

import { ReportFrontendError } from "@bindings/internal/logger/service";

const maximumMessageLength = 1024;
const maximumStackLength = 8192;

type ErrorSource =
  | "window"
  | "promise"
  | "react_caught"
  | "react_recoverable"
  | "react_uncaught";

interface ErrorDetails {
  name: string;
  message: string;
  stack: string;
}

function truncate(value: string, maximumLength: number) {
  return value.length > maximumLength
    ? `${value.slice(0, maximumLength)}...`
    : value;
}

function printable(value: unknown) {
  try {
    return String(value);
  } catch {
    return "Unprintable thrown value";
  }
}

function describeError(value: unknown): ErrorDetails {
  if (value instanceof Error) {
    return {
      name: truncate(value.name || "Error", 128),
      message: truncate(value.message, maximumMessageLength),
      stack: truncate(value.stack ?? "", maximumStackLength),
    };
  }
  return {
    name: "NonErrorThrownValue",
    message: truncate(printable(value), maximumMessageLength),
    stack: "",
  };
}

export function reportFrontendError(
  source: ErrorSource,
  error: unknown,
  componentStack = "",
) {
  const details = describeError(error);
  void ReportFrontendError({
    source,
    ...details,
    componentStack: truncate(componentStack, 4096),
    route: truncate(`${window.location.pathname}${window.location.hash}`, 256),
  }).catch(() => undefined);
}

export function installFrontendErrorReporting() {
  window.addEventListener("error", (event) => {
    reportFrontendError("window", event.error ?? event.message);
  });
  window.addEventListener("unhandledrejection", (event) => {
    reportFrontendError("promise", event.reason);
  });
}

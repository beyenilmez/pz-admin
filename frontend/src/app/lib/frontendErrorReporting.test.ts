import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ReportFrontendError } from "@bindings/internal/logger/service";
import {
  installFrontendErrorReporting,
  reportFrontendError,
} from "./frontendErrorReporting";

vi.mock("@bindings/internal/logger/service", () => ({
  ReportFrontendError: vi.fn(),
}));

type InstalledListener = {
  listener: EventListenerOrEventListenerObject;
  options?: AddEventListenerOptions | boolean;
  type: "error" | "unhandledrejection";
};

const originalRoute = `${window.location.pathname}${window.location.search}${window.location.hash}`;
const installedListeners: InstalledListener[] = [];
const reportFrontendErrorMock = vi.mocked(ReportFrontendError);

function installAndTrackListeners() {
  const addEventListener = vi.spyOn(window, "addEventListener");

  installFrontendErrorReporting();

  for (const [type, listener, options] of addEventListener.mock.calls) {
    if (
      (type === "error" || type === "unhandledrejection") &&
      listener !== null
    ) {
      installedListeners.push({ listener, options, type });
    }
  }
  addEventListener.mockRestore();
}

function rejectionEvent(reason: unknown): PromiseRejectionEvent {
  return Object.assign(new Event("unhandledrejection"), {
    promise: Promise.resolve(),
    reason,
  });
}

async function flushReporting() {
  await Promise.resolve();
  await Promise.resolve();
}

beforeEach(() => {
  reportFrontendErrorMock.mockReset();
  reportFrontendErrorMock.mockResolvedValue(undefined);
});

afterEach(() => {
  for (const { listener, options, type } of installedListeners.splice(0)) {
    window.removeEventListener(type, listener, options);
  }
  window.history.replaceState({}, "", originalRoute);
  vi.restoreAllMocks();
});

describe("reportFrontendError", () => {
  it("reports browser-safe error context without leaking query parameters", () => {
    window.history.replaceState(
      {},
      "",
      "/servers?token=sensitive-value#console",
    );
    const error = new Error("connection failed");
    error.name = "ConnectionError";
    error.stack = "ConnectionError: connection failed\n    at connect";

    reportFrontendError("react_caught", error, "\n    at ServerPage");

    expect(reportFrontendErrorMock).toHaveBeenCalledOnce();
    expect(reportFrontendErrorMock).toHaveBeenCalledWith(
      expect.objectContaining({
        componentStack: "\n    at ServerPage",
        message: "connection failed",
        name: "ConnectionError",
        route: "/servers#console",
        source: "react_caught",
      }),
    );
  });

  it("swallows backend reporting failures without another rejection", async () => {
    reportFrontendErrorMock.mockRejectedValueOnce(
      new Error("logger unavailable"),
    );

    reportFrontendError("react_recoverable", new Error("render failed"));
    await flushReporting();

    expect(reportFrontendErrorMock).toHaveBeenCalledOnce();
  });
});

describe("installFrontendErrorReporting", () => {
  it("routes window errors to the reporting boundary", () => {
    window.history.replaceState({}, "", "/dashboard");
    installAndTrackListeners();
    const error = new Error("window failure");
    error.name = "WindowError";
    error.stack = "WindowError: window failure\n    at bootstrap";

    window.dispatchEvent(
      new ErrorEvent("error", {
        colno: 9,
        error,
        filename: "app.js",
        lineno: 42,
        message: "ignored fallback",
      }),
    );
    expect(reportFrontendErrorMock).toHaveBeenCalledWith({
      componentStack: "",
      message: "window failure",
      name: "WindowError",
      route: "/dashboard",
      source: "window",
      stack: "WindowError: window failure\n    at bootstrap",
    });
  });

  it("normalizes non-Error promise rejection reasons", () => {
    window.history.replaceState({}, "", "/profiles#edit");
    installAndTrackListeners();

    window.dispatchEvent(rejectionEvent("request rejected"));

    expect(reportFrontendErrorMock).toHaveBeenCalledOnce();
    expect(reportFrontendErrorMock).toHaveBeenCalledWith({
      componentStack: "",
      message: "request rejected",
      name: "NonErrorThrownValue",
      route: "/profiles#edit",
      source: "promise",
      stack: "",
    });
  });
});

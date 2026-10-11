import { Snapshot } from "@bindings/internal/session/service";

function requestSessionSnapshot() {
  return Snapshot();
}

let activeRequest: ReturnType<typeof requestSessionSnapshot> | null = null;

// Share concurrent initialization requests, including React Strict Mode's
// development-only second effect run.
export function sessionSnapshot() {
  if (activeRequest) return activeRequest;

  const request = requestSessionSnapshot();
  activeRequest = request;
  const clearRequest = () => {
    if (activeRequest === request) activeRequest = null;
  };
  void request.then(clearRequest, clearRequest);
  return request;
}

import { useRef } from "react";

export function useCommandHistory() {
  const commandsRef = useRef<string[]>([]);
  const editsRef = useRef(new Map<number, string>());
  const indexRef = useRef(0);
  const draftRef = useRef("");

  function record(command: string) {
    commandsRef.current.push(command);
    editsRef.current.clear();
    indexRef.current = commandsRef.current.length;
    draftRef.current = "";
  }

  function update(value: string) {
    if (indexRef.current === commandsRef.current.length) {
      draftRef.current = value;
    } else {
      editsRef.current.set(indexRef.current, value);
    }
  }

  function navigate(direction: -1 | 1) {
    if (commandsRef.current.length === 0) return null;

    indexRef.current = Math.min(
      commandsRef.current.length,
      Math.max(0, indexRef.current + direction),
    );
    return indexRef.current === commandsRef.current.length
      ? draftRef.current
      : (editsRef.current.get(indexRef.current) ??
          commandsRef.current[indexRef.current]);
  }

  return { navigate, record, update };
}

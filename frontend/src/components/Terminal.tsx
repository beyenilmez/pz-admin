import React, { useState, useRef, useEffect } from "react";
import { useRcon } from "@/contexts/rcon-provider";
import { ScrollArea } from "@/components/ui/scroll-area"; // ShadCN ScrollArea

const commands = [
  "additem",
  "adduser",
  "addvehicle",
  "addxp",
  "alarm",
  "banid",
  "banuser",
  "changeoption",
  "checkModsNeedUpdate",
  "chopper",
  "clear",
  "createhorde",
  "createhorde2",
  "godmod",
  "grantadmin",
  "gunshot",
  "help",
  "invisible",
  "kick",
  "lightning",
  "log",
  "noclip",
  "players",
  "quit",
  "releasesafehouse",
  "reloadlua",
  "reloadoptions",
  "removeadmin",
  "removeuserfromwhitelist",
  "removezombies",
  "replay",
  "save",
  "servermsg",
  "setaccesslevel",
  "showoptions",
  "startrain",
  "startstorm",
  "stats",
  "stoprain",
  "stopweather",
  "teleport",
  "teleportto",
  "thunder",
  "unbanid",
  "unbanuser",
  "voiceban",
];

const TerminalPage: React.FC = () => {
  const { sendCommand } = useRcon();

  const [output, setOutput] = useState<{ type: "command" | "response"; line: string }[]>([]);
  const [currentInput, setCurrentInput] = useState<string>(""); // Input command
  const [commandHistory, setCommandHistory] = useState<string[]>([]); // Stores entered commands
  const [historyIndex, setHistoryIndex] = useState<number>(-1); // Tracks current position in history
  const [tabMatches, setTabMatches] = useState<string[]>([]); // Matches for Tab completion
  const [tabIndex, setTabIndex] = useState<number>(-1); // Tracks current match during Tab traversal

  const inputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom of output
  const scrollToBottom = () => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Focus input field when terminal is clicked
  useEffect(() => {
    inputRef.current?.focus();
    scrollToBottom();
  }, [output]);

  // Add lines to output with type
  const addOutput = (line: string, type: "command" | "response") => {
    const newLines = line.split("\n").map((l) => ({ type, line: l }));
    setOutput((prev) => [...prev, ...newLines]);
  };

  // Move command to the end of the history
  const moveCommandToEnd = (command: string) => {
    setCommandHistory((prev) => {
      const filteredHistory = prev.filter((cmd) => cmd !== command);
      return [...filteredHistory, command];
    });
  };

  // Handle Tab Auto-Completion Traversal
  const handleTabCompletion = () => {
    const trimmedInput = currentInput.trim();

    const words = trimmedInput.split(" ");
    const lastWord = words[words.length - 1];

    // Start a new tab match search
    if (tabIndex === -1) {
      const matches = commands.filter((cmd) => cmd.startsWith(lastWord));
      if (matches.length > 0) {
        setTabMatches(matches);
        setTabIndex(0);
        setCurrentInput((words.slice(0, words.length - 1).join(" ") + " " + matches[0]).trim());
      }
    } else {
      // Cycle through existing matches
      const newIndex = (tabIndex + 1) % tabMatches.length;
      setTabIndex(newIndex);
      setCurrentInput((words.slice(0, words.length - 1).join(" ") + " " + tabMatches[newIndex]).trim());
    }
  };

  // Reset Tab Matches when user types
  const resetTabCompletion = (value: string) => {
    setCurrentInput(value);
    setTabMatches([]);
    setTabIndex(-1);
  };

  // Handle key events
  const handleKeyDown = async (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && currentInput.trim()) {
      const command = currentInput.trim();

      // Move command to the end if it's from history
      moveCommandToEnd(command);

      // Display the command entered by the user
      addOutput(`> ${command}`, "command");
      resetTabCompletion(""); // Clear input and reset Tab matches
      setHistoryIndex(-1); // Reset history index

      try {
        if (command === "cls") {
          setOutput([]);
        } else {
          const response = await sendCommand(command);
          addOutput(response ? response : "No output.", "response");
        }
      } catch (error) {
        addOutput(`Error: ${error}`, "response");
      }

      scrollToBottom();
    }

    // Navigate command history with Up/Down keys
    if (e.key === "ArrowUp") {
      e.preventDefault();
      if (commandHistory.length > 0) {
        const newIndex = historyIndex === -1 ? commandHistory.length - 1 : Math.max(0, historyIndex - 1);
        setHistoryIndex(newIndex);
        resetTabCompletion(commandHistory[newIndex]);
      }
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      if (historyIndex > -1 && historyIndex < commandHistory.length - 1) {
        const newIndex = historyIndex + 1;
        setHistoryIndex(newIndex);
        resetTabCompletion(commandHistory[newIndex]);
      } else if (historyIndex === commandHistory.length - 1) {
        setHistoryIndex(-1);
        resetTabCompletion("");
      }
    }

    // Auto-complete on Tab key
    if (e.key === "Tab") {
      e.preventDefault(); // Prevent default Tab behavior
      handleTabCompletion();
    }

    // Clear current input with ESC key
    if (e.key === "Escape") {
      resetTabCompletion("");
      setHistoryIndex(-1);
    }
  };

  return (
    <div
      className="w-full h-[calc(100vh-5.5rem)] dark:bg-black/20 bg-white/20 font-mono p-2 pb-1"
      onClick={() => inputRef.current?.focus()}
    >
      {/* Scrollable Output */}
      <ScrollArea className="h-[calc(100%-2rem)] w-full overflow-auto">
        <div>
          {output.map((entry, index) => (
            <div
              key={index}
              className={
                entry.type === "command"
                  ? "text-green-500" // Brighter green for commands
                  : "text-green-700" // Darker green for responses
              }
            >
              {entry.line}
            </div>
          ))}
          <div ref={scrollRef}></div>
        </div>
      </ScrollArea>

      {/* Inline Input */}
      <div className="flex">
        <span className="text-green-400 mr-2 h-[2rem] flex items-center">$</span>
        <input
          ref={inputRef}
          type="text"
          spellCheck="false"
          value={currentInput}
          onChange={(e) => resetTabCompletion(e.target.value)}
          onKeyDown={handleKeyDown}
          className="w-full bg-transparent outline-none border-none text-green-400 h-[2rem]"
          autoFocus
        />
      </div>
    </div>
  );
};

export default TerminalPage;

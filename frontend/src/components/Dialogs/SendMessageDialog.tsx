import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "../ui/textarea";
import { useEffect, useState, useRef, useMemo } from "react";
import { ColorPicker } from "@/components/ui/color-picker";
import { ScrollArea } from "../ui/scroll-area";
import { main } from "@/wailsjs/go/models";
import { CopyToClipboard, LoadMessageDialog, SaveMessagesDialog, ServerMsg } from "@/wailsjs/go/main/App";
import { useConfig } from "@/contexts/config-provider";
import { Copy } from "lucide-react";

interface SendMessageDialogProps {
  isOpen: boolean;
  onClose: () => void;
  mode?: "message" | "settings" | "tool";
  initialMessage?: string;
  onSaveEdit?: (message: string) => void;
  textareaHeight?: string;
  previewHeight?: string;
}

export function SendMessageDialog({
  isOpen,
  onClose,
  mode = "message",
  initialMessage,
  onSaveEdit,
  textareaHeight = "20rem",
  previewHeight = "8rem",
}: SendMessageDialogProps) {
  const [message, setMessage] = useState("");
  const [lineColors, setLineColors] = useState<Record<number, string>>({});

  const [resetNum, setResetNum] = useState(0);

  const maxBytes = mode === "tool" ? 2147483647 : 988 - (mode === "settings" ? 24 : 0);

  const handleSendMessage = () => {
    ServerMsg(formattedMessage);

    onClose();
  };

  useEffect(() => {
    setMessage("");
    setLineColors({});
    setResetNum((prev) => prev + 1);
  }, [isOpen]);

  const floatLineColors: Record<number, string> = useMemo(() => {
    return Object.entries(lineColors).reduce(
      (acc, [key, value]) => ({
        ...acc,
        [key]: value
          .split(",")
          .map((v) => {
            const parsedValue = parseFloat(v);
            if (isNaN(parsedValue)) return "";
            return +(parsedValue / 255).toFixed(2);
          })
          .join(","),
      }),
      {}
    );
  }, [lineColors]);

  const handleColorChange = (index: number, color: string) => {
    setLineColors((prev) => ({ ...prev, [index]: color }));
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const lineCount = e.target.value.split("\n").length;
    setLineColors((prev) => ({ ...prev, [lineCount]: "" }));

    setMessage(e.target.value.replace(/[\\"]/g, ""));
  };

  const formattedMessage = message
    .split("\n")
    .map((line, index) => {
      const color = floatLineColors[index];
      if (!color) return line;
      return line.trim() ? `<RGB:${color}>${line}` : line;
    })
    .join("<LINE>");

  const remainingBytes = useMemo(
    () => maxBytes - new TextEncoder().encode(formattedMessage).length,
    [formattedMessage]
  );

  useEffect(() => {
    if (remainingBytes < 0) {
      const encoder = new TextEncoder();
      let localFormattedMessage = formattedMessage;
      let targetMessage = message;
      if (remainingBytes < 0) {
        let truncatedMessage = targetMessage;
        while (encoder.encode(localFormattedMessage).length > maxBytes) {
          truncatedMessage = truncatedMessage.slice(0, -1);
          localFormattedMessage = truncatedMessage
            .split("\n")
            .map((line, index) => {
              const color = floatLineColors[index];
              if (!color) return line;
              return line.trim() ? `<RGB:${color}>${line}` : line;
            })
            .join("<LINE>");
        }
        targetMessage = truncatedMessage;
      }
      setMessage(targetMessage);
    }
  }, [remainingBytes]);

  const handleSaveMessage = () => {
    const serverMessage: main.ServerMessage = {
      message: message,
      lineColors: lineColors,
    };

    SaveMessagesDialog(serverMessage);
  };

  const handleLoadMessage = () => {
    LoadMessageDialog().then((serverMessage) => {
      if (!serverMessage.message) return;
      setMessage(serverMessage.message);
      setLineColors(serverMessage.lineColors);
    });
  };

  useEffect(() => {
    if (initialMessage) {
      let constructedMessage = "";

      initialMessage.split("<LINE>").forEach((line, index) => {
        let trimmedLine = line.trim();

        if (trimmedLine.startsWith("<RGB:")) {
          const color = trimmedLine.split("<RGB:")[1].split(">")[0];
          const [x, y, z] = color.split(",");
          setLineColors((prev) => ({
            ...prev,
            [index]: `
            ${(parseFloat(x) * 255).toFixed(0)},
              ${(parseFloat(y) * 255).toFixed(0)},
              ${(parseFloat(z) * 255).toFixed(0)}`,
          }));

          trimmedLine = trimmedLine.split(">")[1];
        }

        constructedMessage += trimmedLine + "\n";
      });

      setMessage(constructedMessage);
    }
  }, [initialMessage, resetNum]);

  const handleSaveEdit = () => {
    onSaveEdit?.(formattedMessage);
    onClose();
  };

  const handleResetEdit = () => {
    setResetNum((prev) => prev + 1);
  };

  const renderTextareaWithColors = () => {
    const lines = message.split("\n");
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const lineRefs = useRef<(HTMLDivElement | null)[]>([]);
    const [lineHeights, setLineHeights] = useState<number[]>([]);
    const { config } = useConfig();

    const MIN_LINE_HEIGHT = 20 * (config?.windowScale ? config.windowScale / 100 : 1);

    useEffect(() => {
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
        textareaRef.current.style.height = textareaRef.current.scrollHeight + "px";
      }
    }, [message]);

    useEffect(() => {
      const heights = lineRefs.current.map((line, index) =>
        line && lines[index].trim() !== "" ? line.offsetHeight : MIN_LINE_HEIGHT
      );
      setLineHeights(heights);
    }, [message, lineRefs.current]);

    const getTopPosition = (index: number) => {
      return lineHeights.slice(0, index).reduce((sum, height) => sum + height, 0);
    };

    return (
      <ScrollArea className="rounded-md" style={{ height: textareaHeight }}>
        <div className="relative">
          <Textarea
            spellCheck={false}
            ref={textareaRef}
            value={message}
            onChange={handleInputChange}
            placeholder="Your message"
            style={{ minHeight: textareaHeight, width: mode === "tool" ? "100%" : "45rem" }}
            className="pt-3 break-words whitespace-pre-wrap dark:bg-black/40 bg-black/80 resize-none overflow-clip text-sm pl-8 leading-5 font-semibold text-transparent selection:bg-muted caret-muted-foreground font-[corbel]"
          />
          <div className="absolute top-3 left-0 w-full pointer-events-none">
            {lines.map((line, index) => (
              <>
                <div
                  key={"color" + index}
                  className="absolute pointer-events-auto"
                  style={{
                    top: `${getTopPosition(index) + 2}px`,
                    left: "0.5rem",
                  }}
                >
                  <ColorPicker
                    className="h-4 w-4 rounded-sm"
                    value={lineColors[index]}
                    onChange={(color) => handleColorChange(index, color)}
                  />
                </div>

                <div
                  key={"line" + index}
                  ref={(el) => {
                    lineRefs.current[index] = el;
                    return;
                  }}
                  className="pr-[2.81rem] w-full break-words whitespace-pre-wrap absolute pointer-events-none text-[rgb(7,126,245)] font-semibold text-sm select-none font-[corbel]"
                  style={{
                    top: `${getTopPosition(index)}px`,
                    left: "2.03rem",
                    color: `rgb(${lineColors[index] || "7,126,245"})`,
                  }}
                >
                  {line.trim() === "" ? "\u00A0" : line}
                </div>
              </>
            ))}
          </div>
        </div>
      </ScrollArea>
    );
  };

  const dialogContent = (
    <div className="space-y-1">
      <Label htmlFor="server-message" className="text-right">
        Message
      </Label>
      {renderTextareaWithColors()}
      <div className="space-y-0.5">
        <div className="space-y-1 mt-4">
          <div className="flex w-full justify-between">
            <Label className="font-bold">{mode === "tool" ? "Formatted Message" : "Preview"}</Label>
            {mode !== "tool" && (
              <p className="text-right text-xs text-muted-foreground" role="status">
                <span className="tabular-nums">
                  {remainingBytes}/{maxBytes}
                </span>{" "}
                bytes left
              </p>
            )}
            {mode === "tool" && (
              <p className="text-right text-xs text-muted-foreground" role="status">
                <span className="tabular-nums">{maxBytes - remainingBytes}</span> bytes
              </p>
            )}
          </div>
          <ScrollArea
            className="p-2 py-0.5 pr-5 border rounded"
            style={{ width: mode === "tool" ? "100%" : "45rem", height: previewHeight }}
          >
            <div>
              <code
                className="text-sm break-words whitespace-pre-wrap block max-w-full"
                style={{
                  wordBreak: "break-word",
                  overflowWrap: "anywhere",
                }}
              >
                {formattedMessage}
              </code>
            </div>
          </ScrollArea>
        </div>
      </div>
    </div>
  );

  if (mode === "tool") {
    return (
      <>
        {dialogContent}
        <div className="flex justify-between gap-2 py-2">
          <Button
            onClick={() => {
              CopyToClipboard(formattedMessage, true);
            }}
            disabled={!formattedMessage}
            variant={"outline"}
            className="gap-2"
          >
            <Copy /> Copy Formatted Message
          </Button>
          <div>
            <Button onClick={handleSaveMessage} disabled={!message} variant={"outline"}>
              Save Message
            </Button>
            <Button onClick={handleLoadMessage} variant={"outline"}>
              Load Message
            </Button>
          </div>
        </div>
      </>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[80vw] w-fit h-max-screen overflow-clip">
        <DialogHeader>
          <DialogTitle>{mode === "message" ? "Send Message" : "Edit message"}</DialogTitle>
          <DialogDescription>
            <p>{mode === "message" ? "You will send this message to everyone in the server." : ""}</p>
          </DialogDescription>
        </DialogHeader>
        {dialogContent}
        <DialogFooter className="w-full flex flex-row sm:flex-row sm:justify-between justify-between">
          <div className="flex gap-2">
            <Button onClick={handleSaveMessage} disabled={!message} variant={"outline"}>
              Save Message
            </Button>
            <Button onClick={handleLoadMessage} variant={"outline"}>
              Load Message
            </Button>
          </div>
          {mode === "settings" ? (
            <div className="space-x-2">
              <Button type="submit" variant={"secondary"} onClick={handleResetEdit}>
                Reset
              </Button>
              <Button type="submit" onClick={handleSaveEdit}>
                Save Edit
              </Button>
            </div>
          ) : (
            <Button type="submit" onClick={handleSendMessage} disabled={!formattedMessage}>
              Send
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

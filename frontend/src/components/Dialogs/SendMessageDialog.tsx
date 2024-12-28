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
import { LoadMessageDialog, SaveMessagesDialog, ServerMsg } from "@/wailsjs/go/main/App";

interface SendMessageDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

const maxBytes = 988;

export function SendMessageDialog({ isOpen, onClose }: SendMessageDialogProps) {
  const [message, setMessage] = useState("");
  const [lineColors, setLineColors] = useState<Record<number, string>>({});
  const [lineColorsFloat, setLineColorsFloat] = useState<Record<number, string>>({});

  const handleSendMessage = () => {
    ServerMsg(formattedMessage);

    onClose();
  };

  useEffect(() => {
    setMessage("");
    setLineColors({});
    setLineColorsFloat({});
  }, [isOpen]);

  const handleColorChange = (index: number, color: string) => {
    setLineColors((prev) => ({ ...prev, [index]: color }));
  };

  const handleColorFloatChange = (index: number, color: string) => {
    setLineColorsFloat((prev) => ({ ...prev, [index]: color }));
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const lineCount = e.target.value.split("\n").length;
    setLineColors((prev) => ({ ...prev, [lineCount]: "" }));
    setLineColorsFloat((prev) => ({ ...prev, [lineCount]: "" }));

    setMessage(e.target.value.replace(/[\\"]/g, ""));
  };

  const formattedMessage = message
    .split("\n")
    .map((line, index) => {
      const color = lineColorsFloat[index] || "1,1,1";
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
              const color = lineColorsFloat[index] || "1,1,1";
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
      lineColorsFloat: lineColorsFloat,
    };

    SaveMessagesDialog(serverMessage);
  };

  const handleLoadMessage = () => {
    LoadMessageDialog().then((serverMessage) => {
      if (!serverMessage.message) return;

      setMessage(serverMessage.message);
      setLineColors(serverMessage.lineColors);
      setLineColorsFloat(serverMessage.lineColorsFloat);
    });
  };

  const renderTextareaWithColors = () => {
    const lines = message.split("\n");
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    useEffect(() => {
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
        textareaRef.current.style.height = textareaRef.current.scrollHeight + "px";
      }
    }, [message]);

    return (
      <ScrollArea className="h-80 rounded-md">
        <div className="relative">
          <Textarea
            spellCheck={false}
            ref={textareaRef}
            value={message}
            onChange={handleInputChange}
            placeholder="Your message"
            className="break-words whitespace-pre-wrap bg-black/40 w-[45rem] min-h-80 resize-none overflow-clip text-sm pl-8 leading-5 font-semibold text-transparent selection:bg-muted caret-muted-foreground font-[corbel]"
          />
          <div className="absolute top-3 left-0 w-full pointer-events-none">
            {lines.map((line, index) => (
              <>
                <div
                  key={"color" + index}
                  className="absolute pointer-events-auto"
                  style={{ top: `${index * 1.25}rem`, left: "0.5rem" }}
                >
                  <ColorPicker
                    className="h-4 w-4 rounded-sm"
                    value={lineColors[index]}
                    onChange={(color) => handleColorChange(index, color)}
                    onFloatChange={(color) =>
                      handleColorFloatChange(index, `${color.r.toFixed(3)},${color.g.toFixed(3)},${color.b.toFixed(3)}`)
                    }
                  />
                </div>

                <div
                  key={"line" + index}
                  className="pr-12 w-full break-words whitespace-pre-wrap absolute pointer-events-none text-white font-semibold text-sm select-none font-[corbel]"
                  style={{
                    top: `${index * 1.25 - 0.2}rem`,
                    left: "2.03rem",
                    color: `rgb(${lineColors[index] || "255,255,255"})`,
                  }}
                >
                  {line}
                </div>
              </>
            ))}
          </div>
        </div>
      </ScrollArea>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[80vw] w-fit h-max-screen overflow-clip">
        <DialogHeader>
          <DialogTitle>Send Message</DialogTitle>
          <DialogDescription>
            <p>You will send this message to everyone in the server.</p>
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-1">
          <Label htmlFor="server-message" className="text-right">
            Message
          </Label>
          {renderTextareaWithColors()}
          <div className="space-y-0.5">
            <Label className="font-bold">Preview:</Label>
            <ScrollArea className="p-2 py-0.5 pr-5 border rounded h-32 w-[45rem]">
              <div className="w-[43rem]">
                <code className="text-sm break-words whitespace-pre-wrap">{formattedMessage}</code>
              </div>
            </ScrollArea>
          </div>
        </div>
        <DialogFooter className="w-full flex flex-row sm:flex-row sm:justify-between justify-between">
          <div className="flex gap-2">
            <Button onClick={handleSaveMessage} disabled={!message}>
              Save Message
            </Button>
            <Button onClick={handleLoadMessage}>Load Message</Button>
          </div>
          <Button type="submit" onClick={handleSendMessage} disabled={!formattedMessage}>
            Send
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

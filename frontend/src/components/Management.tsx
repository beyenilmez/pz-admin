"use client";

import { SaveWorld } from "@/wailsjs/go/main/App";
import { Button } from "./ui/button";
import { ScrollArea } from "./ui/scroll-area";
import { useState } from "react";

export function ManagementTab() {
  const [saving, setSaving] = useState(false);
  const handleSave = async () => {
    setSaving(true);
    await SaveWorld();
    setSaving(false);
  };

  return (
    <>
      <div className="w-full h-[calc(100vh-5.5rem)] dark:bg-black/20 bg-white/20 p-2">
        <div className="w-[calc(100%-1rem)]">
          <ScrollArea className="h-full w-full overflow-auto">
            <div className="flex mb-2 justify-between">
              <div className="space-x-2">
                <Button className="bg-success text-success-foreground" onClick={handleSave} disabled={saving}>
                  Save
                </Button>
                <Button variant={"destructive"}>Quit</Button>
              </div>
              <div className="space-x-2">
                <Button>Message</Button>
                <Button>Check Mod Updates</Button>
              </div>
            </div>
            <div>Content</div>
          </ScrollArea>
        </div>
      </div>
    </>
  );
}

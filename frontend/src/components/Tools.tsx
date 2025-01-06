import { useState } from "react";
import { AddItemDialog } from "./Dialogs/AddItemDialog";
import { Tabs, TabsList, TabsTrigger } from "./ui/tabs";
import { useTranslation } from "react-i18next";
import { AddVehicleDialog } from "./Dialogs/AddVehicleDialog";
import { SendMessageDialog } from "./Dialogs/SendMessageDialog";

export default function Tools() {
  const { t } = useTranslation();
  const [tab, setTab] = useState("message-editor");

  return (
    <Tabs value={tab} className="flex w-full h-full">
      <TabsList defaultValue={"message-editor"} className="h-full backdrop-brightness-0 rounded-none p-2 w-64 shrink-0">
        <div className="flex flex-col w-full h-full">
          <TabsTrigger value="message-editor" onClick={() => setTab("message-editor")} className="px-6 py-3 w-full">
            {t("tools.message_editor.mode.tool.name")}
          </TabsTrigger>
          <TabsTrigger value="item-browser" onClick={() => setTab("item-browser")} className="px-6 py-3 w-full">
            {t("Item Browser")}
          </TabsTrigger>
          <TabsTrigger value="vehicle-browser" onClick={() => setTab("vehicle-browser")} className="px-6 py-3 w-full">
            {t("Vehicle Browser")}
          </TabsTrigger>
        </div>
      </TabsList>

      {/* Tab Content */}
      <div className="w-full h-full relative p-4">
        <div className={tab === "message-editor" ? "block w-full" : "hidden"}>
          {tab === "message-editor" && (
            <SendMessageDialog
              mode="tool"
              onClose={() => {}}
              isOpen
              textareaHeight={`calc(100vh - 27rem)`}
              previewHeight={`13rem`}
            />
          )}
        </div>
        <div className={tab === "item-browser" ? "block w-full" : "hidden"}>
          {tab === "item-browser" && (
            <AddItemDialog mode="tool" onClose={() => {}} isOpen height={`calc(100vh - 11.5rem)`} />
          )}
        </div>
        <div className={tab === "vehicle-browser" ? "block w-full" : "hidden"}>
          {tab === "vehicle-browser" && (
            <AddVehicleDialog
              mode="tool"
              onClose={() => {}}
              isOpen
              initialNames={[]}
              height={`calc(100vh - 11.5rem)`}
            />
          )}
        </div>
      </div>
    </Tabs>
  );
}

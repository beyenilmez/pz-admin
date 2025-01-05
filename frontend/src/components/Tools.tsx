import { useState } from "react";
import { AddItemDialog } from "./Dialogs/AddItemDialog";
import { Tabs, TabsList, TabsTrigger } from "./ui/tabs";
import { useTranslation } from "react-i18next";

export default function Tools() {
  const { t } = useTranslation();
  const [tab, setTab] = useState("item-browser");

  return (
    <Tabs value={tab} className="flex w-full h-full">
      <TabsList defaultValue={"item-browser"} className="h-full backdrop-brightness-0 rounded-none p-2 w-64 shrink-0">
        <div className="flex flex-col justify-between w-full h-full">
          <TabsTrigger value="item-browser" onClick={() => setTab("item-browser")} className="px-6 w-full">
            {t("Item Browser")}
          </TabsTrigger>
        </div>
      </TabsList>

      {/* Tab Content */}
      <div className="w-full h-full relative p-4">
        <div className={tab === "item-browser" ? "block w-full" : "hidden"}>
          {tab === "item-browser" && (
            <AddItemDialog mode="tool" onClose={() => {}} isOpen height={`calc(100vh - 11.5rem)`} />
          )}
        </div>
      </div>
    </Tabs>
  );
}

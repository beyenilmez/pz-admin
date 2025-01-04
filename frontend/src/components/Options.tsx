import { Option, options as optionsData } from "@/assets/options";
import { ScrollArea } from "./ui/scroll-area";
import { Tabs, TabsList, TabsTrigger } from "./ui/tabs";
import { useEffect, useRef, useState } from "react";
import { Button } from "./ui/button";
import { SettingContent, SettingDescription, SettingLabel, SettingsGroup, SettingsItem } from "./ui/settings-group";
import { useTranslation } from "react-i18next";
import { useRcon } from "@/contexts/rcon-provider";
import { main } from "@/wailsjs/go/models";
import { Switch } from "./ui/switch";
import { Input } from "./ui/input";
import { formatWithMinimumOneDecimal } from "@/lib/utils";

export function OptionsTab() {
  const { t } = useTranslation();
  const { optionsModified, cancelModifiedOptions, updateOptions, updatingOptions, modifiedOptions, optionsInvalid } =
    useRcon();

  const [tab, setTab] = useState("General");
  const [scrollAreaHeight, setScrollAreaHeight] = useState<string>("100%");

  const tabsRef = useRef<HTMLDivElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  const scrollToItem = (item: string) => {
    const element = document.getElementById(item);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  useEffect(() => {
    const observerOptions = {
      root: scrollAreaRef.current,
      rootMargin: "0px 0px -90% 0px",
      threshold: 0,
    };

    const observerCallback = (entries: IntersectionObserverEntry[]) => {
      const visibleEntry = entries.find((entry) => entry.isIntersecting);
      if (visibleEntry) {
        const id = visibleEntry.target.getAttribute("id")?.replace("-anchor", "");
        if (id) {
          setTab(id);
        }
      }
    };

    const observer = new IntersectionObserver(observerCallback, observerOptions);

    const anchors = optionsData.categories.map((category) => document.getElementById(category.name + "-anchor"));

    anchors.forEach((anchor) => {
      if (anchor) {
        observer.observe(anchor);
      }
    });

    return () => {
      anchors.forEach((anchor) => {
        if (anchor) {
          observer.unobserve(anchor);
        }
      });
    };
  }, []);

  useEffect(() => {
    const updateHeight = () => {
      if (tabsRef.current) {
        const tabsHeight = tabsRef.current.offsetHeight;
        setScrollAreaHeight(`calc(100% - ${tabsHeight}px - 3.5rem)`);
      }
    };

    updateHeight();

    const resizeObserver = new ResizeObserver(updateHeight);
    if (tabsRef.current) {
      resizeObserver.observe(tabsRef.current);
    }

    return () => {
      if (tabsRef.current) {
        resizeObserver.unobserve(tabsRef.current);
      }
    };
  }, []);

  return (
    <div className="w-full h-[calc(100vh-5.5rem)] dark:bg-black/20 bg-white/20 p-2 space-y-2">
      <Tabs value={tab}>
        <TabsList defaultValue={"General"} className="flex flex-wrap h-fit" ref={tabsRef}>
          {optionsData.categories.map((category) => (
            <TabsTrigger
              key={category.name}
              value={category.name}
              onClick={() => {
                scrollToItem(category.name + "-anchor");
                setTab(category.name);
              }}
            >
              {category.name}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      <ScrollArea className={`w-full pr-6`} ref={scrollAreaRef} style={{ height: scrollAreaHeight }}>
        {optionsData.categories.map((category, index) => (
          <div key={category.name} className="flex flex-col gap-2">
            <div className={`border-b pb-2 ${index === 0 ? "mt-2" : "mt-10"}`}>
              <a
                className="text-3xl font-bold leading-none"
                href={`#${category.name}`}
                id={category.name + "-anchor"}
                onClick={(e) => {
                  e.preventDefault();
                  scrollToItem(category.name + "-anchor");
                  setTab(category.name);
                }}
              >
                {category.name}
              </a>
            </div>
            <SettingsGroup className="space-y-0.5">
              {category.options.map((option) => (
                <SettingsItem
                  className="border-none"
                  key={option.FieldName}
                  disabled={
                    option.Requirements &&
                    modifiedOptions[option.Requirements?.FieldName as keyof main.PzOptions] !==
                      option.Requirements?.FieldValue
                  }
                >
                  <div>
                    <SettingLabel>{t(`options.${option.FieldName}.display_name`)}</SettingLabel>
                    <SettingDescription>{t(`options.${option.FieldName}.description`)}</SettingDescription>
                    {option.Requirements && (
                      <div className="flex items-center gap-2 opacity-50">
                        <span className="text-xs text-muted-foreground">
                          Requires: {t(`options.${option.Requirements.FieldName}.display_name`)} to be{" "}
                          {option.Requirements.FieldValue.toString()}
                        </span>
                      </div>
                    )}
                  </div>

                  <SettingContent className="mr-2">
                    <OptionContent option={option} />
                  </SettingContent>
                </SettingsItem>
              ))}
            </SettingsGroup>
          </div>
        ))}
      </ScrollArea>

      <div className="h-12 flex justify-between mr-5">
        <Button disabled={updatingOptions}>Apply Options</Button>
        <div className="flex gap-2">
          <Button disabled={!optionsModified || updatingOptions || optionsInvalid} className="min-w-28">
            {updatingOptions ? "Saving..." : "Save & Apply"}
          </Button>
          <Button
            disabled={!optionsModified || updatingOptions || optionsInvalid}
            onClick={updateOptions}
            className="min-w-20"
          >
            {updatingOptions ? "Saving..." : "Save"}
          </Button>
          <Button variant={"destructive"} onClick={cancelModifiedOptions} disabled={!optionsModified}>
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
}

function OptionContent({ option }: { option: Option }) {
  if (option.Type === "Boolean") {
    return <BoolOptionContent option={option} />;
  } else if (option.Type === "Integer") {
    return <IntOptionContent option={option} />;
  } else if (option.Type === "Double") {
    return <DoubleOptionContent option={option} />;
  }
}

function BoolOptionContent({ option }: { option: Option }) {
  const { modifiedOptions, modifyOption } = useRcon();

  return (
    <div className="w-20 flex justify-center">
      <Switch
        checked={modifiedOptions[option.FieldName as keyof main.PzOptions] as boolean}
        onCheckedChange={(value) => {
          modifyOption(option.FieldName as keyof main.PzOptions, value);
        }}
      />
    </div>
  );
}

function IntOptionContent({ option }: { option: Option }) {
  const { modifiedOptions, modifyOption } = useRcon();

  const value = modifiedOptions[option.FieldName as keyof main.PzOptions] as number;

  return (
    <>
      <Input
        className={`w-20 ${
          (isNaN(value) || value > (option.Range?.Max ?? 2147483647) || value < (option.Range?.Min ?? -2147483648)) &&
          "ring-offset-destructive ring ring-destructive"
        }`}
        type="number"
        lang="en"
        inputMode="numeric"
        value={modifiedOptions[option.FieldName as keyof main.PzOptions] as number}
        onChange={(e) => {
          let value = parseInt(e.target.value, 10);
          if (e.target.value !== "" && isNaN(value)) {
            return;
          }
          value = Math.min(value, option.Range?.Max ?? 2147483647);

          modifyOption(option.FieldName as keyof main.PzOptions, value);
        }}
        min={option.Range?.Min ?? -2147483647}
        max={option.Range?.Max ?? 2147483647}
        onKeyDown={(e) => e.key.match(/[-+.,]/) && e.preventDefault()}
      />
      {option.Range && (
        <div className="text-[0.6rem] w-20 h-0 text-center">
          {option.Range?.Min} - {option.Range?.Max}
        </div>
      )}
    </>
  );
}

function DoubleOptionContent({ option }: { option: Option }) {
  const { modifiedOptions, modifyOption, optionsModified } = useRcon();

  const [inputValue, setInputValue] = useState(
    formatWithMinimumOneDecimal(modifiedOptions[option.FieldName as keyof main.PzOptions])
  );
  const floatInputValue = parseFloat(inputValue);

  const handleInputValueChange = (newValue: string) => {
    newValue = newValue
      .replace(/[^0-9.,]/g, "")
      .replace(",", ".")
      .replace(/(\..*?)\./g, "$1");
    if (newValue === ".") {
      setInputValue("");
      return;
    }

    const floatNewValue = parseFloat(newValue);

    if (!newValue.endsWith(".") && !isNaN(floatNewValue) && floatNewValue > (option.Range?.Max ?? 2147483647)) {
      setInputValue((option.Range?.Max ?? 2147483647).toString());
    } else {
      setInputValue(newValue);
    }
  };

  useEffect(() => {
    modifyOption(option.FieldName as keyof main.PzOptions, floatInputValue);
  }, [inputValue]);

  useEffect(() => {
    if (!optionsModified) {
      setInputValue(formatWithMinimumOneDecimal(modifiedOptions[option.FieldName as keyof main.PzOptions]));
    }
  }, [optionsModified]);

  return (
    <>
      <Input
        className={`w-20 ${
          (isNaN(floatInputValue) ||
            floatInputValue > (option.Range?.Max ?? 2147483647) ||
            floatInputValue < (option.Range?.Min ?? -2147483648)) &&
          "ring-offset-destructive ring ring-destructive"
        }`}
        type="text"
        inputMode="decimal"
        value={inputValue}
        onChange={(e) => handleInputValueChange(e.target.value)}
        min={option.Range?.Min ?? -2147483647}
        max={option.Range?.Max ?? 2147483647}
        onKeyDown={(e) => e.key.match(/[-+]/) && e.preventDefault()}
      />
      {option.Range && (
        <div className="text-[0.6rem] w-20 h-0 text-center">
          {option.Range?.Min} - {option.Range?.Max}
        </div>
      )}
    </>
  );
}

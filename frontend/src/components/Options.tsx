import { Option, options as optionsData } from "@/assets/options";
import { ScrollArea, ScrollBar } from "./ui/scroll-area";
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
import { Edit, RotateCw, Search } from "lucide-react";
import { SendMessageDialog } from "./Dialogs/SendMessageDialog";
import { Tooltip, TooltipContent } from "./ui/tooltip";
import { TooltipTrigger } from "@radix-ui/react-tooltip";
import { Textarea } from "./ui/textarea";
import { ToggleGroup, ToggleGroupItem } from "./ui/toggle-group";
import { AddItemDialog } from "./Dialogs/AddItemDialog";
import { Slider } from "./ui/my-slider";
import { ReloadOptions } from "@/wailsjs/go/main/App";
import { Label } from "./ui/label";

export function OptionsTab() {
  const { t } = useTranslation();
  const {
    optionsModified,
    cancelModifiedOptions,
    updateOptions,
    updatingOptions,
    modifiedOptions,
    optionsInvalid,
    modifyOption,
    reloadDoubleptions,
  } = useRcon();

  const [tab, setTab] = useState("General");
  const [scrollAreaHeight, setScrollAreaHeight] = useState<string>("100%");

  const [searchText, setSearchText] = useState("");

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

  const filteredCategories = optionsData.categories
    .map((category) => {
      return {
        ...category,
        options: category.options.filter(
          (option) =>
            option.FieldName.toLowerCase().includes(searchText.toLowerCase()) ||
            t(`options.${option.FieldName}.keywords`).toLowerCase().includes(searchText.toLowerCase()) ||
            option.Type.toLowerCase() === searchText.toLowerCase() ||
            category.name.toLowerCase().includes(searchText.toLowerCase())
        ),
      };
    })
    .filter((category) => category.options.length > 0);

  return (
    <div className="w-full h-[calc(100vh-5.5rem)] dark:bg-black/20 bg-white/20 p-2 space-y-2">
      <Tabs value={tab}>
        <TabsList defaultValue={"General"} className="flex flex-wrap h-fit min-h-10" ref={tabsRef}>
          {filteredCategories.map((category) => (
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
        <div className="relative m-1">
          <Input
            className="peer ps-9"
            placeholder="Search option..."
            type="search"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
          />
          <div className="pointer-events-none absolute inset-y-0 start-0 flex items-center justify-center ps-3 text-muted-foreground/80 peer-disabled:opacity-50">
            <Search className="w-4 h-4" strokeWidth={2} />
          </div>
        </div>
        {filteredCategories.map((category, index) => (
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
                    option.Requirements.some(
                      (requirement) =>
                        modifiedOptions[requirement.FieldName as keyof main.PzOptions] !== requirement.FieldValue
                    )
                  }
                >
                  <div>
                    <SettingLabel className="flex gap-1.5">
                      {t(`options.${option.FieldName}.display_name`)}
                      {option.Default !== undefined &&
                        option.Default !== modifiedOptions[option.FieldName as keyof main.PzOptions] && (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div
                                className="cursor-pointer mt-0.5"
                                onClick={() => {
                                  modifyOption(option.FieldName as keyof main.PzOptions, option.Default!);
                                  reloadDoubleptions();
                                }}
                              >
                                <RotateCw className="w-2.5 h-2.5 opacity-70" strokeWidth={2} />
                              </div>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Reset to default</p>
                            </TooltipContent>
                          </Tooltip>
                        )}
                    </SettingLabel>
                    <SettingDescription>{t(`options.${option.FieldName}.description`)}</SettingDescription>
                    {option.Requirements && (
                      <div className="flex items-center gap-2 opacity-50">
                        <span className="text-xs text-muted-foreground">
                          Requires:{" "}
                          {option.Requirements.map(
                            (requirement) =>
                              t(`options.${requirement.FieldName}.display_name`) +
                              " to be " +
                              (requirement.FieldValue ? "enabled" : "disabled")
                          ).join(", ")}
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
        <Button
          disabled={updatingOptions}
          onClick={() => {
            ReloadOptions();
          }}
        >
          Apply Options
        </Button>
        <div className="flex gap-2">
          <Button
            onClick={() => {
              updateOptions(true);
            }}
            disabled={!optionsModified || updatingOptions || optionsInvalid}
            className="min-w-28"
          >
            {updatingOptions ? "Saving..." : "Save & Apply"}
          </Button>
          <Button
            disabled={!optionsModified || updatingOptions || optionsInvalid}
            onClick={() => {
              updateOptions();
            }}
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
  } else if (option.Type === "String") {
    return <StringOptionContent option={option} />;
  } else if (option.Type === "Text") {
    return <TextOptionContent option={option} />;
  } else if (option.Type === "Information") {
    return <InformationOptionContent option={option} />;
  } else if (option.Type === "ServerWelcomeMessage") {
    return <ServerWelcomeMessageOptionContent option={option} />;
  } else if (option.Type === "SpawnItems") {
    return <SpawnItemsOptionContent option={option} />;
  } else if (option.Type === "Choice") {
    return <ChoiceOptionContent option={option} />;
  }
}

function BoolOptionContent({ option }: { option: Option }) {
  const { modifiedOptions, modifyOption } = useRcon();

  return (
    <div className="w-[5.5rem] flex justify-end">
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
  const { modifiedOptions, modifyOption, options } = useRcon();

  const value = modifiedOptions[option.FieldName as keyof main.PzOptions] as number;

  const { t } = useTranslation();

  return (
    <div className="flex items-center">
      {option.DisabledValue !== undefined && (
        <div className="flex flex-col items-center min-w-24">
          <Switch
            id={option.FieldName + "-disabled"}
            checked={modifiedOptions[option.FieldName as keyof main.PzOptions] === option.DisabledValue}
            onCheckedChange={(value) => {
              modifyOption(
                option.FieldName as keyof main.PzOptions,
                value
                  ? (option.DisabledValue as number)
                  : options[option.FieldName as keyof main.PzOptions] === option.DisabledValue
                  ? NaN
                  : options[option.FieldName as keyof main.PzOptions]
              );
            }}
          />
          <Label htmlFor={option.FieldName + "-disabled"} className="text-[0.65rem] text-muted-foreground h-0">
            {t(`options.${option.FieldName}.disabled`)}
          </Label>
        </div>
      )}
      <div>
        <Input
          className={`w-[5.5rem] ${
            (isNaN(value) || value > (option.Range?.Max ?? 2147483647) || value < (option.Range?.Min ?? -2147483648)) &&
            "ring-offset-destructive ring ring-destructive"
          }`}
          type="number"
          lang="en"
          inputMode="numeric"
          placeholder={
            modifiedOptions[option.FieldName as keyof main.PzOptions] === option.DisabledValue
              ? t(`options.${option.FieldName}.disabled`)
              : ""
          }
          value={
            modifiedOptions[option.FieldName as keyof main.PzOptions] === option.DisabledValue
              ? ""
              : (modifiedOptions[option.FieldName as keyof main.PzOptions] as number)
          }
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
          disabled={modifiedOptions[option.FieldName as keyof main.PzOptions] === option.DisabledValue}
        />
        {option.Range && (
          <div className="text-[0.6rem] w-[5.5rem] h-0 text-center text-muted-foreground">
            {option.Range?.Min} - {option.Range?.Max}
          </div>
        )}
      </div>
    </div>
  );
}

function DoubleOptionContent({ option }: { option: Option }) {
  const { modifiedOptions, modifyOption, optionsModified, options, reloadDoubleOptionsKey } = useRcon();

  const [inputValue, setInputValue] = useState(
    formatWithMinimumOneDecimal(modifiedOptions[option.FieldName as keyof main.PzOptions])
  );
  const floatInputValue = parseFloat(inputValue);

  const step = (option.Range?.Max ?? 2147483647) >= 100 ? 1 : 0.1;

  const { t } = useTranslation();

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

  useEffect(() => {
    setInputValue(formatWithMinimumOneDecimal(modifiedOptions[option.FieldName as keyof main.PzOptions]));
  }, [reloadDoubleOptionsKey]);

  return (
    <div className="flex items-center">
      {option.DisabledValue !== undefined && (
        <div className="flex flex-col items-center min-w-24">
          <Switch
            checked={modifiedOptions[option.FieldName as keyof main.PzOptions] === option.DisabledValue}
            onCheckedChange={(value) => {
              modifyOption(
                option.FieldName as keyof main.PzOptions,
                value ? (option.DisabledValue as number) : options[option.FieldName as keyof main.PzOptions]
              );
            }}
          />
          <div className="text-xs text-muted-foreground h-0">{t(`options.${option.FieldName}.disabled`)}</div>
        </div>
      )}
      <div>
        <div className="w-[20rem] gap-4 flex">
          <Slider
            value={[parseFloat(inputValue)]}
            onValueChange={(value) => {
              setInputValue(formatWithMinimumOneDecimal(value[0]));
            }}
            step={step}
            max={option.Range?.Max ?? 2147483647}
            min={option.Range?.Min ?? -2147483648}
          />
          <div>
            <Input
              className={`w-[5.5rem] ${
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
              <div className="text-[0.6rem] w-[5.5rem] h-0 text-center text-muted-foreground">
                {option.Range?.Min} - {option.Range?.Max}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function StringOptionContent({ option }: { option: Option }) {
  const { modifiedOptions, modifyOption, options } = useRcon();

  const { t } = useTranslation();

  return (
    <div className="flex items-center">
      {option.DisabledValue !== undefined && (
        <div className="flex flex-col items-center min-w-24">
          <Switch
            id={option.FieldName + "-disabled"}
            checked={modifiedOptions[option.FieldName as keyof main.PzOptions] === option.DisabledValue}
            onCheckedChange={(value) => {
              modifyOption(
                option.FieldName as keyof main.PzOptions,
                value
                  ? (option.DisabledValue as string)
                  : options[option.FieldName as keyof main.PzOptions] === option.DisabledValue
                  ? ""
                  : options[option.FieldName as keyof main.PzOptions]
              );
            }}
          />
          <Label htmlFor={option.FieldName + "-disabled"} className="text-[0.65rem] text-muted-foreground h-0">
            {t(`options.${option.FieldName}.disabled`)}
          </Label>
        </div>
      )}
      <Input
        className="w-[20rem]"
        type="text"
        inputMode="text"
        placeholder={
          modifiedOptions[option.FieldName as keyof main.PzOptions] === option.DisabledValue
            ? t(`options.${option.FieldName}.disabled`)
            : ""
        }
        value={
          modifiedOptions[option.FieldName as keyof main.PzOptions] === option.DisabledValue
            ? ""
            : (modifiedOptions[option.FieldName as keyof main.PzOptions] as string)
        }
        onChange={(e) => {
          modifyOption(option.FieldName as keyof main.PzOptions, e.target.value);
        }}
        onKeyDown={(e) => e.key.match(/[\\"]/g) && e.preventDefault()}
        disabled={modifiedOptions[option.FieldName as keyof main.PzOptions] === option.DisabledValue}
      />
    </div>
  );
}

function TextOptionContent({ option }: { option: Option }) {
  const { modifiedOptions, modifyOption, options } = useRcon();

  const { t } = useTranslation();

  return (
    <div className="flex items-center">
      {option.DisabledValue !== undefined && (
        <div className="flex flex-col items-center min-w-24">
          <Switch
            checked={modifiedOptions[option.FieldName as keyof main.PzOptions] === option.DisabledValue}
            onCheckedChange={(value) => {
              modifyOption(
                option.FieldName as keyof main.PzOptions,
                value
                  ? (option.DisabledValue as string)
                  : options[option.FieldName as keyof main.PzOptions] === option.DisabledValue
                  ? ""
                  : (options[option.FieldName as keyof main.PzOptions] as string)
              );
            }}
          />
          <div className="text-xs text-muted-foreground h-0">{t(`options.${option.FieldName}.disabled`)}</div>
        </div>
      )}
      <Textarea
        className="w-[20rem] max-h-40"
        inputMode="text"
        placeholder={
          modifiedOptions[option.FieldName as keyof main.PzOptions] === option.DisabledValue
            ? t(`options.${option.FieldName}.disabled`)
            : ""
        }
        value={(modifiedOptions[option.FieldName as keyof main.PzOptions] === option.DisabledValue
          ? ""
          : (modifiedOptions[option.FieldName as keyof main.PzOptions] as string)
        ).replace(/\\n/g, "\n")}
        onChange={(e) => {
          modifyOption(option.FieldName as keyof main.PzOptions, e.target.value.replace(/\n/g, "\\n"));
        }}
        onKeyDown={(e) => e.key.match(/[\\"]/g) && e.preventDefault()}
        disabled={modifiedOptions[option.FieldName as keyof main.PzOptions] === option.DisabledValue}
        maxLength={965}
      />
    </div>
  );
}

function InformationOptionContent({ option }: { option: Option }) {
  const { modifiedOptions } = useRcon();

  return (
    <Input
      className="w-28 text-center"
      type="text"
      inputMode="none"
      readOnly={true}
      value={modifiedOptions[option.FieldName as keyof main.PzOptions] as string}
    />
  );
}

function ServerWelcomeMessageOptionContent({ option }: { option: Option }) {
  const { modifiedOptions, modifyOption } = useRcon();
  const { t } = useTranslation();

  const [isDialogOpen, setIsDialogOpen] = useState(false);

  return (
    <>
      <div className="flex gap-1.5 w-[20rem]">
        <Input
          type="text"
          inputMode="text"
          placeholder={
            modifiedOptions[option.FieldName as keyof main.PzOptions] === option.DisabledValue
              ? t(`options.${option.FieldName}.disabled`)
              : ""
          }
          value={
            modifiedOptions[option.FieldName as keyof main.PzOptions] === option.DisabledValue
              ? ""
              : (modifiedOptions[option.FieldName as keyof main.PzOptions] as string)
          }
          onChange={(e) => {
            modifyOption(option.FieldName as keyof main.PzOptions, e.target.value);
          }}
          onKeyDown={(e) => e.key.match(/[\\"]/g) && e.preventDefault()}
          disabled={modifiedOptions[option.FieldName as keyof main.PzOptions] === option.DisabledValue}
        />
        <Button size={"icon"} className="shrink-0" onClick={() => setIsDialogOpen(true)}>
          <Edit className="h-4 w-4" />
        </Button>
      </div>

      <SendMessageDialog
        onSaveEdit={(message) => modifyOption(option.FieldName as keyof main.PzOptions, message)}
        initialMessage={modifiedOptions[option.FieldName as keyof main.PzOptions] as string}
        mode="settings"
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
      />
    </>
  );
}

function SpawnItemsOptionContent({ option }: { option: Option }) {
  const { modifiedOptions, modifyOption } = useRcon();

  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const items = ((modifiedOptions[option.FieldName as keyof main.PzOptions] as string) || "").split(",");

  return (
    <>
      <div className="flex w-[20rem] gap-2">
        <ScrollArea className="w-full whitespace-nowrap mr-0">
          <div className="flex w-max space-x-0.5">
            {items.length > 0 && items[0] !== "" ? (
              items.map((item) => (
                <Tooltip>
                  <TooltipTrigger className="cursor-default">
                    <img key={item} src={`items/${item}_0.png`} alt={item} className="w-6 h-6 select-none" />
                  </TooltipTrigger>
                  <TooltipContent>{item}</TooltipContent>
                </Tooltip>
              ))
            ) : (
              <div className="items-center flex h-10 text-muted-foreground text-sm opacity-80 select-none">
                No items selected
              </div>
            )}
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>

        <Button size={"icon"} className="shrink-0" onClick={() => setIsDialogOpen(true)}>
          <Edit className="h-4 w-4" />
        </Button>
      </div>

      <AddItemDialog
        onSaveEdit={(items) => modifyOption(option.FieldName as keyof main.PzOptions, items)}
        initialItems={modifiedOptions[option.FieldName as keyof main.PzOptions] as string}
        mode="settings"
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
      />
    </>
  );
}

function ChoiceOptionContent({ option }: { option: Option }) {
  const { modifiedOptions, modifyOption } = useRcon();
  const { t } = useTranslation();

  return (
    <div>
      <ToggleGroup type="single" value={modifiedOptions[option.FieldName as keyof main.PzOptions] as any}>
        {option.Choices?.map(({ Name, Value }) => (
          <ToggleGroupItem
            key={Value as any}
            value={Value as any}
            onClick={() => {
              modifyOption(option.FieldName as keyof main.PzOptions, Value);
            }}
          >
            {t(`options.${option.FieldName}.choices.${Name}`)}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
    </div>
  );
}

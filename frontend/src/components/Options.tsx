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
import { Search } from "lucide-react";

export function OptionsTab() {
  const { t } = useTranslation();
  const { optionsModified, cancelModifiedOptions, updateOptions, updatingOptions, modifiedOptions, optionsInvalid } =
    useRcon();

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
            option.Keywords?.toLowerCase().includes(searchText.toLowerCase()) ||
            option.Type.toLowerCase() === searchText.toLowerCase() ||
            category.name.toLowerCase().includes(searchText.toLowerCase())
        ),
      };
    })
    .filter((category) => category.options.length > 0);

  return (
    <div className="w-full h-[calc(100vh-5.5rem)] dark:bg-black/20 bg-white/20 p-2 space-y-2">
      <Tabs value={tab}>
        <TabsList defaultValue={"General"} className="flex flex-wrap h-fit" ref={tabsRef}>
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
  } else if (option.Type === "String") {
    return <StringOptionContent option={option} />;
  } else if (option.Type === "Information") {
    return <InformationOptionContent option={option} />;
  }
}

function BoolOptionContent({ option }: { option: Option }) {
  const { modifiedOptions, modifyOption } = useRcon();

  return (
    <div className="w-[5.5rem] flex justify-center">
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
          <div className="text-xs text-muted-foreground h-0">{t(`options.${option.FieldName}.disabled`)}</div>
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
  const { modifiedOptions, modifyOption, optionsModified, options } = useRcon();

  const [inputValue, setInputValue] = useState(
    formatWithMinimumOneDecimal(modifiedOptions[option.FieldName as keyof main.PzOptions])
  );
  const floatInputValue = parseFloat(inputValue);

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

  return (
    <div className="flex items-center">
      {option.DisabledValue !== undefined && (
        <div className="flex flex-col items-center min-w-24">
          <Switch
            checked={modifiedOptions[option.FieldName as keyof main.PzOptions] === option.DisabledValue}
            onCheckedChange={(value) => {
              console.log(option.DisabledValue as number);
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
          <div className="text-xs text-muted-foreground h-0">{t(`options.${option.FieldName}.disabled`)}</div>
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

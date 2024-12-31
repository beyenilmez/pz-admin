import { options as optionsData } from "@/assets/options";
import { ScrollArea } from "./ui/scroll-area";
import { Tabs, TabsList, TabsTrigger } from "./ui/tabs";
import { useEffect, useRef, useState } from "react";
import { Button } from "./ui/button";

export function OptionsTab() {
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

      <ScrollArea className={`w-full pr-4`} ref={scrollAreaRef} style={{ height: scrollAreaHeight }}>
        {optionsData.categories.map((category) => (
          <div key={category.name} className="mb-4">
            <a
              className="text-2xl font-semibold mb-2"
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
            {category.options.map((option) => (
              <div key={option.FieldName} className="mb-2">
                <div className="text-sm font-medium">{option.FieldName}</div>
                <div className="text-sm">{option.Type}</div>
              </div>
            ))}
          </div>
        ))}
      </ScrollArea>

      <div className="h-12 flex justify-between mr-5">
        <Button>Reload Options</Button>
        <div className="flex gap-2">
          <Button>Save & Reload</Button>
          <Button>Save</Button>
          <Button variant={"destructive"}>Cancel</Button>
        </div>
      </div>
    </div>
  );
}

import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/contexts/theme-provider";

export default function ModeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => {
        const themeToSet = theme === "light" ? "dark" : "light";
        setTheme(themeToSet);
      }}
      className="bg-transparent hover:bg-transparent duration-0"
    >
      <Sun className="opacity-100 dark:opacity-0 transition-all duration-250 rotate-0 dark:rotate-180 w-6 h-6" />
      <Moon className="absolute opacity-0 dark:opacity-100 transition-all duration-250 -rotate-180 dark:rotate-0 w-6 h-6" />
      <span className="sr-only">Toggle theme</span>
    </Button>
  );
}

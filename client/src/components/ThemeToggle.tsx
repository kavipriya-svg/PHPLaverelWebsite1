import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/contexts/ThemeContext";

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <Button
      variant="ghost"
      size="sm"
      className="flex items-center gap-1.5"
      onClick={toggleTheme}
      data-testid="button-theme-toggle"
    >
      {theme === "dark" ? (
        <>
          <Sun className="h-5 w-5" />
          <span className="hidden md:inline text-sm">Light</span>
        </>
      ) : (
        <>
          <Moon className="h-5 w-5" />
          <span className="hidden md:inline text-sm">Dark</span>
        </>
      )}
    </Button>
  );
}

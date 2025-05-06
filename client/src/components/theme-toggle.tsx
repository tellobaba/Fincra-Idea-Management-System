import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/hooks/use-theme";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

interface ThemeToggleProps {
  showLabel?: boolean;
}

export function ThemeToggle({ showLabel = true }: ThemeToggleProps) {
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="flex items-center space-x-2">
      {showLabel && (
        <div className="flex items-center space-x-2">
          {theme === "light" ? (
            <Sun className="h-4 w-4 text-foreground" />
          ) : (
            <Moon className="h-4 w-4 text-foreground" />
          )}
          <Label htmlFor="theme-toggle" className="cursor-pointer">
            {theme === "light" ? "Light Mode" : "Dark Mode"}
          </Label>
        </div>
      )}
      <Switch
        id="theme-toggle"
        checked={theme === "dark"}
        onCheckedChange={toggleTheme}
        aria-label="Toggle dark mode"
      />
    </div>
  );
}

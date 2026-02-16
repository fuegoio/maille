import { Moon, Sun } from "lucide-react";

import { useTheme } from "@/stores/theme";

import { DropdownMenuItem } from "../ui/dropdown-menu";

export function ThemeSwitcher() {
  const theme = useTheme((state) => state.theme);
  const setTheme = useTheme((state) => state.setTheme);

  const systemTheme = window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";

  const currentTheme = theme === "system" ? systemTheme : theme;

  const switchTheme = () => {
    const newTheme = currentTheme === "light" ? "dark" : "light";
    setTheme(newTheme);
    document.documentElement.classList.remove("light", "dark");
    document.documentElement.classList.add(newTheme);
  };

  return (
    <DropdownMenuItem className="gap-2 px-3" onClick={() => switchTheme()}>
      {currentTheme === "light" ? <Moon /> : <Sun />}
      {currentTheme === "light" ? "Dark" : "Light"} mode
    </DropdownMenuItem>
  );
}

export function loadTheme() {
  const theme = useTheme.getState().theme;
  const systemTheme = window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
  const currentTheme = theme === "system" ? systemTheme : theme;
  document.documentElement.classList.add(currentTheme);
}

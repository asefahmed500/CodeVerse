import { Files, Search, Github, Settings, type LucideIcon } from "lucide-react";

export interface View {
  view: "explorer" | "search" | "github" | "settings";
  icon: LucideIcon;
  tooltip: string;
  label: string;
}

export const activityItems: readonly View[] = [
    { view: "explorer", icon: Files, tooltip: "Explorer (Ctrl+Shift+E)", label: "Explorer" },
    { view: "search", icon: Search, tooltip: "Search (Ctrl+Shift+F)", label: "Search" },
    { view: "github", icon: Github, tooltip: "Source Control (Ctrl+Shift+G)", label: "Source Control" },
] as const;

export const settingsItem: readonly View[] = [
    { view: "settings", icon: Settings, tooltip: "Settings (Ctrl+,)", label: "Settings" },
] as const;

export const allViews = [...activityItems, ...settingsItem];

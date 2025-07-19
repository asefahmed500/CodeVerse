'use client';

import { Files, Search, Github, Settings, Bug, type LucideIcon } from "lucide-react";

export interface View {
  view: "explorer" | "search" | "github" | "debug" | "settings";
  icon: LucideIcon;
  tooltip: string;
  label: string;
}

export const activityItems: readonly View[] = [
    { view: "explorer", icon: Files, tooltip: "Explorer (Ctrl+Shift+E)", label: "Explorer" },
    { view: "search", icon: Search, tooltip: "Search (Ctrl+Shift+F)", label: "Search" },
    { view: "github", icon: Github, tooltip: "Source Control (Ctrl+Shift+G)", label: "Source Control" },
    { view: "debug", icon: Bug, tooltip: "Run and Debug (Ctrl+Shift+D)", label: "Run and Debug" },
] as const;

export const settingsItem: readonly View[] = [
    { view: "settings", icon: Settings, tooltip: "Settings (Ctrl+,)", label: "Settings" },
] as const;

export const allViews = [...activityItems, ...settingsItem];

"use client";

import { useActiveView } from "@/hooks/use-active-view";
import { useCommandPaletteStore } from "@/hooks/use-command-palette-store";
import { usePanelStore } from "@/hooks/use-panel-store";
import { useSidebarStore } from "@/hooks/use-sidebar-store";
import { useEffect } from "react";

function toggleFullScreen() {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen().catch((err) => {
      console.error(
        `Error attempting to enable full-screen mode: ${err.message} (${err.name})`
      );
    });
  } else {
    if (document.exitFullscreen) {
      document.exitFullscreen();
    }
  }
}

export function KeyboardShortcuts() {
  const { toggle: toggleCommandPalette } = useCommandPaletteStore();
  const { activeView, setActiveView } = useActiveView();
  const { toggle: toggleSidebar } = useSidebarStore();
  const { toggle: togglePanel } = usePanelStore();

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      const isMac = navigator.platform.toUpperCase().indexOf("MAC") >= 0;
      const isCtrlCmd = isMac ? e.metaKey : e.ctrlKey;

      if (isCtrlCmd && e.shiftKey && e.key.toLowerCase() === "p") {
        e.preventDefault();
        toggleCommandPalette();
        return;
      }

      if (isCtrlCmd && !e.shiftKey && e.key.toLowerCase() === "p") {
        e.preventDefault();
        toggleCommandPalette();
        return;
      }

      if (isCtrlCmd && e.key === ",") {
        e.preventDefault();
        setActiveView("settings");
        return;
      }

      if (isCtrlCmd && e.key.toLowerCase() === "b") {
        e.preventDefault();
        toggleSidebar();
        return;
      }

      if (isCtrlCmd && e.key === "`") {
        e.preventDefault();
        // This shortcut simply toggles the 'terminal' view on/off.
        // The Panel component has a useEffect that will then show/hide the panel.
        setActiveView(activeView === "terminal" ? null : "terminal");
        return;
      }

      if (e.key === "F11") {
        e.preventDefault();
        toggleFullScreen();
        return;
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, [
    activeView,
    setActiveView,
    toggleCommandPalette,
    toggleSidebar,
    togglePanel,
  ]);

  return null;
}

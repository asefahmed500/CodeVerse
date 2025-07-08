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
  const { activeView, setActiveView, openView } = useActiveView();
  const { toggle: toggleSidebar } = useSidebarStore();
  const { toggle: togglePanel } = usePanelStore();

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      const isMac = navigator.platform.toUpperCase().indexOf("MAC") >= 0;
      const isCtrlCmd = isMac ? e.metaKey : e.ctrlKey;

      // Command Palette
      if (isCtrlCmd && e.shiftKey && e.key.toLowerCase() === "p") {
        e.preventDefault();
        toggleCommandPalette();
        return;
      }

      // Quick Open (also opens command palette for now)
      if (isCtrlCmd && !e.shiftKey && e.key.toLowerCase() === "p") {
        e.preventDefault();
        toggleCommandPalette();
        return;
      }

      // Toggle Debug View
      if (isCtrlCmd && e.shiftKey && e.key.toLowerCase() === "d") {
        e.preventDefault();
        setActiveView('debug');
        return;
      }
      
      // Open Settings
      if (isCtrlCmd && e.key === ",") {
        e.preventDefault();
        openView("settings");
        return;
      }

      // Toggle Sidebar
      if (isCtrlCmd && e.key.toLowerCase() === "b") {
        e.preventDefault();
        toggleSidebar();
        return;
      }

      // Toggle Terminal
      if (isCtrlCmd && e.key === "`") {
        e.preventDefault();
        setActiveView(activeView === "terminal" ? null : "terminal");
        return;
      }

      // Toggle Full Screen
      const isF11 = e.key === "F11";
      const isMacFullScreen = isCtrlCmd && isMac && e.key.toLowerCase() === 'f';

      if (isF11 || isMacFullScreen) {
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
    openView,
    toggleCommandPalette,
    toggleSidebar,
    togglePanel,
  ]);

  return null;
}

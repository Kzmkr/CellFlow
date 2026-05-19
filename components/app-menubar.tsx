"use client";

import { PlayIcon } from "lucide-react";
import { useEffect } from "react";
import { useTheme } from "next-themes";

import { Button } from "@/components/ui/button";
import {
  Menubar,
  MenubarCheckboxItem,
  MenubarContent,
  MenubarItem,
  MenubarMenu,
  MenubarSeparator,
  MenubarShortcut,
  MenubarSub,
  MenubarSubContent,
  MenubarSubTrigger,
  MenubarTrigger,
} from "@/components/ui/menubar";

type AppMenubarProps = {
  showNodes: boolean;
  showProperties: boolean;
  showTable: boolean;
  onNewTab: () => void;
  onUndo?: () => void;
  onRedo?: () => void;
  onCut?: () => void;
  onCopy?: () => void;
  onPaste?: () => void;
  onTogglePanel: (
    panel: "nodes" | "properties" | "table",
    value: boolean,
  ) => void;
};

export function AppMenubar({
  showNodes,
  showProperties,
  showTable,
  onNewTab,
  onUndo,
  onRedo,
  onCut,
  onCopy,
  onPaste,
  onTogglePanel,
}: AppMenubarProps) {
  const { resolvedTheme, setTheme } = useTheme();

  function handleRun() {
    window.dispatchEvent(new CustomEvent("pipeline:run"));
  }

  function toggleFullscreen() {
    if (typeof document == "undefined") return;

    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    } else {
      document.documentElement.requestFullscreen().catch(() => {});
    }
  }

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      const target = e.target as HTMLElement | null;
      const isEditable =
        target?.isContentEditable ||
        target?.tagName === "INPUT" ||
        target?.tagName === "TEXTAREA" ||
        target?.tagName === "SELECT";

      if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() == "t") {
        e.preventDefault();
        onNewTab();
        return;
      }

      if (isEditable) {
        return;
      }

      const isModifierKey = e.ctrlKey || e.metaKey;
      if (isModifierKey && !e.altKey) {
        const key = e.key.toLowerCase();

        if (key === "z") {
          e.preventDefault();
          if (e.shiftKey) {
            onRedo?.();
          } else {
            onUndo?.();
          }
          return;
        }

        if (key === "y") {
          e.preventDefault();
          onRedo?.();
          return;
        }

        if (!e.shiftKey) {
          if (key === "x") {
            e.preventDefault();
            onCut?.();
            return;
          }
          if (key === "c") {
            e.preventDefault();
            onCopy?.();
            return;
          }
          if (key === "v") {
            e.preventDefault();
            onPaste?.();
            return;
          }
        }
      }

      if (e.key == "F11") {
        e.preventDefault();
        toggleFullscreen();
      }
    }
    document.addEventListener("keydown", onKeyDown, { capture: true });
    return () =>
      document.removeEventListener("keydown", onKeyDown, { capture: true });
  }, [onNewTab, onUndo, onRedo, onCut, onCopy, onPaste]);

  return (
    <div className="shrink-0 bg-muted/30">
      <div className="flex items-center gap-2 border-b px-2">
        <Menubar className="flex-1 rounded-none border-0">
          <MenubarMenu>
            <MenubarTrigger>File</MenubarTrigger>
            <MenubarContent>
              <MenubarItem onSelect={onNewTab}>
                New Tab <MenubarShortcut>Ctrl+Shift+T</MenubarShortcut>
              </MenubarItem>
              <MenubarSeparator />
              <MenubarItem onSelect={handleRun}>
                Run <MenubarShortcut>Ctrl+Enter</MenubarShortcut>
              </MenubarItem>
            </MenubarContent>
          </MenubarMenu>
          <MenubarMenu>
            <MenubarTrigger>Edit</MenubarTrigger>
            <MenubarContent>
              <MenubarItem onSelect={onUndo}>
                Undo <MenubarShortcut>Ctrl+Z</MenubarShortcut>
              </MenubarItem>
              <MenubarItem onSelect={onRedo}>
                Redo <MenubarShortcut>Ctrl+Y</MenubarShortcut>
              </MenubarItem>
              <MenubarSeparator />
              <MenubarItem onSelect={onCut}>
                Cut <MenubarShortcut>Ctrl+X</MenubarShortcut>
              </MenubarItem>
              <MenubarItem onSelect={onCopy}>
                Copy <MenubarShortcut>Ctrl+C</MenubarShortcut>
              </MenubarItem>
              <MenubarItem onSelect={onPaste}>
                Paste <MenubarShortcut>Ctrl+V</MenubarShortcut>
              </MenubarItem>
            </MenubarContent>
          </MenubarMenu>

          <MenubarMenu>
            <MenubarTrigger>View</MenubarTrigger>
            <MenubarContent>
              <MenubarCheckboxItem
                checked={showProperties}
                onCheckedChange={(val) => {
                  onTogglePanel("properties", Boolean(val));
                }}
              >
                Properties
              </MenubarCheckboxItem>

              <MenubarCheckboxItem
                checked={showNodes}
                onCheckedChange={(val) => {
                  onTogglePanel("nodes", Boolean(val));
                }}
              >
                Nodes
              </MenubarCheckboxItem>

              <MenubarCheckboxItem
                checked={showTable}
                onCheckedChange={(val) => {
                  onTogglePanel("table", Boolean(val));
                }}
              >
                Table
              </MenubarCheckboxItem>

              <MenubarSeparator />

              <MenubarCheckboxItem
                checked={resolvedTheme == "dark"}
                onCheckedChange={(val) => {
                  setTheme(Boolean(val) ? "dark" : "light");
                }}
              >
                Dark Mode <MenubarShortcut>D</MenubarShortcut>
              </MenubarCheckboxItem>

              <MenubarItem onClick={toggleFullscreen}>
                Toggle Fullscreen <MenubarShortcut>F11</MenubarShortcut>
              </MenubarItem>
            </MenubarContent>
          </MenubarMenu>

          <MenubarMenu>
            <MenubarTrigger>Help</MenubarTrigger>
            <MenubarContent>
              <MenubarItem>Documentation</MenubarItem>
              <MenubarSeparator />
              <MenubarItem>About</MenubarItem>
            </MenubarContent>
          </MenubarMenu>
        </Menubar>

        <Button asChild size="sm" variant="outline" aria-label="Sign in">
          <a href="/login">Sign In</a>
        </Button>

        <Button size="sm" onClick={handleRun}>
          <PlayIcon data-icon="inline-start" />
          Run
        </Button>
      </div>
    </div>
  );
}

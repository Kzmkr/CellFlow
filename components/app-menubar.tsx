"use client";

import { PlayIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Menubar,
  MenubarContent,
  MenubarItem,
  MenubarMenu,
  MenubarSeparator,
  MenubarShortcut,
  MenubarSub,
  MenubarSubContent,
  MenubarSubTrigger,
  MenubarTrigger,
  MenubarCheckboxItem,
  MenubarRadioGroup,
  MenubarRadioItem,
} from "@/components/ui/menubar";
import { useEffect, useState } from "react";
import { useTheme } from "next-themes";

export function AppMenubar() {
  const [showNodes, setShowNodes] = useState(true);
  const [showProperties, setShowProperties] = useState(true);
  const [showTable, setShowTable] = useState(true);
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
      if (e.key == "F11") {
        e.preventDefault();
        toggleFullscreen();
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  });

  function dispatchToggle(
    panel: "nodes" | "properties" | "table",
    value: boolean,
  ) {
    window.dispatchEvent(
      new CustomEvent("ui:toggle-panel", { detail: { panel, value } }),
    );
  }

  return (
    <div className="shrink-0 bg-muted/30">
      <div className="flex items-center gap-2 border-b px-2">
        <Menubar className="flex-1 rounded-none border-0">
          <MenubarMenu>
            <MenubarTrigger>File</MenubarTrigger>
            <MenubarContent>
              <MenubarItem>
                New Tab <MenubarShortcut>Ctrl+T</MenubarShortcut>
              </MenubarItem>
              <MenubarItem>
                New Window <MenubarShortcut>Ctrl+N</MenubarShortcut>
              </MenubarItem>
              <MenubarSeparator />
              <MenubarItem onSelect={handleRun}>
                Run <MenubarShortcut>Ctrl+Enter</MenubarShortcut>
              </MenubarItem>
              <MenubarSeparator />
              <MenubarSub>
                <MenubarSubTrigger>Share</MenubarSubTrigger>
                <MenubarSubContent>
                  <MenubarItem>Email Link</MenubarItem>
                  <MenubarItem>Messages</MenubarItem>
                  <MenubarItem>Notes</MenubarItem>
                </MenubarSubContent>
              </MenubarSub>
              <MenubarSeparator />
              <MenubarItem>
                Print <MenubarShortcut>Ctrl+P</MenubarShortcut>
              </MenubarItem>
            </MenubarContent>
          </MenubarMenu>
          <MenubarMenu>
            <MenubarTrigger>Edit</MenubarTrigger>
            <MenubarContent>
              <MenubarItem>
                Undo <MenubarShortcut>Ctrl+Z</MenubarShortcut>
              </MenubarItem>
              <MenubarItem>
                Redo <MenubarShortcut>Ctrl+Y</MenubarShortcut>
              </MenubarItem>
              <MenubarSeparator />
              <MenubarItem>
                Cut <MenubarShortcut>Ctrl+X</MenubarShortcut>
              </MenubarItem>
              <MenubarItem>
                Copy <MenubarShortcut>Ctrl+C</MenubarShortcut>
              </MenubarItem>
              <MenubarItem>
                Paste <MenubarShortcut>Ctrl+V</MenubarShortcut>
              </MenubarItem>
              <MenubarSeparator />
              <MenubarItem>
                Select All <MenubarShortcut>Ctrl+A</MenubarShortcut>
              </MenubarItem>
            </MenubarContent>
          </MenubarMenu>

          <MenubarMenu>
            <MenubarTrigger>View</MenubarTrigger>
            <MenubarContent>
              <MenubarCheckboxItem
                checked={showProperties}
                onCheckedChange={(val) => {
                  const checked = Boolean(val);
                  setShowProperties(checked);
                  dispatchToggle("properties", checked);
                }}
              >
                Properties
              </MenubarCheckboxItem>

              <MenubarCheckboxItem
                checked={showNodes}
                onCheckedChange={(val) => {
                  const checked = Boolean(val);
                  setShowNodes(checked);
                  dispatchToggle("nodes", checked);
                }}
              >
                Nodes
              </MenubarCheckboxItem>

              <MenubarCheckboxItem
                checked={showTable}
                onCheckedChange={(val) => {
                  const checked = Boolean(val);
                  setShowTable(checked);
                  dispatchToggle("table", checked);
                }}
              >
                Table
              </MenubarCheckboxItem>

              <MenubarSeparator />

              <MenubarCheckboxItem
                checked={resolvedTheme == "dark"}
                onCheckedChange={(val) => {
                  const checked = Boolean(val);
                  setTheme(checked ? "dark" : "light");
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
              <MenubarItem>Release Notes</MenubarItem>
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

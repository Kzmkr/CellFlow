import { Routes, Route } from "react-router-dom"
import { useEffect, useState } from "react"
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from "@/components/ui/resizable"
import { DataTable } from "@/components/data-table"
import { AppMenubar } from "@/components/app-menubar"
import { ActionGrid } from "@/components/action-grid"
import { PropertiesPanel } from "@/components/properties-panel"
import Flow from "@/components/flow"
import LoginPage from "@/pages/login"

function EditorLayout() {
  const [showNodes, setShowNodes] = useState(true)
  const [showProperties, setShowProperties] = useState(true)
  const [showTable, setShowTable] = useState(true)

  useEffect(() => {
    function onToggle(e: Event) {
      const ev = e as CustomEvent<{ panel: string; value: boolean }>
      const { panel, value } = ev.detail ?? {}
      if (panel === "nodes") setShowNodes(Boolean(value))
      else if (panel === "properties") setShowProperties(Boolean(value))
      else if (panel === "table") setShowTable(Boolean(value))
    }
    window.addEventListener("ui:toggle-panel", onToggle as EventListener)
    return () =>
      window.removeEventListener("ui:toggle-panel", onToggle as EventListener)
  }, [])

  const bottomVisible = showNodes || showTable

  return (
    <ResizablePanelGroup direction="vertical" className="min-h-screen w-full">
      <ResizablePanel defaultSize={70} minSize={3}>
        <ResizablePanelGroup direction="horizontal" className="h-full">
          <ResizablePanel defaultSize={80} minSize={10}>
            <div className="flex h-full flex-col">
              <AppMenubar />
              <div className="flex-1 min-h-0">
                <Flow />
              </div>
            </div>
          </ResizablePanel>

          {showProperties && <ResizableHandle withHandle />}
          {showProperties && (
            <ResizablePanel minSize={10}>
              <PropertiesPanel />
            </ResizablePanel>
          )}
        </ResizablePanelGroup>
      </ResizablePanel>

      {bottomVisible && <ResizableHandle withHandle />}
      {bottomVisible && (
        <ResizablePanel minSize={3}>
          <ResizablePanelGroup direction="horizontal" className="h-full">
            {showNodes && (
              <ResizablePanel defaultSize={20} minSize={10}>
                <ActionGrid />
              </ResizablePanel>
            )}

            {showNodes && showTable && <ResizableHandle withHandle />}

            {showTable && (
              <ResizablePanel minSize={10}>
                <DataTable />
              </ResizablePanel>
            )}
          </ResizablePanelGroup>
        </ResizablePanel>
      )}
    </ResizablePanelGroup>
  )
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/*" element={<EditorLayout />} />
    </Routes>
  )
}

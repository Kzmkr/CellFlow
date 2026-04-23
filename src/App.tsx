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

export default function App() {
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
          <ResizableHandle withHandle />

          <ResizablePanel minSize={10}>
            <PropertiesPanel />
          </ResizablePanel>
          
        </ResizablePanelGroup>
      </ResizablePanel>

      <ResizableHandle withHandle />
      <ResizablePanel  minSize={3}>
        <ResizablePanelGroup direction="horizontal" className="h-full">
          <ResizablePanel defaultSize={20} minSize={10}>
            <ActionGrid />
          </ResizablePanel>
          <ResizableHandle withHandle />
          <ResizablePanel  minSize={10}>
            <DataTable />
          </ResizablePanel>
        </ResizablePanelGroup>
      </ResizablePanel>

    </ResizablePanelGroup>
  )
}

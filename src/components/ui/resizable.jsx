import * as React from "react"
import {
  Panel,
  Group,
  Separator as ResizableSeparator,
  Handle,
  PanelResizeHandle,
} from "react-resizable-panels"
import { cn } from "@/lib/utils.js"

const ResizablePanelGroup = ({
  className,
  ...props
}) => (
  <Group
    className={cn(
      "flex h-full w-full data-[panel-group-direction=vertical]:flex-col",
      className
    )}
    {...props}
  />
)

const ResizablePanel = Panel

const ResizableHandle = ({
  withHandle,
  className,
  ...props
}) => (
  <PanelResizeHandle
    className={cn(
      "relative flex w-1.5 items-center justify-center bg-gradient-to-b from-transparent via-gold/20 to-transparent after:absolute after:inset-y-0 after:left-1/2 after:w-1 after:-translate-x-1/2 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-gold/60 focus-visible:ring-offset-1 data-[panel-group-direction=vertical]:h-1.5 data-[panel-group-direction=vertical]:w-full data-[panel-group-direction=vertical]:after:left-0 data-[panel-group-direction=vertical]:after:h-1 data-[panel-group-direction=vertical]:after:w-full data-[panel-group-direction=vertical]:after:-translate-y-1/2 data-[panel-group-direction=vertical]:after:translate-x-0 [&[data-panel-group-direction=vertical]>div]:rotate-90 transition-colors hover:bg-gradient-to-b hover:from-transparent hover:via-gold/40 hover:to-transparent",
      className
    )}
    {...props}
  >
    {withHandle && (
      <div className="z-10 flex h-6 w-4 items-center justify-center rounded-md border border-gold/30 bg-background shadow-sm">
        <div className="space-y-0.5">
          <div className="h-0.5 w-1.5 rounded-full gold-gradient" />
          <div className="h-0.5 w-1.5 rounded-full gold-gradient" />
          <div className="h-0.5 w-1.5 rounded-full gold-gradient" />
        </div>
      </div>
    )}
  </PanelResizeHandle>
)

export { ResizablePanelGroup, ResizablePanel, ResizableHandle }

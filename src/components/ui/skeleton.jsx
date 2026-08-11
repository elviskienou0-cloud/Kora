import { cn } from "@/lib/utils.js"

function Skeleton({ className, ...props }) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-md bg-gradient-to-r from-muted via-muted/60 to-muted shimmer-bg",
        className
      )}
      {...props}
    />
  )
}

export { Skeleton }

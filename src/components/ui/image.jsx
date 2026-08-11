import * as React from "react"
import { cn } from "@/lib/utils.js"

const Image = React.forwardRef(
  ({ src, alt, className, fallback, ...props }, ref) => {
    const [hasError, setHasError] = React.useState(false)
    const [isLoaded, setIsLoaded] = React.useState(false)

    return (
      <div className={cn("relative overflow-hidden", className)} ref={ref}>
        {!isLoaded && !hasError && (
          <div className="absolute inset-0 shimmer-bg rounded-md" />
        )}
        {!hasError ? (
          <img
            src={src}
            alt={alt || ""}
            onError={() => setHasError(true)}
            onLoad={() => setIsLoaded(true)}
            className={cn(
              "h-full w-full object-cover transition-opacity duration-500",
              isLoaded ? "opacity-100" : "opacity-0"
            )}
            {...props}
          />
        ) : (
          <div
            className={cn(
              "flex h-full w-full items-center justify-center gold-gradient text-foreground/70",
              className
            )}
          >
            {fallback || (
              <svg
                className="h-1/2 w-1/2 opacity-50"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
                <circle cx="9" cy="9" r="2" />
                <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
              </svg>
            )}
          </div>
        )}
      </div>
    )
  }
)
Image.displayName = "Image"

export { Image }

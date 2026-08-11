import * as React from "react"
import { cva } from "class-variance-authority"
import { cn } from "@/lib/utils.js"

const alertVariants = cva(
  "relative w-full rounded-xl border p-4 [&>svg~*]:pl-7 [&>svg+div]:translate-y-[-3px] [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4 [&>svg]:text-foreground transition-all duration-200",
  {
    variants: {
      variant: {
        default:
          "bg-background text-foreground border-gold/20 shadow-sm hover:shadow-md hover:border-gold/30",
        destructive:
          "border-destructive/50 text-destructive dark:border-destructive/50 [&>svg]:text-destructive bg-destructive/5",
        success:
          "border-emerald-500/30 text-emerald-700 dark:text-emerald-400 [&>svg]:text-emerald-500 bg-emerald-500/10",
        warning:
          "border-amber-500/30 text-amber-700 dark:text-amber-400 [&>svg]:text-amber-500 bg-amber-500/10",
        gold:
          "border-gold/40 text-foreground [&>svg]:text-gold bg-gradient-to-br from-gold-light/20 via-gold/10 to-gold-dark/15 shadow-lg shadow-gold/10",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

const Alert = React.forwardRef(
  ({ className, variant, ...props }, ref) => (
    <div
      ref={ref}
      role="alert"
      className={cn(alertVariants({ variant }), className)}
      {...props}
    />
  )
)
Alert.displayName = "Alert"

const AlertTitle = React.forwardRef(
  ({ className, ...props }, ref) => (
    <h5
      ref={ref}
      className={cn("mb-1 text-sm font-semibold leading-none tracking-tight", className)}
      {...props}
    />
  )
)
AlertTitle.displayName = "AlertTitle"

const AlertDescription = React.forwardRef(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("text-sm opacity-90 [&_p]:leading-relaxed", className)}
      {...props}
    />
  )
)
AlertDescription.displayName = "AlertDescription"

export { Alert, AlertTitle, AlertDescription, alertVariants }

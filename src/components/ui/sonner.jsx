import { Toaster as Sonner } from "sonner"
import { cn } from "@/lib/utils.js"

type ToasterProps = React.ComponentProps<typeof Sonner>

const Toaster = ({ className, ...props }: ToasterProps) => {
  return (
    <Sonner
      theme="light"
      className={cn("toaster group", className)}
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-popover/95 group-[.toaster]:text-foreground group-[.toaster]:border-gold/20 group-[.toaster]:shadow-xl group-[.toaster]:shadow-gold/10 group-[.toaster]:rounded-xl group-[.toaster]:backdrop-blur-md",
          description: "group-[.toast]:text-muted-foreground",
          actionButton:
            "group-[.toast]:gold-gradient group-[.toast]:text-foreground group-[.toast]:rounded-lg group-[.toast]:font-medium",
          cancelButton:
            "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground group-[.toast]:rounded-lg group-[.toast]:font-medium group-[.toast]:hover:bg-gold/10",
          icon: "group-[.toast]:text-gold",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }

import * as React from "react"
import { cva } from "class-variance-authority"
import { cn } from "@/lib/utils"

const progressVariants = cva(
  "relative h-4 w-full overflow-hidden rounded-full bg-secondary",
  {
    variants: {
      variant: {
        default: "bg-primary",
        destructive: "bg-destructive",
        warning: "bg-yellow-500",
        success: "bg-green-500",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

interface ProgressProps
  extends React.HTMLAttributes<HTMLDivElement> {
  value?: number
  variant?: "default" | "destructive" | "warning" | "success"
}

const Progress = React.forwardRef<HTMLDivElement, ProgressProps>(
  ({ className, value = 0, variant, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "relative h-4 w-full overflow-hidden rounded-full bg-secondary",
          progressVariants({ variant: variant || "default" })
        )}
        {...props}
      >
        <div
          className={cn(
            "h-full transition-all duration-300 ease-in-out",
            progressVariants({ variant: variant || "default" })
          )}
          style={{ width: `${Math.min(Math.max(value, 0), 100)}%` }}
        />
      </div>
    )
  }
)
Progress.displayName = "Progress"

export { Progress, progressVariants }
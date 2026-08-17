import { cn } from "@/lib/utils"

function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      className={cn(
        "animate-pulse rounded-[2px] bg-border/50 dark:bg-border/30",
        className
      )}
      {...props}
    />
  )
}

export { Skeleton }

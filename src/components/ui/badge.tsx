import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Slot } from "radix-ui"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "group/badge inline-flex h-5 w-fit shrink-0 items-center justify-center gap-1 overflow-hidden border border-transparent px-2.5 py-0.5 font-mono text-[11px] font-bold uppercase tracking-[0.08em] whitespace-nowrap transition-all focus-visible:ring-[3px] focus-visible:ring-[rgba(202,255,77,0.4)] [&>svg]:pointer-events-none [&>svg]:size-3!",
  {
    variants: {
      variant: {
        default:
          "rounded-full bg-accent-bright text-[#18180F] border-transparent",
        secondary:
          "rounded-full bg-accent text-white border-transparent",
        destructive:
          "rounded-full bg-destructive/10 text-destructive border-destructive/25",
        outline:
          "rounded-full border-border-strong text-ink",
        ghost:
          "rounded-full hover:bg-canvas hover:text-ink-muted",
        link: "text-accent underline-offset-4 hover:underline",
        /* Meridian Status Badges */
        published:
          "rounded-full bg-success/12 text-success border-success/25",
        draft:
          "rounded-full bg-warning/10 text-warning border-warning/25",
        archived:
          "rounded-full bg-transparent text-ink-faint border-border",
        api:
          "rounded-[2px] bg-sidebar text-accent-bright border-transparent font-mono text-[11px] font-medium",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function Badge({
  className,
  variant = "default",
  asChild = false,
  ...props
}: React.ComponentProps<"span"> &
  VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot.Root : "span"

  return (
    <Comp
      data-slot="badge"
      data-variant={variant}
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  )
}

export { Badge, badgeVariants }

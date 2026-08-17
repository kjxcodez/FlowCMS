import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Slot } from "radix-ui"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center rounded-[2px] border border-transparent bg-clip-padding text-[13px] font-medium uppercase tracking-[0.04em] whitespace-nowrap transition-all outline-none select-none focus-visible:ring-[3px] focus-visible:ring-[rgba(202,255,77,0.4)] active:not-aria-[haspopup]:translate-y-px disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4 cursor-pointer",
  {
    variants: {
      variant: {
        default:
          "bg-accent-bright text-[#18180F] border-transparent hover:bg-[#D6FF6A] active:bg-accent-dim active:text-white shadow-sm",
        outline:
          "border-border-strong bg-transparent text-ink hover:border-accent hover:text-accent dark:border-border-strong dark:hover:border-accent dark:hover:text-accent",
        secondary:
          "bg-accent text-white hover:bg-accent/80 active:bg-accent-dim",
        ghost:
          "hover:bg-black/5 hover:text-ink dark:hover:bg-white/5 dark:hover:text-ink",
        destructive:
          "bg-transparent text-destructive border border-destructive/40 hover:bg-destructive/8 dark:hover:bg-destructive/15",
        link: "text-accent underline-offset-4 hover:underline tracking-normal normal-case font-normal",
      },
      size: {
        default: "h-9 gap-1.5 px-4",
        xs: "h-6 gap-1 px-2 text-[11px]",
        sm: "h-8 gap-1 px-3 text-[12px]",
        lg: "h-10 gap-1.5 px-5",
        icon: "size-9",
        "icon-xs": "size-6 [&_svg:not([class*='size-'])]:size-3",
        "icon-sm": "size-8",
        "icon-lg": "size-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot.Root : "button"

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }

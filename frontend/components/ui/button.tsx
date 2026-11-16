"use client";

import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

// API aliases preserve Main callers; presentation follows GMP CTA421-431.
const buttonVariants = cva("gmp-button", {
  variants: {
    variant: {
      default: "",
      destructive: "destructive",
      outline: "secondary",
      secondary: "secondary",
      ghost: "ghost",
      link: "link",
      premium: "",
      success: "",
      glass: "secondary",
    },
    size: {
      default: "",
      sm: "small",
      lg: "large",
      xl: "large",
      icon: "icon",
      "icon-sm": "icon",
      "icon-lg": "icon icon-large",
    },
  },
  defaultVariants: { variant: "default", size: "default" },
});

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  loading?: boolean;
}

function preventActivation(event: React.SyntheticEvent) {
  event.preventDefault();
  event.stopPropagation();
}

// A disabled slotted NextLink cannot retain href: the document navigation
// controller may observe that href before the component's click handler.
function inertSlotChild(children: React.ReactNode) {
  if (!React.isValidElement<React.HTMLAttributes<HTMLElement>>(children))
    return children;
  const attrs = Object.fromEntries(
    Object.entries(children.props).filter(
      ([key]) =>
        ["id", "title", "className", "style", "lang", "dir"].includes(key) ||
        key.startsWith("aria-") ||
        key.startsWith("data-"),
    ),
  );
  return (
    <span
      {...attrs}
      role={
        children.props.role ?? (children.type === "button" ? "button" : "link")
      }
      tabIndex={-1}
      aria-disabled="true"
    >
      {children.props.children}
    </span>
  );
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant,
      size,
      asChild = false,
      loading = false,
      children,
      disabled,
      ...props
    },
    ref,
  ) => {
    const inactive = Boolean(disabled || loading);
    const onKeyDownCapture: React.KeyboardEventHandler<HTMLButtonElement> = (
      event,
    ) => {
      if (inactive && (event.key === "Enter" || event.key === " ")) {
        preventActivation(event);
        return;
      }
      props.onKeyDownCapture?.(event);
    };
    const common = {
      ...props,
      ref,
      className: cn(buttonVariants({ variant, size }), className),
      "aria-disabled": inactive ? true : props["aria-disabled"],
      "aria-busy": loading ? true : props["aria-busy"],
      onClick: inactive ? preventActivation : props.onClick,
      onClickCapture: inactive ? preventActivation : props.onClickCapture,
      onKeyDownCapture,
    };
    if (asChild)
      return (
        <Slot {...common}>
          {inactive ? inertSlotChild(children) : children}
        </Slot>
      );
    return (
      <button {...common} disabled={inactive}>
        {children}
      </button>
    );
  },
);
Button.displayName = "Button";
export { Button, buttonVariants };

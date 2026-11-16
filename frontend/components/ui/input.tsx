import * as React from "react";
import { cn } from "@/lib/utils";

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, error, leftIcon, rightIcon, ...props }, ref) => (
    <div className="gmp-input-wrap">
      {leftIcon && <div className="gmp-input-icon left">{leftIcon}</div>}
      <input
        {...props}
        ref={ref}
        type={type}
        aria-invalid={error ? true : props["aria-invalid"]}
        className={cn(
          "gmp-input",
          leftIcon && "has-left-icon",
          rightIcon && "has-right-icon",
          className,
        )}
      />
      {rightIcon && <div className="gmp-input-icon right">{rightIcon}</div>}
    </div>
  ),
);
Input.displayName = "Input";

const SearchInput = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, ...props }, ref) => (
    <Input
      type="search"
      ref={ref}
      className={className}
      leftIcon={
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
          fill="currentColor"
          aria-hidden="true"
          width="16"
          height="16"
        >
          <path
            fillRule="evenodd"
            d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z"
            clipRule="evenodd"
          />
        </svg>
      }
      {...props}
    />
  ),
);
SearchInput.displayName = "SearchInput";
export { Input, SearchInput };

import * as React from "react";
import { Button, ButtonProps } from "./button";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

export interface LoadingButtonProps extends ButtonProps {
  isLoading?: boolean;
  loadingText?: string;
  showSpinner?: boolean;
}

/**
 * Button component with built-in loading state management.
 *
 * Features:
 * - Automatically disables when loading
 * - Shows spinner and optional loading text
 * - Prevents duplicate clicks during async operations
 *
 * @example
 * <LoadingButton
 *   isLoading={isSubmitting}
 *   loadingText="Saving..."
 *   onClick={handleSave}
 * >
 *   Save
 * </LoadingButton>
 */
const LoadingButton = React.forwardRef<HTMLButtonElement, LoadingButtonProps>(
  ({
    children,
    isLoading = false,
    loadingText,
    showSpinner = true,
    disabled,
    className,
    ...props
  }, ref) => {
    return (
      <Button
        ref={ref}
        disabled={isLoading || disabled}
        className={cn(className)}
        {...props}
      >
        {isLoading ? (
          <div className="flex items-center space-x-2">
            {showSpinner && (
              <Loader2 className="h-4 w-4 animate-spin" />
            )}
            <span>{loadingText || children}</span>
          </div>
        ) : (
          children
        )}
      </Button>
    );
  }
);

LoadingButton.displayName = "LoadingButton";

export { LoadingButton };

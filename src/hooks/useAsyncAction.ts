import { useState, useCallback } from 'react';
import { toast } from './use-toast';

export interface AsyncActionOptions {
  onSuccess?: (data?: any) => void;
  onError?: (error: Error) => void;
  successMessage?: string;
  errorMessage?: string;
  loadingMessage?: string;
  showSuccessToast?: boolean;
  showErrorToast?: boolean;
}

/**
 * Centralized hook for managing async actions with loading states and user feedback.
 *
 * Features:
 * - Automatic loading state management
 * - Optional toast notifications
 * - Error handling
 * - Button locking during action execution
 *
 * @example
 * const { execute, isLoading } = useAsyncAction(
 *   async () => await apiService.doSomething(),
 *   {
 *     successMessage: "Action completed!",
 *     errorMessage: "Failed to complete action"
 *   }
 * );
 */
export const useAsyncAction = <T = any, Args extends any[] = any[]>(
  asyncFn: (...args: Args) => Promise<T>,
  options: AsyncActionOptions = {}
) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [data, setData] = useState<T | null>(null);

  const {
    onSuccess,
    onError,
    successMessage,
    errorMessage,
    loadingMessage,
    showSuccessToast = true,
    showErrorToast = true,
  } = options;

  const execute = useCallback(
    async (...args: Args) => {
      setIsLoading(true);
      setError(null);

      // Show loading message if provided
      if (loadingMessage) {
        toast({
          title: loadingMessage,
          description: "Please wait...",
        });
      }

      try {
        const result = await asyncFn(...args);
        setData(result);

        // Show success toast if enabled
        if (showSuccessToast && successMessage) {
          toast({
            title: successMessage,
            description: "Operation completed successfully",
          });
        }

        // Call success callback
        if (onSuccess) {
          onSuccess(result);
        }

        return result;
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        setError(error);

        // Show error toast if enabled
        if (showErrorToast) {
          toast({
            title: errorMessage || "Action failed",
            description: error.message,
            variant: "destructive",
          });
        }

        // Call error callback
        if (onError) {
          onError(error);
        }

        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [asyncFn, onSuccess, onError, successMessage, errorMessage, loadingMessage, showSuccessToast, showErrorToast]
  );

  return {
    execute,
    isLoading,
    error,
    data,
    reset: () => {
      setIsLoading(false);
      setError(null);
      setData(null);
    },
  };
};

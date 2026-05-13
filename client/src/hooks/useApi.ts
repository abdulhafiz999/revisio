import { useState, useCallback } from 'react';
import { AxiosError } from 'axios';

interface ApiErrorResponse {
  success: false;
  error: string;
  timestamp: string;
}

interface UseApiState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

interface UseApiReturn<T, Args extends any[]> {
  data: T | null;
  loading: boolean;
  error: string | null;
  execute: (...args: Args) => Promise<T | null>;
  reset: () => void;
}

/**
 * Custom hook for managing API call states (loading, error, data)
 * 
 * @param apiFunction - The API function to call
 * @returns Object containing data, loading, error states and execute function
 * 
 * @example
 * const { data, loading, error, execute } = useApi(apiClient.getCourses);
 * 
 * useEffect(() => {
 *   execute();
 * }, []);
 */
export function useApi<T, Args extends any[] = []>(
  apiFunction: (...args: Args) => Promise<T>
): UseApiReturn<T, Args> {
  const [state, setState] = useState<UseApiState<T>>({
    data: null,
    loading: false,
    error: null,
  });

  const execute = useCallback(
    async (...args: Args): Promise<T | null> => {
      setState({ data: null, loading: true, error: null });

      try {
        const result = await apiFunction(...args);
        setState({ data: result, loading: false, error: null });
        return result;
      } catch (err) {
        const errorMessage = getErrorMessage(err);
        setState({ data: null, loading: false, error: errorMessage });
        return null;
      }
    },
    [apiFunction]
  );

  const reset = useCallback(() => {
    setState({ data: null, loading: false, error: null });
  }, []);

  return {
    data: state.data,
    loading: state.loading,
    error: state.error,
    execute,
    reset,
  };
}

/**
 * Extract user-friendly error message from various error types
 */
function getErrorMessage(error: unknown): string {
  // Handle Axios errors
  if (error && typeof error === 'object' && 'isAxiosError' in error) {
    const axiosError = error as AxiosError<ApiErrorResponse>;

    // Network errors
    if (axiosError.code === 'ERR_NETWORK') {
      return 'Network error. Please check your internet connection and try again.';
    }

    // Timeout errors
    if (axiosError.code === 'ECONNABORTED') {
      return 'Request timeout. The server took too long to respond.';
    }

    // Server returned an error response
    if (axiosError.response) {
      const status = axiosError.response.status;
      const data = axiosError.response.data;

      // Use server error message if available
      if (data && typeof data === 'object' && 'error' in data) {
        return data.error;
      }

      // Fallback to status-based messages
      switch (status) {
        case 400:
          return 'Invalid request. Please check your input and try again.';
        case 401:
          return 'Authentication required. Please log in.';
        case 403:
          return 'Access denied. You do not have permission to perform this action.';
        case 404:
          return 'Resource not found.';
        case 409:
          return 'Conflict. This resource already exists.';
        case 413:
          return 'File too large. Please upload a smaller file.';
        case 429:
          return 'Too many requests. Please wait a moment and try again.';
        case 500:
          return 'Server error. Please try again later.';
        case 503:
          return 'Service temporarily unavailable. Please try again later.';
        default:
          return `An error occurred (${status}). Please try again.`;
      }
    }

    // Request was made but no response received
    return 'No response from server. Please try again.';
  }

  // Handle standard Error objects
  if (error instanceof Error) {
    return error.message;
  }

  // Handle string errors
  if (typeof error === 'string') {
    return error;
  }

  // Fallback for unknown error types
  return 'An unexpected error occurred. Please try again.';
}

/**
 * Hook variant that automatically executes on mount
 * 
 * @param apiFunction - The API function to call
 * @param args - Arguments to pass to the API function
 * @returns Object containing data, loading, error states and refetch function
 * 
 * @example
 * const { data, loading, error, refetch } = useApiQuery(apiClient.getCourses);
 */
export function useApiQuery<T, Args extends any[] = []>(
  apiFunction: (...args: Args) => Promise<T>,
  ...args: Args
): Omit<UseApiReturn<T, Args>, 'execute'> & { refetch: () => Promise<T | null> } {
  const { data, loading, error, execute, reset } = useApi(apiFunction);
  const [hasExecuted, setHasExecuted] = useState(false);

  // Execute on mount
  if (!hasExecuted && !loading) {
    setHasExecuted(true);
    execute(...args);
  }

  const refetch = useCallback(() => {
    return execute(...args);
  }, [execute, ...args]);

  return {
    data,
    loading,
    error,
    refetch,
    reset,
  };
}

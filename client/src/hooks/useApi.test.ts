import { describe, it, expect, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useApi, useApiQuery } from './useApi';
import { AxiosError } from 'axios';

describe('useApi Hook', () => {
  it('should initialize with default state', () => {
    const mockApiFunction = vi.fn();
    const { result } = renderHook(() => useApi(mockApiFunction));

    expect(result.current.data).toBeNull();
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('should set loading state when executing', async () => {
    const mockApiFunction = vi.fn(() => new Promise((resolve) => setTimeout(() => resolve('data'), 100)));
    const { result } = renderHook(() => useApi(mockApiFunction));

    result.current.execute();

    await waitFor(() => {
      expect(result.current.loading).toBe(true);
    });
  });

  it('should set data on successful execution', async () => {
    const mockData = { id: '1', name: 'Test' };
    const mockApiFunction = vi.fn(() => Promise.resolve(mockData));
    const { result } = renderHook(() => useApi(mockApiFunction));

    await result.current.execute();

    await waitFor(() => {
      expect(result.current.data).toEqual(mockData);
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBeNull();
    });
  });

  it('should set error on failed execution', async () => {
    const mockError = new Error('Test error');
    const mockApiFunction = vi.fn(() => Promise.reject(mockError));
    const { result } = renderHook(() => useApi(mockApiFunction));

    await result.current.execute();

    await waitFor(() => {
      expect(result.current.data).toBeNull();
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBe('Test error');
    });
  });

  it('should handle network errors', async () => {
    const mockError: Partial<AxiosError> = {
      isAxiosError: true,
      code: 'ERR_NETWORK',
      message: 'Network Error',
      name: 'AxiosError',
    };
    const mockApiFunction = vi.fn(() => Promise.reject(mockError));
    const { result } = renderHook(() => useApi(mockApiFunction));

    await result.current.execute();

    await waitFor(() => {
      expect(result.current.error).toBe('Network error. Please check your internet connection and try again.');
    });
  });

  it('should handle 401 errors', async () => {
    const mockError: Partial<AxiosError> = {
      isAxiosError: true,
      response: {
        status: 401,
        data: { success: false, error: 'Unauthorized', timestamp: '2024-01-01' },
        statusText: 'Unauthorized',
        headers: {},
        config: {} as any,
      },
      message: 'Request failed with status code 401',
      name: 'AxiosError',
    };
    const mockApiFunction = vi.fn(() => Promise.reject(mockError));
    const { result } = renderHook(() => useApi(mockApiFunction));

    await result.current.execute();

    await waitFor(() => {
      expect(result.current.error).toBe('Unauthorized');
    });
  });

  it('should handle 404 errors', async () => {
    const mockError: Partial<AxiosError> = {
      isAxiosError: true,
      response: {
        status: 404,
        data: {},
        statusText: 'Not Found',
        headers: {},
        config: {} as any,
      },
      message: 'Request failed with status code 404',
      name: 'AxiosError',
    };
    const mockApiFunction = vi.fn(() => Promise.reject(mockError));
    const { result } = renderHook(() => useApi(mockApiFunction));

    await result.current.execute();

    await waitFor(() => {
      expect(result.current.error).toBe('Resource not found.');
    });
  });

  it('should reset state', async () => {
    const mockData = { id: '1', name: 'Test' };
    const mockApiFunction = vi.fn(() => Promise.resolve(mockData));
    const { result } = renderHook(() => useApi(mockApiFunction));

    await result.current.execute();

    await waitFor(() => {
      expect(result.current.data).toEqual(mockData);
    });

    result.current.reset();

    await waitFor(() => {
      expect(result.current.data).toBeNull();
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBeNull();
    });
  });

  it('should pass arguments to api function', async () => {
    const mockApiFunction = vi.fn((id: string) => Promise.resolve({ id, name: 'Test' }));
    const { result } = renderHook(() => useApi(mockApiFunction));

    await result.current.execute('123');

    await waitFor(() => {
      expect(mockApiFunction).toHaveBeenCalledWith('123');
      expect(result.current.data).toEqual({ id: '123', name: 'Test' });
    });
  });
});

describe('useApiQuery Hook', () => {
  it('should execute on mount', async () => {
    const mockData = { id: '1', name: 'Test' };
    const mockApiFunction = vi.fn(() => Promise.resolve(mockData));
    const { result } = renderHook(() => useApiQuery(mockApiFunction));

    await waitFor(() => {
      expect(mockApiFunction).toHaveBeenCalled();
      expect(result.current.data).toEqual(mockData);
    });
  });

  it('should refetch data', async () => {
    const mockData = { id: '1', name: 'Test' };
    const mockApiFunction = vi.fn(() => Promise.resolve(mockData));
    const { result } = renderHook(() => useApiQuery(mockApiFunction));

    await waitFor(() => {
      expect(result.current.data).toEqual(mockData);
    });

    // Clear the mock to verify refetch calls it again
    mockApiFunction.mockClear();

    await result.current.refetch();

    await waitFor(() => {
      expect(mockApiFunction).toHaveBeenCalled();
    });
  });
});

import { renderHook, act } from '@testing-library/react';
import { useSSE } from '../../lib/useSSE';

/* eslint-disable @typescript-eslint/no-explicit-any */

describe('useSSE', () => {
  let mockEventSource: any;

  beforeEach(() => {
    jest.clearAllMocks();

    mockEventSource = {
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
      readyState: 1,
      url: '',
      withCredentials: false,
      close: jest.fn(),
      onerror: null,
      onmessage: null,
      onopen: null,
    };

    (global as any).EventSource = jest.fn().mockImplementation(() => mockEventSource);
  });

  it('connects to SSE endpoint', () => {
    renderHook(() => useSSE({}));

    expect((global as any).EventSource).toHaveBeenCalledWith('/api/events');
  });

  it('handles bookmark_created event', () => {
    const onBookmarkCreated = jest.fn();
    renderHook(() => useSSE({ onBookmarkCreated }));

    act(() => {
      mockEventSource.onmessage!({
        data: JSON.stringify({
          type: 'bookmark_created',
          data: { id: 1, title: 'Test Bookmark' },
        }),
      } as any);
    });

    expect(onBookmarkCreated).toHaveBeenCalledWith({ id: 1, title: 'Test Bookmark' });
  });

  it('handles bookmark_updated event', () => {
    const onBookmarkUpdated = jest.fn();
    renderHook(() => useSSE({ onBookmarkUpdated }));

    act(() => {
      mockEventSource.onmessage!({
        data: JSON.stringify({
          type: 'bookmark_updated',
          data: { id: 1, title: 'Updated Bookmark' },
        }),
      } as any);
    });

    expect(onBookmarkUpdated).toHaveBeenCalledWith({ id: 1, title: 'Updated Bookmark' });
  });

  it('handles bookmark_deleted event', () => {
    const onBookmarkDeleted = jest.fn();
    renderHook(() => useSSE({ onBookmarkDeleted }));

    act(() => {
      mockEventSource.onmessage!({
        data: JSON.stringify({
          type: 'bookmark_deleted',
          data: { id: 1 },
        }),
      } as any);
    });

    expect(onBookmarkDeleted).toHaveBeenCalledWith({ id: 1 });
  });

  it('handles category events', () => {
    const onCategoryCreated = jest.fn();
    const onCategoryUpdated = jest.fn();
    const onCategoryDeleted = jest.fn();

    renderHook(() =>
      useSSE({
        onCategoryCreated,
        onCategoryUpdated,
        onCategoryDeleted,
      })
    );

    act(() => {
      mockEventSource.onmessage!({
        data: JSON.stringify({
          type: 'category_created',
          data: { id: 1, name: 'Test Category' },
        }),
      } as any);
    });
    expect(onCategoryCreated).toHaveBeenCalledWith({ id: 1, name: 'Test Category' });

    act(() => {
      mockEventSource.onmessage!({
        data: JSON.stringify({
          type: 'category_updated',
          data: { id: 1, name: 'Updated Category' },
        }),
      } as any);
    });
    expect(onCategoryUpdated).toHaveBeenCalledWith({ id: 1, name: 'Updated Category' });

    act(() => {
      mockEventSource.onmessage!({
        data: JSON.stringify({
          type: 'category_deleted',
          data: { id: 1 },
        }),
      } as any);
    });
    expect(onCategoryDeleted).toHaveBeenCalledWith({ id: 1 });
  });

  it('handles unknown event types', () => {
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
    renderHook(() => useSSE({}));

    act(() => {
      mockEventSource.onmessage!({
        data: JSON.stringify({
          type: 'unknown_event',
          data: { some: 'data' },
        }),
      } as any);
    });

    expect(consoleSpy).toHaveBeenCalledWith('Unknown SSE event:', 'unknown_event', { some: 'data' });
    consoleSpy.mockRestore();
  });

  it('handles malformed JSON', () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
    renderHook(() => useSSE({}));

    act(() => {
      mockEventSource.onmessage!({
        data: 'invalid json',
      } as any);
    });

    expect(consoleSpy).toHaveBeenCalledWith('Error parsing SSE message:', expect.any(SyntaxError));
    consoleSpy.mockRestore();
  });

  it('cleans up on unmount', () => {
    const { unmount } = renderHook(() => useSSE({}));

    unmount();

    expect(mockEventSource.close).toHaveBeenCalled();
  });

  it('returns connection utilities', () => {
    const { result } = renderHook(() => useSSE({}));

    expect(result.current).toHaveProperty('isConnected');
    expect(result.current).toHaveProperty('close');
    expect(typeof result.current.close).toBe('function');
  });

  it('allows manual closing', () => {
    const { result } = renderHook(() => useSSE({}));

    act(() => {
      result.current.close();
    });

    expect(mockEventSource.close).toHaveBeenCalled();
  });
});
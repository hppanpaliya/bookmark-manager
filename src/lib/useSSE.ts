'use client';

import { useEffect, useRef, useCallback } from 'react';
import { Bookmark, Category } from '@/types';

interface SSEEvent {
  type: string;
  data: unknown;
}

interface UseSSEOptions {
  onBookmarkCreated?: (bookmark: Bookmark) => void;
  onBookmarkUpdated?: (bookmark: Bookmark) => void;
  onBookmarkDeleted?: (data: { id: number }) => void;
  onCategoryCreated?: (category: Category) => void;
  onCategoryUpdated?: (category: Category) => void;
  onCategoryDeleted?: (data: { id: number }) => void;
}

export function useSSE(options: UseSSEOptions) {
  const eventSourceRef = useRef<EventSource | null>(null);
  const optionsRef = useRef(options);

  // Update options ref when options change
  useEffect(() => {
    optionsRef.current = options;
  }, [options]);

  const handleMessage = useCallback((event: MessageEvent) => {
    try {
      const { type, data }: SSEEvent = JSON.parse(event.data);
      const currentOptions = optionsRef.current;

      switch (type) {
        case 'bookmark_created':
          currentOptions.onBookmarkCreated?.(data);
          break;
        case 'bookmark_updated':
          currentOptions.onBookmarkUpdated?.(data);
          break;
        case 'bookmark_deleted':
          currentOptions.onBookmarkDeleted?.(data);
          break;
        case 'category_created':
          currentOptions.onCategoryCreated?.(data);
          break;
        case 'category_updated':
          currentOptions.onCategoryUpdated?.(data);
          break;
        case 'category_deleted':
          currentOptions.onCategoryDeleted?.(data);
          break;
        case 'connected':
          console.log('SSE connected:', data.message);
          break;
        default:
          console.log('Unknown SSE event:', type, data);
      }
    } catch (error) {
      console.error('Error parsing SSE message:', error);
    }
  }, []);

  useEffect(() => {
    // Only run on client side
    if (typeof window === 'undefined') return;

    // Create EventSource connection
    eventSourceRef.current = new EventSource('/api/events');

    eventSourceRef.current.onmessage = handleMessage;

    eventSourceRef.current.onerror = (error) => {
      console.error('SSE connection error:', error);
    };

    eventSourceRef.current.onopen = () => {
      console.log('SSE connection opened');
    };

    // Cleanup on unmount
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
    };
  }, [handleMessage]);

  return {
    isConnected: typeof window !== 'undefined' && eventSourceRef.current?.readyState === 1,
    close: () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
    }
  };
}
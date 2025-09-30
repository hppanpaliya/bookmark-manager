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
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const maxReconnectAttempts = 5;
  const reconnectDelay = 1000; // Start with 1 second

  // Update options ref when options change
  useEffect(() => {
    optionsRef.current = options;
  }, [options]);

  const handleMessage = useCallback((event: MessageEvent) => {
    try {
      const parsed = JSON.parse(event.data) as SSEEvent;
      const { type, data } = parsed;
      const currentOptions = optionsRef.current;

      switch (type) {
        case 'bookmark_created':
          currentOptions.onBookmarkCreated?.(data as Bookmark);
          break;
        case 'bookmark_updated':
          currentOptions.onBookmarkUpdated?.(data as Bookmark);
          break;
        case 'bookmark_deleted':
          currentOptions.onBookmarkDeleted?.(data as { id: number });
          break;
        case 'category_created':
          currentOptions.onCategoryCreated?.(data as Category);
          break;
        case 'category_updated':
          currentOptions.onCategoryUpdated?.(data as Category);
          break;
        case 'category_deleted':
          currentOptions.onCategoryDeleted?.(data as { id: number });
          break;
        case 'connected':
          console.log('SSE connected:', (data as { message: string }).message);
          reconnectAttemptsRef.current = 0; // Reset on successful connection
          break;
        default:
          console.log('Unknown SSE event:', type, data);
      }
    } catch (error) {
      console.error('Error parsing SSE message:', error);
    }
  }, []);

  const connect = useCallback(() => {
    // Only run on client side
    if (typeof window === 'undefined') return;

    // Close existing connection
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }

    // Create EventSource connection
    eventSourceRef.current = new EventSource('/api/events');

    eventSourceRef.current.onmessage = handleMessage;

    eventSourceRef.current.onerror = (error) => {
      console.error('SSE connection error:', error);
      
      // Attempt to reconnect if under max attempts
      if (reconnectAttemptsRef.current < maxReconnectAttempts) {
        reconnectAttemptsRef.current++;
        const delay = reconnectDelay * Math.pow(2, reconnectAttemptsRef.current - 1); // Exponential backoff
        
        console.log(`Attempting to reconnect SSE in ${delay}ms (attempt ${reconnectAttemptsRef.current}/${maxReconnectAttempts})`);
        
        reconnectTimeoutRef.current = setTimeout(() => {
          connect();
        }, delay);
      } else {
        console.error('Max SSE reconnection attempts reached');
      }
    };

    eventSourceRef.current.onopen = () => {
      console.log('SSE connection opened');
      reconnectAttemptsRef.current = 0; // Reset on successful connection
    };
  }, [handleMessage]);

  useEffect(() => {
    connect();

    // Cleanup on unmount
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
    };
  }, [connect]);

  return {
    isConnected: typeof window !== 'undefined' && eventSourceRef.current?.readyState === 1,
    close: () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
    }
  };
}
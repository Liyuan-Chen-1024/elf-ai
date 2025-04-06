import { useEffect, useRef } from 'react';
import { Message } from '../../../../types';

/**
 * Hook for handling UI-specific concerns related to messages
 * like scroll management, size adjustments, etc.
 * 
 * This implementation uses more browser-compatible scroll behavior
 * with smoother animations and proper throttling.
 */
export function useMessageUI(messages: Message[] = []) {
  const messageEndRef = useRef<HTMLDivElement | null>(null);
  const conversationIdRef = useRef<string | null>(null);
  // Handle potential undefined/empty messages array gracefully
  const currentConversationId = messages && messages.length > 0 ? messages[0]?.conversationId : null;
  
  // Throttle scroll to prevent too many scrolls in quick succession
  const scrollTimeoutRef = useRef<number | null>(null);
  
  // Cross-browser smooth scroll function
  const smoothScrollToBottom = (instant = false) => {
    if (!messageEndRef.current) return;
    
    // Clear any pending scrolls
    if (scrollTimeoutRef.current) {
      window.clearTimeout(scrollTimeoutRef.current);
    }
    
    // Schedule scroll
    scrollTimeoutRef.current = window.setTimeout(() => {
      const element = messageEndRef.current;
      if (!element) return;

      try {
        // Try the standard smooth scroll first
        element.scrollIntoView({ 
          behavior: instant ? 'auto' : 'smooth',
          block: 'end'
        });
      } catch (e) {
        // Fallback for older browsers
        const parent = element.parentElement;
        if (parent) {
          parent.scrollTop = parent.scrollHeight;
        }
      }
    }, 10);
  };
  
  // Auto-scroll to bottom when conversation changes
  useEffect(() => {
    // Only run if we have a valid conversation ID
    if (currentConversationId && conversationIdRef.current !== currentConversationId) {
      conversationIdRef.current = currentConversationId;
      smoothScrollToBottom(true); // Instant scroll when conversation changes
    }
    
    // Clean up any pending timeouts
    return () => {
      if (scrollTimeoutRef.current) {
        window.clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, [currentConversationId]);

  // Auto-scroll when new messages arrive
  useEffect(() => {
    // Only scroll if we have messages 
    if (messages && messages.length > 0) {
      smoothScrollToBottom();
    }
    
    // Clean up any pending timeouts
    return () => {
      if (scrollTimeoutRef.current) {
        window.clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, [messages ? messages.length : 0]); // Safely access length

  // Handler for when the scrollable container is rendered
  const handleScrollableRef = (container: HTMLDivElement) => {
    messageEndRef.current = container;
  };

  return {
    messageEndRef,
    handleScrollableRef
  };
} 
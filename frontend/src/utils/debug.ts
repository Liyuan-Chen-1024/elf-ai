/**
 * Debugging utility functions
 */

/* global console */

type ElfAIDebug = {
  checkApiConfig: () => boolean;
  clearAuth: () => void;
  getAuthToken: () => string | null;
  checkToken: () => boolean;
};

declare global {
  interface Window {
    __elfai_debug: ElfAIDebug;
  }
}

/**
 * Log messages only in development mode
 */
export const debug = {
  log: (...args: Parameters<typeof console.log>) => {
    if (import.meta.env.DEV) {
      window.console.log('[ElfAI]', ...args);
    }
  },
  error: (...args: Parameters<typeof console.error>) => {
    if (import.meta.env.DEV) {
      window.console.error('[ElfAI]', ...args);
    }
  },
  warn: (...args: Parameters<typeof console.warn>) => {
    if (import.meta.env.DEV) {
      window.console.warn('[ElfAI]', ...args);
    }
  },
  info: (...args: Parameters<typeof console.info>) => {
    if (import.meta.env.DEV) {
      window.console.info('[ElfAI]', ...args);
    }
  },
};

/**
 * Check if API is configured correctly
 */
export const checkApiConfig = () => {
  const apiUrl = import.meta.env.VITE_API_URL;
  
  debug.log('API configuration:', {
    apiUrl,
    development: import.meta.env.DEV,
    production: import.meta.env.PROD,
  });
  
  if (!apiUrl) {
    debug.error(
      'API URL is not configured. Make sure you have a .env file with VITE_API_URL=http://yourapiurl'
    );
  }
  
  return !!apiUrl;
};

/**
 * Initialize debugging tools
 */
export const initDebug = () => {
  if (import.meta.env.DEV) {
    debug.log('Initializing debug tools');
    checkApiConfig();
    
    // Add listener for localStorage changes to detect token issues
    const originalSetItem = window.localStorage.setItem;
    window.localStorage.setItem = function(key, value) {
      if (key === 'authToken') {
        debug.log(`Auth token being set: ${value.substring(0, 5)}...`);
      }
      originalSetItem.call(this, key, value);
    };
    
    const originalRemoveItem = window.localStorage.removeItem;
    window.localStorage.removeItem = function(key) {
      if (key === 'authToken') {
        debug.log(`Auth token being removed. Current URL: ${window.location.pathname}`);
        console.trace('Auth token removal stack trace');
      }
      originalRemoveItem.call(this, key);
    };
    
    // Add global debug object for console access
    window.__elfai_debug = {
      checkApiConfig,
      clearAuth: () => {
        window.localStorage.removeItem('authToken');
        debug.log('Auth token cleared');
      },
      getAuthToken: () => {
        return window.localStorage.getItem('authToken');
      },
      checkToken: () => {
        const token = window.localStorage.getItem('authToken');
        if (token) {
          debug.log(`Auth token exists: ${token.substring(0, 5)}...`);
          return true;
        } else {
          debug.log('No auth token found');
          return false;
        }
      }
    };
    
    debug.log('Debug tools initialized. Use window.__elfai_debug to access them');
  }
};

export default debug; 
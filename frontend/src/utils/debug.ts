/**
 * Debugging utility functions
 */

/**
 * Log messages only in development mode
 */
export const debug = {
  log: (...args: any[]) => {
    if (import.meta.env.DEV) {
      window.console.log('[ElfAI]', ...args);
    }
  },
  error: (...args: any[]) => {
    if (import.meta.env.DEV) {
      window.console.error('[ElfAI]', ...args);
    }
  },
  warn: (...args: any[]) => {
    if (import.meta.env.DEV) {
      window.console.warn('[ElfAI]', ...args);
    }
  },
  info: (...args: any[]) => {
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
    
    // Add global debug object for console access
    (window as any).__elfai_debug = {
      checkApiConfig,
      clearAuth: () => {
        window.localStorage.removeItem('authToken');
        debug.log('Auth token cleared');
      },
      getAuthToken: () => {
        return window.localStorage.getItem('authToken');
      },
    };
    
    debug.log('Debug tools initialized. Use window.__elfai_debug to access them');
  }
};

export default debug; 
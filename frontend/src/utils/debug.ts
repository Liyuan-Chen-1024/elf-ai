/**
 * Debugging utility functions
 */

import api from '../services/fetchClient';

type ElfAIDebug = {
  checkApiConfig: () => boolean;
  clearAuth: () => void;
  getAuthToken: () => string | null;
  checkToken: () => boolean;
  testCSRF: () => Promise<string | null>;
  testLogin: (username: string, password: string) => Promise<unknown>;
  verifyTokenFormat: () => boolean;
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
    window.localStorage.setItem = function (key, value) {
      if (key === 'authToken') {
        debug.log(`Auth token being set: ${value.substring(0, 5)}...`);
      }
      originalSetItem.call(this, key, value);
    };

    const originalRemoveItem = window.localStorage.removeItem;
    window.localStorage.removeItem = function (key) {
      if (key === 'authToken') {
        debug.log(`Auth token being removed. Current URL: ${window.location.pathname}`);
        window.console.trace('Auth token removal stack trace');
      }
      originalRemoveItem.call(this, key);
    };

    // Add CSRF testing tools
    const testCSRF = async (): Promise<string | null> => {
      window.console.log('Fetching CSRF token...');
      try {
        await api.initialize();
        const token =
          document.cookie
            .split('; ')
            .find(row => row.startsWith('csrftoken='))
            ?.split('=')[1] || null;

        window.console.log('CSRF token:', token ? `${token.substring(0, 5)}...` : 'Not found');
        window.console.log('Full cookies:', document.cookie);
        return token;
      } catch (error) {
        window.console.error('CSRF fetch error:', error);
        return null;
      }
    };

    // Replace 'any' with more specific type
    type TestLoginFn = (username: string, password: string) => Promise<unknown>;

    // Use window.fetch instead of fetch
    const testLogin: TestLoginFn = async (username, password) => {
      try {
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
        const response = await window.fetch(`${apiUrl}/api/v1/auth/login/`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ username, password }),
          credentials: 'include',
        });
        return await response.json();
      } catch (error) {
        return { error };
      }
    };

    // Get auth token properly
    const getAuthToken = () => window.localStorage.getItem('authToken');

    // Use window.fetch instead of fetch
    const verifyTokenFormat = () => {
      const token = window.localStorage.getItem('authToken');
      if (!token) {
        window.console.error('No auth token found in localStorage');
        return false;
      }

      window.console.log('Auth token found:', token.substring(0, 10) + '...');
      window.console.log('Auth token length:', token.length);

      // Test an API request with the token
      window.console.log('Testing API request with the token...');
      window
        .fetch('http://localhost:8000/api/v1/auth/profile/', {
          method: 'GET',
          headers: {
            Authorization: `Token ${token}`,
          },
          credentials: 'include',
        })
        .then(response => {
          window.console.log('Auth test response status:', response.status);
          if (response.ok) {
            window.console.log('Auth token is valid! ✅');
            return response.json();
          } else {
            window.console.error('Auth token is invalid or expired ❌');
            return response.json().catch(() => ({}));
          }
        })
        .then(data => {
          window.console.log('Auth test response data:', data);
        })
        .catch(error => {
          window.console.error('Auth test error:', error);
        });

      return true;
    };

    // Add global debug object for console access
    window.__elfai_debug = {
      checkApiConfig,
      clearAuth: () => {
        window.localStorage.removeItem('authToken');
        debug.log('Auth token cleared');
      },
      getAuthToken,
      checkToken: () => {
        const token = window.localStorage.getItem('authToken');
        if (token) {
          debug.log(`Auth token exists: ${token.substring(0, 5)}...`);
          return true;
        } else {
          debug.log('No auth token found');
          return false;
        }
      },
      testCSRF,
      testLogin,
      verifyTokenFormat,
    };

    debug.log('Debug tools initialized. Use window.__elfai_debug to access them');
  }
};

export default debug;

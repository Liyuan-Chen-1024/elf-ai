// Simplified auth store for now - will integrate with full implementation later
interface AuthState {
  token: string | null;
  user: Record<string, unknown> | null;
  isAuthenticated: boolean;
}

// Simple store getter
export const useAuthStore = {
  getState: (): AuthState => {
    // Get token from localStorage
    const token = window.localStorage.getItem('authToken');
    
    // Try to get user data
    let user = null;
    try {
      const userJson = window.localStorage.getItem('user');
      if (userJson) {
        user = JSON.parse(userJson);
      }
    } catch (_error) {
      // Silently fail if we can't parse the user data
      window.console.error('Failed to parse user data from localStorage');
    }
    
    return {
      token,
      user,
      isAuthenticated: !!token
    };
  },
  
  // Store setter
  setState: (state: Partial<AuthState>) => {
    if (state.token !== undefined) {
      if (state.token === null) {
        window.localStorage.removeItem('authToken');
      } else {
        window.localStorage.setItem('authToken', state.token);
      }
    }
    
    if (state.user !== undefined) {
      if (state.user === null) {
        window.localStorage.removeItem('user');
      } else {
        window.localStorage.setItem('user', JSON.stringify(state.user));
      }
    }
  }
}; 
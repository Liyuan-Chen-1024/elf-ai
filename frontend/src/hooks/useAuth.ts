import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { authApi, AuthResponse } from '../services/authApi';
import { ApiError } from '../services/fetchClient';
import { useAuthStore } from '../stores/authStore';

export const AUTH_QUERY_KEYS = {
  user: ['user'],
  session: ['session'],
};

export function useAuth() {
  const queryClient = useQueryClient();
  const token = useAuthStore(state => state.token);
  const setToken = useAuthStore(state => state.setToken);
  const logoutStore = useAuthStore(state => state.logout);

  // Fetch current user
  const {
    data: user,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: AUTH_QUERY_KEYS.user,
    queryFn: async () => {
      if (import.meta.env.DEV) {
        console.log('🔑 Auth token:', token ? 'present' : 'missing');
      }

      if (!token) {
        return null;
      }

      try {
        const userData = await authApi.getCurrentUser();
        if (import.meta.env.DEV) {
          console.log('👤 User data loaded:', userData);
        }
        return userData;
      } catch (err) {
        if (import.meta.env.DEV) {
          console.error('❌ Failed to load user data:', err);
        }
        // If we get a rate limit error (429), don't throw - just return the cached data
        if (err instanceof ApiError && err.status === 429) {
          // Return previous data or null
          const previousData = queryClient.getQueryData(AUTH_QUERY_KEYS.user);
          return previousData || null;
        }
        throw err;
      }
    },
    retry: (failureCount: number, error: Error) => {
      // Don't retry on 429 errors
      if (error instanceof ApiError && error.status === 429) {
        return false;
      }
      // Only retry a few times for other errors
      return failureCount < 2;
    },
    staleTime: 1000 * 60 * 60, // 60 minutes - greatly increased to reduce API calls
    gcTime: 1000 * 60 * 120, // 120 minutes for cache
    enabled: !!token,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
    retryDelay: (attemptIndex: number) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  // Login mutation
  const loginMutation = useMutation({
    mutationFn: async (credentials: { username: string; password: string }) => {
      // Always initialize the API to get a fresh CSRF token before login
      await authApi.initialize();
      return authApi.login(credentials);
    },
    onSuccess: (data: AuthResponse) => {
      if (import.meta.env.DEV) {
        console.log('Login successful:', data);
      }

      // Extract token from different possible formats
      let newToken = null;
      if (data.token) {
        newToken = data.token;
      } else if ('key' in data) {
        newToken = (data as unknown as { key: string }).key;
      }

      if (newToken) {
        // Store token in store (handles localStorage)
        setToken(newToken);

        if (import.meta.env.DEV) {
          console.log('Stored auth token after login:', newToken.substring(0, 5) + '...');
        }
      } else {
        console.error('No token found in login response', data);
      }

      // Update current user query
      queryClient.setQueryData(AUTH_QUERY_KEYS.user, data.user);

      // Force a refetch of the user data to ensure everything is up to date
      refetch();

      // Invalidate queries that might depend on auth status
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
    onError: (error: ApiError) => {
      if (import.meta.env.DEV) {
        console.error('Login error details:', {
          message: error.message,
          status: error.status,
          data: error.data,
        });
      }
    },
  });

  // Logout mutation
  const logoutMutation = useMutation({
    mutationFn: authApi.logout,
    onSuccess: () => {
      // Clear user data
      queryClient.setQueryData(AUTH_QUERY_KEYS.user, null);
      // Clear all queries when logging out
      queryClient.clear();
      // Clear store
      logoutStore();
    },
  });

  return {
    user,
    isAuthenticated: !!user,
    isLoading,
    error,
    login: loginMutation.mutate,
    logout: logoutMutation.mutate,
    isLoginLoading: loginMutation.isPending,
    isLogoutLoading: logoutMutation.isPending,
    loginError: loginMutation.error,
    logoutError: logoutMutation.error,
    refetchUser: refetch,
  };
}

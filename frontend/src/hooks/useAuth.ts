import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { authApi, AuthResponse } from '../services/api';
import { AxiosError } from 'axios';

export const AUTH_QUERY_KEYS = {
  user: ['user'],
  session: ['session'],
};

export function useAuth() {
  const queryClient = useQueryClient();

  // Fetch current user
  const { 
    data: user,
    isLoading,
    error,
    refetch 
  } = useQuery({
    queryKey: AUTH_QUERY_KEYS.user,
    queryFn: async () => {
      const token = window.localStorage.getItem('authToken');
      if (import.meta.env.DEV) {
        window.console.log('🔑 Auth token:', token ? 'present' : 'missing');
      }
      
      if (!token) {
        return null;
      }
      
      try {
        const userData = await authApi.getCurrentUser();
        if (import.meta.env.DEV) {
          window.console.log('👤 User data loaded:', userData);
        }
        return userData;
      } catch (err) {
        if (import.meta.env.DEV) {
          window.console.error('❌ Failed to load user data:', err);
        }
        // If we get a rate limit error (429), don't throw - just return the cached data
        if (err instanceof AxiosError && err.response?.status === 429) {
          // Return previous data or null
          const previousData = queryClient.getQueryData(AUTH_QUERY_KEYS.user);
          return previousData || null;
        }
        throw err;
      }
    },
    retry: (failureCount: number, error: Error) => {
      // Don't retry on 429 errors
      if (error instanceof AxiosError && error.response?.status === 429) {
        return false;
      }
      // Only retry a few times for other errors
      return failureCount < 2;
    },
    staleTime: 1000 * 60 * 60, // 60 minutes - greatly increased to reduce API calls
    gcTime: 1000 * 60 * 120, // 120 minutes for cache
    enabled: !!window.localStorage.getItem('authToken'),
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
    retryDelay: (attemptIndex: number) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  // Login mutation
  const loginMutation = useMutation({
    mutationFn: authApi.login,
    onSuccess: (data: AuthResponse) => {
      if (import.meta.env.DEV) {
        window.console.log('Login successful:', data);
      }
      
      // Store token
      window.localStorage.setItem('authToken', data.token);
      
      // Update current user query
      queryClient.setQueryData(AUTH_QUERY_KEYS.user, data.user);
      
      // Force a refetch of the user data to ensure everything is up to date
      refetch();
      
      // Invalidate queries that might depend on auth status
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
    onError: (error: AxiosError) => {
      if (import.meta.env.DEV) {
        window.console.error('Login error details:', {
          message: error.message,
          status: error.response?.status,
          data: error.response?.data,
          config: {
            url: error.config?.url,
            baseURL: error.config?.baseURL,
            method: error.config?.method,
          }
        });
      }
    }
  });

  // Logout mutation
  const logoutMutation = useMutation({
    mutationFn: authApi.logout,
    onSuccess: () => {
      // Clear user data
      queryClient.setQueryData(AUTH_QUERY_KEYS.user, null);
      // Clear all queries when logging out
      queryClient.clear();
    },
  });

  // Register mutation
  const registerMutation = useMutation({
    mutationFn: authApi.register,
    onSuccess: (data: AuthResponse) => {
      // Store token
      window.localStorage.setItem('authToken', data.token);
      // Update current user query
      queryClient.setQueryData(AUTH_QUERY_KEYS.user, data.user);
    },
  });

  return {
    user,
    isAuthenticated: !!user,
    isLoading,
    error,
    login: loginMutation.mutate,
    logout: logoutMutation.mutate,
    register: registerMutation.mutate,
    isLoginLoading: loginMutation.isPending,
    isLogoutLoading: logoutMutation.isPending,
    isRegisterLoading: registerMutation.isPending,
    loginError: loginMutation.error,
    logoutError: logoutMutation.error,
    registerError: registerMutation.error,
    refetchUser: refetch,
  };
} 
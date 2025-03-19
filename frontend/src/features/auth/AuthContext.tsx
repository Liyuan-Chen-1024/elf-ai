import { createContext, useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ElfSpinner } from '../../components/ElfSpinner';
import { User } from '../chat/types';
import { authApi } from './api';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isInitializing: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

interface AuthProviderProps {
  children: React.ReactNode;
}

const defaultContext: AuthContextType = {
  user: null,
  isAuthenticated: false,
  isLoading: false,
  isInitializing: true,
  error: null,
  login: async () => {},
  logout: async () => {},
};

const AuthContext = createContext<AuthContextType>(defaultContext);

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const navigate = useNavigate();
  const [state, setState] = useState({
    user: null as User | null,
    isAuthenticated: false,
    isLoading: false,
    isInitializing: true,
    error: null as string | null,
  });

  useEffect(() => {
    const initializeAuth = async () => {
      const token = localStorage.getItem('token');
      const email = localStorage.getItem('email');
      
      if (!token) {
        setState(prev => ({
          ...prev,
          isInitializing: false,
        }));
        return;
      }

      try {
        // Set up axios with the token
        authApi.setAuthToken(token);
        
        // Try to get user profile
        const userProfile = await authApi.getCurrentUser();
        const userData: User = {
          id: userProfile.id,
          name: userProfile.username || userProfile.first_name || email || 'User',
          email: email || '',
          role: 'user',
        };
        
        setState(prev => ({
          ...prev,
          user: userData,
          isAuthenticated: true,
          isInitializing: false,
        }));
      } catch (err) {
        console.error('Failed to initialize auth:', err);
        // Clear invalid token
        localStorage.removeItem('token');
        localStorage.removeItem('email');
        authApi.clearAuthToken();
        
        setState(prev => ({
          ...prev,
          isInitializing: false,
        }));
        
        navigate('/login');
      }
    };

    initializeAuth();
  }, [navigate]);

  const login = async (email: string, password: string) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    try {
      const response = await authApi.login(email, password);
      
      // Save email for persistence
      localStorage.setItem('email', email);
      
      // Set up user data
      const userData: User = {
        id: response.user.id,
        name: response.user.username || response.user.first_name || email,
        email: email,
        role: 'user',
      };
      
      setState(prev => ({
        ...prev,
        user: userData,
        isAuthenticated: true,
        isLoading: false,
      }));
      
      navigate('/chat');
    } catch (err) {
      setState(prev => ({
        ...prev,
        error: 'Failed to login. Please check your credentials.',
        isLoading: false,
      }));
      console.error('Login error:', err);
    }
  };

  const logout = async () => {
    setState(prev => ({ ...prev, isLoading: true }));
    try {
      await authApi.logout();
      
      // Clear user data
      localStorage.removeItem('email');
      localStorage.removeItem('token');
      authApi.clearAuthToken();
      
      setState(prev => ({
        ...prev,
        user: null,
        isAuthenticated: false,
        isLoading: false,
      }));
      
      navigate('/login');
    } catch (err) {
      setState(prev => ({
        ...prev,
        error: 'Failed to logout',
        isLoading: false,
      }));
      console.error('Logout error:', err);
    }
  };

  // Only show loading spinner during initialization
  if (state.isInitializing) {
    return <ElfSpinner message="Loading application..." />;
  }

  return (
    <AuthContext.Provider
      value={{
        ...state,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}; 
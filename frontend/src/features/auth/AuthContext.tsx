import { createContext, useState, useContext } from 'react';
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
  children: any;
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

const AuthContext = createContext(defaultContext);

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const navigate = useNavigate();
  const [state, setState] = useState({
    user: null as User | null,
    isAuthenticated: false,
    isLoading: false,
    isInitializing: true,
    error: null as string | null,
  });

  const login = async (email: string, password: string) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    try {
      const response = await authApi.login(email, password);
      
      // Save email to localStorage for persistence/fallback
      localStorage.setItem('email', email);
      
      // Try to get the full profile after login
      try {
        const userProfile = await authApi.getCurrentUser();
        const userData: User = {
          id: userProfile.id,
          name: userProfile.username || userProfile.first_name || email,
          email: email,
          role: 'user',
        };
        setState(prev => ({
          ...prev,
          user: userData,
          isAuthenticated: true,
          isLoading: false,
        }));
      } catch (profileErr) {
        // Fallback to basic user data if profile fetch fails
        const mockUser: User = {
          id: 1,
          name: 'Test User',
          email: email,
          role: 'user',
        };
        setState(prev => ({
          ...prev,
          user: mockUser,
          isAuthenticated: true,
          isLoading: false,
        }));
      }
      
      localStorage.setItem('token', response.token);
      navigate('/chat');
    } catch (err) {
      setState(prev => ({
        ...prev,
        error: 'Failed to login',
        isLoading: false,
      }));
      console.error('Login error:', err);
    }
  };

  const logout = async () => {
    setState(prev => ({ ...prev, isLoading: true }));
    try {
      await authApi.logout();
      
      // Clear user data from localStorage
      localStorage.removeItem('email');
      localStorage.removeItem('token');
      
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
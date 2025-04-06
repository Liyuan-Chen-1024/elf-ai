import { useState, useEffect, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../hooks/useAuth';

export function useLoginForm() {
  const { login, isLoginLoading, loginError, isAuthenticated } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [showDebugInfo, setShowDebugInfo] = useState(false);
  const navigate = useNavigate();

  // Redirect when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      if (import.meta.env.DEV) {
        console.log('User authenticated, redirecting to /chat');
      }
      navigate('/chat');
    }
  }, [isAuthenticated, navigate]);

  // Clear form error when inputs change
  useEffect(() => {
    if (username || password) {
      setFormError(null);
    }
  }, [username, password]);
  
  // Toggle debug info with keyboard shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+Shift+D to toggle debug info
      if (e.ctrlKey && e.shiftKey && e.key === 'D') {
        setShowDebugInfo(prev => !prev);
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setFormError(null);
    
    if (!username.trim()) {
      setFormError('Username is required');
      return;
    }
    
    if (!password.trim()) {
      setFormError('Password is required');
      return;
    }
    
    // Show API URL in development mode
    if (import.meta.env.DEV) {
      console.log('Login attempt using API URL:', import.meta.env.VITE_API_URL);
      console.log('Login credentials:', { username: username.trim() });
    }
    
    login({ username: username.trim(), password: password.trim() });
  };

  // Test login with default credentials (for development only)
  const handleTestLogin = () => {
    if (import.meta.env.DEV) {
      setUsername('admin');
      setPassword('password');
      login({ username: 'admin', password: 'password' });
    }
  };

  return {
    username,
    setUsername,
    password,
    setPassword,
    formError,
    loginError,
    isLoginLoading,
    showDebugInfo,
    handleSubmit,
    handleTestLogin
  };
} 
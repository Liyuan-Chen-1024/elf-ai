import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import './styles/index.css';

// Configure console logging
if (import.meta.env.DEV || import.meta.env.VITE_DEBUG === 'true') {
  console.log('Debug mode enabled');
  
  // Intercept and log all fetch requests in development
  const originalFetch = window.fetch;
  window.fetch = async (...args) => {
    const [resource, config] = args;
    console.log('🌐 Fetch Request:', resource, config);
    
    try {
      const response = await originalFetch(resource, config);
      console.log(`✅ Fetch Response (${response.status}):`, resource);
      return response;
    } catch (error) {
      console.error('❌ Fetch Error:', error);
      throw error;
    }
  };
}

// Create a query client for React Query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      onError: (error) => {
        console.error('Query error:', error);
      },
    },
    mutations: {
      onError: (error) => {
        console.error('Mutation error:', error);
      },
    },
  },
});

const rootElement = document.getElementById('root');
if (!rootElement) throw new Error('Failed to find the root element');

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <App />
      </BrowserRouter>
    </QueryClientProvider>
  </React.StrictMode>
);

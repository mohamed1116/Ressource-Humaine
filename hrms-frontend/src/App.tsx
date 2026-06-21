/**
 * App Root -- wrapped in ErrorBoundary for crash protection
 */
import { useEffect } from 'react';
import { RouterProvider } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './context/AuthContext';
import { queryClient } from './store/queryClient';
import { router } from './router';
import ErrorBoundary from './components/ui/ErrorBoundary';

function App() {
  useEffect(() => {
    const lang = localStorage.getItem('lang') || 'fr';
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = lang;
  }, []);

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <RouterProvider router={router} />
        </AuthProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;

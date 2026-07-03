import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { Provider as ReduxProvider } from 'react-redux';
import { HelmetProvider } from 'react-helmet-async';
import { Toaster } from 'react-hot-toast';

import App from './App.jsx';
import { store } from '@/store/index.js';
import QueryProvider from '@/providers/QueryProvider.jsx';
import SmoothScrollProvider from '@/providers/SmoothScrollProvider.jsx';
import ErrorBoundary from '@/components/ui/ErrorBoundary.jsx';

import './index.css';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <HelmetProvider>
        <ReduxProvider store={store}>
          <QueryProvider>
            <BrowserRouter>
              <SmoothScrollProvider>
                <App />
                <Toaster
                  position="bottom-center"
                  toastOptions={{
                    style: {
                      background: '#0A1730',
                      color: '#F5F1E8',
                      fontFamily: 'Inter, sans-serif',
                      fontSize: '14px',
                      borderRadius: '4px',
                      padding: '12px 20px',
                    },
                    success: { iconTheme: { primary: '#1547FF', secondary: '#F5F1E8' } },
                    error: { iconTheme: { primary: '#DC2626', secondary: '#F5F1E8' } },
                  }}
                />
              </SmoothScrollProvider>
            </BrowserRouter>
          </QueryProvider>
        </ReduxProvider>
      </HelmetProvider>
    </ErrorBoundary>
  </StrictMode>
);

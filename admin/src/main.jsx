import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Provider as ReduxProvider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { Toaster } from 'react-hot-toast';
import App from './App.jsx';
import ErrorBoundary from './components/ui/ErrorBoundary.jsx';
import QueryProvider from './providers/QueryProvider.jsx';
import { store } from './store/index.js';
import './index.css';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <HelmetProvider>
        <ReduxProvider store={store}>
          <QueryProvider>
            <BrowserRouter>
              <App />
              <Toaster
                position="bottom-right"
                gutter={12}
                toastOptions={{
                  duration: 4000,
                  style: {
                    background: '#0A1730',
                    color: '#F5F1E8',
                    fontFamily: 'Inter, ui-sans-serif, system-ui, sans-serif',
                    fontSize: '13px',
                    fontWeight: '400',
                    padding: '12px 16px',
                    borderRadius: '4px',
                    border: '1px solid #16233F',
                    boxShadow: '0 10px 30px -10px rgba(10, 23, 48, 0.4)',
                  },
                  success: {
                    iconTheme: { primary: '#1547FF', secondary: '#F5F1E8' },
                  },
                  error: {
                    iconTheme: { primary: '#B4351B', secondary: '#F5F1E8' },
                  },
                }}
              />
            </BrowserRouter>
          </QueryProvider>
        </ReduxProvider>
      </HelmetProvider>
    </ErrorBoundary>
  </StrictMode>
);

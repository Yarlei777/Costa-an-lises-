import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import ErrorBoundary from './components/ErrorBoundary.tsx';
import './index.css';

// Global error listener for catching errors before React mounts
window.addEventListener('error', (event) => {
  if (event.message && (event.message.includes('removeChild') || event.message.includes('appendChild'))) {
    console.warn('DOM mismatch detected (likely Google Translate). Reloading...');
    window.location.reload();
    return;
  }
  console.error('Global error caught:', event.error);
});

window.addEventListener('unhandledrejection', (event) => {
  // Prevent the default browser behavior (logging to console)
  event.preventDefault();
  
  const reason = event.reason;
  const message = reason instanceof Error ? reason.message : String(reason);
  
  // Ignore benign errors
  if (message.includes('Failed to fetch dynamically imported module') || 
      message.includes('Importing a module script failed') ||
      message.includes('The user aborted a request')) {
    return;
  }
  
  console.error('Unhandled promise rejection:', message, reason);
});

try {
  const rootElement = document.getElementById('root');
  if (!rootElement) {
    throw new Error('Root element not found');
  }

  createRoot(rootElement).render(
    <StrictMode>
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    </StrictMode>,
  );
} catch (error) {
  console.error('Failed to render app:', error);
}

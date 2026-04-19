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
  let message = '';
  let stack = '';
  
  if (reason instanceof Error) {
    message = reason.message;
    stack = reason.stack || '';
  } else {
    message = String(reason);
  }
  
  console.error('Unhandled promise rejection:', message);
  if (stack) console.error('Stack:', stack);
  console.error('Full reason object:', reason);
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

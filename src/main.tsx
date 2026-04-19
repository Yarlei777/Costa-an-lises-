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
  // Prevent the default browser behavior
  event.preventDefault();
  
  const reason = event.reason;
  const message = reason instanceof Error ? reason.message : (reason ? String(reason) : "Empty/Undefined Reason");
  
  // Ignore specific benign errors
  const ignoredMessages = [
    'Failed to fetch dynamically imported module',
    'Importing a module script failed',
    'The user aborted a request',
    'ResizeObserver loop'
  ];

  if (ignoredMessages.some(m => message.includes(m))) {
    return;
  }
  
  console.error('CRITICAL: Unhandled Promise Rejection Detected', {
    message,
    reason,
    timestamp: new Date().toISOString()
  });
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

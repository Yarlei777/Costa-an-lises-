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
  const reason = event.reason;
  
  // Ignorar erros sem razão para evitar logs vazios
  if (!reason) {
    event.preventDefault();
    return;
  }
  
  // Extração inteligente de mensagem (garantindo que seja string)
  let message = '';
  if (reason instanceof Error) {
    message = reason.message;
  } else if (typeof reason === 'object') {
    const rawMsg = reason.message || reason.code || reason.error;
    message = typeof rawMsg === 'string' ? rawMsg : String(reason);
  } else {
    message = String(reason);
  }

  // Filtrar silenciosamente erros conhecidos que não são "bugs" (cancelamentos de UI, rede instável, etc)
  const ignoredPatterns = [
    'auth/popup-closed-by-user',
    'auth/cancelled-by-user',
    'Firebase: Error',
    'FirebaseError',
    'Quota exceeded',
    'The user has denied the request',
    'permission-denied',
    'Failed to fetch dynamically imported module',
    'Importing a module script failed',
    'auth/network-request-failed'
  ];

  if (ignoredPatterns.some(p => message.includes(p))) {
    event.preventDefault();
    return;
  }

  // Se chegamos aqui, é um erro real que o usuário deve ver nos logs
  event.preventDefault();
  
  console.group('%c --- UNHANDLED PROMISE REJECTION --- ', 'background: #991b1b; color: white; border-radius: 4px; padding: 2px;');
  console.error('Message:', message || '(No message)');
  
  if (reason instanceof Error) {
    console.error('Stack:', reason.stack || '(No stack trace)');
  } else if (typeof reason === 'object') {
    try {
      console.error('As JSON:', JSON.stringify(reason, null, 2));
    } catch (e) {
      console.error('Properties:', Object.keys(reason));
    }
  }
  
  console.error('Original Object:', reason);
  console.groupEnd();
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

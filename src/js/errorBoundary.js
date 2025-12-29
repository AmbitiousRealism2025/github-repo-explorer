import { showToast } from './common.js';

const ERROR_MESSAGES = {
  network: 'Network error. Please check your connection.',
  rateLimit: 'API rate limit reached. Please wait a moment.',
  notFound: 'Resource not found.',
  forbidden: 'Access denied. Check your token.',
  default: 'Something went wrong. Please try again.'
};

const classifyError = (error) => {
  const message = error?.message?.toLowerCase() || '';
  
  if (message.includes('rate limit')) return 'rateLimit';
  if (message.includes('network') || message.includes('fetch')) return 'network';
  if (message.includes('not found') || message.includes('404')) return 'notFound';
  if (message.includes('forbidden') || message.includes('403')) return 'forbidden';
  
  return 'default';
};

const handleError = (error, context = 'Unknown') => {
  console.error(`[ErrorBoundary] ${context}:`, error);
  
  const errorType = classifyError(error);
  const userMessage = ERROR_MESSAGES[errorType];
  
  showToast(userMessage, 'error');
};

export const initErrorBoundary = () => {
  window.addEventListener('unhandledrejection', (event) => {
    event.preventDefault();
    handleError(event.reason, 'Unhandled Promise Rejection');
  });

  window.addEventListener('error', (event) => {
    if (event.filename && !event.filename.includes(window.location.origin)) {
      return;
    }
    handleError(event.error, 'Uncaught Error');
  });

  console.log('[ErrorBoundary] Initialized');
};

export { handleError };

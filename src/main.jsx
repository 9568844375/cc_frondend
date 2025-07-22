import React, { Suspense } from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import './styles/index.css';

/**
 * ErrorBoundary component to catch JavaScript errors anywhere in the child component tree,
 * log those errors, and display a fallback UI.
 */
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    // Initialize state to track if an error has occurred
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  // Update state when an error is encountered
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  // Log error details (can be sent to an error reporting service)
  componentDidCatch(error, errorInfo) {
    this.setState({ errorInfo });
    
    // Log error for debugging
    console.error('Global error caught:', error, errorInfo);
    
    // In production, you might want to send this to an error reporting service
    if (import.meta.env.PROD) {
      // Example: Send to error reporting service
      // errorReportingService.captureException(error, { extra: errorInfo });
    }
  }

  // Reset error boundary
  resetError = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  // Render fallback UI if an error has occurred, else render children
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center', 
          justifyContent: 'center', 
          minHeight: '100vh',
          textAlign: 'center',
          padding: '2rem',
          fontFamily: 'Inter, system-ui, sans-serif',
          background: '#f8fafc'
        }}>
          <div style={{
            background: 'white',
            borderRadius: '12px',
            padding: '2rem',
            boxShadow: '0 10px 25px rgba(0, 0, 0, 0.15)',
            maxWidth: '500px',
            width: '100%'
          }}>
            <h1 style={{ 
              color: '#ef4444', 
              marginBottom: '1rem',
              fontSize: '1.5rem',
              fontWeight: '600'
            }}>
              Oops! Something went wrong
            </h1>
            <p style={{ 
              color: '#6b7280', 
              marginBottom: '1.5rem',
              lineHeight: '1.5'
            }}>
              We're sorry, but something unexpected happened. This error has been logged and we'll look into it.
            </p>
            
            {import.meta.env.DEV && this.state.error && (
              <details style={{
                background: '#f9fafb',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                padding: '1rem',
                marginBottom: '1.5rem',
                textAlign: 'left'
              }}>
                <summary style={{ cursor: 'pointer', fontWeight: '500', marginBottom: '0.5rem' }}>
                  Error Details (Development Mode)
                </summary>
                <pre style={{
                  fontSize: '0.75rem',
                  color: '#ef4444',
                  overflow: 'auto',
                  margin: 0,
                  whiteSpace: 'pre-wrap'
                }}>
                  {this.state.error.toString()}
                </pre>
              </details>
            )}
            
            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
              <button 
                onClick={this.resetError}
                style={{
                  padding: '0.75rem 1.5rem',
                  background: '#667eea',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '1rem',
                  fontWeight: '600',
                  transition: 'background 0.3s'
                }}
                onMouseOver={(e) => e.target.style.background = '#5a67d8'}
                onMouseOut={(e) => e.target.style.background = '#667eea'}
              >
                Try Again
              </button>
              <button 
                onClick={() => window.location.reload()}
                style={{
                  padding: '0.75rem 1.5rem',
                  background: '#f3f4f6',
                  color: '#374151',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '1rem',
                  fontWeight: '600',
                  transition: 'background 0.3s'
                }}
                onMouseOver={(e) => e.target.style.background = '#e5e7eb'}
                onMouseOut={(e) => e.target.style.background = '#f3f4f6'}
              >
                Refresh Page
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Loading component for Suspense fallback
function LoadingFallback() {
  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column',
      alignItems: 'center', 
      justifyContent: 'center', 
      minHeight: '100vh',
      fontFamily: 'Inter, system-ui, sans-serif'
    }}>
      <div style={{
        width: '50px',
        height: '50px',
        border: '4px solid #f3f4f6',
        borderTop: '4px solid #667eea',
        borderRadius: '50%',
        animation: 'spin 1s linear infinite',
        marginBottom: '1rem'
      }} />
      <p style={{ color: '#6b7280', fontSize: '1rem' }}>Loading CampusConnect...</p>
      
      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

// Get the root DOM element to mount the React app
const container = document.getElementById('root');

if (!container) {
  throw new Error('Root container not found. Make sure you have a div with id="root" in your HTML.');
}

// Create a root for React rendering
const root = ReactDOM.createRoot(container);

// Render the React application
root.render(
  <React.StrictMode>
    {/* ErrorBoundary wraps the app to catch errors in the component tree */}
    <ErrorBoundary>
      {/* BrowserRouter enables routing in the app */}
      <BrowserRouter>
        {/* Suspense shows fallback UI while lazy components load */}
        <Suspense fallback={<LoadingFallback />}>
          {/* Main App component */}
          <App />
        </Suspense>
      </BrowserRouter>
    </ErrorBoundary>
  </React.StrictMode>
);

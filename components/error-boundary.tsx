'use client';

import React from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<{ error: Error; reset: () => void }>;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

/**
 * Error Boundary Component
 * 
 * Catches JavaScript errors anywhere in the child component tree,
 * logs those errors, and displays a fallback UI instead of crashing the whole app.
 * 
 * Usage:
 * ```tsx
 * <ErrorBoundary>
 *   <YourComponent />
 * </ErrorBoundary>
 * ```
 * 
 * With custom fallback:
 * ```tsx
 * <ErrorBoundary fallback={CustomErrorFallback}>
 *   <YourComponent />
 * </ErrorBoundary>
 * ```
 */
export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log error to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('ErrorBoundary caught an error:', error);
      console.error('Error info:', errorInfo);
    }

    // In production, you would send this to an error reporting service
    // Example: Sentry.captureException(error, { extra: errorInfo });
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError && this.state.error) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        const FallbackComponent = this.props.fallback;
        return <FallbackComponent error={this.state.error} reset={this.handleReset} />;
      }

      // Default fallback UI
      return <DefaultErrorFallback error={this.state.error} reset={this.handleReset} />;
    }

    return this.props.children;
  }
}

/**
 * Default Error Fallback UI
 * 
 * Shows a user-friendly error message with options to:
 * - Retry (reset error boundary)
 * - Go to homepage
 * - Reload page
 */
function DefaultErrorFallback({ error, reset }: { error: Error; reset: () => void }) {
  const isDevelopment = process.env.NODE_ENV === 'development';

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
      <Card className="max-w-lg w-full p-8">
        <div className="flex flex-col items-center text-center space-y-4">
          {/* Error Icon */}
          <div className="rounded-full bg-red-100 p-4">
            <AlertTriangle className="h-10 w-10 text-red-600" />
          </div>

          {/* Title */}
          <h1 className="text-2xl font-bold text-gray-900">
            Oops! Something went wrong
          </h1>

          {/* Description */}
          <p className="text-gray-600">
            We encountered an unexpected error. Don't worry, this has been logged and we'll look into it.
          </p>

          {/* Error Details (Development Only) */}
          {isDevelopment && (
            <div className="w-full mt-4 p-4 bg-gray-100 rounded-lg text-left">
              <p className="text-xs font-mono text-red-600 mb-2 font-bold">
                Development Error Details:
              </p>
              <p className="text-xs font-mono text-gray-800 break-words">
                {error.message}
              </p>
              {error.stack && (
                <details className="mt-2">
                  <summary className="text-xs font-mono text-gray-600 cursor-pointer hover:text-gray-800">
                    Stack Trace
                  </summary>
                  <pre className="text-xs font-mono text-gray-600 mt-2 overflow-x-auto whitespace-pre-wrap">
                    {error.stack}
                  </pre>
                </details>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 w-full mt-6">
            <Button
              onClick={reset}
              variant="default"
              className="flex-1 gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Try Again
            </Button>

            <Button
              onClick={() => (window.location.href = '/')}
              variant="outline"
              className="flex-1 gap-2"
            >
              <Home className="h-4 w-4" />
              Go Home
            </Button>
          </div>

          {/* Reload Link */}
          <button
            onClick={() => window.location.reload()}
            className="text-sm text-gray-500 hover:text-gray-700 underline"
          >
            Or reload the page
          </button>
        </div>
      </Card>
    </div>
  );
}

/**
 * Compact Error Fallback
 * 
 * Use this for smaller components where a full-page error would be too intrusive
 */
export function CompactErrorFallback({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="p-4 border border-red-200 rounded-lg bg-red-50">
      <div className="flex items-start gap-3">
        <AlertTriangle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-red-900">Error</h3>
          <p className="text-sm text-red-700 mt-1">{error.message}</p>
          <Button
            onClick={reset}
            variant="outline"
            size="sm"
            className="mt-3"
          >
            Try Again
          </Button>
        </div>
      </div>
    </div>
  );
}

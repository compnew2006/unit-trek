import React, { Component, ReactNode } from 'react';
import { AlertCircle, RefreshCw, Home } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { useLocale } from '../hooks/useLocale';
import { errorTracker } from '../utils/errorTracker';
import { logger } from '../utils/logger';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log error using logger in development
    if (import.meta.env.DEV) {
      logger.error('ErrorBoundary caught an error', error, {
        componentStack: errorInfo.componentStack,
      });
    }

    // Track error with error tracker
    errorTracker.captureError(error, {
      componentStack: errorInfo.componentStack,
      type: 'react-error-boundary',
    });

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Update state with error info
    this.setState({
      error,
      errorInfo,
    });
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render() {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      return (
        <ErrorFallback
          error={this.state.error}
          errorInfo={this.state.errorInfo}
          onReset={this.handleReset}
        />
      );
    }

    return this.props.children;
  }
}

interface ErrorFallbackProps {
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
  onReset: () => void;
}

const ErrorFallback: React.FC<ErrorFallbackProps> = ({ error, errorInfo, onReset }) => {
  const { t } = useLocale();

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <div className="flex items-center gap-2">
            <AlertCircle className="h-6 w-6 text-destructive" />
            <CardTitle className="text-2xl">{t('errors.somethingWentWrong') || 'Something went wrong'}</CardTitle>
          </div>
          <CardDescription>
            {t('errors.unexpectedError') || 'An unexpected error occurred. Please try again or contact support if the problem persists.'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4">
              <p className="font-semibold text-destructive mb-2">
                {t('errors.errorDetails') || 'Error Details'}:
              </p>
              <p className="text-sm text-muted-foreground font-mono break-all">
                {error.message || 'Unknown error occurred'}
              </p>
              {process.env.NODE_ENV === 'development' && error.stack && (
                <details className="mt-2">
                  <summary className="cursor-pointer text-sm text-muted-foreground hover:text-foreground">
                    {t('errors.stackTrace') || 'Stack Trace'}
                  </summary>
                  <pre className="mt-2 text-xs overflow-auto max-h-40 p-2 bg-background rounded border">
                    {error.stack}
                  </pre>
                </details>
              )}
              {process.env.NODE_ENV === 'development' && errorInfo && (
                <details className="mt-2">
                  <summary className="cursor-pointer text-sm text-muted-foreground hover:text-foreground">
                    {t('errors.componentStack') || 'Component Stack'}
                  </summary>
                  <pre className="mt-2 text-xs overflow-auto max-h-40 p-2 bg-background rounded border">
                    {errorInfo.componentStack}
                  </pre>
                </details>
              )}
            </div>
          )}

          <div className="flex flex-wrap gap-2">
            <Button onClick={onReset} variant="default">
              <RefreshCw className="ltr:mr-2 rtl:ml-2 h-4 w-4" />
              {t('errors.tryAgain') || 'Try Again'}
            </Button>
            <Button 
              onClick={() => {
                window.location.href = '/';
              }} 
              variant="outline"
            >
              <Home className="ltr:mr-2 rtl:ml-2 h-4 w-4" />
              {t('errors.goHome') || 'Go Home'}
            </Button>
            <Button
              onClick={() => window.location.reload()}
              variant="outline"
            >
              {t('errors.reloadPage') || 'Reload Page'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// Hook-based Error Boundary wrapper for function components
export const useErrorHandler = () => {
  return (error: Error, _errorInfo?: React.ErrorInfo) => {
    // This can be used to manually trigger error boundary
    // In a real implementation, you might want to use a state management solution
    throw error;
  };
};

export default ErrorBoundary;

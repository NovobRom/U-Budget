import React, { Component } from 'react';

class ErrorBoundary extends Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        console.error('Error caught by boundary:', error, errorInfo);
        // Here you could send the error to an external service like Sentry
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50 dark:bg-slate-900">
                    <div className="max-w-md w-full text-center space-y-6">
                        <div className="flex justify-center">
                            <div className="bg-red-100 dark:bg-red-900/30 p-3 rounded-full">
                                <svg
                                    className="w-12 h-12 text-red-600 dark:text-red-400"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth="2"
                                        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 15c-.77 1.333.192 3 1.732 3z"
                                    />
                                </svg>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                                Something went wrong
                            </h1>
                            <p className="text-slate-600 dark:text-slate-400">
                                The application encountered an unexpected error. Please try
                                refreshing the page.
                            </p>
                        </div>
                        <div className="flex flex-col gap-3">
                            <button
                                onClick={() => window.location.reload()}
                                className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-colors font-medium shadow-sm"
                            >
                                Refresh Page
                            </button>
                            <button
                                onClick={() => this.setState({ hasError: false, error: null })}
                                className="w-full px-4 py-2 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl transition-colors font-medium"
                            >
                                Try Again
                            </button>
                        </div>
                        {import.meta.env.DEV && (
                            <div className="mt-8 p-4 bg-slate-100 dark:bg-slate-800/50 rounded-lg text-left overflow-auto max-h-48">
                                <p className="text-xs font-mono text-red-600 dark:text-red-400">
                                    {this.state.error?.toString()}
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;

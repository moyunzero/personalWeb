import React from 'react';
import PropTypes from 'prop-types';

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        console.error('Error caught by boundary:', error, errorInfo);
    }

    handleReset = () => {
        this.setState({ hasError: false, error: null });
    };

    render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen flex items-center justify-center bg-zinc-900">
                    <div className="text-center p-8 bg-zinc-800 rounded-2xl shadow-lg max-w-md mx-4 ring-1 ring-zinc-50/5">
                        <div className="mb-6">
                            <span className="material-symbols-rounded text-6xl text-red-400 mb-4">
                                error_outline
                            </span>
                        </div>
                        <h2 className="text-2xl font-bold text-zinc-50 mb-4">出错了！</h2>
                        <p className="text-zinc-400 mb-6">我们会尽快修复这个问题。如果问题持续存在，请刷新页面。</p>
                        <div className="flex gap-3 justify-center">
                            <button
                                onClick={this.handleReset}
                                className="btn btn-outline"
                            >
                                重试
                            </button>
                            <button
                                onClick={() => window.location.reload()}
                                className="btn btn-primary"
                            >
                                刷新页面
                            </button>
                        </div>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

ErrorBoundary.propTypes = {
    children: PropTypes.node.isRequired,
};

export default ErrorBoundary; 
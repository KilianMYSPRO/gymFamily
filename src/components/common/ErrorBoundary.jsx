import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null, errorInfo: null };
    }

    // eslint-disable-next-line no-unused-vars
    static getDerivedStateFromError(_error) {
        return { hasError: true };
    }

    componentDidCatch(error, errorInfo) {
        this.setState({
            error: error,
            errorInfo: errorInfo
        });
        console.error("Uncaught error:", error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen flex items-center justify-center bg-slate-950 p-6 relative overflow-hidden">
                    <div className="absolute inset-0 bg-red-500/5 blur-[120px] pointer-events-none" />
                    
                    <div className="bg-slate-900 border border-white/10 rounded-[2.5rem] p-10 max-w-md w-full text-center shadow-2xl relative z-10">
                        <div className="w-20 h-20 bg-red-500/10 rounded-[1.5rem] flex items-center justify-center mx-auto mb-8 text-red-500 border border-red-500/20 shadow-inner transform rotate-3">
                            <AlertTriangle size={40} />
                        </div>
                        <h2 className="text-3xl font-black italic text-white mb-2 uppercase tracking-tight">System Error</h2>
                        <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-10 leading-relaxed">
                            Something went wrong. The system needs a manual reboot to continue.
                        </p>

                        {this.state.error && (
                            <div className="bg-slate-950/50 border border-white/5 rounded-2xl p-4 mb-10 text-left overflow-auto max-h-32 custom-scrollbar">
                                <p className="text-red-400 font-mono text-[10px] leading-relaxed break-all">
                                    {this.state.error.toString()}
                                </p>
                            </div>
                        )}

                        <button
                            onClick={() => window.location.reload()}
                            className="w-full py-5 rounded-2xl bg-white text-slate-950 font-black uppercase tracking-[0.2em] text-xs shadow-2xl active:scale-95 transition-all flex items-center justify-center gap-3"
                        >
                            <RefreshCw size={18} strokeWidth={3} /> Reboot System
                        </button>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;

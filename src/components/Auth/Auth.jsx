import React, { useState } from 'react';
import { User, Lock, ArrowRight, Loader2, AlertCircle, HelpCircle, ArrowLeft } from 'lucide-react';
import clsx from 'clsx';
import { useLanguage } from '../../context/LanguageContext';

const Auth = ({ onLogin }) => {
    const { t } = useLanguage();
    const [view, setView] = useState('login'); // 'login', 'register', 'forgot-password', 'reset-password'
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [successMessage, setSuccessMessage] = useState(null);
    const [securityQuestion, setSecurityQuestion] = useState(null);

    const SECURITY_QUESTIONS = [
        'q1', 'q2', 'q3', 'q4', 'q5'
    ];

    const [formData, setFormData] = useState({
        username: '',
        password: '',
        securityQuestion: 'q1',
        securityAnswer: '',
        newPassword: ''
    });

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
        setError(null);
        setSuccessMessage(null);
    };

    const handleForgotPasswordSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const response = await fetch(`/api/auth/get-security-question/${formData.username}`);
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || t('auth.errors.userNotFound'));
            }

            // If the question is one of our keys, translate it. Otherwise show as is (legacy support)
            const questionKey = Object.keys(t('auth.securityQuestions')).find(key =>
                t(`auth.securityQuestions.${key}`) === data.question || data.question === key
            );

            setSecurityQuestion(questionKey ? t(`auth.securityQuestions.${questionKey}`) : data.question);
            setView('reset-password');
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleResetPasswordSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const response = await fetch('/api/auth/reset-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    username: formData.username,
                    securityAnswer: formData.securityAnswer,
                    newPassword: formData.newPassword
                })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || t('auth.errors.resetFailed'));
            }

            setSuccessMessage(t('auth.success.resetSuccess'));
            setView('login');
            setFormData(prev => ({ ...prev, password: '', securityAnswer: '', newPassword: '' }));
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        const endpoint = view === 'login' ? '/api/auth/login' : '/api/auth/register';

        // For registration, we need to send the translated question text or the key?
        // Let's send the key if possible, or the translated text. 
        // Ideally backend stores the key, but for now let's send the translated text to match legacy behavior if needed,
        // OR better: send the key if the backend supports it. 
        // Assuming backend just stores string. Let's store the KEY so it can be translated on retrieval.
        // But wait, if we store the key, older users have full text.
        // Let's store the key.

        const payload = { ...formData };
        if (view === 'register') {
            // If it's a key (q1, q2...), keep it.
        }

        try {
            const response = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || t('auth.errors.authFailed'));
            }

            onLogin(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const renderForm = () => {
        if (view === 'forgot-password') {
            return (
                <form onSubmit={handleForgotPasswordSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-400">{t('auth.username')}</label>
                        <div className="relative">
                            <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                            <input
                                type="text"
                                name="username"
                                value={formData.username}
                                onChange={handleChange}
                                required
                                className="w-full bg-slate-800/50 border border-slate-700 rounded-xl pl-10 pr-4 py-3 text-white focus:outline-none focus:border-sky-500 transition-colors"
                                placeholder={t('auth.enterUsername')}
                            />
                        </div>
                    </div>
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full btn btn-primary py-3 flex items-center justify-center gap-2"
                    >
                        {loading ? <Loader2 className="animate-spin" size={20} /> : t('auth.next')}
                    </button>
                    <button
                        type="button"
                        onClick={() => setView('login')}
                        className="w-full text-sm text-slate-400 hover:text-white transition-colors flex items-center justify-center gap-2"
                    >
                        <ArrowLeft size={16} /> {t('auth.backToLogin')}
                    </button>
                </form>
            );
        }

        if (view === 'reset-password') {
            return (
                <form onSubmit={handleResetPasswordSubmit} className="space-y-4">
                    <div className="p-4 bg-slate-800/50 rounded-xl border border-slate-700 mb-4">
                        <p className="text-sm text-slate-400 mb-1">{t('auth.securityQuestion')}:</p>
                        <p className="text-white font-medium">
                            {/* Try to translate if it's a key, otherwise show as is */}
                            {t(`auth.securityQuestions.${securityQuestion}`) !== `auth.securityQuestions.${securityQuestion}`
                                ? t(`auth.securityQuestions.${securityQuestion}`)
                                : securityQuestion}
                        </p>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-400">{t('auth.securityAnswer')}</label>
                        <div className="relative">
                            <HelpCircle className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                            <input
                                type="text"
                                name="securityAnswer"
                                value={formData.securityAnswer}
                                onChange={handleChange}
                                required
                                className="w-full bg-slate-800/50 border border-slate-700 rounded-xl pl-10 pr-4 py-3 text-white focus:outline-none focus:border-sky-500 transition-colors"
                                placeholder={t('auth.enterAnswer')}
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-400">{t('auth.newPassword')}</label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                            <input
                                type="password"
                                name="newPassword"
                                value={formData.newPassword}
                                onChange={handleChange}
                                required
                                className="w-full bg-slate-800/50 border border-slate-700 rounded-xl pl-10 pr-4 py-3 text-white focus:outline-none focus:border-sky-500 transition-colors"
                                placeholder={t('auth.enterNewPassword')}
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full btn btn-primary py-3 flex items-center justify-center gap-2"
                    >
                        {loading ? <Loader2 className="animate-spin" size={20} /> : t('auth.resetPassword')}
                    </button>
                    <button
                        type="button"
                        onClick={() => setView('login')}
                        className="w-full text-sm text-slate-400 hover:text-white transition-colors flex items-center justify-center gap-2"
                    >
                        {t('auth.cancel')}
                    </button>
                </form>
            );
        }

        return (
            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-400">{t('auth.username')}</label>
                    <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                        <input
                            type="text"
                            name="username"
                            value={formData.username}
                            onChange={handleChange}
                            required
                            className="w-full bg-slate-800/50 border border-slate-700 rounded-xl pl-10 pr-4 py-3 text-white focus:outline-none focus:border-sky-500 transition-colors"
                            placeholder={t('auth.enterUsername')}
                        />
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-400">{t('auth.password')}</label>
                    <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                        <input
                            type="password"
                            name="password"
                            value={formData.password}
                            onChange={handleChange}
                            required
                            className="w-full bg-slate-800/50 border border-slate-700 rounded-xl pl-10 pr-4 py-3 text-white focus:outline-none focus:border-sky-500 transition-colors"
                            placeholder={t('auth.enterPassword')}
                        />
                    </div>
                </div>

                {view === 'register' && (
                    <>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-400">{t('auth.securityQuestion')}</label>
                            <div className="relative">
                                <HelpCircle className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                                <select
                                    name="securityQuestion"
                                    value={formData.securityQuestion}
                                    onChange={handleChange}
                                    className="w-full bg-slate-800/50 border border-slate-700 rounded-xl pl-10 pr-4 py-3 text-white focus:outline-none focus:border-sky-500 transition-colors appearance-none"
                                >
                                    {SECURITY_QUESTIONS.map((qKey) => (
                                        <option key={qKey} value={qKey} className="bg-slate-800 text-white">
                                            {t(`auth.securityQuestions.${qKey}`)}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-400">{t('auth.securityAnswer')}</label>
                            <div className="relative">
                                <HelpCircle className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                                <input
                                    type="text"
                                    name="securityAnswer"
                                    value={formData.securityAnswer}
                                    onChange={handleChange}
                                    required
                                    className="w-full bg-slate-800/50 border border-slate-700 rounded-xl pl-10 pr-4 py-3 text-white focus:outline-none focus:border-sky-500 transition-colors"
                                    placeholder={t('auth.enterAnswer')}
                                />
                            </div>
                        </div>
                    </>
                )}

                {view === 'login' && (
                    <div className="flex justify-end">
                        <button
                            type="button"
                            onClick={() => setView('forgot-password')}
                            className="text-sm text-sky-400 hover:text-sky-300 transition-colors"
                        >
                            {t('auth.forgotPassword')}
                        </button>
                    </div>
                )}

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full btn btn-primary py-3 flex items-center justify-center gap-2"
                >
                    {loading ? (
                        <Loader2 className="animate-spin" size={20} />
                    ) : (
                        <>
                            {view === 'login' ? t('auth.signIn') : t('auth.createAccount')}
                            <ArrowRight size={18} />
                        </>
                    )}
                </button>
            </form>
        );
    };

    return (
        <div className="w-full max-w-md mx-auto p-6 glass-card animate-fade-in">
            <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-white mb-2">
                    {view === 'login' && t('auth.welcomeBack')}
                    {view === 'register' && t('auth.createAccount')}
                    {view === 'forgot-password' && t('auth.recoverAccount')}
                    {view === 'reset-password' && t('auth.resetPassword')}
                </h2>
                <p className="text-slate-400">
                    {view === 'login' && t('auth.signInSubtitle')}
                    {view === 'register' && t('auth.signUpSubtitle')}
                    {view === 'forgot-password' && t('auth.recoverSubtitle')}
                    {view === 'reset-password' && t('auth.resetSubtitle')}
                </p>
            </div>

            {error && (
                <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center gap-2 text-red-400 text-sm">
                    <AlertCircle size={16} />
                    {error}
                </div>
            )}

            {successMessage && (
                <div className="mb-4 p-3 bg-green-500/10 border border-green-500/20 rounded-lg flex items-center gap-2 text-green-400 text-sm">
                    <AlertCircle size={16} />
                    {successMessage}
                </div>
            )}

            {renderForm()}

            {(view === 'login' || view === 'register') && (
                <div className="mt-6 text-center">
                    <button
                        onClick={() => setView(view === 'login' ? 'register' : 'login')}
                        className="text-sm text-slate-400 hover:text-white transition-colors"
                    >
                        {view === 'login' ? t('auth.noAccount') : t('auth.hasAccount')}
                    </button>
                </div>
            )}
        </div>
    );
};

export default Auth;

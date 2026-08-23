import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Zap, Lock, Mail, User, Eye, EyeOff, AlertCircle, CheckCircle, ArrowLeft } from 'lucide-react';
import { authService } from '../services/authService';
import { useAuthStore } from '../store/authStore';
import toast from 'react-hot-toast';

type Step = 'form' | 'otp';

export default function RegisterPage() {
  const navigate = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [step, setStep] = useState<Step>('form');
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [otp, setOtp] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await authService.sendOtp(form.email, form.name);
      setStep('otp');
      toast.success('Verification code sent to your email!');
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { error?: string } } };
      setError(axiosErr?.response?.data?.error || 'Failed to send code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (otp.length !== 6) {
      setError('Please enter the 6-digit verification code.');
      return;
    }
    setLoading(true);
    try {
      const res = await authService.register(form.name, form.email, form.password, otp);
      setAuth(res.user, res.token);
      toast.success('Account created! Welcome aboard.');
      navigate('/');
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { error?: string } } };
      setError(axiosErr?.response?.data?.error || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setError('');
    setLoading(true);
    try {
      await authService.sendOtp(form.email, form.name);
      toast.success('New verification code sent!');
    } catch {
      toast.error('Failed to resend code.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-48 -right-48 w-96 h-96 bg-brand-600/15 rounded-full blur-3xl" />
        <div className="absolute -bottom-48 -left-48 w-96 h-96 bg-purple-700/10 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-brand-600/15 rounded-2xl border border-brand-500/25 mb-5 shadow-lg shadow-brand-900/20 p-2.5">
            <img src="/favicon.svg" alt="Dev Dynasty Logo" className="w-10 h-10 object-contain drop-shadow-md" />
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight mb-2">Universal AI</h1>
          <p className="text-gray-500 text-sm">Smart India Hackathon 2026 · Dev Dynasty · PS12</p>
        </div>

        <div className="card p-8 shadow-2xl shadow-black/40">
          {/* Step indicator */}
          <div className="flex items-center gap-3 mb-6">
            <div
              className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                step === 'form' ? 'bg-brand-600 text-white' : 'bg-brand-600/20 text-brand-400'
              }`}
            >
              {step === 'otp' ? <CheckCircle className="w-4 h-4" /> : '1'}
            </div>
            <div className={`flex-1 h-0.5 ${step === 'otp' ? 'bg-brand-600' : 'bg-gray-800'}`} />
            <div
              className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                step === 'otp' ? 'bg-brand-600 text-white' : 'bg-gray-800 text-gray-600'
              }`}
            >
              2
            </div>
            <span className="text-xs text-gray-500">
              {step === 'form' ? 'Create account' : 'Verify email'}
            </span>
          </div>

          {error && (
            <div className="flex items-center gap-2 p-3 mb-5 bg-red-500/10 border border-red-500/25 rounded-xl text-red-400 text-sm animate-fade-in">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {error}
            </div>
          )}

          {step === 'form' ? (
            <form onSubmit={handleSendOtp} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Full Name</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="Your full name"
                    className="input-field pl-10"
                    required
                    minLength={2}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Email address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    placeholder="you@company.com"
                    className="input-field pl-10"
                    required
                    autoComplete="email"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                  <input
                    type={showPwd ? 'text' : 'password'}
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    placeholder="Min. 8 characters"
                    className="input-field pl-10 pr-10"
                    required
                    minLength={8}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPwd(!showPwd)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
                  >
                    {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full justify-center py-3 text-base mt-2"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Sending code...
                  </span>
                ) : (
                  'Send Verification Code'
                )}
              </button>
            </form>
          ) : (
            <form onSubmit={handleRegister} className="space-y-5">
              <div className="text-center p-4 bg-brand-500/10 border border-brand-500/20 rounded-xl">
                <CheckCircle className="w-6 h-6 text-brand-400 mx-auto mb-2" />
                <p className="text-sm text-gray-300">Code sent to</p>
                <p className="text-brand-400 font-medium text-sm">{form.email}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  6-digit verification code
                </label>
                <input
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="000000"
                  className="input-field text-center text-2xl tracking-[0.5em] font-mono"
                  maxLength={6}
                  required
                  autoFocus
                  autoComplete="one-time-code"
                />
              </div>

              <button
                type="submit"
                disabled={loading || otp.length !== 6}
                className="btn-primary w-full justify-center py-3 text-base"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Creating account...
                  </span>
                ) : (
                  'Create Account'
                )}
              </button>

              <div className="flex items-center justify-between pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setStep('form');
                    setError('');
                    setOtp('');
                  }}
                  className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-300 transition-colors"
                >
                  <ArrowLeft className="w-3 h-3" /> Back
                </button>
                <button
                  type="button"
                  onClick={handleResendOtp}
                  disabled={loading}
                  className="text-xs text-brand-400 hover:text-brand-300 transition-colors disabled:opacity-50"
                >
                  Resend code
                </button>
              </div>
            </form>
          )}

          <p className="text-center text-gray-500 text-sm mt-6">
            Already have an account?{' '}
            <Link
              to="/login"
              className="text-brand-400 hover:text-brand-300 font-medium transition-colors"
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

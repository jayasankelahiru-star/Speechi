import React, { useState } from 'react';
import { Mic, Lock, Mail, User, AlertCircle, ArrowRight, CheckCircle2 } from 'lucide-react';
import { getAllUsers, hashPassword, saveUserAccount, setActiveUserEmail } from '../utils/storage';

interface AuthScreenProps {
  onSuccess: (email: string) => void;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({ onSuccess }) => {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [keepSignedIn, setKeepSignedIn] = useState(true);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedEmail) {
      setError('Please enter your email.');
      return;
    }

    if (mode === 'signup') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
      if (!emailRegex.test(trimmedEmail)) {
        setError('Please enter a valid email address.');
        return;
      }
    }

    if (password.length < 4) {
      setError('Password must be at least 4 characters.');
      return;
    }

    setIsLoading(true);

    try {
      const allUsers = getAllUsers();

      if (mode === 'signup') {
        if (allUsers[trimmedEmail]) {
          setError('An account with this email already exists. Please sign in instead.');
          setIsLoading(false);
          return;
        }

        if (password !== confirmPassword) {
          setError('Passwords do not match.');
          setIsLoading(false);
          return;
        }

        const salt = Math.random().toString(36).slice(2);
        const hash = await hashPassword(password, salt);

        saveUserAccount({
          email: trimmedEmail,
          name: name.trim() || trimmedEmail.split('@')[0],
          salt,
          hash,
          since: Date.now(),
        });

        if (keepSignedIn) {
          setActiveUserEmail(trimmedEmail);
        }
        onSuccess(trimmedEmail);
      } else {
        const user = allUsers[trimmedEmail];
        if (!user) {
          setError('Account not found. Create an account first.');
          setIsLoading(false);
          return;
        }

        const computedHash = await hashPassword(password, user.salt);
        if (computedHash !== user.hash) {
          setError('Invalid email or password.');
          setIsLoading(false);
          return;
        }

        if (keepSignedIn) {
          setActiveUserEmail(trimmedEmail);
        }
        onSuccess(trimmedEmail);
      }
    } catch (err: unknown) {
      const e = err as Error;
      setError(e.message || 'Authentication failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickDemo = async () => {
    const demoEmail = 'guest@speakup.local';
    const all = getAllUsers();
    if (!all[demoEmail]) {
      const salt = 'demo_salt';
      const hash = await hashPassword('demo123', salt);
      saveUserAccount({
        email: demoEmail,
        name: 'Guest Speaker',
        salt,
        hash,
        since: Date.now(),
      });
    }
    setActiveUserEmail(demoEmail);
    onSuccess(demoEmail);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[#f7f4ef]">
      <div className="w-full max-w-md bg-[#fffaf2] border border-[#dccfbd] rounded-3xl p-6 sm:p-8 shadow-xl">
        {/* Logo and title */}
        <div className="text-center mb-6">
          <div className="w-16 h-16 rounded-2xl bg-[#1d4e5f] text-white flex items-center justify-center mx-auto mb-3 shadow-lg">
            <Mic className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-extrabold text-[#2b2622] tracking-tight">SpeakUp</h1>
          <p className="text-sm text-[#74695c] mt-1">
            Your AI presentation & public speaking coach
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="grid grid-cols-2 p-1 bg-[#efe9df] rounded-2xl mb-6">
          <button
            type="button"
            onClick={() => {
              setMode('signin');
              setError('');
            }}
            className={`py-2 text-sm font-bold rounded-xl transition-all cursor-pointer ${
              mode === 'signin'
                ? 'bg-[#1d4e5f] text-white shadow-sm'
                : 'text-[#74695c] hover:text-[#2b2622]'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('signup');
              setError('');
            }}
            className={`py-2 text-sm font-bold rounded-xl transition-all cursor-pointer ${
              mode === 'signup'
                ? 'bg-[#1d4e5f] text-white shadow-sm'
                : 'text-[#74695c] hover:text-[#2b2622]'
            }`}
          >
            Create Account
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'signup' && (
            <div>
              <label className="block text-xs font-semibold text-[#74695c] uppercase tracking-wider mb-1">
                Your Full Name
              </label>
              <div className="relative">
                <User className="absolute left-3.5 top-3.5 w-4 h-4 text-[#74695c]" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Kasun Perera"
                  className="w-full pl-10 pr-4 py-2.5 bg-[#efe9df]/50 border border-[#dccfbd] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1d4e5f] focus:bg-white text-[#2b2622]"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-[#74695c] uppercase tracking-wider mb-1">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-3.5 w-4 h-4 text-[#74695c]" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                required
                className="w-full pl-10 pr-4 py-2.5 bg-[#efe9df]/50 border border-[#dccfbd] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1d4e5f] focus:bg-white text-[#2b2622]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#74695c] uppercase tracking-wider mb-1">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-3.5 w-4 h-4 text-[#74695c]" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full pl-10 pr-4 py-2.5 bg-[#efe9df]/50 border border-[#dccfbd] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1d4e5f] focus:bg-white text-[#2b2622]"
              />
            </div>
          </div>

          {mode === 'signup' && (
            <div>
              <label className="block text-xs font-semibold text-[#74695c] uppercase tracking-wider mb-1">
                Confirm Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-3.5 w-4 h-4 text-[#74695c]" />
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full pl-10 pr-4 py-2.5 bg-[#efe9df]/50 border border-[#dccfbd] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1d4e5f] focus:bg-white text-[#2b2622]"
                />
              </div>
            </div>
          )}

          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="keep"
              checked={keepSignedIn}
              onChange={(e) => setKeepSignedIn(e.target.checked)}
              className="w-4 h-4 accent-[#1d4e5f] rounded"
            />
            <label htmlFor="keep" className="text-xs text-[#74695c] cursor-pointer select-none">
              Keep me signed in on this device
            </label>
          </div>

          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2.5 text-xs text-rose-700">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-[#1d4e5f] hover:bg-[#163f4e] active:scale-[0.99] text-white py-3 rounded-xl font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {isLoading ? (
              'Please wait...'
            ) : (
              <>
                <span>{mode === 'signin' ? 'Sign In' : 'Create Account'}</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Guest Demo shortcut */}
        <div className="mt-5 pt-4 border-t border-[#dccfbd] text-center">
          <button
            type="button"
            onClick={handleQuickDemo}
            className="text-xs font-semibold text-[#1d4e5f] hover:underline cursor-pointer flex items-center justify-center gap-1.5 mx-auto"
          >
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>Continue as Guest Speaker</span>
          </button>

          <p className="text-[11px] text-[#74695c]/80 mt-3 leading-relaxed">
            Accounts and speech logs are kept on this device so each speaker maintains personal
            milestones without shared overwrite.
          </p>
        </div>
      </div>
    </div>
  );
};

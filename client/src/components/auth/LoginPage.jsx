import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, EyeOff, ArrowRight, WalletCards, AlertCircle } from 'lucide-react';
import { dashboardPathFor, useAuth } from '@/lib/AuthContext';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const user = await login({ email, password });
      navigate(dashboardPathFor(user.role), { replace: true });
    } catch (err) {
      setError(err.message || 'Unable to sign in. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const fillDemoCredentials = (role) => {
    const credentials = {
      admin: { email: 'admin@empay.com', password: 'admin123' },
      employee: { email: 'emp@empay.com', password: 'emp123' },
      hr: { email: 'hr@empay.com', password: 'hr123' },
      payroll: { email: 'payroll@empay.com', password: 'payroll123' },
    };

    const creds = credentials[role];
    if (creds) {
      setEmail(creds.email);
      setPassword(creds.password);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-[#f8f9ff] via-[#f0f2ff] to-[#f8f9ff] p-4 font-sans">

      {/* Logo & Header */}
      <div className="mb-8 flex flex-col items-center text-center">
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-white shadow-lg shadow-primary/30">
          <WalletCards className="h-6 w-6" />
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">EmPay</h1>
        <p className="mt-2 text-sm text-slate-500">The modern standard for HR & Payroll.</p>
      </div>

      <Card className="w-full max-w-[420px] rounded-2xl border-slate-100 p-2 shadow-xl shadow-slate-200/50">
        <CardContent className="p-6">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-slate-900">Welcome back</h2>
            <p className="mt-1 text-sm text-slate-500">Please enter your details to sign in.</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            {error && (
              <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-medium text-rose-700 flex items-center gap-2">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                {error}
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-xs font-semibold text-slate-700">Email address</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input
                  id="email"
                  type="email"
                  placeholder="alex@company.com"
                  className="pl-10 bg-slate-50 border-slate-200 focus:bg-white"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-xs font-semibold text-slate-700">Password</Label>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  className="pl-10 pr-10 bg-slate-50 border-slate-200 focus:bg-white text-lg tracking-widest placeholder:tracking-normal"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  <EyeOff className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="flex items-center space-x-2 pb-2">
              <input
                type="checkbox"
                id="remember"
                className="h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary"
              />
              <label htmlFor="remember" className="text-sm text-slate-600">
                Keep me signed in
              </label>
            </div>

            <Button className="w-full bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/25 h-11 text-base font-medium" type="submit" disabled={loading}>
              {loading ? 'Signing in...' : (
                <>
                  Sign In <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          </form>

          {/* Demo Credentials Section */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200"></div>
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-4 text-slate-400 font-medium">Demo Credentials</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 mb-6">
            <Button
              type="button"
              variant="outline"
              className="h-9 text-xs bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200"
              onClick={() => fillDemoCredentials('admin')}
            >
              Admin
            </Button>
            <Button
              type="button"
              variant="outline"
              className="h-9 text-xs bg-green-50 hover:bg-green-100 text-green-700 border-green-200"
              onClick={() => fillDemoCredentials('employee')}
            >
              Employee
            </Button>
            <Button
              type="button"
              variant="outline"
              className="h-9 text-xs bg-purple-50 hover:bg-purple-100 text-purple-700 border-purple-200"
              onClick={() => fillDemoCredentials('hr')}
            >
              HR
            </Button>
            <Button
              type="button"
              variant="outline"
              className="h-9 text-xs bg-orange-50 hover:bg-orange-100 text-orange-700 border-orange-200"
              onClick={() => fillDemoCredentials('payroll')}
            >
              Payroll
            </Button>
          </div>

          <div className="text-center text-xs text-slate-500 pb-4 border-b border-slate-200">
            👆 Click a role above to auto-fill demo credentials
          </div>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200"></div>
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-4 text-slate-400 font-medium">Other Options</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Button variant="outline" className="h-11 bg-white hover:bg-slate-50 text-slate-700 font-medium">
              <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
              </svg>
              Google
            </Button>
            <Button variant="outline" className="h-11 bg-white hover:bg-slate-50 text-slate-700 font-medium">
              <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                <line x1="9" y1="3" x2="9" y2="21" />
              </svg>
              SSO
            </Button>
          </div>

          <div className="mt-8 text-center text-xs text-slate-500">
            First time? Contact admin to create your account.
          </div>
        </CardContent>
      </Card>

      {/* API Status Indicator */}
      <div className="mt-6 text-center text-xs text-slate-500 max-w-[420px]">
        <p>Backend API: <span className="text-emerald-600 font-semibold">http://localhost:5000</span></p>
        <p>Frontend: <span className="text-blue-600 font-semibold">http://localhost:5173</span></p>
      </div>
    </div>
  );
};

export default LoginPage;
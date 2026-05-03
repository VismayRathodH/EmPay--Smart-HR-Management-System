import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { api, authStorage } from './api';

const AuthContext = createContext(null);

const rolePath = {
  Admin: '/dashboard/admin',
  HR: '/dashboard/hr',
  'Payroll Officer': '/dashboard/payroll',
  Employee: '/dashboard/employee',
  'AI Analyst': '/dashboard/ai',
};

export function dashboardPathFor(role) {
  if (!role) return '/dashboard/employee';
  const path = rolePath[role];
  return path || '/dashboard/employee';
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => authStorage.getUser());
  const [booting, setBooting] = useState(Boolean(authStorage.getToken()));
  const [error, setError] = useState(null);

  useEffect(() => {
    let active = true;

    async function restoreSession() {
      if (!authStorage.getToken()) {
        setBooting(false);
        return;
      }

      try {
        const profile = await api.me();
        if (active) {
          authStorage.setSession({ token: authStorage.getToken(), user: profile });
          setUser(profile);
          setError(null);
        }
      } catch (err) {
        console.error('Session restore error:', err);
        authStorage.clearSession();
        if (active) {
          setUser(null);
          setError(err.message);
        }
      } finally {
        if (active) setBooting(false);
      }
    }

    restoreSession();
    return () => {
      active = false;
    };
  }, []);

  const value = useMemo(() => ({
    user,
    booting,
    error,
    isAuthenticated: Boolean(user && authStorage.getToken()),
    async login(credentials) {
      try {
        console.log('Logging in with:', credentials.email);
        const session = await api.login(credentials);
        console.log('Login successful:', session);
        authStorage.setSession({ token: session.token, user: session.user });
        setUser(session.user);
        setError(null);
        return session.user;
      } catch (err) {
        console.error('Login error:', err);
        setError(err.message);
        throw err;
      }
    },
    logout() {
      console.log('Logging out');
      authStorage.clearSession();
      setUser(null);
      setError(null);
    },
  }), [user, booting, error]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}

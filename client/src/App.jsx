import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  CalendarCheck,
  CalendarOff,
  Banknote,
  Bell,
  Settings,
  HelpCircle,
  WalletCards,
  AlertCircle,
  Wifi,
  WifiOff
} from 'lucide-react';

import LoginPage from './components/auth/LoginPage';
import Dashboard from './pages/Dashboard';
import AdminDashboard from './components/auth/dashboard/AdminDashboard';
import HRDashboard from './components/auth/dashboard/HRDashboard';
import PayrollDashboard from './components/auth/dashboard/PayrollDashboard';
import EmployeeDashboard from './components/auth/dashboard/EmployeeDashboard';
import AIInsightsDashboard from './components/auth/dashboard/AIInsightsDashboard';
import AttendancePage from './pages/AttendancePage';
import LeaveManagement from './components/auth/dashboard/LeaveManagement';
import EmployeesPage from './pages/EmployeesPage';
import EmployeeProfile from './components/employees/EmployeeProfile';
import PayslipView from './components/payroll/PayslipView';
import SettingsPage from './pages/SettingsPage';
import ProfilePage from './pages/ProfilePage';
import HelpCenterPage from './pages/HelpCenterPage';
import { AuthProvider, dashboardPathFor, useAuth } from './lib/AuthContext';
import { api } from './lib/api';

// API Health Check Component
function ApiHealthCheck() {
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    const checkHealth = async () => {
      try {
        await api.health();
        setIsOnline(true);
      } catch (err) {
        setIsOnline(false);
      }
    };

    checkHealth();
    const interval = setInterval(checkHealth, 10000);
    return () => clearInterval(interval);
  }, []);

  if (!isOnline) {
    return (
      <div className="fixed bottom-4 right-4 flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg shadow-lg text-sm">
        <WifiOff className="h-4 w-4" />
        Backend offline - Check terminal
      </div>
    );
  }

  return null;
}

function Layout({ children }) {
  const location = useLocation();
  const { user, logout } = useAuth();

  const navItems = [
    { name: 'Dashboard', path: dashboardPathFor(user?.role) || '/dashboard/employee', icon: LayoutDashboard },
    { name: 'Employees', path: '/employees', icon: Users },
    { name: 'Attendance', path: '/attendance', icon: CalendarCheck },
    { name: 'Leave', path: '/leave', icon: CalendarOff },
    ...(user?.role !== 'Employee' ? [{ name: 'Payroll', path: '/dashboard/payroll', icon: Banknote }] : []),
  ];

  return (
    <div className="flex h-screen overflow-hidden bg-[#F8FAFC]">
      {/* Sidebar */}
      <aside className="w-64 flex-shrink-0 border-r bg-white/70 backdrop-blur-md flex flex-col justify-between z-20">
        <div>
          <div className="h-16 flex items-center px-6 border-b border-transparent">
            <div className="flex items-center gap-2 text-primary">
              <WalletCards className="h-6 w-6" />
              <span className="text-xl font-bold text-slate-900 tracking-tight">EmPay</span>
            </div>
          </div>
          <div className="px-3 py-6 space-y-1">
            {navItems.map((item) => {
              const isActive = location.pathname.includes(item.path);
              return (
                <Link
                  key={item.name}
                  to={item.path}
                  className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${isActive
                    ? 'bg-primary/10 text-primary border-l-4 border-primary'
                    : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50 border-l-4 border-transparent'
                    }`}
                >
                  <item.icon className={`h-5 w-5 ${isActive ? 'text-primary' : 'text-slate-400'}`} />
                  {item.name}
                </Link>
              );
            })}
          </div>
        </div>
        <div className="p-4 space-y-1">
          <Link to="/help" className="flex items-center gap-3 px-3 py-2 text-sm font-medium text-slate-500 hover:text-slate-900 hover:bg-slate-50 rounded-md transition-colors">
            <HelpCircle className="h-5 w-5 text-slate-400" />
            Help Center
          </Link>
          <Link to="/settings" className="flex items-center gap-3 px-3 py-2 text-sm font-medium text-slate-500 hover:text-slate-900 hover:bg-slate-50 rounded-md transition-colors">
            <Settings className="h-5 w-5 text-slate-400" />
            Settings
          </Link>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Header */}
        <header className="h-16 flex items-center justify-end px-8 bg-white/70 backdrop-blur-md border-b sticky top-0 z-10">
          <div className="flex items-center gap-4">
            <button className="text-slate-400 hover:text-slate-600 transition-colors">
              <Bell className="h-5 w-5" />
            </button>
            <Link to="/settings" className="text-slate-400 hover:text-slate-600 transition-colors">
              <Settings className="h-5 w-5" />
            </Link>
            <div className="h-6 w-px bg-slate-200 mx-2"></div>
            <Link to="/profile" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-medium text-slate-900 leading-none">{user?.full_name || 'EmPay User'}</p>
                <p className="text-xs text-slate-500 mt-1">{user?.role || 'Employee'}</p>
              </div>
              <div className="h-9 w-9 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold overflow-hidden border border-primary/10">
                {(user?.full_name || user?.email || 'EU').split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase()}
              </div>
            </Link>
            <button onClick={logout} className="text-xs font-semibold text-slate-500 hover:text-slate-900">
              Sign out
            </button>
          </div>
        </header>

        {/* Scrollable Content */}
        <main className="flex-1 overflow-y-auto p-8">
          {children}
        </main>
      </div>
    </div>
  );
}

function ProtectedRoute({ children }) {
  const { booting, isAuthenticated } = useAuth();

  if (booting) {
    return (
      <div className="min-h-screen bg-slate-50 p-8 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block">
            <div className="h-12 w-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          </div>
          <p className="text-sm font-medium text-slate-500">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return children;
}

function LoginRoute() {
  const { booting, isAuthenticated, user } = useAuth();

  if (booting) {
    return (
      <div className="min-h-screen bg-slate-50 p-8 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block">
            <div className="h-12 w-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          </div>
          <p className="text-sm font-medium text-slate-500">Checking session...</p>
        </div>
      </div>
    );
  }

  if (isAuthenticated && user) {
    return <Navigate to={dashboardPathFor(user?.role)} replace />;
  }

  return <LoginPage />;
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <ApiHealthCheck />
        <Routes>
          <Route path="/" element={<LoginRoute />} />

          {/* Dashboard Routes via Wrapper */}
          <Route path="/dashboard/admin" element={<ProtectedRoute><Layout><AdminDashboard /></Layout></ProtectedRoute>} />
          <Route path="/dashboard/hr" element={<ProtectedRoute><Layout><HRDashboard /></Layout></ProtectedRoute>} />
          <Route path="/dashboard/payroll" element={<ProtectedRoute><Layout><PayrollDashboard /></Layout></ProtectedRoute>} />
          <Route path="/dashboard/employee" element={<ProtectedRoute><Layout><EmployeeDashboard /></Layout></ProtectedRoute>} />
          <Route path="/dashboard/ai" element={<ProtectedRoute><Layout><AIInsightsDashboard /></Layout></ProtectedRoute>} />

          {/* Other Routes */}
          <Route path="/attendance" element={<ProtectedRoute><Layout><AttendancePage /></Layout></ProtectedRoute>} />
          <Route path="/leave" element={<ProtectedRoute><Layout><LeaveManagement /></Layout></ProtectedRoute>} />
          <Route path="/employees" element={<ProtectedRoute><Layout><EmployeesPage /></Layout></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><Layout><ProfilePage /></Layout></ProtectedRoute>} />
          <Route path="/settings" element={<ProtectedRoute><Layout><SettingsPage /></Layout></ProtectedRoute>} />
          <Route path="/help" element={<ProtectedRoute><Layout><HelpCenterPage /></Layout></ProtectedRoute>} />
          <Route path="/payslip" element={<ProtectedRoute><Layout><PayslipView /></Layout></ProtectedRoute>} />

          {/* Catch all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;


import React from 'react';
import { useAuth } from '../lib/AuthContext';
import AdminDashboard from '../components/auth/dashboard/AdminDashboard';
import HRDashboard from '../components/auth/dashboard/HRDashboard';
import PayrollDashboard from '../components/auth/dashboard/PayrollDashboard';
import EmployeeDashboard from '../components/auth/dashboard/EmployeeDashboard';
import AIInsightsDashboard from '../components/auth/dashboard/AIInsightsDashboard';

const Dashboard = () => {
  const { user } = useAuth();
  const role = user?.role?.toLowerCase() || 'employee';

  // Role-based rendering logic
  if (role.includes('admin')) {
    return <AdminDashboard />;
  } else if (role.includes('hr')) {
    return <HRDashboard />;
  } else if (role.includes('payroll')) {
    return <PayrollDashboard />;
  } else if (role.includes('ai')) {
    return <AIInsightsDashboard />;
  } else {
    return <EmployeeDashboard />;
  }
};

export default Dashboard;

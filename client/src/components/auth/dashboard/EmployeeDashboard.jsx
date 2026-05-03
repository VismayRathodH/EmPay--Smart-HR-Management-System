import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users, CalendarCheck, Wallet, Calendar, Lightbulb, AlertCircle, Download, FileText } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/AuthContext';

const EmployeeDashboard = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalEmployees: 0,
    presentToday: 0,
    leavesAvailable: 0,
    nextPayslip: null,
  });
  const [attendance, setAttendance] = useState([]);
  const [leaves, setLeaves] = useState([]);
  const [error, setError] = useState('');
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    const loadDashboardData = async () => {
      setLoading(true);
      setError('');
      try {
        // Fetch all employees for total count
        const employeesData = await api.employees();
        
        // Fetch attendance logs for today using local date
        const today = new Date().toLocaleDateString('en-CA');
        const todayLogs = await api.attendanceLogs({ attendance_date: today });
        
        // Fetch personal attendance logs for the "Recent Attendance" table
        const myLogs = await api.attendanceLogs();
        
        // Fetch leave requests for current user
        const leaveRequests = await api.leaveRequests();
        
        // Fetch payslips and find current month's one
        const payslips = await api.payslips();
        const now = new Date();
        const currentMonthPayslip = payslips.find(p => p.month === (now.getMonth() + 1) && p.year === now.getFullYear());

        setStats({
          totalEmployees: employeesData.length,
          presentToday: todayLogs.filter(a => a.check_in_time).length,
          leavesAvailable: 18, // Default annual leave
          nextPayslip: currentMonthPayslip || null,
        });

        setAttendance(myLogs.slice(0, 5));
        setLeaves(leaveRequests.slice(0, 5));
      } catch (err) {
        setError(err.message || 'Failed to load dashboard data');
        console.error('Dashboard error:', err);
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="space-y-8">
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-4 md:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <Skeleton className="h-20 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">My Dashboard</h1>
        <p className="text-sm text-slate-500 mt-1">Welcome back, {user?.full_name || 'Employee'}</p>
      </div>

      {error && (
        <div className="rounded-lg border border-yellow-200 bg-yellow-50 px-4 py-3 text-sm font-medium text-yellow-700 flex items-center gap-2">
          <AlertCircle className="h-4 w-4" />
          {error}
        </div>
      )}

      {/* Top Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-none shadow-sm rounded-2xl">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div className="h-10 w-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <Users className="h-5 w-5" />
              </div>
              <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">Company</span>
            </div>
            <div className="mt-4 text-sm font-medium text-slate-500">Total Employees</div>
            <div className="text-3xl font-bold text-slate-900 mt-1">{stats.totalEmployees}</div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm rounded-2xl">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div className="h-10 w-10 rounded-xl bg-green-50 text-green-600 flex items-center justify-center">
                <CalendarCheck className="h-5 w-5" />
              </div>
              <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">Today</span>
            </div>
            <div className="mt-4 text-sm font-medium text-slate-500">Present</div>
            <div className="text-3xl font-bold text-slate-900 mt-1">{stats.presentToday}</div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm rounded-2xl">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div className="h-10 w-10 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center">
                <Calendar className="h-5 w-5" />
              </div>
              <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">Available</span>
            </div>
            <div className="mt-4 text-sm font-medium text-slate-500">Leaves Available</div>
            <div className="text-3xl font-bold text-slate-900 mt-1">{stats.leavesAvailable}</div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm rounded-2xl">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div className="h-10 w-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                <Wallet className="h-5 w-5" />
              </div>
              <span className={`text-xs font-medium px-2 py-1 rounded-full ${stats.nextPayslip ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                {stats.nextPayslip ? 'Current Month' : 'Next Month'}
              </span>
            </div>
            <div className="mt-4 text-sm font-medium text-slate-500">Salary Status</div>
            <div className="text-3xl font-bold text-slate-900 mt-1">
              {stats.nextPayslip ? 'Paid' : 'Pending'}
            </div>
            {stats.nextPayslip && (
              <Button 
                variant="ghost" 
                size="sm" 
                className="mt-4 w-full justify-start text-primary hover:bg-primary/5 h-9 rounded-xl gap-2 font-semibold"
                onClick={async () => {
                  try {
                    setDownloading(true);
                    await api.downloadPayslipPdf(stats.nextPayslip.id);
                  } catch (err) {
                    setError('Failed to download payslip');
                  } finally {
                    setDownloading(false);
                  }
                }}
                disabled={downloading}
              >
                <Download className="h-4 w-4" />
                {downloading ? 'Downloading...' : 'Download Payslip'}
              </Button>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions & Details */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent Attendance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {attendance.length > 0 ? (
                attendance.map((record) => (
                  <div key={record.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                    <div>
                      <p className="text-sm font-medium">{record.attendance_date}</p>
                      <p className="text-xs text-slate-500">Check-in: {record.check_in_time ? new Date(record.check_in_time).toLocaleTimeString() : 'N/A'}</p>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full ${record.check_in_time ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {record.check_in_time ? 'Present' : 'Absent'}
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground text-center py-6">No attendance data</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>My Leave Requests</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {leaves.length > 0 ? (
                leaves.map((leave) => (
                  <div key={leave.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                    <div>
                      <p className="text-sm font-medium">{leave.leave_type}</p>
                      <p className="text-xs text-slate-500">{leave.start_date} to {leave.end_date}</p>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      leave.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                      leave.status === 'approved' ? 'bg-green-100 text-green-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {leave.status}
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground text-center py-6">No leave requests</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* AI Insights */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-blue-600" />
            <CardTitle>AI Insights</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-slate-600">
            Your attendance is looking great! Keep up the consistency. Don't forget to plan your leaves for the upcoming quarter.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default EmployeeDashboard;

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import AttendanceBarChart from '../../charts/AttendanceBarChart';
import LeavePieChart from '../../charts/LeavePieChart';
import { Users, UserCheck, CalendarOff, IndianRupee, TrendingUp, AlertCircle } from 'lucide-react';
import { api } from '@/lib/api';
import { Skeleton } from '@/components/ui/skeleton';

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    totalEmployees: 0,
    presentToday: 0,
    onLeave: 0,
    payrollEstimate: 0,
  });
  const [attendanceData, setAttendanceData] = useState([]);
  const [leaveData, setLeaveData] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadDashboardData = async () => {
      setLoading(true);
      setError('');
      try {
        // Fetch employees
        const employeesData = await api.employees();
        setEmployees(employeesData);

        // Fetch attendance logs for today using local date
        const today = new Date().toLocaleDateString('en-CA');
        const attendanceLogs = await api.attendanceLogs({
          attendance_date: today,
        });

        // Fetch leave requests
        const leaveRequests = await api.leaveRequests();
        setLeaves(leaveRequests);

        // Fetch payruns for actual payroll data
        const payruns = await api.payruns();
        const latestPayrun = payruns.find(p => p.status === 'completed');

        // Calculate stats
        const presentCount = attendanceLogs.filter(a => a.check_in_time).length;
        const onLeaveCount = leaveRequests.filter(l => l.status === 'approved').length;
        const payrollValue = latestPayrun ? latestPayrun.total_net_pay : 0;

        setStats({
          totalEmployees: employeesData.length,
          presentToday: presentCount,
          onLeave: onLeaveCount,
          payrollEstimate: payrollValue,
        });

        // Mock attendance data for chart
        setAttendanceData([
          { name: 'Jan', attendance: 95 },
          { name: 'Feb', attendance: 92 },
          { name: 'Mar', attendance: 96 },
          { name: 'Apr', attendance: 94 },
          { name: 'May', attendance: 98 },
          { name: 'Jun', attendance: 91 },
        ]);

        // Group leaves by type for pie chart
        const leaveTypes = {};
        leaveRequests.forEach(leave => {
          leaveTypes[leave.leave_type] = (leaveTypes[leave.leave_type] || 0) + 1;
        });

        setLeaveData(
          Object.entries(leaveTypes).map(([type, count]) => ({
            name: type,
            value: count,
          }))
        );
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
      <div className="p-6 space-y-6">
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
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
          <p className="text-sm text-slate-500 mt-1">Complete system overview and management</p>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-yellow-200 bg-yellow-50 px-4 py-3 text-sm font-medium text-yellow-700 flex items-center gap-2">
          <AlertCircle className="h-4 w-4" />
          {error}
        </div>
      )}

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Employees</CardTitle>
            <Users className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalEmployees}</div>
            <p className="text-xs text-muted-foreground">Active employees</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Present Today</CardTitle>
            <UserCheck className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.presentToday}</div>
            <p className="text-xs text-muted-foreground">
              {stats.totalEmployees > 0
                ? `${Math.round((stats.presentToday / stats.totalEmployees) * 100)}% attendance rate`
                : 'No data'}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">On Leave</CardTitle>
            <CalendarOff className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.onLeave}</div>
            <p className="text-xs text-muted-foreground">Approved leaves</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Monthly Payroll</CardTitle>
            <IndianRupee className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{(stats.payrollEstimate / 100000).toFixed(1)}L</div>
            <p className="text-xs text-muted-foreground">Estimated payout</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Monthly Attendance (%)</CardTitle>
          </CardHeader>
          <CardContent>
            {attendanceData.length > 0 ? (
              <AttendanceBarChart data={attendanceData} />
            ) : (
              <p className="text-sm text-muted-foreground text-center py-6">No attendance data available</p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Leave Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            {leaveData.length > 0 ? (
              <LeavePieChart data={leaveData} />
            ) : (
              <p className="text-sm text-muted-foreground text-center py-6">No leave data available</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Leave Requests</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {leaves.slice(0, 5).length > 0 ? (
              leaves.slice(0, 5).map((leave) => (
                <div key={leave.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                  <div>
                    <p className="text-sm font-medium">{leave.employee?.user?.full_name || 'Unknown'}</p>
                    <p className="text-xs text-slate-500">{leave.leave_type} - {leave.status}</p>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full ${leave.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                      leave.status === 'approved' ? 'bg-green-100 text-green-700' :
                        'bg-red-100 text-red-700'
                    }`}>
                    {leave.status}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground text-center py-6">No recent leave requests</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminDashboard;
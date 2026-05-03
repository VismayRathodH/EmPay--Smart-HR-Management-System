import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Link } from 'react-router-dom';
import { Users, UserCheck, CalendarOff, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { api } from '@/lib/api';
import { Skeleton } from '@/components/ui/skeleton';

const HRDashboard = () => {
  const [stats, setStats] = useState({
    headcount: 0,
    attendanceToday: 0,
    leavesPending: 0,
    openQueries: 0,
  });
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadDashboardData = async () => {
      setLoading(true);
      setError('');
      try {
        // Fetch employees
        const employeesData = await api.employees();
        
        // Fetch attendance logs for today using local date
        const today = new Date().toLocaleDateString('en-CA');
        const attendanceLogs = await api.attendanceLogs({
          attendance_date: today,
        });
        
        // Fetch leave requests
        const leaves = await api.leaveRequests();
        const pendingLeaves = leaves.filter(l => l.status === 'pending');

        setStats({
          headcount: employeesData.length,
          attendanceToday: attendanceLogs.filter(a => a.check_in_time).length,
          leavesPending: pendingLeaves.length,
          openQueries: 3, // Placeholder
        });

        setLeaveRequests(leaves);
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
          <h1 className="text-3xl font-bold tracking-tight">HR Dashboard</h1>
          <p className="text-sm text-slate-500 mt-1">Manage employees, attendance, and leave requests</p>
        </div>
        <Link to="/employees">
          <Button>Employee Directory</Button>
        </Link>
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
            <CardTitle className="text-sm font-medium">Headcount</CardTitle>
            <Users className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.headcount}</div>
            <p className="text-xs text-muted-foreground">Active employees</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Attendance Today</CardTitle>
            <UserCheck className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.attendanceToday}</div>
            <p className="text-xs text-muted-foreground">
              {stats.headcount > 0 ? `${Math.round((stats.attendanceToday / stats.headcount) * 100)}% rate` : 'No data'}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Leaves Pending</CardTitle>
            <CalendarOff className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.leavesPending}</div>
            <p className="text-xs text-muted-foreground">Awaiting approval</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Open Queries</CardTitle>
            <AlertCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.openQueries}</div>
            <p className="text-xs text-muted-foreground">Pending resolution</p>
          </CardContent>
        </Card>
      </div>

      {/* Leave Requests Table */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Leave Requests</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b">
                <tr>
                  <th className="text-left py-2 px-2 font-medium">Employee</th>
                  <th className="text-left py-2 px-2 font-medium">Type</th>
                  <th className="text-left py-2 px-2 font-medium">Duration</th>
                  <th className="text-left py-2 px-2 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {leaveRequests.slice(0, 10).map((leave) => (
                  <tr key={leave.id} className="border-b hover:bg-slate-50">
                    <td className="py-3 px-2">{leave.employee?.user?.full_name || 'Unknown'}</td>
                    <td className="py-3 px-2">{leave.leave_type}</td>
                    <td className="py-3 px-2 text-xs">
                      {leave.start_date} to {leave.end_date}
                    </td>
                    <td className="py-3 px-2">
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        leave.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                        leave.status === 'approved' ? 'bg-green-100 text-green-700' :
                        'bg-red-100 text-red-700'
                      }`}>
                        {leave.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {leaveRequests.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-6">No leave requests found</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default HRDashboard;

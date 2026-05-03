import React, { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Clock, CalendarX, Timer, Download } from 'lucide-react';
import { api } from '@/lib/api';

const formatTime = (value) => {
  if (!value) return '-';
  return new Intl.DateTimeFormat('en-US', { hour: '2-digit', minute: '2-digit' }).format(new Date(value));
};

const durationFor = (start, end) => {
  if (!start || !end) return '0h 0m';
  const minutes = Math.max(0, Math.round((new Date(end) - new Date(start)) / 60000));
  return `${Math.floor(minutes / 60)}h ${minutes % 60}m`;
};

const AttendancePage = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState('');
  const [error, setError] = useState('');
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [todayAttendance, setTodayAttendance] = useState(null);

  const loadLogs = async () => {
    setLoading(true);
    setError('');
    try {
      const now = new Date();
      const data = await api.attendanceLogs({ month: now.getMonth() + 1, year: now.getFullYear() });
      setLogs(data);
    } catch (err) {
      setError(err.message || 'Unable to load attendance logs.');
    } finally {
      setLoading(false);
    }
  };

  const loadTodayAttendance = async () => {
    try {
      const data = await api.getTodayAttendance();
      setTodayAttendance(data);
    } catch (err) {
      setTodayAttendance(null);
    }
  };

  useEffect(() => {
    loadLogs();
    loadTodayAttendance();
  }, []);

  const handleMarkAttendance = async (action) => {
    if (action === 'check_out' && !isConfirmOpen) {
      setIsConfirmOpen(true);
      return;
    }

    setIsConfirmOpen(false);
    setActionLoading(action);
    setError('');
    try {
      await api.markAttendance({ action });
      await loadLogs();
      await loadTodayAttendance();
    } catch (err) {
      setError(err.message || 'Unable to update attendance.');
    } finally {
      setActionLoading('');
    }
  };

  const stats = useMemo(() => {
    const present = logs.filter((log) => log.check_in_time).length;
    const completed = logs.filter((log) => log.check_in_time && log.check_out_time).length;
    return {
      present,
      completed,
      total: logs.length,
      open: Math.max(0, present - completed),
    };
  }, [logs]);

  const exportCSV = () => {
    if (!logs.length) return;
    const headers = ['Date', 'Employee', 'Check-in', 'Check-out', 'Total Hours', 'Status'];
    const rows = logs.map(log => [
      log.attendance_date,
      log.employee?.employee_code || log.employee_id,
      formatTime(log.check_in_time),
      formatTime(log.check_out_time),
      durationFor(log.check_in_time, log.check_out_time),
      log.check_out_time ? 'Checked Out' : (log.check_in_time ? 'Checked In' : 'Absent')
    ]);
    const csvContent = [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'attendance_export.csv';
    link.click();
  };

  return (
    <div className="space-y-6 relative">
      {/* Custom Confirmation Modal */}
      {isConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <Card className="w-[340px] border-none shadow-2xl rounded-2xl p-6 animate-in zoom-in-95 duration-200">
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="h-12 w-12 rounded-full bg-amber-50 text-amber-500 flex items-center justify-center">
                <Clock className="h-6 w-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-bold text-slate-900">Confirm Checkout</h3>
                <p className="text-sm text-slate-500 px-2">Do you want to checkout for today? This will record your finish time.</p>
              </div>
              <div className="flex w-full gap-3 pt-2">
                <Button variant="outline" className="flex-1 rounded-xl h-11 font-semibold" onClick={() => setIsConfirmOpen(false)}>
                  No
                </Button>
                <Button className="flex-1 bg-primary hover:bg-primary/90 text-white rounded-xl h-11 font-semibold shadow-lg shadow-primary/20" onClick={() => handleMarkAttendance('check_out')}>
                  Yes
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Attendance Records</h1>
          <p className="text-sm text-slate-500 mt-1">Live attendance logs from the EmPay backend.</p>
        </div>
        <div className="flex gap-3">
          {(!todayAttendance || !todayAttendance.check_in_time) && (
            <Button
              onClick={() => handleMarkAttendance('check_in')}
              disabled={Boolean(actionLoading)}
              className="bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20 rounded-xl px-6 h-11 font-semibold transition-all active:scale-95"
            >
              {actionLoading === 'check_in' ? 'Checking in...' : 'Check In'}
            </Button>
          )}
          {todayAttendance && todayAttendance.check_in_time && !todayAttendance.check_out_time && (
            <Button
              variant="outline"
              onClick={() => handleMarkAttendance('check_out')}
              disabled={Boolean(actionLoading)}
              className="border-primary/20 hover:bg-primary/5 text-primary rounded-xl px-6 h-11 font-semibold transition-all active:scale-95"
            >
              {actionLoading === 'check_out' ? 'Checking out...' : 'Check Out'}
            </Button>
          )}
          {todayAttendance && todayAttendance.check_in_time && todayAttendance.check_out_time && (
            <div className="flex items-center gap-2 text-sm font-medium text-emerald-600 bg-emerald-50 px-4 py-2 rounded-xl">
              <CheckCircle2 className="h-5 w-5" />
              Checked Out
            </div>
          )}
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
          {error}
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-none shadow-sm rounded-2xl">
          <CardContent className="p-6">
            <CheckCircle2 className="h-5 w-5 text-emerald-500 mb-4" />
            <p className="text-sm font-medium text-slate-500">Present Days</p>
            <div className="text-3xl font-bold text-slate-900 mt-1">{stats.present}</div>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm rounded-2xl">
          <CardContent className="p-6">
            <Clock className="h-5 w-5 text-amber-500 mb-4" />
            <p className="text-sm font-medium text-slate-500">In Progress</p>
            <div className="text-3xl font-bold text-slate-900 mt-1">{stats.open}</div>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm rounded-2xl">
          <CardContent className="p-6">
            <CalendarX className="h-5 w-5 text-rose-500 mb-4" />
            <p className="text-sm font-medium text-slate-500">Checked Out Days</p>
            <div className="text-3xl font-bold text-slate-900 mt-1">{stats.completed}</div>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm rounded-2xl">
          <CardContent className="p-6">
            <Timer className="h-5 w-5 text-indigo-500 mb-4" />
            <p className="text-sm font-medium text-slate-500">Total Logs</p>
            <div className="text-3xl font-bold text-slate-900 mt-1">{stats.total}</div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-none shadow-sm rounded-2xl overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Monthly Attendance</CardTitle>
          <Button variant="outline" size="sm" onClick={exportCSV}>
            <Download className="mr-2 h-4 w-4" /> Export
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50/50">
                <tr className="border-b border-slate-100">
                  <th className="text-xs font-bold text-slate-500 uppercase tracking-wider h-12 pl-6">Date</th>
                  <th className="text-xs font-bold text-slate-500 uppercase tracking-wider h-12">Employee</th>
                  <th className="text-xs font-bold text-slate-500 uppercase tracking-wider h-12">Check-in</th>
                  <th className="text-xs font-bold text-slate-500 uppercase tracking-wider h-12">Check-out</th>
                  <th className="text-xs font-bold text-slate-500 uppercase tracking-wider h-12">Total Hours</th>
                  <th className="text-xs font-bold text-slate-500 uppercase tracking-wider h-12 pr-6">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr><td colSpan={6} className="py-10 text-center text-sm text-slate-500">Loading attendance...</td></tr>
                ) : logs.length > 0 ? logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-4 pl-6 text-sm font-semibold text-slate-900">{log.attendance_date}</td>
                    <td className="py-4 text-sm text-slate-600">{log.employee?.employee_code || log.employee_id}</td>
                    <td className="py-4 text-sm text-slate-600">{formatTime(log.check_in_time)}</td>
                    <td className="py-4 text-sm text-slate-600">{formatTime(log.check_out_time)}</td>
                    <td className="py-4 text-sm text-slate-600">{durationFor(log.check_in_time, log.check_out_time)}</td>
                    <td className="py-4 pr-6">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider ${
                        log.check_out_time ? 'bg-indigo-50 text-indigo-600' : 
                        log.check_in_time ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'
                      }`}>
                        {log.check_out_time ? 'Checked Out' : 
                         log.check_in_time ? 'Checked In' : 'Absent'}
                      </span>
                    </td>
                  </tr>
                )) : (
                  <tr><td colSpan={6} className="py-10 text-center text-sm text-slate-500">No attendance records found.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AttendancePage;

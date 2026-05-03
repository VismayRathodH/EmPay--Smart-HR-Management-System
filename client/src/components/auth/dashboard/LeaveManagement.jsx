import React, { useEffect, useMemo, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { CalendarCheck, CalendarRange, Clock, Send, Info, Check, X } from 'lucide-react';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/AuthContext';

const LeaveManagement = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [requests, setRequests] = useState([]);
  const [form, setForm] = useState({
    leave_type: 'Annual',
    start_date: '',
    end_date: '',
    reason: '',
  });

  const loadRequests = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await api.leaveRequests();
      setRequests(data);
    } catch (err) {
      setError(err.message || 'Unable to load leave requests.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRequests();
  }, []);

  const updateField = (field, value) => setForm((current) => ({ ...current, [field]: value }));

  const submitLeave = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    try {
      await api.applyLeave(form);
      setForm({ leave_type: 'Annual', start_date: '', end_date: '', reason: '' });
      await loadRequests();
    } catch (err) {
      setError(err.message || 'Unable to submit leave request.');
    } finally {
      setSaving(false);
    }
  };

  const updateRequest = async (id, action) => {
    setError('');
    try {
      await api.updateLeave(id, action);
      await loadRequests();
    } catch (err) {
      setError(err.message || `Unable to ${action} leave request.`);
    }
  };

  const pendingRequests = requests.filter((request) => request.status === 'Pending');
  const recentRequests = useMemo(() => requests.slice(0, 6), [requests]);
  const canApprove = user?.role === 'Payroll Officer' || user?.role === 'Admin';

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Leave Management</h1>
          <p className="text-sm text-slate-500 mt-1">Track balances, request time off, and manage team approvals.</p>
        </div>
        <div className="bg-white px-4 py-2.5 rounded-xl border border-slate-100 shadow-sm flex items-center gap-3">
          <div className="bg-primary/10 p-2 rounded-lg text-primary">
            <CalendarRange className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Requests</p>
            <p className="text-sm font-bold text-slate-900">{pendingRequests.length} Pending</p>
          </div>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
          {error}
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-3">
        <div className="space-y-6">
          <Card className="border-none shadow-sm rounded-2xl">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg flex items-center gap-2">
                <CalendarCheck className="h-5 w-5 text-primary" /> Request Leave
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-4">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-24 w-full" />
                </div>
              ) : (
                <form onSubmit={submitLeave} className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">Leave Type</Label>
                    <select value={form.leave_type} onChange={(event) => updateField('leave_type', event.target.value)} className="w-full border border-slate-200 text-sm font-medium text-slate-700 py-2.5 px-3 rounded-lg outline-none focus:border-primary focus:ring-1 focus:ring-primary bg-white">
                      <option value="Annual">Annual</option>
                      <option value="Sick">Sick</option>
                      <option value="Casual">Casual</option>
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">Start Date</Label>
                      <Input value={form.start_date} onChange={(event) => updateField('start_date', event.target.value)} type="date" className="bg-slate-50 focus:bg-white" required />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">End Date</Label>
                      <Input value={form.end_date} onChange={(event) => updateField('end_date', event.target.value)} type="date" className="bg-slate-50 focus:bg-white" required />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">Reason</Label>
                    <textarea
                      value={form.reason}
                      onChange={(event) => updateField('reason', event.target.value)}
                      className="w-full border border-slate-200 rounded-lg p-3 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none resize-none bg-slate-50 focus:bg-white"
                      rows={3}
                      placeholder="Briefly explain your leave request..."
                      required
                    />
                  </div>
                  <Button className="w-full bg-primary hover:bg-primary/90 text-white font-medium h-11 shadow-md shadow-primary/20" disabled={saving}>
                    <Send className="h-4 w-4 mr-2" /> {saving ? 'Submitting...' : 'Submit Request'}
                  </Button>
                </form>
              )}
            </CardContent>
          </Card>

          <Card className="border-none shadow-lg shadow-primary/20 rounded-2xl bg-gradient-to-br from-primary to-indigo-700 text-white relative overflow-hidden">
            <Info className="absolute -right-6 -bottom-6 h-32 w-32 text-white/10" />
            <CardContent className="p-6 relative z-10">
              <h3 className="text-xs font-bold tracking-wider text-indigo-200 uppercase mb-3">Company Policy</h3>
              <p className="text-lg font-bold leading-tight mb-4">Submit requests at least 5 days in advance where possible.</p>
            </CardContent>
          </Card>
        </div>

        <div className="md:col-span-2 space-y-6">
          <Card className="border-none shadow-sm rounded-2xl">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <Clock className="h-5 w-5 text-emerald-500" /> Team Requests Pending
              </CardTitle>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider bg-amber-50 text-amber-600 border border-amber-200">
                {pendingRequests.length} Action Required
              </span>
            </CardHeader>
            <CardContent>
              <LeaveTable requests={pendingRequests} loading={loading} onUpdate={updateRequest} showActions={canApprove} />
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm rounded-2xl">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <CalendarRange className="h-5 w-5 text-indigo-500" /> Recent Requests
              </CardTitle>
            </CardHeader>
            <CardContent>
              <LeaveTable requests={recentRequests} loading={loading} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

function LeaveTable({ requests, loading, onUpdate, showActions = false }) {
  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2].map((i) => <Skeleton key={i} className="h-12 w-full" />)}
      </div>
    );
  }

  return (
    <div className="overflow-x-auto mt-2">
      <table className="w-full text-sm text-left">
        <thead className="text-[10px] text-slate-400 uppercase tracking-wider">
          <tr>
            <th className="pb-3 font-semibold">Employee</th>
            <th className="pb-3 font-semibold">Type / Dates</th>
            <th className="pb-3 font-semibold">Reason</th>
            <th className="pb-3 font-semibold text-right">{showActions ? 'Actions' : 'Status'}</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {requests.length > 0 ? requests.map((request) => (
            <tr key={request.id}>
              <td className="py-4 font-semibold text-slate-900">{request.employee?.employee_code || `EMP-${request.employee_id}`}</td>
              <td className="py-4">
                <p className="font-semibold text-slate-900">{request.leave_type}</p>
                <p className="text-xs text-slate-500">{request.start_date} - {request.end_date} ({request.days_requested}d)</p>
              </td>
              <td className="py-4 text-slate-500 italic text-xs">{request.reason}</td>
              <td className="py-4 text-right">
                {showActions ? (
                  <div className="flex justify-end gap-2">
                    <Button onClick={() => onUpdate(request.id, 'approve')} variant="outline" size="icon" className="h-8 w-8 border-emerald-200 text-emerald-600 hover:bg-emerald-50 hover:border-emerald-300">
                      <Check className="h-4 w-4" />
                    </Button>
                    <Button onClick={() => onUpdate(request.id, 'reject')} variant="outline" size="icon" className="h-8 w-8 border-rose-200 text-rose-600 hover:bg-rose-50 hover:border-rose-300">
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-sm text-[10px] font-bold uppercase tracking-wider ${
                    request.status === 'Approved' ? 'bg-emerald-50 text-emerald-600' :
                    request.status === 'Rejected' ? 'bg-rose-50 text-rose-600' :
                    'bg-slate-100 text-slate-600'
                  }`}>
                    {request.status}
                  </span>
                )}
              </td>
            </tr>
          )) : (
            <tr><td colSpan={4} className="py-8 text-center text-sm text-slate-500">No leave requests found.</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

export default LeaveManagement;

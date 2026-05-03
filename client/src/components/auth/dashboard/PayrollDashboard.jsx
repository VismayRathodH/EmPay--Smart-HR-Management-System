import React, { useEffect, useMemo, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { IndianRupee, CheckCircle, FileText, TrendingUp, AlertCircle, Download } from 'lucide-react';
import { api } from '@/lib/api';
import { Skeleton } from '@/components/ui/skeleton';

const currency = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
});

const PayrollDashboard = () => {
  const [payruns, setPayruns] = useState([]);
  const [payslips, setPayslips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState('');
  const [downloading, setDownloading] = useState(null);

  const loadPayruns = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await api.payruns();
      setPayruns(data || []);

      const slips = await api.payslips();
      setPayslips(slips || []);
    } catch (err) {
      setError(err.message || 'Unable to load payruns.');
      console.error('Payroll error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPayruns();
  }, []);

  const latest = payruns[0];
  const totals = useMemo(() => payruns.reduce((sum, item) => sum + Number(item.total_net_pay || 0), 0), [payruns]);

  const runPayroll = async () => {
    const now = new Date();
    setRunning(true);
    setError('');
    try {
      await api.createPayrun({ month: now.getMonth() + 1, year: now.getFullYear() });
      await loadPayruns();
    } catch (err) {
      setError(err.message || 'Unable to run payroll.');
    } finally {
      setRunning(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-4 md:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
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
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Payroll Dashboard</h1>
          <p className="text-sm text-slate-500 mt-1">Manage payroll cycles and employee compensation</p>
        </div>
        <Button onClick={runPayroll} disabled={running} className="bg-blue-600 hover:bg-blue-700">
          {running ? 'Running...' : 'Run Payroll'}
        </Button>
      </div>

      {error && (
        <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700 flex items-center gap-2">
          <AlertCircle className="h-4 w-4" />
          {error}
        </div>
      )}

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Last Payrun Status</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{latest?.status || 'No payruns'}</div>
            <p className="text-xs text-muted-foreground">
              {latest ? `${latest.month}/${latest.year}` : 'Run payroll to begin'}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Payout</CardTitle>
            <IndianRupee className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{currency.format(totals)}</div>
            <p className="text-xs text-muted-foreground">All payruns combined</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Payslips Generated</CardTitle>
            <FileText className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{payslips.length}</div>
            <p className="text-xs text-muted-foreground">Total documents</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Payruns */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Payruns</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b">
                <tr>
                  <th className="text-left py-2 px-2 font-medium">Period</th>
                  <th className="text-left py-2 px-2 font-medium">Employees</th>
                  <th className="text-left py-2 px-2 font-medium">Gross Salary</th>
                  <th className="text-left py-2 px-2 font-medium">Deductions</th>
                  <th className="text-left py-2 px-2 font-medium">Net Pay</th>
                  <th className="text-left py-2 px-2 font-medium">Status</th>
                  <th className="text-right py-2 px-2 font-medium">Action</th>
                </tr>
              </thead>
              <tbody>
                {payruns.map((payrun) => (
                  <tr key={payrun.id} className="border-b hover:bg-slate-50">
                    <td className="py-3 px-2 font-medium">{payrun.month}/{payrun.year}</td>
                    <td className="py-3 px-2">{payrun.total_employees}</td>
                    <td className="py-3 px-2">{currency.format(payrun.total_gross)}</td>
                    <td className="py-3 px-2">{currency.format(payrun.total_deductions)}</td>
                    <td className="py-3 px-2 font-bold">{currency.format(payrun.total_net_pay)}</td>
                    <td className="py-3 px-2">
                      <span className={`text-xs px-2 py-1 rounded-full ${payrun.status === 'completed' ? 'bg-green-100 text-green-700' :
                          payrun.status === 'processing' ? 'bg-yellow-100 text-yellow-700' :
                            'bg-slate-100 text-slate-700'
                        }`}>
                        {payrun.status}
                      </span>
                    </td>
                    <td className="py-3 px-2 text-right">
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 h-8 gap-1"
                        onClick={async () => {
                          try {
                            setDownloading(payrun.id);
                            await api.downloadPayrollReport(payrun.id);
                          } catch (err) {
                            setError(err.message);
                          } finally {
                            setDownloading(null);
                          }
                        }}
                        disabled={downloading === payrun.id}
                      >
                        <Download className="h-3.5 w-3.5" />
                        {downloading === payrun.id ? 'Saving...' : 'Report'}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {payruns.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-6">No payruns created yet. Click "Run Payroll" to start.</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Payslips */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Payslips</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b">
                <tr>
                  <th className="text-left py-2 px-2 font-medium">Employee</th>
                  <th className="text-left py-2 px-2 font-medium">Period</th>
                  <th className="text-left py-2 px-2 font-medium">Gross</th>
                  <th className="text-left py-2 px-2 font-medium">Net Pay</th>
                  <th className="text-left py-2 px-2 font-medium">Action</th>
                </tr>
              </thead>
              <tbody>
                {payslips.slice(0, 10).map((slip) => (
                  <tr key={slip.id} className="border-b hover:bg-slate-50">
                    <td className="py-3 px-2">{slip.employee?.user?.full_name || 'Unknown'}</td>
                    <td className="py-3 px-2">{slip.payrun?.month}/{slip.payrun?.year}</td>
                    <td className="py-3 px-2">{currency.format(slip.gross_salary)}</td>
                    <td className="py-3 px-2 font-bold">{currency.format(slip.net_pay)}</td>
                    <td className="py-3 px-2">
                      <Button size="sm" variant="outline" onClick={() => api.downloadPayslipPdf(slip.id)}>Download</Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {payslips.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-6">No payslips generated yet</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PayrollDashboard;

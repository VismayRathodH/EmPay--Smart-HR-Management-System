import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { api } from '@/lib/api';

const EmployeeForm = ({ employeeId, onSaved, onCancel }) => {
  const [form, setForm] = useState({
    full_name: '',
    email: '',
    password: 'password123',
    employee_code: '',
    department: 'Engineering',
    designation: '',
    ctc: '600000',
    wage: '50000',
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (employeeId) {
      setLoading(true);
      api.getEmployee(employeeId)
        .then((data) => {
          setForm({
            full_name: data.user?.full_name || '',
            email: data.user?.email || '',
            password: '', // Don't pre-fill password for edits
            employee_code: data.employee_code || '',
            department: data.department || 'Engineering',
            designation: data.designation || '',
            ctc: data.ctc?.toString() || '600000',
            wage: data.wage?.toString() || '50000',
          });
        })
        .catch((err) => setError('Failed to load employee data: ' + err.message))
        .finally(() => setLoading(false));
    }
  }, [employeeId]);

  const updateField = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError('');

    try {
      if (employeeId) {
        // Edit mode
        await api.updateEmployee(employeeId, {
          employee_code: form.employee_code,
          department: form.department,
          designation: form.designation,
          ctc: Number(form.ctc),
          wage: Number(form.wage),
        });
        // Note: Password/Email updates for existing users might need a separate endpoint 
        // but for now we follow the user request to implement profile edit from Admin/HR.
      } else {
        // Create mode
        const registered = await api.register({
          full_name: form.full_name,
          email: form.email,
          password: form.password,
        });

        await api.createEmployee({
          user_id: registered.user.id,
          employee_code: form.employee_code,
          department: form.department,
          designation: form.designation,
          ctc: Number(form.ctc),
          wage: Number(form.wage),
        });
      }

      onSaved?.();
    } catch (err) {
      setError(err.message || 'Unable to save employee.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-12 text-center text-slate-500">Loading data...</div>;

  return (
    <Card className="border-none shadow-sm rounded-2xl max-w-2xl">
      <CardHeader>
        <CardTitle>{employeeId ? 'Edit Employee' : 'Add New Employee'}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-medium text-rose-700">
              {error}
            </div>
          )}
          
          <div className="space-y-2">
            <Label>Full Name</Label>
            <Input 
              value={form.full_name} 
              onChange={(event) => updateField('full_name', event.target.value)} 
              placeholder="John Doe" 
              className="bg-slate-50 focus:bg-white" 
              required 
              disabled={!!employeeId} // Full name edit might require user update endpoint
            />
          </div>
          
          <div className="space-y-2">
            <Label>Email</Label>
            <Input 
              value={form.email} 
              onChange={(event) => updateField('email', event.target.value)} 
              type="email" 
              placeholder="john@empay.com" 
              className="bg-slate-50 focus:bg-white" 
              required 
              disabled={!!employeeId} // Email edit might require user update endpoint
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            {!employeeId && (
              <div className="space-y-2">
                <Label>Temporary Password</Label>
                <Input 
                  value={form.password} 
                  onChange={(event) => updateField('password', event.target.value)} 
                  type="password" 
                  className="bg-slate-50 focus:bg-white" 
                  required 
                  minLength={6} 
                />
              </div>
            )}
            <div className={`space-y-2 ${employeeId ? 'col-span-2' : ''}`}>
              <Label>Employee Code</Label>
              <Input 
                value={form.employee_code} 
                onChange={(event) => updateField('employee_code', event.target.value)} 
                placeholder="EMP-001" 
                className="bg-slate-50 focus:bg-white" 
                required 
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Department</Label>
              <select 
                value={form.department} 
                onChange={(event) => updateField('department', event.target.value)} 
                className="w-full border border-slate-200 text-sm font-medium text-slate-700 py-2.5 px-3 rounded-lg outline-none focus:border-primary focus:ring-1 focus:ring-primary bg-slate-50 focus:bg-white"
              >
                <option>Engineering</option>
                <option>HR</option>
                <option>Marketing</option>
                <option>Payroll</option>
                <option>Sales</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label>Role</Label>
              <Input 
                value={form.designation} 
                onChange={(event) => updateField('designation', event.target.value)} 
                placeholder="e.g. Frontend Developer" 
                className="bg-slate-50 focus:bg-white" 
                required 
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Annual CTC</Label>
              <Input 
                value={form.ctc} 
                onChange={(event) => updateField('ctc', event.target.value)} 
                type="number" 
                min="0" 
                className="bg-slate-50 focus:bg-white" 
                required 
              />
            </div>
            <div className="space-y-2">
              <Label>Monthly Wage</Label>
              <Input 
                value={form.wage} 
                onChange={(event) => updateField('wage', event.target.value)} 
                type="number" 
                min="0" 
                className="bg-slate-50 focus:bg-white" 
                required 
              />
            </div>
          </div>

          <div className="pt-4 flex gap-2 justify-end">
            <Button variant="outline" type="button" onClick={onCancel}>Cancel</Button>
            <Button className="bg-primary text-white" disabled={saving}>
              {saving ? 'Saving...' : employeeId ? 'Update Employee' : 'Save Employee'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default EmployeeForm;

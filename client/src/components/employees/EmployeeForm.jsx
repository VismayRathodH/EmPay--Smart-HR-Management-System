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
    phone_number: '',
    date_of_joining: new Date().toISOString().split('T')[0],
    ctc: '600000',
    wage: '50000',
    bank_account_number: '',
    ifsc_code: '',
    bank_name: '',
    pf_optin: true,
    pf_account_number: '',
    professional_tax_slab: 'RS_0',
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
            password: '',
            employee_code: data.employee_code || '',
            department: data.department || 'Engineering',
            designation: data.designation || '',
            phone_number: data.phone_number || '',
            date_of_joining: data.date_of_joining ? data.date_of_joining.split('T')[0] : '',
            ctc: data.ctc?.toString() || '600000',
            wage: data.wage?.toString() || '50000',
            bank_account_number: data.bank_account_number || '',
            ifsc_code: data.ifsc_code || '',
            bank_name: data.bank_name || '',
            pf_optin: data.pf_optin !== false,
            pf_account_number: data.pf_account_number || '',
            professional_tax_slab: data.professional_tax_slab || 'RS_0',
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
        await api.updateEmployee(employeeId, {
          employee_code: form.employee_code,
          department: form.department,
          designation: form.designation,
          phone_number: form.phone_number,
          date_of_joining: form.date_of_joining,
          ctc: Number(form.ctc),
          wage: Number(form.wage),
          bank_account_number: form.bank_account_number,
          ifsc_code: form.ifsc_code,
          bank_name: form.bank_name,
          pf_optin: form.pf_optin,
          pf_account_number: form.pf_account_number,
          professional_tax_slab: form.professional_tax_slab,
        });
      } else {
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
          phone_number: form.phone_number,
          date_of_joining: form.date_of_joining,
          ctc: Number(form.ctc),
          wage: Number(form.wage),
          bank_account_number: form.bank_account_number,
          ifsc_code: form.ifsc_code,
          bank_name: form.bank_name,
          pf_optin: form.pf_optin,
          pf_account_number: form.pf_account_number,
          professional_tax_slab: form.professional_tax_slab,
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
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-medium text-rose-700">
              {error}
            </div>
          )}

          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-slate-900">Basic Information</h3>

            <div className="space-y-2">
              <Label>Full Name</Label>
              <Input
                value={form.full_name}
                onChange={(event) => updateField('full_name', event.target.value)}
                placeholder="John Doe"
                className="bg-slate-50 focus:bg-white"
                required
                disabled={!!employeeId}
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
                disabled={!!employeeId}
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

            <div className="space-y-2">
              <Label>Phone Number</Label>
              <Input
                value={form.phone_number}
                onChange={(event) => updateField('phone_number', event.target.value)}
                placeholder="+91 98765 43210"
                className="bg-slate-50 focus:bg-white"
              />
            </div>
          </div>

          {/* Employment Details */}
          <div className="space-y-4 border-t pt-6">
            <h3 className="text-sm font-semibold text-slate-900">Employment Details</h3>

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
                <Label>Designation</Label>
                <Input
                  value={form.designation}
                  onChange={(event) => updateField('designation', event.target.value)}
                  placeholder="e.g. Frontend Developer"
                  className="bg-slate-50 focus:bg-white"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Date of Joining</Label>
              <Input
                value={form.date_of_joining}
                onChange={(event) => updateField('date_of_joining', event.target.value)}
                type="date"
                className="bg-slate-50 focus:bg-white"
              />
            </div>
          </div>

          {/* Payroll Information */}
          <div className="space-y-4 border-t pt-6">
            <h3 className="text-sm font-semibold text-slate-900">Payroll Information</h3>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Annual CTC (₹)</Label>
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
                <Label>Monthly Wage (₹)</Label>
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

            <div className="space-y-2">
              <Label>Professional Tax Slab</Label>
              <select
                value={form.professional_tax_slab}
                onChange={(event) => updateField('professional_tax_slab', event.target.value)}
                className="w-full border border-slate-200 text-sm font-medium text-slate-700 py-2.5 px-3 rounded-lg outline-none focus:border-primary focus:ring-1 focus:ring-primary bg-slate-50 focus:bg-white"
              >
                <option value="RS_0">Rs. 0</option>
                <option value="RS_175">Rs. 175</option>
                <option value="RS_200">Rs. 200</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.pf_optin}
                  onChange={(event) => updateField('pf_optin', event.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary"
                />
                <span className="text-sm font-medium text-slate-700">Opt-in for Provident Fund (PF)</span>
              </label>
            </div>

            {form.pf_optin && (
              <div className="space-y-2">
                <Label>PF Account Number</Label>
                <Input
                  value={form.pf_account_number}
                  onChange={(event) => updateField('pf_account_number', event.target.value)}
                  placeholder="e.g. MH/12345/1234567"
                  className="bg-slate-50 focus:bg-white"
                />
              </div>
            )}
          </div>

          {/* Bank Details */}
          <div className="space-y-4 border-t pt-6">
            <h3 className="text-sm font-semibold text-slate-900">Bank Details</h3>

            <div className="space-y-2">
              <Label>Bank Account Number</Label>
              <Input
                value={form.bank_account_number}
                onChange={(event) => updateField('bank_account_number', event.target.value)}
                placeholder="1234567890123456"
                className="bg-slate-50 focus:bg-white"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>IFSC Code</Label>
                <Input
                  value={form.ifsc_code}
                  onChange={(event) => updateField('ifsc_code', event.target.value)}
                  placeholder="SBIN0001234"
                  className="bg-slate-50 focus:bg-white"
                />
              </div>
              <div className="space-y-2">
                <Label>Bank Name</Label>
                <Input
                  value={form.bank_name}
                  onChange={(event) => updateField('bank_name', event.target.value)}
                  placeholder="State Bank of India"
                  className="bg-slate-50 focus:bg-white"
                />
              </div>
            </div>
          </div>

          <div className="pt-4 flex gap-2 justify-end border-t">
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

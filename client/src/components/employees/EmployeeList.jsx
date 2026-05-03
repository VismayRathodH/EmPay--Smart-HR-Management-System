import React, { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Search, Edit2, Trash2, Users } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/AuthContext';

const EmployeeList = ({ onEdit }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [employees, setEmployees] = useState([]);
  const [error, setError] = useState('');
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [targetId, setTargetId] = useState(null);
  const { user } = useAuth();

  const isEmployeeRole = user?.role === 'Employee';

  useEffect(() => {
    let active = true;

    async function loadEmployees() {
      setLoading(true);
      setError('');
      try {
        const data = await api.employees();
        if (active) setEmployees(data);
      } catch (err) {
        if (active) setError(err.message || 'Unable to load employees.');
      } finally {
        if (active) setLoading(false);
      }
    }

    loadEmployees();
    return () => {
      active = false;
    };
  }, []);

  const handleDelete = (id) => {
    setTargetId(id);
    setIsConfirmOpen(true);
  };

  const confirmDelete = async () => {
    if (!targetId) return;
    
    try {
      await api.deleteEmployee(targetId);
      setEmployees(employees.filter(emp => emp.id !== targetId));
      setIsConfirmOpen(false);
      setTargetId(null);
    } catch (err) {
      setError(err.message || 'Failed to delete employee.');
      setIsConfirmOpen(false);
    }
  };

  const filteredEmployees = employees.filter((emp) => {
    const searchable = [
      emp.user?.full_name,
      emp.user?.email,
      emp.department,
      emp.designation,
      emp.employee_code,
    ].filter(Boolean).join(' ').toLowerCase();

    return searchable.includes(searchTerm.toLowerCase());
  });

  const initialsFor = (name = '') => name.split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase() || 'EU';

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Employee Directory</h1>
          <p className="text-sm text-slate-500 mt-1">Manage your workforce, roles, and department assignments.</p>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        <Card className="flex-1 border-none shadow-sm rounded-2xl p-2">
          <CardContent className="p-4 flex flex-col sm:flex-row gap-4 h-full items-center">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                placeholder="Quick find by name..."
                className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        <div className="w-full md:w-72 bg-gradient-to-br from-primary to-indigo-700 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden shrink-0">
          <Users className="absolute -right-4 -bottom-4 h-32 w-32 text-white/10" />
          <div className="relative z-10">
            <h3 className="text-xs font-bold tracking-wider text-white/80 uppercase mb-2">Total Employees</h3>
            <div className="text-4xl font-bold mb-1">{employees.length}</div>
            <div className="text-xs font-medium text-indigo-100">Live from backend</div>
          </div>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
          {error}
        </div>
      )}

      <Card className="border-none shadow-sm rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-slate-50/50">
              <TableRow className="border-slate-100 hover:bg-transparent">
                <TableHead className="text-xs font-bold text-slate-500 uppercase tracking-wider h-12 pl-6">Employee</TableHead>
                <TableHead className="text-xs font-bold text-slate-500 uppercase tracking-wider h-12">Code</TableHead>
                <TableHead className="text-xs font-bold text-slate-500 uppercase tracking-wider h-12">Department</TableHead>
                <TableHead className="text-xs font-bold text-slate-500 uppercase tracking-wider h-12">Role</TableHead>
                <TableHead className="text-xs font-bold text-slate-500 uppercase tracking-wider h-12">Status</TableHead>
                {!isEmployeeRole && <TableHead className="text-xs font-bold text-slate-500 uppercase tracking-wider text-right h-12 pr-6">Actions</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <TableRow key={i} className="border-slate-100">
                    <TableCell className="pl-6 py-4">
                      <div className="flex items-center gap-3">
                        <Skeleton className="h-10 w-10 rounded-full" />
                        <div>
                          <Skeleton className="h-4 w-32 mb-1" />
                          <Skeleton className="h-3 w-40" />
                        </div>
                      </div>
                    </TableCell>
                    <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-16 rounded-full" /></TableCell>
                    {!isEmployeeRole && <TableCell className="pr-6 text-right"><Skeleton className="ml-auto h-8 w-20 rounded-md" /></TableCell>}
                  </TableRow>
                ))
              ) : filteredEmployees.length > 0 ? (
                filteredEmployees.map((emp) => (
                  <TableRow key={emp.id} className="border-slate-100 hover:bg-slate-50/50 transition-colors group">
                    <TableCell className="pl-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center text-sm font-bold text-slate-600">
                          {initialsFor(emp.user?.full_name)}
                        </div>
                        <div>
                          <div className="font-semibold text-slate-900">{emp.user?.full_name || 'Unnamed Employee'}</div>
                          <div className="text-xs text-slate-500">{emp.user?.email}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-slate-600">{emp.employee_code}</TableCell>
                    <TableCell className="text-sm text-slate-600">{emp.department || '-'}</TableCell>
                    <TableCell className="text-sm text-slate-600">{emp.designation || '-'}</TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        emp.is_active ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
                      }`}>
                        {emp.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </TableCell>
                    {!isEmployeeRole && (
                      <TableCell className="pr-6 text-right">
                        {/* Only show buttons if user is Admin, OR user is HR and target is a regular Employee */}
                        {(user?.role === 'Admin' || (user?.role === 'HR' && emp.user?.role === 'Employee')) ? (
                          <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-8 w-8 text-slate-400 hover:text-primary hover:bg-primary/5"
                              onClick={() => onEdit(emp.id)}
                            >
                              <Edit2 className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-8 w-8 text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                              onClick={() => handleDelete(emp.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        ) : (
                          <span className="text-[10px] text-slate-400 italic">Protected</span>
                        )}
                      </TableCell>
                    )}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={isEmployeeRole ? 5 : 6} className="py-10 text-center text-sm text-slate-500">
                    No employees found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        <div className="flex items-center justify-between p-6 border-t border-slate-100">
          <p className="text-xs text-slate-500">
            Showing <span className="font-bold text-slate-900">{filteredEmployees.length}</span> of <span className="font-bold text-slate-900">{employees.length}</span> employees
          </p>
        </div>
      </Card>

      {/* Custom Confirmation Modal */}
      {isConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <Card className="w-full max-w-sm shadow-2xl border-none rounded-2xl animate-in zoom-in-95 duration-200">
            <CardContent className="p-8 text-center">
              <div className="h-16 w-16 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <Trash2 className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Delete Employee?</h3>
              <p className="text-slate-500 mb-8 leading-relaxed">
                Are you sure you want to deactivate this employee? This will also disable their login access. This action cannot be easily undone.
              </p>
              <div className="flex gap-3">
                <Button 
                  variant="outline" 
                  className="flex-1 rounded-xl h-12 font-semibold text-slate-600 hover:bg-slate-50"
                  onClick={() => setIsConfirmOpen(false)}
                >
                  No, Cancel
                </Button>
                <Button 
                  className="flex-1 bg-rose-600 hover:bg-rose-700 text-white rounded-xl h-12 font-semibold shadow-lg shadow-rose-200"
                  onClick={confirmDelete}
                >
                  Yes, Delete
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default EmployeeList;

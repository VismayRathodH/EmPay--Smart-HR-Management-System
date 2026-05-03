import React, { useState } from 'react';
import EmployeeList from '../components/employees/EmployeeList';
import EmployeeForm from '../components/employees/EmployeeForm';
import { Button } from '@/components/ui/button';
import { Plus, ArrowLeft } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';

const EmployeesPage = () => {
  const [view, setView] = useState('list'); // 'list' | 'form'
  const [editEmployeeId, setEditEmployeeId] = useState(null);
  const { user } = useAuth();
  
  const isEmployee = user?.role === 'Employee';

  const handleEdit = (id) => {
    setEditEmployeeId(id);
    setView('form');
  };

  const handleAdd = () => {
    setEditEmployeeId(null);
    setView('form');
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-6">
        {view === 'form' ? (
          <Button variant="ghost" onClick={() => setView('list')} className="text-slate-500">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Directory
          </Button>
        ) : (
          <div /> // Placeholder for flex layout
        )}
        
        {view === 'list' && !isEmployee && (
          <Button onClick={handleAdd} className="bg-primary hover:bg-primary/90 text-white">
            <Plus className="mr-2 h-4 w-4" /> Add Employee
          </Button>
        )}
      </div>

      {view === 'list' ? (
        <EmployeeList onEdit={handleEdit} />
      ) : (
        <EmployeeForm 
          employeeId={editEmployeeId} 
          onSaved={() => setView('list')} 
          onCancel={() => setView('list')} 
        />
      )}
    </div>
  );
};

export default EmployeesPage;

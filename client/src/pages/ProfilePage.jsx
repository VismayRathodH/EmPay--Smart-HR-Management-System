import React, { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { User, Mail, Briefcase, MapPin, Building, Calendar, Phone, Edit } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import { api } from '@/lib/api';
import { Link } from 'react-router-dom';

const ProfilePage = () => {
  const { user } = useAuth();
  const [employee, setEmployee] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadEmployeeData() {
      try {
        // If we have an employee record linked to the user, fetch it
        // We can find the employee ID from the employees list or if the user object has it
        const employees = await api.employees();
        const myRecord = employees.find(e => e.user_id === user?.id);
        if (myRecord) {
          setEmployee(myRecord);
        }
      } catch (err) {
        console.error("Failed to load employee profile data", err);
      } finally {
        setLoading(false);
      }
    }
    if (user) loadEmployeeData();
  }, [user]);

  const initials = (user?.full_name || 'EU').split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase();

  return (
    <div className="space-y-6 animate-in fade-in duration-500 max-w-5xl mx-auto">
      {/* Cover and Avatar Section */}
      <div className="relative rounded-2xl mb-32 mt-4">
        <div className="h-48 w-full bg-gradient-to-r from-primary/80 to-primary rounded-2xl overflow-hidden"></div>
        <div className="absolute -bottom-24 left-1/2 -translate-x-1/2 flex flex-col items-center gap-3">
          <div className="h-32 w-32 rounded-full border-4 border-white shadow-lg overflow-hidden flex items-center justify-center text-4xl font-bold text-primary bg-primary/10 bg-white">
            {initials}
          </div>
          <div className="text-center">
            <h1 className="text-3xl font-bold text-slate-900 drop-shadow-sm">{user?.full_name}</h1>
            <p className="text-primary font-medium drop-shadow-sm">{user?.role}</p>
          </div>
        </div>
        <div className="absolute top-4 right-6">
          <Link to="/settings">
            <Button variant="secondary" className="bg-white/20 backdrop-blur-md hover:bg-white/30 border-white/20 text-white shadow-sm gap-2">
              <Edit className="h-4 w-4" /> Edit Profile
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-8">
        {/* Left Column: Personal Info */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Personal Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3 text-sm">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium text-slate-700">{user?.email}</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium text-slate-700">{employee?.phone_number || 'Not provided'}</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium text-slate-700">{employee?.address || 'Not provided'}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Employment & Activity */}
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Employment Details</CardTitle>
            </CardHeader>
            <CardContent className="grid sm:grid-cols-2 gap-y-6 gap-x-4">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider font-bold mb-1">Employee ID</p>
                <p className="font-medium text-slate-900">{employee?.employee_code || 'N/A'}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider font-bold mb-1">Department</p>
                <p className="font-medium text-slate-900 flex items-center gap-2">
                  <Building className="h-4 w-4 text-primary" /> {employee?.department || 'N/A'}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider font-bold mb-1">Role</p>
                <p className="font-medium text-slate-900 flex items-center gap-2">
                  <Briefcase className="h-4 w-4 text-primary" /> {employee?.designation || 'N/A'}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider font-bold mb-1">Joined Date</p>
                <p className="font-medium text-slate-900 flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-primary" /> {employee?.date_of_joining ? new Date(employee.date_of_joining).toLocaleDateString() : 'N/A'}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Status</CardTitle>
            </CardHeader>
            <CardContent>
               <div className="flex items-center gap-2">
                 <div className={`h-2.5 w-2.5 rounded-full ${user?.is_active ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                 <span className="text-sm font-medium text-slate-700">{user?.is_active ? 'Active Account' : 'Inactive Account'}</span>
               </div>
               <p className="text-xs text-muted-foreground mt-2">Member since {user ? new Date(user.created_at).toLocaleDateString() : 'N/A'}</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;

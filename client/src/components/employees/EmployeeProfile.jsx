import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { User, Mail, Briefcase, MapPin } from 'lucide-react';

const EmployeeProfile = () => {
  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Employee Profile</h1>
      
      <Card>
        <CardContent className="p-6 flex flex-col md:flex-row gap-6 items-start">
          <div className="h-24 w-24 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 text-3xl font-bold shrink-0">
            RS
          </div>
          <div className="space-y-2 flex-1">
            <h2 className="text-2xl font-bold">Rahul Sharma</h2>
            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mt-2">
              <span className="flex items-center gap-1"><Briefcase className="h-4 w-4" /> Frontend Developer</span>
              <span className="flex items-center gap-1"><Mail className="h-4 w-4" /> rahul.sharma@empay.com</span>
              <span className="flex items-center gap-1"><MapPin className="h-4 w-4" /> Bangalore, India</span>
            </div>
            <div className="mt-4 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
              Active
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Employment Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between border-b pb-2">
              <span className="text-muted-foreground">Employee ID</span>
              <span className="font-medium">EMP-001</span>
            </div>
            <div className="flex justify-between border-b pb-2">
              <span className="text-muted-foreground">Department</span>
              <span className="font-medium">Engineering</span>
            </div>
            <div className="flex justify-between border-b pb-2">
              <span className="text-muted-foreground">Joining Date</span>
              <span className="font-medium">15 Jan, 2022</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Manager</span>
              <span className="font-medium">Priya Patel</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-muted-foreground">
              <ul className="space-y-4 border-l-2 border-muted ml-3 pl-4">
                <li className="relative">
                  <div className="absolute -left-[21px] top-1 h-3 w-3 rounded-full bg-blue-500 ring-4 ring-white" />
                  <p className="font-medium text-foreground">Marked Attendance</p>
                  <p className="text-xs">Today, 09:15 AM</p>
                </li>
                <li className="relative">
                  <div className="absolute -left-[21px] top-1 h-3 w-3 rounded-full bg-muted ring-4 ring-white" />
                  <p className="font-medium text-foreground">Applied for Leave</p>
                  <p className="text-xs">Yesterday, 04:30 PM</p>
                </li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default EmployeeProfile;

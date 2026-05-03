import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Check, X } from 'lucide-react';

const LeaveApprovalTable = () => {
  return (
    <Card className="border-none shadow-sm rounded-2xl">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-lg">Leave Approval Pending</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-[10px] text-slate-400 uppercase tracking-wider">
              <tr>
                <th className="pb-3 font-semibold">Employee</th>
                <th className="pb-3 font-semibold">Type / Dates</th>
                <th className="pb-3 font-semibold">Reason</th>
                <th className="pb-3 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {[
                { name: 'Sarah Chen', role: 'UX Designer', type: 'Vacation', dates: 'Oct 12 - Oct 15 (4d)', reason: '"Annual family trip..."', initials: 'SC' },
                { name: 'James Wilson', role: 'Frontend Dev', type: 'Sick Leave', dates: 'Oct 10 (1d)', reason: '"Medical appointment..."', initials: 'JW' },
              ].map((req, i) => (
                <tr key={i} className="group hover:bg-slate-50 transition-colors">
                  <td className="py-4">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-600">
                        {req.initials}
                      </div>
                      <div>
                        <p className="font-semibold text-slate-900">{req.name}</p>
                        <p className="text-xs text-slate-500">{req.role}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-4">
                    <p className="font-semibold text-slate-900">{req.type}</p>
                    <p className="text-xs text-slate-500">{req.dates}</p>
                  </td>
                  <td className="py-4 text-slate-500 italic text-xs">{req.reason}</td>
                  <td className="py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" size="icon" className="h-8 w-8 border-emerald-200 text-emerald-600 hover:bg-emerald-50 hover:border-emerald-300">
                        <Check className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="icon" className="h-8 w-8 border-rose-200 text-rose-600 hover:bg-rose-50 hover:border-rose-300">
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
};

export default LeaveApprovalTable;

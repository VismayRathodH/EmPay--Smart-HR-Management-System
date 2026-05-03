import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, Building, MapPin, Mail, Calendar, FileText } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(amount);
};

const PayslipView = () => {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1500);
    return () => clearTimeout(timer);
  }, []);

  const payslipData = {
    companyName: "EmPay Technologies Inc.",
    companyAddress: "123 Tech Boulevard, Silicon Valley, CA 94025",
    companyEmail: "payroll@empay.com",
    employeeName: "Marcus Thompson",
    employeeId: "EMP-2041",
    designation: "Full Stack Lead",
    department: "Engineering",
    monthYear: "March 2024",
    bankDetails: "Chase Bank •••• 4281",
    earnings: [
      { label: "Basic Salary", amount: 6500 },
      { label: "House Rent Allowance", amount: 2200 },
      { label: "Special Allowance", amount: 1450 },
      { label: "Internet Reimbursement", amount: 100 },
    ],
    deductions: [
      { label: "Federal Income Tax", amount: 1840 },
      { label: "State Income Tax", amount: 480 },
      { label: "Health Insurance", amount: 250 },
      { label: "401(k) Contribution", amount: 450 },
    ]
  };

  const totalEarnings = payslipData.earnings.reduce((sum, item) => sum + item.amount, 0);
  const totalDeductions = payslipData.deductions.reduce((sum, item) => sum + item.amount, 0);
  const netSalary = totalEarnings - totalDeductions;

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-5xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Payslip - {payslipData.monthYear}</h1>
          <p className="text-sm text-slate-500 mt-1">Review your earnings, deductions, and download your monthly statement.</p>
        </div>
        <Button className="bg-primary hover:bg-primary/90 text-white shadow-md font-medium">
          <Download className="mr-2 h-4 w-4" /> Download PDF
        </Button>
      </div>

      <Card className="border-none shadow-xl shadow-slate-200/50 rounded-2xl overflow-hidden bg-white relative">
        {loading && (
           <div className="absolute inset-0 z-50 bg-white/50 backdrop-blur-sm p-8 flex flex-col">
             <div className="flex justify-between items-start mb-12">
               <div>
                 <Skeleton className="h-8 w-48 mb-4" />
                 <Skeleton className="h-4 w-64 mb-2" />
                 <Skeleton className="h-4 w-32" />
               </div>
               <Skeleton className="h-10 w-32" />
             </div>
             <div className="grid grid-cols-4 gap-4 mb-12">
               {[1,2,3,4].map(i => <Skeleton key={i} className="h-16 w-full" />)}
             </div>
             <div className="grid md:grid-cols-2 gap-12 mb-12">
               <Skeleton className="h-64 w-full" />
               <Skeleton className="h-64 w-full" />
             </div>
             <Skeleton className="h-24 w-full mt-auto" />
           </div>
        )}

        <div className="h-2 w-full bg-gradient-to-r from-primary to-indigo-400"></div>
        
        <CardContent className="p-8 sm:p-12">
          {/* Header Section */}
          <div className="flex flex-col md:flex-row justify-between items-start border-b border-slate-100 pb-8 mb-8 gap-8">
            <div className="flex items-start gap-4">
              <div className="h-14 w-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shrink-0 mt-1">
                <Building className="h-7 w-7" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-slate-900">{payslipData.companyName}</h2>
                <div className="flex items-center gap-2 text-sm text-slate-500 mt-2">
                  <MapPin className="h-4 w-4" /> {payslipData.companyAddress}
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-500 mt-1">
                  <Mail className="h-4 w-4" /> {payslipData.companyEmail}
                </div>
              </div>
            </div>
            <div className="text-left md:text-right bg-slate-50 p-4 rounded-xl border border-slate-100">
              <div className="text-xs font-bold tracking-wider text-slate-500 uppercase mb-1">Payslip For</div>
              <div className="text-xl font-bold text-primary flex items-center gap-2 md:justify-end">
                <Calendar className="h-5 w-5" /> {payslipData.monthYear}
              </div>
            </div>
          </div>

          {/* Employee Details Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 bg-slate-50/50 p-6 rounded-xl border border-slate-100 mb-10">
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Employee Name</p>
              <p className="font-semibold text-slate-900">{payslipData.employeeName}</p>
            </div>
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Employee ID</p>
              <p className="font-semibold text-slate-900">{payslipData.employeeId}</p>
            </div>
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Designation</p>
              <p className="font-semibold text-slate-900">{payslipData.designation}</p>
            </div>
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Bank Account</p>
              <p className="font-semibold text-slate-900">{payslipData.bankDetails}</p>
            </div>
          </div>

          {/* Salary Details */}
          <div className="grid md:grid-cols-2 gap-10 mb-10">
            {/* Earnings */}
            <div>
              <div className="flex items-center gap-2 border-b border-emerald-100 pb-3 mb-4">
                <div className="h-8 w-8 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <span className="font-bold">+</span>
                </div>
                <h3 className="font-bold text-slate-900 text-lg">Earnings</h3>
              </div>
              <div className="space-y-4">
                {payslipData.earnings.map((item, i) => (
                  <div key={i} className="flex justify-between items-center text-sm">
                    <span className="text-slate-600 font-medium">{item.label}</span>
                    <span className="font-semibold text-slate-900">{formatCurrency(item.amount)}</span>
                  </div>
                ))}
              </div>
              <div className="flex justify-between items-center pt-4 border-t border-slate-100 mt-6 bg-emerald-50/50 p-3 rounded-lg">
                <span className="font-bold text-slate-900">Total Earnings (A)</span>
                <span className="font-bold text-emerald-600 text-lg">{formatCurrency(totalEarnings)}</span>
              </div>
            </div>

            {/* Deductions */}
            <div>
              <div className="flex items-center gap-2 border-b border-rose-100 pb-3 mb-4">
                <div className="h-8 w-8 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center">
                  <span className="font-bold">-</span>
                </div>
                <h3 className="font-bold text-slate-900 text-lg">Deductions</h3>
              </div>
              <div className="space-y-4">
                {payslipData.deductions.map((item, i) => (
                  <div key={i} className="flex justify-between items-center text-sm">
                    <span className="text-slate-600 font-medium">{item.label}</span>
                    <span className="font-semibold text-slate-900">{formatCurrency(item.amount)}</span>
                  </div>
                ))}
              </div>
              <div className="flex justify-between items-center pt-4 border-t border-slate-100 mt-6 bg-rose-50/50 p-3 rounded-lg">
                <span className="font-bold text-slate-900">Total Deductions (B)</span>
                <span className="font-bold text-rose-600 text-lg">{formatCurrency(totalDeductions)}</span>
              </div>
            </div>
          </div>

          {/* Net Salary Summary */}
          <div className="bg-gradient-to-r from-slate-900 to-indigo-900 rounded-2xl p-6 md:p-8 flex flex-col md:flex-row justify-between items-center text-white relative overflow-hidden shadow-lg">
            <FileText className="absolute right-0 top-0 h-48 w-48 text-white/5 -translate-y-8 translate-x-8" />
            <div className="relative z-10 mb-4 md:mb-0">
              <p className="text-indigo-200 font-medium mb-1 tracking-wide">NET SALARY PAYABLE (A - B)</p>
              <p className="text-sm text-slate-400">Amount transferred to {payslipData.bankDetails}</p>
            </div>
            <div className="relative z-10 text-center md:text-right">
              <div className="text-4xl md:text-5xl font-bold tracking-tight mb-2">
                {formatCurrency(netSalary)}
              </div>
              <div className="text-xs font-medium text-emerald-400 uppercase tracking-wider bg-emerald-400/10 inline-block px-3 py-1 rounded-full border border-emerald-400/20">
                Paid on {payslipData.monthYear}
              </div>
            </div>
          </div>

          {/* Footer Note */}
          <div className="mt-8 text-center text-xs text-slate-400 border-t border-slate-100 pt-6">
            This is a computer-generated document. No signature is required.
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PayslipView;

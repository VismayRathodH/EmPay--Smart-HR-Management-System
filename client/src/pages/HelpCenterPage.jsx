import React from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Mail, MessageCircle, FileText } from 'lucide-react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const HelpCenterPage = () => {
  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* Header & Search */}
      <div className="text-center space-y-6 py-8">
        <h1 className="text-4xl font-bold tracking-tight text-slate-900">How can we help?</h1>
        <p className="text-lg text-slate-500 max-w-xl mx-auto">
          Search our knowledge base or browse categories below to find the answers you need.
        </p>
        <div className="relative max-w-2xl mx-auto">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
          <Input 
            className="w-full pl-12 h-14 text-lg rounded-2xl border-slate-200 shadow-sm"
            placeholder="Search for articles, guides, and FAQs..."
          />
        </div>
      </div>

      {/* Quick Links */}
      <div className="grid md:grid-cols-3 gap-6">
        <Card className="hover:shadow-md transition-shadow cursor-pointer">
          <CardContent className="p-6 flex flex-col items-center text-center space-y-4">
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
              <FileText className="h-6 w-6" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900">Documentation</h3>
              <p className="text-sm text-slate-500 mt-1">Read our detailed user guides.</p>
            </div>
          </CardContent>
        </Card>
        <Card className="hover:shadow-md transition-shadow cursor-pointer">
          <CardContent className="p-6 flex flex-col items-center text-center space-y-4">
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
              <MessageCircle className="h-6 w-6" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900">Community Forum</h3>
              <p className="text-sm text-slate-500 mt-1">Ask questions and share tips.</p>
            </div>
          </CardContent>
        </Card>
        <Card className="hover:shadow-md transition-shadow cursor-pointer">
          <CardContent className="p-6 flex flex-col items-center text-center space-y-4">
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
              <Mail className="h-6 w-6" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900">Contact Support</h3>
              <p className="text-sm text-slate-500 mt-1">Get in touch with our team.</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* FAQ Section */}
      <Card>
        <CardHeader>
          <CardTitle>Frequently Asked Questions</CardTitle>
          <CardDescription>Quick answers to common questions about using EmPay.</CardDescription>
        </CardHeader>
        <CardContent>
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="item-1">
              <AccordionTrigger>How do I reset my password?</AccordionTrigger>
              <AccordionContent className="text-slate-500">
                You can reset your password by going to the Settings page and navigating to the Security tab. Alternatively, click "Forgot Password" on the login screen.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-2">
              <AccordionTrigger>Where can I find my latest payslip?</AccordionTrigger>
              <AccordionContent className="text-slate-500">
                Navigate to the "Payroll" tab on the left sidebar. Your most recent payslip will be highlighted at the top, and you can download it as a PDF.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-3">
              <AccordionTrigger>How does the leave approval process work?</AccordionTrigger>
              <AccordionContent className="text-slate-500">
                Once you submit a leave request via the Leave Management page, your manager is notified. Upon their approval, HR reviews and finalizes it. You will receive an email notification at each step.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-4">
              <AccordionTrigger>Who do I contact for incorrect attendance records?</AccordionTrigger>
              <AccordionContent className="text-slate-500">
                If your check-in/out times are incorrect, please contact your HR administrator directly through the Contact Support button above.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </CardContent>
      </Card>
    </div>
  );
};

export default HelpCenterPage;

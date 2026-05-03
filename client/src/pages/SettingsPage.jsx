import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/lib/AuthContext';
import { api } from '@/lib/api';

const SettingsPage = () => {
  const { user, login } = useAuth(); // We can use login to refresh the user session after profile update
  const [profileForm, setProfileForm] = useState({
    full_name: user?.full_name || '',
    email: user?.email || '',
  });
  const [passwordForm, setPasswordForm] = useState({
    current_password: '',
    new_password: '',
    confirm_password: '',
  });
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setSavingProfile(true);
    setMessage({ text: '', type: '' });
    try {
      const updatedUser = await api.updateProfile(profileForm);
      // Update local session data (this is a bit hacky as AuthContext doesn't have an update method)
      const token = localStorage.getItem('empay_token');
      localStorage.setItem('empay_user', JSON.stringify(updatedUser));
      // Trigger a reload or just update state if possible
      setMessage({ text: 'Profile updated successfully!', type: 'success' });
      window.location.reload(); // Simplest way to refresh AuthContext for now
    } catch (err) {
      setMessage({ text: err.message, type: 'error' });
    } finally {
      setSavingProfile(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    if (passwordForm.new_password !== passwordForm.confirm_password) {
      setMessage({ text: 'New passwords do not match', type: 'error' });
      return;
    }
    setSavingPassword(true);
    setMessage({ text: '', type: '' });
    try {
      await api.changePassword({
        current_password: passwordForm.current_password,
        new_password: passwordForm.new_password,
      });
      setMessage({ text: 'Password changed successfully!', type: 'success' });
      setPasswordForm({ current_password: '', new_password: '', confirm_password: '' });
    } catch (err) {
      setMessage({ text: err.message, type: 'error' });
    } finally {
      setSavingPassword(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Settings</h1>
        <p className="text-sm text-slate-500 mt-1">Manage your account settings and preferences.</p>
      </div>

      {message.text && (
        <div className={`p-3 rounded-lg text-sm font-medium ${message.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'}`}>
          {message.text}
        </div>
      )}

      <Tabs defaultValue="general" className="w-full flex flex-col md:flex-row gap-6">
        <TabsList className="flex flex-row md:flex-col h-auto bg-transparent items-start justify-start w-full md:w-64 space-y-1">
          <TabsTrigger value="general" className="w-full justify-start data-[state=active]:bg-primary/10 data-[state=active]:text-primary px-4 py-2">General</TabsTrigger>
          <TabsTrigger value="security" className="w-full justify-start data-[state=active]:bg-primary/10 data-[state=active]:text-primary px-4 py-2">Security</TabsTrigger>
          <TabsTrigger value="notifications" className="w-full justify-start data-[state=active]:bg-primary/10 data-[state=active]:text-primary px-4 py-2">Notifications</TabsTrigger>
        </TabsList>

        <div className="flex-1">
          <TabsContent value="general" className="m-0 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Account Information</CardTitle>
                <CardDescription>Update your personal details here.</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleProfileSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="fullName">Full Name</Label>
                    <Input id="fullName" value={profileForm.full_name} onChange={e => setProfileForm({...profileForm, full_name: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <Input id="email" type="email" value={profileForm.email} onChange={e => setProfileForm({...profileForm, email: e.target.value})} />
                  </div>
                  <Button className="mt-4" disabled={savingProfile}>{savingProfile ? 'Saving...' : 'Save Changes'}</Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="security" className="m-0 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Change Password</CardTitle>
                <CardDescription>Ensure your account is using a long, random password to stay secure.</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handlePasswordSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="current">Current Password</Label>
                    <Input id="current" type="password" value={passwordForm.current_password} onChange={e => setPasswordForm({...passwordForm, current_password: e.target.value})} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="new">New Password</Label>
                    <Input id="new" type="password" value={passwordForm.new_password} onChange={e => setPasswordForm({...passwordForm, new_password: e.target.value})} required minLength={6} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirm">Confirm New Password</Label>
                    <Input id="confirm" type="password" value={passwordForm.confirm_password} onChange={e => setPasswordForm({...passwordForm, confirm_password: e.target.value})} required />
                  </div>
                  <Button className="mt-4" disabled={savingPassword}>{savingPassword ? 'Updating...' : 'Update Password'}</Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="notifications" className="m-0 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Email Notifications</CardTitle>
                <CardDescription>Choose what updates you want to receive via email.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h4 className="font-medium text-sm text-slate-900">Payroll Processing</h4>
                    <p className="text-sm text-muted-foreground">Receive an email when payroll starts processing.</p>
                  </div>
                  <input type="checkbox" defaultChecked className="h-4 w-4 text-primary focus:ring-primary border-slate-300 rounded" />
                </div>
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h4 className="font-medium text-sm text-slate-900">Leave Requests</h4>
                    <p className="text-sm text-muted-foreground">Receive an email for pending leave approvals.</p>
                  </div>
                  <input type="checkbox" defaultChecked className="h-4 w-4 text-primary focus:ring-primary border-slate-300 rounded" />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
};

export default SettingsPage;

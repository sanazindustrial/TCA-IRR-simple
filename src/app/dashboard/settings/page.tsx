
'use client';
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { ThemeToggle } from '@/components/theme-toggle';
import { useToast } from '@/hooks/use-toast';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://tcairrapiccontainer.azurewebsites.net';

export default function SettingsPage() {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast({ variant: 'destructive', title: 'Missing fields', description: 'Please fill in all password fields.' });
      return;
    }
    if (newPassword !== confirmPassword) {
      toast({ variant: 'destructive', title: 'Mismatch', description: 'New password and confirmation do not match.' });
      return;
    }
    if (newPassword.length < 6) {
      toast({ variant: 'destructive', title: 'Too short', description: 'New password must be at least 6 characters.' });
      return;
    }
    setSaving(true);
    try {
      const token = localStorage.getItem('authToken');
      const res = await fetch(`${BACKEND_URL}/api/v1/auth/change-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ current_password: currentPassword, new_password: newPassword }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || 'Failed to change password');
      }
      toast({ title: 'Password Updated', description: 'Your password has been changed successfully.' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: unknown) {
      toast({ variant: 'destructive', title: 'Error', description: err instanceof Error ? err.message : 'Failed to change password.' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="container mx-auto p-4 md:p-8">
      <h1 className="text-2xl font-semibold mb-8">Settings</h1>
      <div className="max-w-4xl mx-auto space-y-8">
        <Card>
            <CardHeader>
                <CardTitle>Account Settings</CardTitle>
                <CardDescription>Manage your account details and password.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="space-y-2">
                    <Label htmlFor="current-password">Current Password</Label>
                    <Input id="current-password" type="password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="new-password">New Password</Label>
                    <Input id="new-password" type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="confirm-password">Confirm New Password</Label>
                    <Input id="confirm-password" type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} />
                </div>
                <Button onClick={handleChangePassword} disabled={saving}>{saving ? 'Saving…' : 'Update Password'}</Button>
            </CardContent>
        </Card>
        <Card>
            <CardHeader>
                <CardTitle>Appearance Settings</CardTitle>
                <CardDescription>Customize the look and feel of the application.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="flex items-center justify-between">
                    <div className='space-y-1'>
                        <Label>Theme</Label>
                        <p className='text-sm text-muted-foreground'>Select a theme for the application.</p>
                    </div>
                    <ThemeToggle />
                </div>
            </CardContent>
        </Card>
        <Card>
            <CardHeader>
                <CardTitle>Notification Settings</CardTitle>
                <CardDescription>Choose how you receive notifications.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                    <Label htmlFor="email-notifications">Email Notifications</Label>
                    <Switch id="email-notifications" defaultChecked />
                </div>
                 <div className="flex items-center justify-between">
                    <Label htmlFor="push-notifications">Push Notifications</Label>
                    <Switch id="push-notifications" />
                </div>
                 <div className="flex items-center justify-between">
                    <Label htmlFor="monthly-reports">Monthly Summary Reports</Label>
                    <Switch id="monthly-reports" defaultChecked />
                </div>
            </CardContent>
        </Card>
      </div>
    </div>
  );
}

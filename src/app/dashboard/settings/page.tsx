
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { ThemeToggle } from '@/components/theme-toggle';

export default function SettingsPage() {
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
                    <Input id="current-password" type="password" />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="new-password">New Password</Label>
                    <Input id="new-password" type="password" />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="confirm-password">Confirm New Password</Label>
                    <Input id="confirm-password" type="password" />
                </div>
                <Button>Update Password</Button>
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

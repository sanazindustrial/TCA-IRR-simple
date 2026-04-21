
'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import Link from 'next/link';
import { LogIn, Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { users } from '@/lib/users';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();
  const { toast } = useToast();


  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    // 1. Try backend authentication first
    try {
      const { backendAPI } = await import('@/lib/backend-api');
      const response = await backendAPI.login(email, password);

      if (response.success) {
        // Build a user record from whatever the backend returned
        const rawUser = response.user || {};
        const userData = {
          ...rawUser,
          id: rawUser.user_id || rawUser.id || `user_${Date.now()}`,
          name: rawUser.full_name || rawUser.name || rawUser.email || email,
          email: rawUser.email || email,
          role: rawUser.role || 'User',
        };
        localStorage.setItem('loggedInUser', JSON.stringify(userData));
        localStorage.setItem('authToken', response.access_token);
        if (response.refresh_token) {
          localStorage.setItem('refreshToken', response.refresh_token);
        }
        toast({
          title: 'Login Successful',
          description: `Welcome back, ${userData.name}!`,
        });
        router.push('/dashboard');
        return;
      }
    } catch (backendError: any) {
      // Backend failed – try local user fallback before giving up
      console.warn('Backend login failed, trying local fallback:', backendError.message);
    }

    // 2. Local user fallback (for admin/dev access when backend is unavailable)
    const localUser = users.find(
      (u) => u.email.toLowerCase() === email.toLowerCase() && u.password === password
    );
    if (localUser) {
      const userData = {
        id: localUser.id,
        name: localUser.name,
        email: localUser.email,
        role: localUser.role,
      };
      localStorage.setItem('loggedInUser', JSON.stringify(userData));
      // No real JWT — use a placeholder so auth checks pass
      localStorage.setItem('authToken', `local_${localUser.id}`);
      toast({
        title: 'Login Successful',
        description: `Welcome back, ${localUser.name}! (local session)`,
      });
      router.push('/dashboard');
      return;
    }

    // 3. Both paths failed
    toast({
      variant: 'destructive',
      title: 'Login Failed',
      description: 'Invalid email or password. Please try again.',
    });
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-background p-4">
      <Card className="w-full max-w-md shadow-2xl">
        <CardHeader className="text-center">
          <div className="flex justify-center items-center mb-4">
            <div className="bg-primary/10 border-2 border-primary/20 p-4 rounded-xl">
              <LogIn className="text-primary size-8" />
            </div>
          </div>
          <CardTitle className="text-3xl font-bold tracking-tight">Welcome Back</CardTitle>
          <CardDescription>Sign in to your TCA-IRR APP account</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input id="email" type="email" placeholder="Enter your email address" required className="pl-10" value={email} onChange={e => setEmail(e.target.value)} autoComplete="email" />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
                  required
                  className="pl-10 pr-10"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  autoComplete="current-password"
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  {showPassword ? <EyeOff /> : <Eye />}
                </button>
              </div>
            </div>
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <Checkbox id="remember-me" />
                <Label htmlFor="remember-me" className="font-normal">Remember me</Label>
              </div>
              <Link href="/forgot-password" className="text-primary hover:underline">Forgot password?</Link>
            </div>
            <Button type="submit" className="w-full bg-gradient-to-r from-primary to-accent text-lg h-12">
              Sign In
            </Button>
          </form>
          <div className="mt-6 text-center text-sm">
            Don't have an account?{' '}
            <Link href="/signup" className="font-semibold text-primary hover:underline">
              Sign up for free
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

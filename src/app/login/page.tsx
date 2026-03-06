
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
  const [email, setEmail] = useState('admin@tca.com');
  const [password, setPassword] = useState('admin123');
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();
  const { toast } = useToast();


  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    // Check if backend API should be used
    const useBackendAPI = process.env.NEXT_PUBLIC_USE_MOCK_DATA !== 'true';

    if (useBackendAPI) {
      try {
        const { backendAPI } = await import('@/lib/backend-api');
        const response = await backendAPI.login(email, password);

        if (response.success) {
          localStorage.setItem('loggedInUser', JSON.stringify(response.user));
          localStorage.setItem('authToken', response.access_token);
          toast({
            title: 'Login Successful',
            description: 'Redirecting to your dashboard...',
          });
          router.push('/dashboard');
          return;
        } else {
          throw new Error(response.error || 'Login failed');
        }
      } catch (error) {
        console.warn('Backend login failed, falling back to local auth:', error);
        // Fall back to local authentication below
      }
    }

    // Local authentication fallback
    const user = users.find(u => u.email === email && u.password === password);

    if (user) {
      localStorage.setItem('loggedInUser', JSON.stringify(user));
      toast({
        title: 'Login Successful',
        description: 'Redirecting to your dashboard...',
      });
      router.push('/dashboard');
    } else {
      toast({
        variant: 'destructive',
        title: 'Login Failed',
        description: 'Invalid email or password.',
      });
    }
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
                <Input id="email" type="email" placeholder="admin@demo.com" required className="pl-10" value={email} onChange={e => setEmail(e.target.value)} />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  required
                  className="pl-10 pr-10"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
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

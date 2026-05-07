'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Link from 'next/link';
import { UserPlus, Mail, Lock, User, Eye, EyeOff, Loader2, Info } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription } from '@/components/ui/alert';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://tcairrapiccontainer.azurewebsites.net';

export default function SignupPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password || !firstName || !lastName) {
      toast({
        variant: 'destructive',
        title: 'Signup Failed',
        description: 'Please fill out all fields.',
      });
      return;
    }

    if (password !== confirmPassword) {
      toast({
        variant: 'destructive',
        title: 'Signup Failed',
        description: 'Passwords do not match.',
      });
      return;
    }

    if (password.length < 8) {
      toast({
        variant: 'destructive',
        title: 'Signup Failed',
        description: 'Password must be at least 8 characters.',
      });
      return;
    }

    setIsLoading(true);

    try {
      const fullName = `${firstName} ${lastName}`.trim();
      const username = email.split('@')[0].replace(/[^a-zA-Z0-9_]/g, '_').substring(0, 50);

      const response = await fetch(`${API_BASE_URL}/api/v1/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username,
          email,
          password,
          confirm_password: confirmPassword,
          full_name: fullName,
        }),
      });

      if (response.ok) {
        toast({
          title: 'Signup Successful',
          description: 'Your account has been created. Please sign in.',
        });
        router.push('/login');
      } else {
        const error = await response.json();
        let errorMessage = 'Registration failed. Please try again.';

        if (error.detail?.password_errors) {
          errorMessage = error.detail.password_errors.join('. ');
        } else if (typeof error.detail === 'string') {
          errorMessage = error.detail;
        } else if (typeof error.message === 'string') {
          errorMessage = error.message;
        }

        toast({
          variant: 'destructive',
          title: 'Signup Failed',
          description: errorMessage,
        });
      }
    } catch (error) {
      console.error('Signup error:', error);
      toast({
        variant: 'destructive',
        title: 'Signup Failed',
        description: 'Unable to connect to server. Please try again later.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-background p-4">
      <Card className="w-full max-w-md shadow-2xl">
        <CardHeader className="text-center">
          <div className="flex justify-center items-center mb-4">
            <div className="bg-primary/10 border-2 border-primary/20 p-4 rounded-xl">
              <UserPlus className="text-primary size-8" />
            </div>
          </div>
          <CardTitle className="text-3xl font-bold tracking-tight">Create an Account</CardTitle>
          <CardDescription>Join TCA-IRR APP with a standard user account.</CardDescription>
        </CardHeader>
        <CardContent>
          <Alert className="mb-4 bg-blue-50 border-blue-200">
            <AlertDescription className="text-blue-800 text-sm">
              <Info className="inline w-4 h-4 mr-1" />
              Admin and Analyst accounts must be created from an invitation link.
            </AlertDescription>
          </Alert>

          <form onSubmit={handleSignup} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstname">First Name</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground size-4" />
                  <Input
                    id="firstname"
                    name="firstName"
                    type="text"
                    placeholder="John"
                    required
                    className="pl-10"
                    value={firstName}
                    onChange={e => setFirstName(e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastname">Last Name</Label>
                <Input
                  id="lastname"
                  name="lastName"
                  type="text"
                  placeholder="Doe"
                  required
                  value={lastName}
                  onChange={e => setLastName(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground size-4" />
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="john.doe@example.com"
                  required
                  className="pl-10"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground size-4" />
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  required
                  className="pl-10 pr-10"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                >
                  {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirm Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground size-4" />
                <Input
                  id="confirm-password"
                  name="confirmPassword"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  required
                  className="pl-10 pr-10"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                />
              </div>
            </div>

            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-primary to-accent text-lg h-12"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating Account...
                </>
              ) : (
                'Sign Up'
              )}
            </Button>
          </form>

          <div className="mt-6 text-center text-sm">
            Already have an account?{' '}
            <Link href="/login" className="font-semibold text-primary hover:underline">
              Sign In
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

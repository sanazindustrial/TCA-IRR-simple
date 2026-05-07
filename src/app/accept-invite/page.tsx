'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Link from 'next/link';
import { Mail, Lock, User, Eye, EyeOff, Loader2, Shield, CheckCircle, XCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://tcairrapiccontainer.azurewebsites.net';

function AcceptInviteForm() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isValidatingToken, setIsValidatingToken] = useState(true);
  const [inviteData, setInviteData] = useState<{ email: string; role: string } | null>(null);
  const [inviteToken, setInviteToken] = useState<string | null>(null);

  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  useEffect(() => {
    const token = searchParams.get('token');

    if (!token) {
      setIsValidatingToken(false);
      return;
    }

    setInviteToken(token);
    validateInviteToken(token);
  }, [searchParams]);

  const validateInviteToken = async (token: string) => {
    setIsValidatingToken(true);

    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/auth/validate-invite?token=${encodeURIComponent(token)}`);
      const data = await response.json();

      if (response.ok) {
        setInviteData({ email: data.email, role: data.role });
        toast({
          title: 'Invitation Valid',
          description: `You have been invited as ${data.role}. Complete your account setup.`,
        });
      } else {
        toast({
          variant: 'destructive',
          title: 'Invalid Invitation',
          description: data.detail || data.message || 'This invitation link is invalid or has expired.',
        });
      }
    } catch (error) {
      console.error('Token validation error:', error);
      toast({
        variant: 'destructive',
        title: 'Validation Error',
        description: 'Unable to validate invitation. Please try again later.',
      });
    } finally {
      setIsValidatingToken(false);
    }
  };

  const handleAcceptInvite = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!inviteToken || !inviteData) {
      toast({
        variant: 'destructive',
        title: 'Invite Missing',
        description: 'Invitation token is missing or invalid.',
      });
      return;
    }

    if (!password || !confirmPassword || !firstName || !lastName) {
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

      const response = await fetch(`${API_BASE_URL}/api/v1/auth/complete-invite`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: inviteToken,
          full_name: fullName,
          password,
        }),
      });

      if (response.ok) {
        toast({
          title: 'Signup Successful',
          description: `Your ${inviteData.role} account has been created. Please sign in.`,
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
      console.error('Complete invite error:', error);
      toast({
        variant: 'destructive',
        title: 'Signup Failed',
        description: 'Unable to connect to server. Please try again later.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isValidatingToken) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background p-4">
        <Card className="w-full max-w-md shadow-2xl">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
            <p className="text-muted-foreground">Validating your invitation...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!inviteData || !inviteToken) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background p-4">
        <Card className="w-full max-w-md shadow-2xl">
          <CardHeader className="text-center">
            <div className="flex justify-center items-center mb-4">
              <div className="bg-destructive/10 border-2 border-destructive/20 p-4 rounded-xl">
                <XCircle className="text-destructive size-8" />
              </div>
            </div>
            <CardTitle className="text-2xl font-bold tracking-tight">Invalid or Expired Invite</CardTitle>
            <CardDescription>
              This invitation link is invalid or expired. Ask your administrator to send a new invite.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <Link href="/signup">
                <Button className="w-full">Create Standard User Account</Button>
              </Link>
              <Link href="/login">
                <Button variant="outline" className="w-full">Back to Sign In</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-background p-4">
      <Card className="w-full max-w-md shadow-2xl">
        <CardHeader className="text-center">
          <div className="flex justify-center items-center mb-4">
            <div className="bg-primary/10 border-2 border-primary/20 p-4 rounded-xl">
              <Shield className="text-primary size-8" />
            </div>
          </div>
          <CardTitle className="text-3xl font-bold tracking-tight">Accept Invitation</CardTitle>
          <CardDescription>Complete your invited account setup.</CardDescription>
          <Badge variant="secondary" className="mt-2 mx-auto">
            <CheckCircle className="w-3 h-3 mr-1" />
            Invited as {inviteData.role}
          </Badge>
        </CardHeader>

        <CardContent>
          <Alert className="mb-4 bg-green-50 border-green-200">
            <AlertDescription className="text-green-800 text-sm">
              You are creating an invited <strong>{inviteData.role}</strong> account.
            </AlertDescription>
          </Alert>

          <form onSubmit={handleAcceptInvite} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstname">First Name</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground size-4" />
                  <Input
                    id="firstname"
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
                  type="email"
                  className="pl-10 bg-muted"
                  value={inviteData.email}
                  disabled
                  readOnly
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground size-4" />
                <Input
                  id="password"
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
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  required
                  className="pl-10"
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
                'Accept Invitation'
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

export default function AcceptInvitePage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-screen bg-background">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      }
    >
      <AcceptInviteForm />
    </Suspense>
  );
}

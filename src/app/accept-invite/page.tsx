'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Link from 'next/link';
import { Mail, Lock, User, Eye, EyeOff, Loader2, ShieldCheck, CheckCircle2, AlertTriangle, Crown, Briefcase } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';

// Uses the backend /api/v1/auth/accept-invite endpoint
const API_BASE_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  'https://tcairrapiccontainer.azurewebsites.net';

function AcceptInviteForm() {
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [tokenMissing, setTokenMissing] = useState(false);

  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  const token = searchParams.get('token') || '';

  useEffect(() => {
    if (!token) setTokenMissing(true);
  }, [token]);

  // Auto-generate username from full name
  useEffect(() => {
    if (fullName) {
      const generated = fullName
        .toLowerCase()
        .replace(/[^a-z0-9\s_]/g, '')
        .replace(/\s+/g, '_')
        .substring(0, 50);
      setUsername(generated);
    }
  }, [fullName]);

  const passwordStrength = (() => {
    if (!password) return null;
    const checks = [
      password.length >= 8,
      /[A-Z]/.test(password),
      /[a-z]/.test(password),
      /[0-9]/.test(password),
      /[^A-Za-z0-9]/.test(password),
    ];
    const passed = checks.filter(Boolean).length;
    if (passed <= 2) return { label: 'Weak', color: 'bg-red-500', pct: 33 };
    if (passed <= 3) return { label: 'Fair', color: 'bg-yellow-500', pct: 60 };
    if (passed === 4) return { label: 'Good', color: 'bg-blue-500', pct: 80 };
    return { label: 'Strong', color: 'bg-green-500', pct: 100 };
  })();

  const handleAcceptInvite = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!fullName.trim()) {
      toast({ variant: 'destructive', title: 'Full name is required' });
      return;
    }
    if (username.length < 3) {
      toast({ variant: 'destructive', title: 'Username must be at least 3 characters' });
      return;
    }
    if (password.length < 8) {
      toast({ variant: 'destructive', title: 'Password must be at least 8 characters' });
      return;
    }
    if (password !== confirmPassword) {
      toast({ variant: 'destructive', title: 'Passwords do not match' });
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/auth/accept-invite`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
          token,
          username: username.trim(),
          password,
          confirm_password: confirmPassword,
          full_name: fullName.trim(),
        }),
      });

      let data: Record<string, unknown> = {};
      try {
        const text = await response.text();
        if (text) data = JSON.parse(text);
      } catch { /* ignore */ }

      if (!response.ok) {
        const rawDetail = data.detail;
        let msg = 'Failed to create account. The invitation may have expired.';
        if (typeof rawDetail === 'string') {
          msg = rawDetail;
        } else if (
          typeof rawDetail === 'object' &&
          rawDetail !== null &&
          Array.isArray((rawDetail as Record<string, unknown>).password_errors)
        ) {
          msg = ((rawDetail as Record<string, unknown>).password_errors as string[]).join('. ');
        } else if (typeof data.message === 'string') {
          msg = data.message as string;
        }
        throw new Error(msg);
      }

      setIsSuccess(true);
      toast({ title: '✅ Account Created', description: 'You can now sign in with your credentials.' });
    } catch (err) {
      toast({
        variant: 'destructive',
        title: 'Account Setup Failed',
        description: err instanceof Error ? err.message : 'Please try again or request a new invitation.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (tokenMissing) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background p-4">
        <Card className="w-full max-w-md shadow-2xl">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="bg-destructive/10 border-2 border-destructive/20 p-4 rounded-xl">
                <AlertTriangle className="text-destructive size-8" />
              </div>
            </div>
            <CardTitle className="text-2xl font-bold">Missing Invitation Link</CardTitle>
            <CardDescription>
              No invitation token was found. Please use the full link from your invitation email.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Alert>
              <AlertDescription>
                Contact your administrator if you need a new invitation link sent to your email.
              </AlertDescription>
            </Alert>
            <Link href="/login">
              <Button variant="outline" className="w-full">Back to Sign In</Button>
            </Link>
            <Link href="/signup">
              <Button variant="ghost" className="w-full">Create Standard User Account</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isSuccess) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background p-4">
        <Card className="w-full max-w-md shadow-2xl">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="bg-green-500/10 border-2 border-green-500/20 p-4 rounded-xl">
                <CheckCircle2 className="text-green-500 size-8" />
              </div>
            </div>
            <CardTitle className="text-2xl font-bold">Account Ready!</CardTitle>
            <CardDescription>
              Your privileged account has been created. Sign in to access the platform.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => router.push('/login')} className="w-full">
              Sign In Now
            </Button>
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
              <ShieldCheck className="text-primary size-8" />
            </div>
          </div>
          <CardTitle className="text-3xl font-bold tracking-tight">Accept Invitation</CardTitle>
          <CardDescription>
            You have been invited to join TCA-IRR as a privileged user. Set your details to activate
            your account.
          </CardDescription>
          <div className="flex justify-center gap-2 mt-2">
            <Badge variant="outline" className="gap-1 text-xs">
              <Crown className="h-3 w-3 text-red-500" />
              Admin
            </Badge>
            <Badge variant="outline" className="gap-1 text-xs">
              <Briefcase className="h-3 w-3 text-blue-500" />
              Analyst
            </Badge>
          </div>
        </CardHeader>

        <CardContent>
          <Alert className="mb-4 bg-blue-50 border-blue-200">
            <AlertDescription className="text-blue-800 text-sm">
              This page is for <strong>invited admin &amp; analyst accounts only</strong>. Regular users can{' '}
              <Link href="/signup" className="underline font-medium">sign up here</Link>.
            </AlertDescription>
          </Alert>

          <form onSubmit={handleAcceptInvite} className="space-y-4">
            {/* Full Name */}
            <div className="space-y-2">
              <Label htmlFor="fullName">Full Name</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground size-4" />
                <Input
                  id="fullName"
                  type="text"
                  placeholder="Jane Smith"
                  required
                  className="pl-10"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  disabled={isLoading}
                />
              </div>
            </div>

            {/* Username */}
            <div className="space-y-2">
              <Label htmlFor="username">
                Username <span className="text-xs text-muted-foreground">(auto-generated, editable)</span>
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground size-4" />
                <Input
                  id="username"
                  type="text"
                  placeholder="jane_smith"
                  required
                  minLength={3}
                  maxLength={50}
                  className="pl-10"
                  value={username}
                  onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                  disabled={isLoading}
                />
              </div>
              <p className="text-xs text-muted-foreground">Lowercase letters, numbers, underscores only</p>
            </div>

            {/* Password */}
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
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
              {passwordStrength && (
                <div className="space-y-1">
                  <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${passwordStrength.color}`}
                      style={{ width: `${passwordStrength.pct}%` }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Strength: <span className={passwordStrength.label === 'Strong' ? 'text-green-600' : passwordStrength.label === 'Weak' ? 'text-red-600' : 'text-yellow-600'}>{passwordStrength.label}</span>
                  </p>
                  <ul className="text-xs text-muted-foreground list-disc list-inside space-y-0.5">
                    <li className={password.length >= 8 ? 'text-green-600' : ''}>At least 8 characters</li>
                    <li className={/[A-Z]/.test(password) ? 'text-green-600' : ''}>Uppercase letter</li>
                    <li className={/[0-9]/.test(password) ? 'text-green-600' : ''}>A number</li>
                    <li className={/[^A-Za-z0-9]/.test(password) ? 'text-green-600' : ''}>A special character</li>
                  </ul>
                </div>
              )}
            </div>

            {/* Confirm Password */}
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
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={isLoading}
                />
              </div>
              {confirmPassword && password !== confirmPassword && (
                <p className="text-xs text-destructive">Passwords do not match</p>
              )}
              {confirmPassword && password === confirmPassword && (
                <p className="text-xs text-green-600 flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3" /> Passwords match
                </p>
              )}
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={isLoading || !token || password !== confirmPassword || username.length < 3}
            >
              {isLoading ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Creating Account…</>
              ) : (
                <><ShieldCheck className="mr-2 h-4 w-4" />Create My Account</>
              )}
            </Button>

            <p className="text-xs text-center text-muted-foreground">
              Already have an account?{' '}
              <Link href="/login" className="underline text-primary">Sign in</Link>
            </p>
          </form>
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

'use client';
import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Link from 'next/link';
import { KeyRound, Lock, ArrowLeft, Loader2, CheckCircle, XCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://tcairrapiccontainer.azurewebsites.net/api/v1';

export default function ResetPasswordPage() {
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isValidating, setIsValidating] = useState(true);
    const [isTokenValid, setIsTokenValid] = useState(false);
    const [maskedEmail, setMaskedEmail] = useState('');
    const router = useRouter();
    const searchParams = useSearchParams();
    const token = searchParams.get('token');
    const { toast } = useToast();

    // Validate token on page load
    useEffect(() => {
        const validateToken = async () => {
            if (!token) {
                setIsValidating(false);
                setIsTokenValid(false);
                return;
            }

            try {
                const response = await fetch(`${API_BASE_URL}/auth/reset-password/validate/${token}`);
                const data = await response.json();

                if (response.ok && data.valid) {
                    setIsTokenValid(true);
                    setMaskedEmail(data.email);
                } else {
                    setIsTokenValid(false);
                }
            } catch (error) {
                setIsTokenValid(false);
            } finally {
                setIsValidating(false);
            }
        };

        validateToken();
    }, [token]);

    const handlePasswordReset = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!password || !confirmPassword) {
            toast({
                variant: 'destructive',
                title: 'Error',
                description: 'Please fill in all fields.',
            });
            return;
        }

        if (password !== confirmPassword) {
            toast({
                variant: 'destructive',
                title: 'Error',
                description: 'Passwords do not match.',
            });
            return;
        }

        if (password.length < 8) {
            toast({
                variant: 'destructive',
                title: 'Error',
                description: 'Password must be at least 8 characters long.',
            });
            return;
        }

        setIsLoading(true);
        try {
            const response = await fetch(`${API_BASE_URL}/auth/reset-password`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    token,
                    new_password: password,
                    confirm_password: confirmPassword,
                }),
            });

            const data = await response.json();

            if (response.ok) {
                toast({
                    title: 'Password Reset Successful',
                    description: 'You can now log in with your new password.',
                });
                router.push('/login');
            } else {
                toast({
                    variant: 'destructive',
                    title: 'Reset Failed',
                    description: data.detail?.password_errors?.join(', ') || data.detail || 'Failed to reset password.',
                });
            }
        } catch (error) {
            toast({
                variant: 'destructive',
                title: 'Error',
                description: 'An error occurred. Please try again.',
            });
        } finally {
            setIsLoading(false);
        }
    };

    // Show loading while validating token
    if (isValidating) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-background p-4">
                <Card className="w-full max-w-md shadow-2xl">
                    <CardContent className="flex flex-col items-center justify-center py-16">
                        <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
                        <p className="text-muted-foreground">Validating reset token...</p>
                    </CardContent>
                </Card>
            </div>
        );
    }

    // Show error if token is invalid
    if (!isTokenValid) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-background p-4">
                <Card className="w-full max-w-md shadow-2xl">
                    <CardHeader className="text-center">
                        <div className="flex justify-center items-center mb-4">
                            <div className="bg-destructive/10 border-2 border-destructive/20 p-4 rounded-xl">
                                <XCircle className="text-destructive size-8" />
                            </div>
                        </div>
                        <CardTitle className="text-2xl font-bold tracking-tight">Invalid or Expired Link</CardTitle>
                        <CardDescription>
                            This password reset link is invalid or has expired. Please request a new one.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Link href="/forgot-password">
                            <Button className="w-full bg-gradient-to-r from-primary to-accent text-lg h-12">
                                Request New Reset Link
                            </Button>
                        </Link>
                        <div className="mt-6 text-center text-sm">
                            <Link href="/login" className="font-semibold text-primary hover:underline flex items-center justify-center gap-2">
                                <ArrowLeft className="size-4" />
                                Back to Sign In
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
                            <KeyRound className="text-primary size-8" />
                        </div>
                    </div>
                    <CardTitle className="text-3xl font-bold tracking-tight">Reset Password</CardTitle>
                    <CardDescription>
                        Enter a new password for {maskedEmail}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handlePasswordReset} className="space-y-6">
                        <div className="space-y-2">
                            <Label htmlFor="password">New Password</Label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                                <Input
                                    id="password"
                                    type="password"
                                    placeholder="Enter new password"
                                    required
                                    className="pl-10"
                                    value={password}
                                    onChange={e => setPassword(e.target.value)}
                                    disabled={isLoading}
                                    minLength={8}
                                />
                            </div>
                            <p className="text-xs text-muted-foreground">
                                At least 8 characters with uppercase, lowercase, number, and special character
                            </p>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="confirmPassword">Confirm Password</Label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                                <Input
                                    id="confirmPassword"
                                    type="password"
                                    placeholder="Confirm new password"
                                    required
                                    className="pl-10"
                                    value={confirmPassword}
                                    onChange={e => setConfirmPassword(e.target.value)}
                                    disabled={isLoading}
                                />
                            </div>
                        </div>
                        <Button type="submit" className="w-full bg-gradient-to-r from-primary to-accent text-lg h-12" disabled={isLoading}>
                            {isLoading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Resetting...
                                </>
                            ) : (
                                'Reset Password'
                            )}
                        </Button>
                    </form>
                    <div className="mt-6 text-center text-sm">
                        <Link href="/login" className="font-semibold text-primary hover:underline flex items-center justify-center gap-2">
                            <ArrowLeft className="size-4" />
                            Back to Sign In
                        </Link>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

'use client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useState, useRef, useEffect } from 'react';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://tcairrapiccontainer.azurewebsites.net';

interface UserProfile {
  id: number;
  username: string;
  email: string;
  full_name?: string;
  role: string;
  is_active: boolean;
}

export default function ProfilePage() {
  const { toast } = useToast();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [name, setName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const token = localStorage.getItem('authToken');
    if (!token) {
      setLoading(false);
      return;
    }
    fetch(`${BACKEND_URL}/api/v1/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((data) => {
        setUser(data);
        setName(data.full_name || data.username || '');
        // Keep avatar from localStorage as backend doesn't store avatars
        const storedUser = localStorage.getItem('loggedInUser');
        if (storedUser) {
          try {
            const parsed = JSON.parse(storedUser);
            setAvatarUrl(parsed.avatar || 'https://picsum.photos/seed/10/200/200');
          } catch {}
        }
      })
      .catch(() => {
        // Fallback to localStorage if API fails
        const storedUser = localStorage.getItem('loggedInUser');
        if (storedUser) {
          try {
            const parsed = JSON.parse(storedUser);
            setUser({ id: parsed.id, username: parsed.name, email: parsed.email, role: parsed.role, is_active: true });
            setName(parsed.name);
            setAvatarUrl(parsed.avatar || 'https://picsum.photos/seed/10/200/200');
          } catch {}
        }
      })
      .finally(() => setLoading(false));
  }, []);

  const handleSaveChanges = async () => {
    if (!user) return;
    const token = localStorage.getItem('authToken');
    if (!token) return;
    setSaving(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/v1/users/${user.id}`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ full_name: name }),
      });
      if (!res.ok) throw new Error('Failed to save');
      const updated = await res.json();
      setUser(updated);
      // Sync avatar to localStorage for sidebar
      const storedUser = localStorage.getItem('loggedInUser');
      const base = storedUser ? JSON.parse(storedUser) : {};
      localStorage.setItem('loggedInUser', JSON.stringify({ ...base, name, avatar: avatarUrl }));
      window.dispatchEvent(new Event('storage'));
      toast({ title: 'Profile Updated', description: 'Your changes have been saved successfully.' });
    } catch {
      toast({ title: 'Error', description: 'Failed to save profile changes.', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const url = reader.result as string;
        setAvatarUrl(url);
        // Persist avatar locally (backend doesn't store images)
        const storedUser = localStorage.getItem('loggedInUser');
        const base = storedUser ? JSON.parse(storedUser) : {};
        localStorage.setItem('loggedInUser', JSON.stringify({ ...base, avatar: url }));
        toast({ title: 'Profile Picture Updated', description: 'Your new profile picture has been set.' });
      };
      reader.readAsDataURL(file);
    }
  };

  if (loading) return <div className="p-8">Loading profile…</div>;
  if (!user) return <div className="p-8">Please log in to view your profile.</div>;

  return (
    <div className="container mx-auto p-4 md:p-8">
      <h1 className="text-2xl font-semibold mb-8">User Profile</h1>
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Profile Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center gap-6">
            <Avatar className="size-24">
              <AvatarImage src={avatarUrl} />
              <AvatarFallback>{(name || user.username || '?').charAt(0).toUpperCase()}</AvatarFallback>
            </Avatar>
            <div className="space-y-2">
                <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
                    Change Picture
                </Button>
                <Input 
                    type="file" 
                    ref={fileInputRef} 
                    className="hidden" 
                    accept="image/*"
                    onChange={handleFileChange} 
                />
                 <p className="text-xs text-muted-foreground">Click to upload a new profile picture.</p>
            </div>
          </div>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input id="username" value={user.username} disabled />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input id="email" type="email" value={user.email} disabled />
            </div>
            <div className="space-y-2">
              <Label>Role</Label>
              <Input id="role" value={user.role} disabled />
              <p className="text-xs text-muted-foreground">
                Your role is managed by the system administrator.
              </p>
            </div>
          </div>
           <Button onClick={handleSaveChanges} disabled={saving}>{saving ? 'Saving…' : 'Save Changes'}</Button>
        </CardContent>
      </Card>
    </div>
  );
}

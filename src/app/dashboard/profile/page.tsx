'use client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useState, useRef, useEffect } from 'react';
import type { User } from '@/lib/users';

export default function ProfilePage() {
  const { toast } = useToast();
  const [user, setUser] = useState<User | null>(null);
  const [name, setName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem('loggedInUser');
    if (storedUser) {
      const parsedUser: User = JSON.parse(storedUser);
      setUser(parsedUser);
      setName(parsedUser.name);
      setAvatarUrl(parsedUser.avatar || 'https://picsum.photos/seed/10/200/200');
    }
  }, []);

  const handleSaveChanges = () => {
    if (user) {
      const updatedUser = { ...user, name, avatar: avatarUrl };
      localStorage.setItem('loggedInUser', JSON.stringify(updatedUser));
      setUser(updatedUser);
      toast({
        title: 'Profile Updated',
        description: 'Your changes have been saved successfully.',
      });
      // Force a re-render of the sidebar by dispatching a custom event
      window.dispatchEvent(new Event('storage'));
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarUrl(reader.result as string);
        toast({
          title: 'Profile Picture Updated',
          description: 'Your new profile picture has been set.',
        });
      };
      reader.readAsDataURL(file);
    }
  };

  if (!user) {
    return <div>Loading...</div>;
  }

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
              <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
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
           <Button onClick={handleSaveChanges}>Save Changes</Button>
        </CardContent>
      </Card>
    </div>
  );
}

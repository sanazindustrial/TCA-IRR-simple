
'use client';
import * as React from 'react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Plus, Save, Code, Copy, Power, Link as LinkIcon, TestTube, Trash2, Edit } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

const initialPages = [
    { id: 'eval', name: 'Upload & Evaluate', path: '/upload', description: 'Document upload and AI evaluation interface', status: 'iFrame' as 'iFrame' | 'Widget', enabled: true, dims: '1000w x 800h', theme: 'light', auth: true, rate: '50/hour', roles: ['admin', 'reviewer', 'user']},
    { id: 'dash', name: 'User Dashboard', path: '/dashboard', description: 'User dashboard with analytics and reports', status: 'iFrame' as 'iFrame' | 'Widget', enabled: true, dims: '1200w x 800h', theme: 'auto', auth: true, rate: '100/hour', roles: ['admin', 'reviewer']},
    { id: 'reports', name: 'Reports Viewer', path: '/reports', description: 'View and download evaluation reports', status: 'iFrame' as 'iFrame' | 'Widget', enabled: true, dims: '1000w x 700h', theme: 'light', auth: true, rate: '150/hour', roles: ['admin']},
    { id: 'ai', name: 'AI Analysis', path: '/ai-analysis', description: 'AI-powered insights and analytics', status: 'iFrame' as 'iFrame' | 'Widget', enabled: true, dims: '1000w x 900h', theme: 'dark', auth: true, rate: '50/hour', roles: ['admin']},
    { id: 'dd', name: 'DD Request System', path: '/dd-request', description: 'Due diligence report request system', status: 'Widget' as 'iFrame' | 'Widget', enabled: false, dims: '400w x 500h', theme: 'auto', auth: true, rate: '25/hour', roles: ['admin', 'user']},
    { id: 'submit', name: 'Submit Request', path: '/submit-request', description: 'User request submission form', status: 'Widget' as 'iFrame' | 'Widget', enabled: true, dims: '500w x 400h', theme: 'auto', auth: false, rate: '75/hour', roles: ['user', 'reviewer']},
]

type PageConfig = typeof initialPages[0];

const PageCard = ({ page, onToggle, onEdit, onDelete, baseUrl }: { page: PageConfig, onToggle: (id: string, enabled: boolean) => void, onEdit: (page: PageConfig) => void, onDelete: (id: string) => void, baseUrl: string }) => {
    const { toast } = useToast();

    const handleEmbedCode = () => {
        const embedCode = `<iframe src="${baseUrl}${page.path}" width="${page.dims.split('w')[0]}" height="${page.dims.split('h')[0].replace(' x ', '')}" frameborder="0"></iframe>`;
        navigator.clipboard.writeText(embedCode);
        toast({ title: "Embed Code Copied", description: "The iframe embed code has been copied." });
    }

    const handleCopyUrl = () => {
        const url = `${baseUrl}${page.path}`;
        navigator.clipboard.writeText(url);
        toast({ title: "URL Copied", description: `${url} copied to clipboard.` });
    }
    
    return (
        <Card>
            <CardHeader>
                <div className='flex justify-between items-start'>
                    <div>
                        <CardTitle className='text-xl'>{page.name}</CardTitle>
                        <CardDescription>{page.path}</CardDescription>
                    </div>
                    <div className='flex items-center gap-2'>
                        <Badge variant="outline">{page.status}</Badge>
                        <Badge variant={page.enabled ? "success" : "secondary"}>{page.enabled ? 'Enabled' : 'Disabled'}</Badge>
                    </div>
                </div>
                 <p className="text-sm text-muted-foreground pt-2">{page.description}</p>
            </CardHeader>
            <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                    <p className="font-semibold">Dimensions</p>
                    <p className="text-muted-foreground">{page.dims}</p>
                </div>
                 <div>
                    <p className="font-semibold">Theme</p>
                    <p className="text-muted-foreground capitalize">{page.theme}</p>
                </div>
                 <div>
                    <p className="font-semibold">Auth Required</p>
                    <p className="text-muted-foreground">{page.auth ? 'Yes' : 'No'}</p>
                </div>
                 <div>
                    <p className="font-semibold">Rate Limit</p>
                    <p className="text-muted-foreground">{page.rate}</p>
                </div>
                 <div className='col-span-full'>
                    <p className="font-semibold">Roles</p>
                    <div className='flex flex-wrap gap-1 mt-1'>
                        {page.roles.map(r => <Badge key={r} variant="secondary">{r}</Badge>)}
                    </div>
                </div>
            </CardContent>
            <CardFooter className="flex justify-between">
                <div className='flex gap-2'>
                    <Button variant="ghost" size="icon" onClick={() => onToggle(page.id, !page.enabled)}>
                        <Power className={`size-4 ${page.enabled ? 'text-destructive' : 'text-success'}`}/>
                    </Button>
                    <Button variant="ghost" size="icon" onClick={handleEmbedCode}><Code className="size-4" /></Button>
                    <Button variant="ghost" size="icon" onClick={handleCopyUrl}><Copy className="size-4" /></Button>
                </div>
                <div className='flex gap-2'>
                    <Button variant="outline" size="sm" onClick={() => onEdit(page)}><Edit className="mr-2"/> Edit</Button>
                    <Button variant="destructive" size="sm" onClick={() => onDelete(page.id)}><Trash2 /></Button>
                </div>
            </CardFooter>
        </Card>
    );
};

const PageDialog = ({ open, onOpenChange, onSave, page }: { open: boolean, onOpenChange: (open: boolean) => void, onSave: (page: PageConfig) => void, page: PageConfig | null }) => {
  const [editedPage, setEditedPage] = React.useState<PageConfig | null>(page);

  React.useEffect(() => {
      setEditedPage(page);
  }, [page]);

  if (!editedPage) return null;

  const handleChange = (field: keyof PageConfig, value: any) => {
    setEditedPage(prev => prev ? { ...prev, [field]: value } : null);
  };
  
  const handleRoleChange = (role: string) => {
      if(!editedPage) return;
      const roles = editedPage.roles.includes(role)
          ? editedPage.roles.filter(r => r !== role)
          : [...editedPage.roles, role];
      handleChange('roles', roles);
  }

  const handleSave = () => {
    if (editedPage) {
      onSave(editedPage);
    }
  };
  
  const isNew = !page?.id;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{isNew ? 'Add New Page Configuration' : `Editing: ${page?.name}`}</DialogTitle>
          <DialogDescription>
            {isNew ? 'Define the properties for the new remote page.' : 'Modify the configuration for this page.'}
          </DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-4 py-4 max-h-[60vh] overflow-y-auto pr-4">
          <div className="space-y-2 col-span-2 sm:col-span-1">
            <Label>Name</Label>
            <Input value={editedPage.name} onChange={(e) => handleChange('name', e.target.value)} />
          </div>
          <div className="space-y-2 col-span-2 sm:col-span-1">
            <Label>Path</Label>
            <Input value={editedPage.path} onChange={(e) => handleChange('path', e.target.value)} />
          </div>
          <div className="space-y-2 col-span-2">
            <Label>Description</Label>
            <Textarea value={editedPage.description} onChange={(e) => handleChange('description', e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Status (Type)</Label>
            <Select value={editedPage.status} onValueChange={(v) => handleChange('status', v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="iFrame">iFrame</SelectItem>
                <SelectItem value="Widget">Widget</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Dimensions (e.g., 1000w x 800h)</Label>
            <Input value={editedPage.dims} onChange={(e) => handleChange('dims', e.target.value)} />
          </div>
           <div className="space-y-2">
            <Label>Theme</Label>
            <Select value={editedPage.theme} onValueChange={(v) => handleChange('theme', v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="light">Light</SelectItem>
                <SelectItem value="dark">Dark</SelectItem>
                <SelectItem value="auto">Auto</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Rate Limit</Label>
            <Input value={editedPage.rate} onChange={(e) => handleChange('rate', e.target.value)} />
          </div>
          <div className="space-y-2 flex items-center pt-6">
            <Switch id="auth-required" checked={editedPage.auth} onCheckedChange={(c) => handleChange('auth', c)}/>
            <Label htmlFor="auth-required" className="ml-2">Auth Required</Label>
          </div>
          <div className="space-y-2 col-span-2">
            <Label>Accessible Roles</Label>
            <div className="flex flex-wrap gap-2">
                {['admin', 'reviewer', 'user'].map(role => (
                    <div key={role} className="flex items-center gap-2">
                        <Switch id={`role-${role}`} checked={editedPage.roles.includes(role)} onCheckedChange={() => handleRoleChange(role)} />
                        <Label htmlFor={`role-${role}`}>{role}</Label>
                    </div>
                ))}
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSave}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};


export default function RemoteIntegrationPage() {
  const [baseUrl, setBaseUrl] = useState('https://localhost:3000');
  const [pages, setPages] = useState(initialPages);
  const [isDialogOpen, setDialogOpen] = useState(false);
  const [editingPage, setEditingPage] = useState<PageConfig | null>(null);
  const { toast } = useToast();

  const handleSaveBaseUrl = () => {
    toast({
        title: "Base URL Saved",
        description: "The application base URL has been updated.",
    });
  };

  const handleTogglePage = (id: string, enabled: boolean) => {
    setPages(prev => prev.map(p => p.id === id ? { ...p, enabled } : p));
    const pageName = pages.find(p => p.id === id)?.name;
    toast({
      title: `Page ${enabled ? 'Enabled' : 'Disabled'}`,
      description: `${pageName} has been ${enabled ? 'enabled' : 'disabled'}.`,
    });
  };

  const handleDeletePage = (id: string) => {
    setPages(prev => prev.filter(p => p.id !== id));
    toast({
        variant: 'destructive',
        title: 'Page Deleted',
        description: 'The page configuration has been removed.'
    });
  };

  const handleOpenDialog = (page: PageConfig | null) => {
    setEditingPage(page);
    setDialogOpen(true);
  };
  
  const handleSavePage = (pageToSave: PageConfig) => {
    if (pageToSave.id) { // Editing existing page
        setPages(pages.map(p => p.id === pageToSave.id ? pageToSave : p));
        toast({ title: "Page Updated", description: `${pageToSave.name} configuration has been saved.` });
    } else { // Adding new page
        const newPage = { ...pageToSave, id: `new-${Date.now()}`};
        setPages([newPage, ...pages]);
        toast({ title: "Page Added", description: `${newPage.name} has been created.` });
    }
    setDialogOpen(false);
  };

  return (
    <div className="container mx-auto p-4 md:p-8 space-y-8">
      <header className='flex justify-between items-center'>
        <div>
          <h1 className="text-2xl font-bold">Remote Integration Configuration</h1>
          <p className="text-muted-foreground">Configure pages for remote access and embedding</p>
        </div>
        <Button onClick={() => handleOpenDialog({
            id: '', name: 'New Page', path: '/new-path', description: '', status: 'iFrame', 
            enabled: false, dims: '1000w x 800h', theme: 'auto', auth: true, rate: '100/hour', roles: ['admin']
        })}><Plus/> Add Page</Button>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Base URL Configuration</CardTitle>
        </CardHeader>
        <CardContent>
          <div className='flex items-end gap-4'>
            <div className='flex-1 space-y-2'>
                <Label htmlFor="base-url">Application Base URL</Label>
                <Input id="base-url" value={baseUrl} onChange={(e) => setBaseUrl(e.target.value)} />
            </div>
            <Button onClick={handleSaveBaseUrl}><Save/> Save</Button>
          </div>
        </CardContent>
      </Card>
      
      <div className='space-y-6'>
        {pages.map(page => (
            <PageCard 
                key={page.id} 
                page={page} 
                onToggle={handleTogglePage} 
                onEdit={handleOpenDialog}
                onDelete={handleDeletePage}
                baseUrl={baseUrl} 
            />
        ))}
      </div>
      
      <PageDialog
        open={isDialogOpen}
        onOpenChange={setDialogOpen}
        onSave={handleSavePage}
        page={editingPage}
      />

    </div>
  );
}

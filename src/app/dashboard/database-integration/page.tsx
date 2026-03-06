
'use client';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  GitBranch,
  Plus,
  Save,
  TestTube,
  Trash2,
  Copy,
  Link as LinkIcon,
  Database,
} from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const initialConnections = [
    { id: 'prod', name: 'Production PostgreSQL', type: 'PostgreSQL', status: 'Connected', host: 'prod.db.startupcompass.ai', port: 5432, user: 'admin', lastCheck: '2 minutes ago', enabled: true, isPrimary: true, password: 'prod_password_secret'},
    { id: 'staging', name: 'Staging PostgreSQL', type: 'PostgreSQL', status: 'Connected', host: 'staging.db.startupcompass.ai', port: 5432, user: 'admin', lastCheck: '5 minutes ago', enabled: true, isPrimary: false, password: 'staging_password_secret'},
    { id: 'dev', name: 'Development PostgreSQL', type: 'PostgreSQL', status: 'Error', host: 'localhost', port: 5432, user: 'dev', lastCheck: '1 hour ago', enabled: false, isPrimary: false, password: 'dev_password_secret'},
    { id: 'analytics', name: 'Analytics Data Warehouse', type: 'BigQuery', status: 'Connected', host: 'bigquery.googleapis.com', port: 443, user: 'service-account', lastCheck: '15 minutes ago', enabled: true, isPrimary: false, password: 'bq_service_account_key'},
];

type Connection = typeof initialConnections[0];

const ConnectionCard = ({ conn, onToggle, onTest, onDelete }: { conn: Connection; onToggle: (id: string, enabled: boolean) => void; onTest: (id: string) => void; onDelete: (id: string) => void; }) => {
    const { toast } = useToast();

    const getConnectionString = () => {
        const type = conn.type.toLowerCase();
        if (type === 'postgresql') {
            return `postgresql://${conn.user}:${conn.password}@${conn.host}:${conn.port}/${conn.name.toLowerCase().replace(/ /g, '_')}`;
        }
        return `Type: ${conn.type}, Host: ${conn.host}`;
    }

    const handleCopyString = () => {
        navigator.clipboard.writeText(getConnectionString());
        toast({ title: 'Connection String Copied' });
    }

    return (
     <Card>
        <CardHeader>
            <div className="flex justify-between items-start">
                <div>
                    <CardTitle className='flex items-center gap-2'>
                        <Database className="size-5 text-primary" />
                        {conn.name}
                    </CardTitle>
                    <CardDescription>{conn.type}</CardDescription>
                </div>
                <div className='flex items-center gap-2'>
                   {conn.isPrimary && <Badge>Primary</Badge>}
                    <Badge variant={conn.status === 'Connected' ? 'success' : 'destructive'}>{conn.status}</Badge>
                </div>
            </div>
        </CardHeader>
        <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
                <p className="font-semibold">Host</p>
                <p className="text-muted-foreground">{conn.host}</p>
            </div>
             <div>
                <p className="font-semibold">Port</p>
                <p className="text-muted-foreground">{conn.port}</p>
            </div>
             <div>
                <p className="font-semibold">User</p>
                <p className="text-muted-foreground">{conn.user}</p>
            </div>
             <div>
                <p className="font-semibold">Last Check</p>
                <p className="text-muted-foreground">{conn.lastCheck}</p>
            </div>
        </CardContent>
        <CardFooter className="flex justify-between items-center">
            <div className='flex gap-2'>
                 <Switch id={`active-${conn.id}`} checked={conn.enabled} onCheckedChange={(checked) => onToggle(conn.id, checked)} />
                 <Label htmlFor={`active-${conn.id}`}>Enable</Label>
            </div>
             <div className='flex gap-2'>
                <Button variant="outline" size="sm" onClick={() => onTest(conn.id)}><TestTube className="mr-2"/> Test</Button>
                <Button variant="outline" size="sm" onClick={handleCopyString}><LinkIcon className="mr-2"/> Connection String</Button>
                <Button variant="destructive" size="sm" onClick={() => onDelete(conn.id)}><Trash2 /></Button>
            </div>
        </CardFooter>
    </Card>
    );
};


export default function DatabaseIntegrationPage() {
    const [connections, setConnections] = useState(initialConnections);
    const [envContent, setEnvContent] = useState('');
    const [isDialogOpen, setDialogOpen] = useState(false);
    const [newConnection, setNewConnection] = useState<Partial<Connection>>({ name: '', type: 'PostgreSQL', host: '', port: 5432, user: '', password: '', enabled: true });
    const { toast } = useToast();

    useEffect(() => {
        const generateEnv = () => {
            const activeConnections = connections.filter(c => c.enabled);
            const content = activeConnections.map(c => {
                const nameKey = c.name.toUpperCase().replace(/ /g, '_').replace(/[^A-Z0-9_]/g, '');
                const url = `postgresql://${c.user}:${c.password}@${c.host}:${c.port}/${c.name.toLowerCase().replace(/ /g, '_')}`;
                return `${nameKey}_DATABASE_URL="${url}"`;
            }).join('\n');
            setEnvContent(content);
        };
        generateEnv();
    }, [connections]);
    
    const handleToggle = (id: string, enabled: boolean) => {
        setConnections(conns => conns.map(c => c.id === id ? {...c, enabled} : c));
    };

    const handleTest = (id: string) => {
        const conn = connections.find(c => c.id === id);
        toast({ title: `Testing ${conn?.name}...`, description: 'Connection successful!' });
    };

    const handleDelete = (id: string) => {
        setConnections(conns => conns.filter(c => c.id !== id));
        toast({ title: 'Connection Deleted', variant: 'destructive'});
    };

    const handleCopyEnv = () => {
        navigator.clipboard.writeText(envContent);
        toast({ title: 'Copied to Clipboard', description: '.env content has been copied.' });
    };

    const handleSaveEnv = () => {
        toast({ title: 'Save to .env', description: 'This would save the content to a local .env file in a real application.' });
    };

    const handleAddConnection = () => {
        if (newConnection.name && newConnection.host && newConnection.user && newConnection.password) {
            const newConn: Connection = {
                id: `conn-${Date.now()}`,
                name: newConnection.name,
                type: newConnection.type || 'PostgreSQL',
                status: 'Pending',
                host: newConnection.host,
                port: newConnection.port || 5432,
                user: newConnection.user,
                password: newConnection.password,
                lastCheck: 'Never',
                enabled: true,
                isPrimary: false,
            };
            setConnections(prev => [newConn, ...prev]);
            setDialogOpen(false);
            setNewConnection({ name: '', type: 'PostgreSQL', host: '', port: 5432, user: '', password: '', enabled: true });
            toast({ title: 'Connection Added', description: `${newConn.name} has been added.` });
        } else {
            toast({ title: 'Error', description: 'Please fill all required fields.', variant: 'destructive' });
        }
    };

  return (
    <div className="container mx-auto p-4 md:p-8 space-y-8">
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <GitBranch className="text-primary" />
            Database Integration & Testing
          </h1>
          <p className="text-muted-foreground">
            Manage multiple database connections with automatic .env generation
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
                <Button>
                  <Plus /> Add Connection
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Add New Database Connection</DialogTitle>
                    <DialogDescription>Configure a new database to be used by the application.</DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="name" className="text-right">Name</Label>
                        <Input id="name" value={newConnection.name} onChange={(e) => setNewConnection({...newConnection, name: e.target.value})} className="col-span-3" />
                    </div>
                     <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="type" className="text-right">Type</Label>
                        <Select value={newConnection.type} onValueChange={(value) => setNewConnection({...newConnection, type: value as Connection['type']})}>
                            <SelectTrigger className="col-span-3">
                                <SelectValue placeholder="Select type"/>
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="PostgreSQL">PostgreSQL</SelectItem>
                                <SelectItem value="MySQL">MySQL</SelectItem>
                                <SelectItem value="MongoDB">MongoDB</SelectItem>
                                <SelectItem value="BigQuery">BigQuery</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                     <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="host" className="text-right">Host</Label>
                        <Input id="host" value={newConnection.host} onChange={(e) => setNewConnection({...newConnection, host: e.target.value})} className="col-span-3" />
                    </div>
                     <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="port" className="text-right">Port</Label>
                        <Input id="port" type="number" value={newConnection.port} onChange={(e) => setNewConnection({...newConnection, port: parseInt(e.target.value) || 0})} className="col-span-3" />
                    </div>
                     <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="user" className="text-right">User</Label>
                        <Input id="user" value={newConnection.user} onChange={(e) => setNewConnection({...newConnection, user: e.target.value})} className="col-span-3" />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="password" className="text-right">Password</Label>
                        <Input id="password" type="password" value={newConnection.password} onChange={(e) => setNewConnection({...newConnection, password: e.target.value})} className="col-span-3" />
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
                    <Button onClick={handleAddConnection}>Save Connection</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
      </header>

      <div className='grid grid-cols-1 lg:grid-cols-2 gap-8'>
        <div className="space-y-6">
            {connections.map(conn => <ConnectionCard key={conn.id} conn={conn} onToggle={handleToggle} onTest={handleTest} onDelete={handleDelete} />)}
        </div>
        <Card>
            <CardHeader>
                <CardTitle>Generated .env Configuration</CardTitle>
                <CardDescription>This file is automatically generated based on your active database connections. Copy it or save it to your project root.</CardDescription>
            </CardHeader>
            <CardContent>
                <Textarea value={envContent} readOnly rows={12} className="font-mono text-xs bg-muted/50" />
            </CardContent>
            <CardFooter className='flex justify-end gap-2'>
                <Button variant="outline" onClick={handleCopyEnv}><Copy/> Copy</Button>
                <Button onClick={handleSaveEnv}><Save/> Save to .env</Button>
            </CardFooter>
        </Card>
      </div>

    </div>
  );
}

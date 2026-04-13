
'use client';
import * as React from 'react';
import { useState } from 'react';
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Settings,
  AlertTriangle,
  Plus,
  Trash2,
  Copy,
  Download,
  KeyRound,
  TestTube,
  Rocket,
  CheckCircle,
  XCircle,
  Database,
  Lightbulb,
  Cpu,
  Zap,
  Edit,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

type EnvVar = {
  id: string;
  name: string;
  value: string;
  scope: 'frontend' | 'backend';
  description: string;
};

type ApiKey = {
  id: string;
  name: string;
  keySnippet: string;
  value: string;
};


const initialEnvVars: EnvVar[] = [
  { id: '1', name: 'NODE_ENV', value: 'development', scope: 'backend', description: 'Backend-node only' },
  { id: '2', name: 'NEXT_PUBLIC_SUPABASE_URL', value: 'https://ixshfrcomwlmybmvupdanv.supabase.co', scope: 'frontend', description: 'Accessible to React frontend' },
  { id: '3', name: 'NEXT_PUBLIC_SUPABASE_ANON_KEY', value: '*****************', scope: 'frontend', description: 'Accessible to React frontend' },
  { id: '4', name: 'OPENAI_API_KEY', value: '*****************', scope: 'backend', description: 'Backend-node only' },
  { id: '5', name: 'GEMINI_API_KEY', value: '*****************', scope: 'backend', description: 'Backend-node only' },
  { id: '6', name: 'DATABASE_URL', value: 'postgresql://postgres:password@localhost:5432/pitch.db', scope: 'backend', description: 'Backend-node only' },
  { id: '7', name: 'SMTP_HOST', value: 'smtp.gmail.com', scope: 'backend', description: 'Backend-node only' },
];

const initialApiKeys: ApiKey[] = [
    { id: 'key-1', name: 'Gemini', value: 'AIzaSy****************', keySnippet: 'AIzaSy...' },
    { id: 'key-2', name: 'OpenAI', value: 'sk-****************', keySnippet: 'sk-...' },
    { id: 'key-3', name: 'Supabase', value: 'eyJhbGci****************', keySnippet: 'eyJhbGci...' },
    { id: 'key-4', name: 'Crunchbase', value: '', keySnippet: '' },
    { id: 'key-5', name: 'Anthropic', value: '', keySnippet: '' },
    { id: 'key-6', name: 'GitHub', value: '', keySnippet: '' },
];

const connections = [
    { name: 'Database', status: 'disconnected' },
    { name: 'OpenAI', status: 'disconnected' },
    { name: 'Supabase', status: 'connected' },
    { name: 'Smtp', status: 'disconnected' },
];

const systemHealth = [
    { name: 'Database Connection', status: 'disconnected'},
    { name: 'OpenAI API', status: 'disconnected'},
    { name: 'Supabase', status: 'connected'},
    { name: 'SMTP Email', status: 'disconnected'},
]

const configurationFeatures = [
    { name: 'TCA Categories (12) with custom weights'},
    { name: 'Risk Flags (14) with thresholds'},
    { name: 'Growth Classifier (6 models)'},
    { name: 'DD Configuration (10 modules)'},
    { name: 'Macro Trend Alignment'},
    { name: 'Benchmark Comparison'},
    { name: 'Founder & Strategic Fit Analysis'},
];

const ApiKeyDialog = ({ open, onOpenChange, onSave, apiKey }: { open: boolean, onOpenChange: (open: boolean) => void, onSave: (key: ApiKey) => void, apiKey: ApiKey | null }) => {
    const [editedKey, setEditedKey] = useState<ApiKey | null>(apiKey);

    React.useEffect(() => {
        setEditedKey(apiKey);
    }, [apiKey]);

    if (!editedKey) return null;

    const handleChange = (field: keyof ApiKey, value: any) => {
        setEditedKey(prev => prev ? { ...prev, [field]: value } : null);
    };

    const handleSave = () => {
        if (editedKey && editedKey.name && editedKey.value) {
            onSave({
                ...editedKey,
                keySnippet: editedKey.value ? `${editedKey.value.substring(0, 8)}...` : ''
            });
        }
    };
    
    const isNew = !apiKey?.id;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{isNew ? 'Add New API Key' : `Edit ${apiKey?.name} API Key`}</DialogTitle>
                    <DialogDescription>{isNew ? 'Add a new API key to your system configuration.' : 'Update the details for this API key.'}</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="key-name">Service Name</Label>
                        <Input id="key-name" value={editedKey.name} onChange={(e) => handleChange('name', e.target.value)} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="key-value">API Key</Label>
                        <Input id="key-value" type="password" value={editedKey.value} onChange={(e) => handleChange('value', e.target.value)} />
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                    <Button onClick={handleSave}>Save Key</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

export default function SystemConfigPage() {
  const [envVars, setEnvVars] = useState(initialEnvVars);
  const [apiKeys, setApiKeys] = useState(initialApiKeys);
  const [isApiKeyDialogOpen, setApiKeyDialogOpen] = useState(false);
  const [editingApiKey, setEditingApiKey] = useState<ApiKey | null>(null);

  const { toast } = useToast();

  const handleVarChange = (id: string, field: 'name' | 'value' | 'scope' | 'description', value: string) => {
    setEnvVars((prev) =>
      prev.map((v) => (v.id === id ? { ...v, [field]: value } : v))
    );
  };

  const handleRemoveVar = (id: string) => {
    setEnvVars((prev) => prev.filter((v) => v.id !== id));
  };
  
  const handleAddVar = () => {
    const newVar: EnvVar = {
      id: `new-${Date.now()}`,
      name: 'NEW_VARIABLE',
      value: '',
      scope: 'backend',
      description: 'Newly added variable',
    };
    setEnvVars((prev) => [newVar, ...prev]);
    toast({
      title: 'Variable Added',
      description: 'A new environment variable row has been added.',
    });
  };

  const handleGuessSecrets = () => {
    const secretKeywords = ['_KEY', '_SECRET', '_PASSWORD', '_TOKEN'];
    let secretsMasked = 0;
    const updatedVars = envVars.map(v => {
      const shouldMask = secretKeywords.some(keyword => v.name.toUpperCase().includes(keyword));
      if (shouldMask && v.value !== '*****************') {
        secretsMasked++;
        return { ...v, value: '*****************' };
      }
      return v;
    });

    setEnvVars(updatedVars);
    if (secretsMasked > 0) {
      toast({ title: 'Secrets Masked', description: `${secretsMasked} potential secret(s) have been masked.` });
    } else {
      toast({ title: 'No New Secrets Found', description: 'All potential secrets appear to be masked already.' });
    }
  };
  
  const handleCopyVar = (value: string) => {
    navigator.clipboard.writeText(value);
    toast({ title: 'Copied to clipboard' });
  };
  
  const handleDownloadEnv = () => {
    const envContent = envVars
      .map(v => `${v.name}="${v.value}"`)
      .join('\n');
    const blob = new Blob([envContent], { type: 'text/plain;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = '.env';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast({ title: 'Downloading .env file' });
  };

  const handleTestConnection = (name: string) => {
      toast({title: `Testing ${name}...`, description: 'This is a placeholder action.'})
  }

  const handleOpenApiKeyDialog = (key: ApiKey | null) => {
    setEditingApiKey(key);
    setApiKeyDialogOpen(true);
  };

  const handleSaveApiKey = (keyToSave: ApiKey) => {
    if (keyToSave.id) { // Editing
      setApiKeys(apiKeys.map(k => k.id === keyToSave.id ? keyToSave : k));
      toast({ title: "API Key Updated", description: `${keyToSave.name} has been updated.` });
    } else { // Adding
      const newKey = { ...keyToSave, id: `key-${Date.now()}` };
      setApiKeys([newKey, ...apiKeys]);
      toast({ title: "API Key Added", description: `${newKey.name} has been created.` });
    }
    setApiKeyDialogOpen(false);
  };
  
  const handleDeleteApiKey = (keyId: string) => {
      const keyName = apiKeys.find(k => k.id === keyId)?.name;
      setApiKeys(apiKeys.filter(k => k.id !== keyId));
      toast({ title: "API Key Deleted", description: `${keyName} has been removed.`, variant: "destructive" });
  };

  return (
    <>
      <div className="bg-muted/30 min-h-screen">
        <div className="container mx-auto p-4 md:p-8">
          <header className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-2xl font-semibold flex items-center gap-2">
                <Settings className="text-primary" />
                System Configuration & Testing
              </h1>
              <p className="text-muted-foreground">
                Manage environment variables, API keys, and test connections
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={() => toast({title: 'Testing all connections...'})}>
                <TestTube className="mr-2" /> Test All
              </Button>
              <Button onClick={handleDownloadEnv}>
                <Download className="mr-2" /> Download .env
              </Button>
            </div>
          </header>

          <Tabs defaultValue="api-keys">
            <TabsList className="mb-6 grid grid-cols-1 md:grid-cols-5">
              <TabsTrigger value="env-vars">Environment Variables</TabsTrigger>
              <TabsTrigger value="api-keys">API Keys</TabsTrigger>
              <TabsTrigger value="connection-status">Connection Status</TabsTrigger>
              <TabsTrigger value="system-testing">System Testing</TabsTrigger>
              <TabsTrigger value="sector-setup">Sector Setup Management</TabsTrigger>
            </TabsList>
            <TabsContent value="env-vars">
              <Card>
                  <CardHeader>
                      <CardTitle>Environment Variables</CardTitle>
                      <div className="flex items-center justify-between">
                          <CardDescription>
                              Total variables: {envVars.length} | Frontend: {envVars.filter(v => v.scope === 'frontend').length} | Backend: {envVars.filter(v => v.scope === 'backend').length}
                          </CardDescription>
                          <div className="flex items-center gap-2">
                              <Button variant="outline" onClick={handleGuessSecrets}>Guess Secrets</Button>
                              <Button onClick={handleAddVar}><Plus className="mr-2" /> Add Variable</Button>
                          </div>
                      </div>
                  </CardHeader>
                <CardContent>
                  <Alert className="mb-6 bg-blue-950/50 border-blue-500/30 text-blue-200">
                    <AlertTriangle className="h-4 w-4 !text-blue-400" />
                    <AlertTitle className="text-blue-300">Environment Variable Guidelines</AlertTitle>
                    <AlertDescription className="text-blue-200/80">
                      <ul className="list-disc list-inside text-xs space-y-1">
                        <li>Frontend variables must start with <code className="bg-blue-400/20 p-1 rounded">NEXT_PUBLIC_</code> to be accessible in React/Next.js.</li>
                        <li>Backend variables can use any name (e.g., DATABASE_URL, OPENAI_API_KEY).</li>
                        <li>API Keys should be kept secure and never exposed to the frontend.</li>
                        <li>URLs should include protocol (http:// or https://).</li>
                        <li>Ports should be numeric values only.</li>
                      </ul>
                    </AlertDescription>
                  </Alert>

                  <div className="space-y-4">
                    {envVars.map((v) => (
                      <div
                        key={v.id}
                        className="grid grid-cols-12 items-center gap-4 p-2 rounded-md border"
                      >
                        <div className="col-span-3 flex items-center gap-2">
                           <Input value={v.name} onChange={(e) => handleVarChange(v.id, 'name', e.target.value)} className="font-mono text-sm h-8" />
                        </div>
                        <div className="col-span-4">
                          <Input
                              id={v.id}
                              value={v.value}
                              onChange={(e) => handleVarChange(v.id, 'value', e.target.value)}
                              type={v.value.includes('***') ? 'password' : 'text'}
                              className="h-8"
                          />
                        </div>
                        <div className="col-span-2">
                           <Select value={v.scope} onValueChange={(value) => handleVarChange(v.id, 'scope', value)}>
                             <SelectTrigger className="h-8 text-xs">
                               <SelectValue/>
                             </SelectTrigger>
                             <SelectContent>
                               <SelectItem value="frontend">frontend</SelectItem>
                               <SelectItem value="backend">backend</SelectItem>
                             </SelectContent>
                           </Select>
                        </div>
                        <div className="col-span-2 text-xs text-muted-foreground">
                          <Input value={v.description} onChange={(e) => handleVarChange(v.id, 'description', e.target.value)} className="text-xs h-8"/>
                        </div>
                        <div className="col-span-1 flex items-center justify-end gap-1">
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleCopyVar(v.value)}>
                              <Copy className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive/80 hover:text-destructive" onClick={() => handleRemoveVar(v.id)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
                <CardFooter className="flex justify-end border-t pt-6">
                  <Button size="lg" onClick={() => toast({title: "Configuration Saved"})}>Save Configuration</Button>
                </CardFooter>
              </Card>
            </TabsContent>
            <TabsContent value="api-keys">
              <Card>
                  <CardHeader className="flex-row items-center justify-between">
                      <div>
                        <CardTitle>API Keys Management</CardTitle>
                        <CardDescription>Manage and test API keys for external services.</CardDescription>
                      </div>
                      <Button onClick={() => handleOpenApiKeyDialog({id: '', name: '', value: '', keySnippet: ''})}><Plus className="mr-2"/> Add API Key</Button>
                  </CardHeader>
                  <CardContent className="space-y-6">
                      <Alert variant="destructive">
                          <AlertTriangle className="h-4 w-4" />
                          <AlertTitle>API Key Security Guidelines</AlertTitle>
                          <AlertDescription>
                              <ul className="list-disc list-inside text-xs space-y-1">
                                  <li>Never expose API keys in frontend code or client-side variables.</li>
                                  <li>Use environment variables for all sensitive keys (backend scope).</li>
                                  <li>Rotate keys regularly and monitor usage for security.</li>
                                  <li>Set usage limits and alerts for cost control.</li>
                                  <li>Use separate keys for development, staging, and production.</li>
                              </ul>
                          </AlertDescription>
                      </Alert>

                      <div className="space-y-4">
                          {apiKeys.map(key => {
                              const isConfigured = !!key.value;
                              return (
                                <div key={key.id} className="flex items-center justify-between p-4 border rounded-lg">
                                    <div className="flex items-center gap-4">
                                        <KeyRound className="size-6 text-muted-foreground"/>
                                        <div>
                                            <p className="font-semibold">{key.name}</p>
                                            <p className="text-sm text-muted-foreground">{isConfigured ? key.keySnippet : 'Not configured'}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        {isConfigured ? (
                                            <Badge variant="success">Configured</Badge>
                                        ) : (
                                            <Badge variant="destructive">Missing</Badge>
                                        )}
                                        <Button variant="outline" size="sm" onClick={() => handleTestConnection(key.name)}><TestTube className="mr-2"/> Test</Button>
                                        <Button variant="outline" size="sm" onClick={() => handleOpenApiKeyDialog(key)}><Edit className="mr-2"/> Edit</Button>
                                        <Button variant="ghost" size="icon" onClick={() => handleDeleteApiKey(key.id)}><Trash2 className="size-4 text-destructive"/></Button>
                                    </div>
                                </div>
                              )
                          })}
                      </div>
                  </CardContent>
              </Card>
            </TabsContent>
              <TabsContent value="connection-status">
                  <Card>
                      <CardHeader>
                          <CardTitle>Connection Status</CardTitle>
                          <CardDescription>Check the status of external service connections.</CardDescription>
                      </CardHeader>
                      <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          {connections.map(conn => (
                              <Card key={conn.name} className="p-4">
                                <div className="flex items-center justify-between">
                                  <div>
                                      <h3 className="font-semibold">{conn.name}</h3>
                                      <Button size="sm" className="mt-2" onClick={() => handleTestConnection(conn.name)}>Test Connection</Button>
                                  </div>
                                  {conn.status === 'connected' ? (
                                      <Badge variant="success" className="gap-1.5">
                                          <CheckCircle className="size-3"/>
                                          Connected
                                      </Badge>
                                  ) : (
                                      <Badge variant="destructive" className="gap-1.5">
                                          <XCircle className="size-3"/>
                                          Disconnected
                                      </Badge>
                                  )}
                                </div>
                              </Card>
                          ))}
                      </CardContent>
                  </Card>
              </TabsContent>
              <TabsContent value="system-testing">
                  <Card>
                      <CardHeader>
                          <CardTitle>System Testing & Diagnostics</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-6">
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                              <Button size="lg" onClick={() => handleTestConnection('Database')}><Database className="mr-2"/> Test Database</Button>
                              <Button size="lg" onClick={() => handleTestConnection('OpenAI API')}><Rocket className="mr-2"/> Test OpenAI API</Button>
                              <Button size="lg" onClick={() => handleTestConnection('Supabase')}><TestTube className="mr-2"/> Test Supabase</Button>
                          </div>
                          <Card>
                              <CardHeader>
                                  <CardTitle>System Health Check</CardTitle>
                              </CardHeader>
                              <CardContent className="space-y-2">
                                  {systemHealth.map(item => (
                                      <div key={item.name} className="flex justify-between items-center text-sm p-2 rounded-md bg-muted/50">
                                          <p className="font-medium text-muted-foreground">{item.name}:</p>
                                          <Badge variant={item.status === 'connected' ? 'success' : 'destructive'}>
                                              {item.status}
                                          </Badge>
                                      </div>
                                  ))}
                              </CardContent>
                          </Card>
                      </CardContent>
                  </Card>
              </TabsContent>
              <TabsContent value="sector-setup">
                  <Card>
                      <CardHeader>
                          <CardTitle>Sector Configuration Setup Management</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-8">
                           <Alert className="bg-blue-950/50 border-blue-500/30 text-blue-200">
                              <Rocket className="h-4 w-4 !text-blue-400" />
                              <AlertTitle className="text-blue-300">Create New Analysis Configurations</AlertTitle>
                              <AlertDescription className="text-blue-200/80">
                                  Configure custom analysis setups for different sectors, use cases, or client requirements. Each setup includes TCA categories, risk flags, growth classifier, and all 9 analysis modules.
                                  <div className="mt-4">
                                      <Button asChild variant="outline" className="bg-transparent hover:bg-blue-400/20 border-blue-400/50 text-blue-300">
                                          <Link href="/analysis/modules/tca">Open Sector Configuration Panel</Link>
                                      </Button>
                                  </div>
                              </AlertDescription>
                          </Alert>

                          <div>
                              <h3 className="text-lg font-semibold mb-4">Available Configuration Types:</h3>
                              <div className="space-y-4">
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start p-4 border rounded-lg bg-green-950/30 border-green-500/20">
                                      <div>
                                          <h4 className="font-semibold flex items-center gap-2"><Cpu className="text-green-400" /> Tech/Others Setup</h4>
                                          <p className="text-sm text-muted-foreground">Optimized for software, hardware, AI/ML, fintech</p>
                                      </div>
                                      <ul className="text-sm space-y-1 text-muted-foreground">
                                          {configurationFeatures.map(feature => (
                                              <li key={feature.name} className="flex items-center gap-2">
                                                  <CheckCircle className="size-4 text-green-500"/>
                                                  {feature.name}
                                              </li>
                                          ))}
                                      </ul>
                                  </div>
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start p-4 border rounded-lg bg-purple-950/30 border-purple-500/20">
                                      <div>
                                          <h4 className="font-semibold flex items-center gap-2"><Zap className="text-purple-400" /> Life Science Setup</h4>
                                          <p className="text-sm text-muted-foreground">Biotech, pharma, medical devices, digital health</p>
                                      </div>
                                      <ul className="text-sm space-y-1 text-muted-foreground">
                                          {configurationFeatures.map(feature => (
                                              <li key={feature.name} className="flex items-center gap-2">
                                                  <CheckCircle className="size-4 text-green-500"/>
                                                  {feature.name}
                                              </li>
                                          ))}
                                      </ul>
                                  </div>
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start p-4 border rounded-lg bg-yellow-950/30 border-yellow-500/20">
                                      <div>
                                          <h4 className="font-semibold flex items-center gap-2"><Settings className="text-yellow-400" /> Custom Setup</h4>
                                          <p className="text-sm text-muted-foreground">Tailored configurations for specific needs</p>
                                      </div>
                                      <ul className="text-sm space-y-1 text-muted-foreground">
                                          {configurationFeatures.map(feature => (
                                              <li key={feature.name} className="flex items-center gap-2">
                                                  <CheckCircle className="size-4 text-green-500"/>
                                                  {feature.name}
                                              </li>
                                          ))}
                                      </ul>
                                  </div>
                              </div>
                          </div>

                          <Alert>
                              <Lightbulb className="h-4 w-4" />
                              <AlertTitle>Quick Setup Guide:</AlertTitle>
                              <AlertDescription>
                                  <ol className="list-decimal list-inside space-y-1 mt-2">
                                      <li>Click "Open Sector Configuration Panel" above.</li>
                                      <li>Click "Create New Setup" in the Setup Management section.</li>
                                      <li>Enter setup name and select target sector.</li>
                                      <li>Choose base template (default or existing setup).</li>
                                      <li>Configure all 9 modules with custom weights and settings.</li>
                                      <li>Save and activate your new configuration.</li>
                                  </ol>
                              </AlertDescription>
                          </Alert>
                      </CardContent>
                  </Card>
              </TabsContent>
          </Tabs>
        </div>
      </div>
      <ApiKeyDialog
        open={isApiKeyDialogOpen}
        onOpenChange={setApiKeyDialogOpen}
        onSave={handleSaveApiKey}
        apiKey={editingApiKey}
      />
    </>
  );
}

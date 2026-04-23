'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  DatabaseBackup,
  Plus,
  Upload,
  MoreHorizontal,
  Play,
  Trash2,
  Pause,
  Clock,
  RefreshCw,
  Wifi,
  WifiOff,
} from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

type BackupJob = {
  id: string;
  name: string;
  status: 'Completed' | 'Running' | 'Paused' | 'Failed';
  schedule: string;
  lastRun: string;
  destination: string;
};

const initialJobs: BackupJob[] = [
  {
    id: 'job-1',
    name: 'Daily Full Backup',
    status: 'Completed',
    schedule: 'Daily at 2:00 AM',
    lastRun: '10/24/2025, 2:00:15 AM',
    destination: 'Azure Blob Storage',
  },
  {
    id: 'job-2',
    name: 'Weekly User Data',
    status: 'Paused',
    schedule: 'Sundays at 4:00 AM',
    lastRun: '10/19/2025, 4:00:10 AM',
    destination: 'AWS S3',
  },
  {
    id: 'job-3',
    name: 'Real-time Transaction Log',
    status: 'Running',
    schedule: 'Every 15 minutes',
    lastRun: '10/24/2025, 10:30:00 AM',
    destination: 'Google Cloud Storage',
  },
];

const statusColors: { [key: string]: string } = {
  Completed: 'bg-success/20 text-success',
  Running: 'bg-blue-500/20 text-blue-500',
  Paused: 'bg-gray-500/20 text-gray-500',
  Failed: 'bg-destructive/20 text-destructive',
};

export default function BackupPage() {
  const [jobs, setJobs] = useState<BackupJob[]>(initialJobs);
  const [isDialogOpen, setDialogOpen] = useState(false);
  const [newJobName, setNewJobName] = useState('');
  const [newJobSchedule, setNewJobSchedule] = useState('Daily at 2:00 AM');
  const [isLoading, setIsLoading] = useState(true);
  const [backendAvailable, setBackendAvailable] = useState<boolean | null>(null);
  const [lastChecked, setLastChecked] = useState<string>('');
  const { toast } = useToast();

  const fetchBackupStatus = async () => {
    setIsLoading(true);
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;
      const res = await fetch('/api/backup', {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        cache: 'no-store',
      });
      if (res.ok) {
        const data = await res.json();
        if (data.source === 'backend' && Array.isArray(data.jobs) && data.jobs.length > 0) {
          setJobs(data.jobs);
          setBackendAvailable(true);
        } else {
          // Endpoint responded but no jobs yet or fallback – keep static jobs as baseline
          setBackendAvailable(data.dbHealthy ?? false);
        }
        setLastChecked(new Date().toLocaleTimeString());
      } else {
        setBackendAvailable(false);
      }
    } catch {
      setBackendAvailable(false);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBackupStatus();
    // Refresh every 60 seconds to catch status changes
    const interval = setInterval(fetchBackupStatus, 60_000);
    return () => clearInterval(interval);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCreateJob = () => {
    if (newJobName.trim()) {
      const newJob: BackupJob = {
        id: `job-${Date.now()}`,
        name: newJobName,
        status: 'Paused',
        schedule: newJobSchedule,
        lastRun: 'Never',
        destination: 'Google Cloud Storage',
      };
      setJobs((prev) => [newJob, ...prev]);
      setDialogOpen(false);
      setNewJobName('');
      toast({
        title: 'Backup Job Created',
        description: `${newJobName} has been successfully created.`,
      });
    } else {
      toast({
        variant: 'destructive',
        title: 'Creation Failed',
        description: 'Please provide a name for the backup job.',
      });
    }
  };

  const handleAction = async (
    jobId: string,
    action: 'run' | 'pause' | 'delete'
  ) => {
    // Optimistic local update first
    if (action === 'delete') {
      setJobs((prev) => prev.filter((j) => j.id !== jobId));
      toast({ variant: 'destructive', title: 'Job Deleted', description: 'The backup job has been removed.' });
    } else {
      setJobs((prev) =>
        prev.map((j) => {
          if (j.id === jobId) {
            const newStatus =
              action === 'run' ? 'Running' : j.status === 'Paused' ? 'Completed' : 'Paused';
            toast({ title: `Job ${newStatus}`, description: `Job "${j.name}" is now ${newStatus.toLowerCase()}.` });
            return { ...j, status: newStatus };
          }
          return j;
        })
      );
    }

    // Attempt to sync with backend (best-effort, non-blocking)
    if (backendAvailable) {
      try {
        const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;
        await fetch('/api/backup', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({ jobId, action }),
        });
      } catch {
        // Ignore – local state is already updated
      }
    }
  };

  return (
    <div className="container mx-auto p-4 md:p-8">
      <header className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold flex items-center gap-2">
            <DatabaseBackup className="text-primary" />
            Backup & Recovery
          </h1>
          <p className="text-muted-foreground">
            Manage automated backups and data consistency.
          </p>
          <div className="flex items-center gap-2 mt-1">
            {backendAvailable === null ? (
              <Badge variant="secondary" className="text-xs gap-1"><Clock className="size-3"/> Connecting...</Badge>
            ) : backendAvailable ? (
              <Badge variant="success" className="text-xs gap-1"><Wifi className="size-3"/> Backend Connected</Badge>
            ) : (
              <Badge variant="destructive" className="text-xs gap-1"><WifiOff className="size-3"/> Backend Offline — showing cached data</Badge>
            )}
            {lastChecked && <span className="text-xs text-muted-foreground">Last checked: {lastChecked}</span>}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={fetchBackupStatus} disabled={isLoading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button variant="outline">
            <Upload className="mr-2" /> Import
          </Button>
          <Dialog open={isDialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2" /> New Backup Job
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Backup Job</DialogTitle>
                <DialogDescription>
                  Configure a new automated backup job for your database.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="job-name">Job Name</Label>
                  <Input
                    id="job-name"
                    placeholder="e.g., Daily Production Backup"
                    value={newJobName}
                    onChange={(e) => setNewJobName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="job-schedule">Schedule</Label>
                  <Select
                    value={newJobSchedule}
                    onValueChange={setNewJobSchedule}
                  >
                    <SelectTrigger id="job-schedule">
                      <SelectValue placeholder="Select a schedule" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Daily at 2:00 AM">
                        Daily at 2:00 AM
                      </SelectItem>
                      <SelectItem value="Weekly on Sunday">
                        Weekly on Sunday
                      </SelectItem>
                      <SelectItem value="Every 15 minutes">
                        Every 15 minutes
                      </SelectItem>
                      <SelectItem value="Manual">Manual Only</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateJob}>Create Job</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Backup Jobs ({jobs.length})</CardTitle>
          <CardDescription>
            List of all configured database backup jobs.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {jobs.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Job Name</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Schedule</TableHead>
                  <TableHead>Last Run</TableHead>
                  <TableHead>Destination</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {jobs.map((job) => (
                  <TableRow key={job.id}>
                    <TableCell className="font-medium">{job.name}</TableCell>
                    <TableCell>
                      <Badge
                        className={statusColors[job.status] || 'bg-gray-500/20'}
                      >
                        {job.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{job.schedule}</TableCell>
                    <TableCell>{job.lastRun}</TableCell>
                    <TableCell>{job.destination}</TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Open menu</span>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => handleAction(job.id, 'run')}
                          >
                            <Play className="mr-2" /> Run Now
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleAction(job.id, 'pause')}
                          >
                            <Pause className="mr-2" />{' '}
                            {job.status === 'Paused' ? 'Resume' : 'Pause'}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleAction(job.id, 'delete')}
                            className="text-destructive"
                          >
                            <Trash2 className="mr-2" /> Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-16 border-2 border-dashed rounded-lg">
              <DatabaseBackup className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-semibold">
                No backup jobs configured
              </h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Create a new backup job to get started.
              </p>
              <DialogTrigger asChild>
                <Button className="mt-6">
                  <Plus className="mr-2" />
                  Create Backup Job
                </Button>
              </DialogTrigger>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

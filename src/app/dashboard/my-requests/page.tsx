
'use client';
import { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription
} from '@/components/ui/card';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"

import {
  FileText,
  Clock,
  CheckCircle,
  XCircle,
  Eye
} from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://tcairrapiccontainer.azurewebsites.net';

const StatCard = ({ title, value, icon: Icon, color }: { title: string, value: number, icon: React.ElementType, color?: string }) => (
  <Card className="flex-1">
    <CardContent className="p-4 flex items-center gap-4">
      <Icon className={cn('size-8', color || 'text-muted-foreground')} />
      <div>
        <p className="text-2xl font-bold">{value}</p>
        <p className="text-sm text-muted-foreground">{title}</p>
      </div>
    </CardContent>
  </Card>
);

const initialRequests: Request[] = [];

type Request = {
  id: string;
  request_type: string;
  description: string;
  priority: string;
  status: string;
  resolution_notes?: string;
  username?: string;
  created_at?: string;
};

const statusColors: { [key: string]: string } = {
  'Pending': 'bg-yellow-500/20 text-yellow-500',
  'In Review': 'bg-blue-500/20 text-blue-500',
  'Approved': 'bg-green-500/20 text-green-500',
  'Completed': 'bg-green-500/20 text-green-500',
  'Rejected': 'bg-red-500/20 text-red-500',
}

const priorityColors: { [key: string]: string } = {
  'Low': 'text-muted-foreground',
  'Medium': 'text-yellow-500',
  'High': 'text-orange-500',
  'Critical': 'text-red-500',
}

export default function MyRequestsPage() {
  const [myRequests, setMyRequests] = useState<Request[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('authToken');
    if (!token) { setLoading(false); return; }
    fetch(`${BACKEND_URL}/api/v1/requests`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((data) => setMyRequests(data.items || []))
      .catch(() => setMyRequests([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="container mx-auto p-4 md:p-8">
      <header className="mb-8">
        <div className="flex items-center gap-2">
          <Eye className="size-6 text-primary" />
          <div>
            <h1 className="text-2xl font-semibold">My Requests</h1>
            <p className="text-muted-foreground">Track the status and resolution of your submitted requests.</p>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <StatCard title="Total Submitted" value={myRequests.length} icon={FileText} color="text-primary" />
        <StatCard title="Pending / In Review" value={myRequests.filter(r => r.status === 'pending' || r.status === 'in_review').length} icon={Clock} color="text-warning" />
        <StatCard title="Completed" value={myRequests.filter(r => r.status === 'completed' || r.status === 'approved').length} icon={CheckCircle} color="text-success" />
        <StatCard title="Rejected" value={myRequests.filter(r => r.status === 'rejected').length} icon={XCircle} color="text-destructive" />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>My Request History</CardTitle>
          <CardDescription>
            Here you can see all your past and current requests. Click on a request to see the admin's response.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-center py-8 text-muted-foreground">Loading requests…</p>
          ) : myRequests.length > 0 ? (
            <Accordion type="single" collapsible className="w-full">
              {myRequests.map((req) => (
                <AccordionItem value={req.id} key={req.id}>
                  <AccordionTrigger className="hover:no-underline">
                    <div className="flex items-center justify-between w-full pr-4">
                      <div className="text-left">
                        <p className="font-semibold">{req.request_type}</p>
                        <p className="text-sm text-muted-foreground">{req.created_at ? new Date(req.created_at).toLocaleDateString() : ''}</p>
                      </div>
                      <Badge className={cn('font-semibold', statusColors[req.status] || 'bg-gray-500/20 text-gray-500')}>{req.status}</Badge>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="p-4 bg-muted/30 rounded-b-lg">
                    <div className="space-y-4">
                      <div>
                        <h4 className="font-semibold text-muted-foreground text-sm">Your Request:</h4>
                        <p className="text-sm whitespace-pre-wrap font-mono bg-background/50 p-2 rounded-md mt-1">{req.description}</p>
                      </div>
                      {req.resolution_notes ? (
                        <div>
                          <h4 className="font-semibold text-muted-foreground text-sm">Admin Response:</h4>
                          <div className="text-sm mt-1 whitespace-pre-wrap bg-muted p-3 rounded-md border-l-4 border-primary">
                            <p className="text-foreground">{req.resolution_notes}</p>
                          </div>
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground italic text-center py-4">No response from admin yet.</p>
                      )}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          ) : (
            <div className="text-center py-16">
              <h3 className="text-lg font-semibold">No requests found.</h3>
              <p className="text-muted-foreground">You haven't submitted any requests yet.</p>
              <Button asChild className="mt-4">
                <Link href="/dashboard/request">Submit a New Request</Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

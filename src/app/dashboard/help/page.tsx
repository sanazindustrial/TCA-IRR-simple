
'use client';

import { useState, useEffect } from 'react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import {
  HelpCircle,
  Book,
  Mail,
  Search,
  ChevronRight,
  PlusCircle,
  Eye,
  FileText,
  ShieldCheck,
  RefreshCw,
  Database,
  Lightbulb,
  Bug,
  Send,
  DollarSign,
  SlidersHorizontal,
  MessageSquare,
  FileSearch,
  Calculator,
} from 'lucide-react';
import Link from 'next/link';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import type { User } from '@/lib/users';
import { useToast } from '@/hooks/use-toast';

const allGuides = [
    { title: "Getting Started Guide", description: "A complete walkthrough of your first analysis.", icon: Book, href: "/dashboard/help/getting-started", roles: ['user', 'reviewer', 'admin'] },
    { title: "Understanding Your Report", description: "Learn what each section of the analysis means.", icon: Book, href: "/dashboard/help/understanding-your-report", roles: ['user', 'reviewer', 'admin'] },
    { title: "Module Guides", description: "A detailed breakdown of all 9 analysis modules.", icon: Book, href: "/dashboard/help/module-guides", roles: ['user', 'reviewer', 'admin'] },
    { title: "Reviewer Analysis Guide", description: "How to use the reviewer input and analysis tools.", icon: MessageSquare, href: "/dashboard/help/reviewer-analysis", roles: ['reviewer', 'admin'] },
    { title: "What-If Analysis Guide", description: "Simulate outcomes by adjusting scores before finalizing.", icon: Calculator, href: "/dashboard/help/what-if-analysis", roles: ['reviewer', 'admin'] },
    { title: "Detailed DD Report Guide", description: "An in-depth look at the Due Diligence report sections.", icon: FileSearch, href: "/dashboard/help/detailed-report", roles: ['reviewer', 'admin'] },
    { title: "Configuring Modules", description: "Customize module weights, scoring, and logic.", icon: SlidersHorizontal, href: "/dashboard/help/admin-configuration", roles: ['reviewer', 'admin'] },
    { title: "Add a New Data Source", description: "Connect new external data sources to the platform.", icon: PlusCircle, href: "/dashboard/help/add-new-source", roles: ['reviewer', 'admin'] },
    { title: "Cost Management & Analytics", description: "Understand and manage platform costs.", icon: DollarSign, href: "/dashboard/help/cost-analysis", roles: ['reviewer', 'admin'] },
];


const faqs = [
  {
    question: 'How do I start a new analysis?',
    answer:
      'Navigate to the "New Evaluation" page from the dashboard. Fill in the company information, upload the required documents (like pitch decks and financials), configure the analysis modules if you have permission, and click "Run Analysis".',
  },
  {
    question: 'What is the difference between a Triage and a Due Diligence report?',
    answer:
      'A Triage report is a high-level summary designed for initial screening. A Due Diligence (DD) report is a much more in-depth analysis across all modules and is typically used for later-stage evaluation. DD reports are only available to Admin and Reviewer roles.',
  },
  {
    question: 'How can I improve the accuracy of the AI analysis?',
    answer:
      'The more high-quality data you provide, the better. Ensure your uploaded documents are clear, complete, and up-to-date. For Privileged Users, providing detailed manual reviewer comments also helps fine-tune the AI for future analyses.',
  },
  {
    question: 'Where can I find my past reports?',
    answer:
      'All generated reports are available in the "Reports" section, accessible from the main dashboard navigation. You can filter and search for specific reports there.',
  },
];

const requestCategories = [
    { id: 'additional_reports', title: 'Additional Triage Reports', icon: FileText },
    { id: 'due_diligence', title: 'Due Diligence Access', icon: ShieldCheck },
    { id: 'resubmission', title: 'Resubmission Request', icon: RefreshCw },
    { id: 'data_change', title: 'Data Change Request', icon: Database },
    { id: 'feature_request', title: 'Feature Request', icon: Lightbulb },
    { id: 'bug_report', title: 'Bug Report', icon: Bug },
    { id: 'data_quality', title: 'Data Quality Review', icon: Database },
    { id: 'risk_model', title: 'Risk Model Inquiry', icon: ShieldCheck },
    { id: 'compliance', title: 'Compliance Verification', icon: ShieldCheck },
    { id: 'scoring_anomaly', title: 'AI Scoring Anomaly', icon: Lightbulb },
    { id: 'general_question', title: 'General Question', icon: HelpCircle },
    { id: 'other', title: 'Other', icon: Send },
];


export default function HelpPage() {
    const [guides, setGuides] = useState(allGuides);
    const [user, setUser] = useState<User | null>(null);
    const [requestType, setRequestType] = useState('general_question');
    const [message, setMessage] = useState('');
    const { toast } = useToast();


    useEffect(() => {
        const storedUser = localStorage.getItem('loggedInUser');
        if (storedUser) {
            try {
                const parsedUser = JSON.parse(storedUser);
                setUser(parsedUser);
                const userRole = parsedUser.role?.toLowerCase() || 'user';
                const filteredGuides = allGuides.filter(guide => guide.roles.includes(userRole));
                setGuides(filteredGuides);
            } catch (e) {
                const userRole = 'user';
                const filteredGuides = allGuides.filter(guide => guide.roles.includes(userRole));
                setGuides(filteredGuides);
            }
        } else {
             const userRole = 'user';
             const filteredGuides = allGuides.filter(guide => guide.roles.includes(userRole));
             setGuides(filteredGuides);
        }
    }, []);

    const handleSendMessage = () => {
        const selectedCategory = requestCategories.find(c => c.id === requestType);
        if (!selectedCategory || !message.trim()) {
            toast({
                variant: 'destructive',
                title: 'Missing Information',
                description: 'Please select a request type and write a message.',
            });
            return;
        }

        try {
            const existingRequests = JSON.parse(localStorage.getItem('userRequests') || '[]');
            const newRequest = {
                id: `req-${Date.now()}`,
                title: selectedCategory.title,
                type: selectedCategory.title,
                user: user?.name || 'Unknown User',
                status: 'Pending',
                priority: 'Medium', // Default priority for support requests
                date: new Date().toLocaleDateString(),
                description: message,
            };

            const updatedRequests = [newRequest, ...existingRequests];
            localStorage.setItem('userRequests', JSON.stringify(updatedRequests));

            toast({
                title: 'Message Sent',
                description: 'Your message has been sent to the admin support team.',
            });
            
            // Reset form
            setRequestType('general_question');
            setMessage('');
        } catch (error) {
            console.error('Failed to save request to localStorage:', error);
            toast({
                variant: 'destructive',
                title: 'Submission Failed',
                description: 'There was an error saving your request. Please try again.',
            });
        }
    };

  return (
    <div className="container mx-auto p-4 md:p-8">
      <header className="mb-8">
        <h1 className="text-2xl font-semibold flex items-center gap-2">
          <HelpCircle className="text-primary" />
          Help & Support
        </h1>
        <p className="text-muted-foreground">
          Find answers, tutorials, and get in touch with our support team.
        </p>
      </header>

      <div className="relative mb-8">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input placeholder="Search help topics..." className="pl-10 h-12" />
      </div>

      <Tabs defaultValue="faq" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="faq">FAQs</TabsTrigger>
          <TabsTrigger value="guides">Quick Guides</TabsTrigger>
          <TabsTrigger value="contact">Admin Support</TabsTrigger>
        </TabsList>
        <TabsContent value="faq">
          <Card>
            <CardHeader>
              <CardTitle>Frequently Asked Questions</CardTitle>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible className="w-full">
                {faqs.map((faq, i) => (
                  <AccordionItem value={`item-${i}`} key={i}>
                    <AccordionTrigger>{faq.question}</AccordionTrigger>
                    <AccordionContent>{faq.answer}</AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="guides">
            <Card>
                <CardHeader>
                    <CardTitle>Quick Start Guides</CardTitle>
                    <CardDescription>Step-by-step tutorials to get the most out of the platform.</CardDescription>
                </CardHeader>
                <CardContent className='space-y-4'>
                    {guides.map(guide => {
                        const Icon = guide.icon;
                        return (
                            <div key={guide.title} className="flex items-center justify-between p-4 rounded-lg border hover:bg-muted/50 transition-colors">
                                <div className='flex items-center gap-4'>
                                    <Icon className="size-6 text-primary"/>
                                    <div>
                                        <h3 className="font-semibold">{guide.title}</h3>
                                        <p className="text-sm text-muted-foreground">{guide.description}</p>
                                    </div>
                                </div>
                                <Button asChild variant="outline" size="sm">
                                    <Link href={guide.href}>
                                        View Guide <ChevronRight className='ml-2'/>
                                    </Link>
                                </Button>
                            </div>
                        )
                    })}
                </CardContent>
            </Card>
        </TabsContent>
        <TabsContent value="contact">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail />
                Admin Support
              </CardTitle>
              <CardDescription>
                Can't find an answer? Our support team is here to help. For feature requests or bug reports, please use the User Request form.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <Alert>
                    <AlertTitle className="flex items-center gap-2 font-semibold">
                      <Eye /> Administrator Tools
                    </AlertTitle>
                    <AlertDescription className="flex items-center justify-between">
                      <p>Need to review user-submitted requests? You can view and manage all requests from the User Request Log.</p>
                      <Button asChild variant="outline" size="sm">
                        <Link href="/dashboard/user-requests">View Request Log</Link>
                      </Button>
                    </AlertDescription>
                </Alert>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Your Name</Label>
                  <Input id="name" value={user?.name || ''} readOnly />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Your Email</Label>
                  <Input id="email" type="email" value={user?.email || ''} readOnly />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="request-type">Request Type</Label>
                <Select value={requestType} onValueChange={setRequestType}>
                    <SelectTrigger id="request-type">
                        <SelectValue placeholder="Select a request category..." />
                    </SelectTrigger>
                    <SelectContent>
                        {requestCategories.map(category => (
                            <SelectItem key={category.id} value={category.id}>
                                <div className="flex items-center gap-2">
                                <category.icon className="size-4 text-muted-foreground" />
                                <span>{category.title}</span>
                                </div>
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="message">Message</Label>
                <Textarea
                  id="message"
                  rows={6}
                  placeholder="Please describe your issue in detail..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                />
              </div>
               <Button size="lg" onClick={handleSendMessage}>Send Message</Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

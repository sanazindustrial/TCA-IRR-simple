
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, PlusCircle, KeyRound, TestTube, Power } from 'lucide-react';
import Link from 'next/link';

const Step = ({ num, title, description, link }: { num: string, title: string, description: string, link?: { href: string; text: string } }) => (
    <div className="flex items-start gap-4">
        <div className="flex items-center justify-center size-8 rounded-full bg-primary text-primary-foreground font-bold shrink-0">{num}</div>
        <div>
            <h3 className="font-semibold text-lg">{title}</h3>
            <p className="text-muted-foreground">{description}</p>
            {link && (
                <Link href={link.href} className="text-sm text-primary hover:underline mt-1 inline-block">
                    {link.text}
                </Link>
            )}
        </div>
    </div>
)

export default function AddNewSourceGuidePage() {
  return (
    <div className="container mx-auto p-4 md:p-8">
      <header className="mb-8">
        <Link href="/dashboard/help" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary mb-4">
            <ArrowLeft className="size-4" />
            Back to Help & Support
        </Link>
        <h1 className="text-4xl md:text-5xl font-bold font-headline text-primary tracking-tight">
          How to Add a New Data Source
        </h1>
        <p className="mt-4 text-lg text-muted-foreground max-w-3xl">
          A step-by-step guide to expanding your platform's data capabilities.
        </p>
      </header>

      <Card>
        <CardHeader>
            <CardTitle className="flex items-center gap-2"><PlusCircle /> Adding and Configuring Sources</CardTitle>
            <CardDescription>Follow these steps to connect a new external data source.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-8">
            <Step
                num="1"
                title="Navigate to the External Source Manager"
                description="From the sidebar, go to Administration > External Links. This is the central hub where all data source connections are managed."
                link={{ href: "/data-sources", text: "Go to External Source Manager" }}
            />
            <Step
                num="2"
                title="Add a New Source"
                description="Click the 'Add Source' button at the top right of the page. This will open a form or dialog to enter the new source's details. You can also import a configuration file if you have one."
            />
            <Step
                num="3"
                title="Configure Source Details"
                description="Fill in the necessary information for the new source, such as its Name, Category, Description, and the API URL. Accurate categorization helps with filtering."
            />
             <Step
                num="4"
                title="Enter API Key"
                description="In the API Key field for the new source, securely paste the API key. You can use the 'Show/Hide Secrets' toggle to verify it. For free sources without a key, you can leave this blank or it may be pre-filled."
                link={{ href: "/dashboard/system-config", text: "Manage All API Keys" }}
            />
            <Step
                num="5"
                title="Test the Connection"
                description="After entering the API key, click the 'Test Connection' (flask icon) button on the source card. This will verify that the API key is correct and that the service is reachable."
            />
             <Step
                num="6"
                title="Activate the Source"
                description="Once the connection test is successful, toggle the 'Active' switch on the source card. This makes the data source available to the analysis modules. Only active sources will be used in evaluations."
            />
        </CardContent>
      </Card>
    </div>
  );
}

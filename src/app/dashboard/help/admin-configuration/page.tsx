
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Settings, SlidersHorizontal } from 'lucide-react';
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

export default function AdminConfigGuidePage() {
  return (
    <div className="container mx-auto p-4 md:p-8">
      <header className="mb-8">
        <Link href="/dashboard/help" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary mb-4">
            <ArrowLeft className="size-4" />
            Back to Help & Support
        </Link>
        <h1 className="text-4xl md:text-5xl font-bold font-headline text-primary tracking-tight">
          Guide: Configuring Modules
        </h1>
        <p className="mt-4 text-lg text-muted-foreground max-w-3xl">
          Customize modules, weights, scoring logic, and more.
        </p>
      </header>

      <Card>
        <CardHeader>
            <CardTitle className="flex items-center gap-2"><SlidersHorizontal /> Platform Customization</CardTitle>
            <CardDescription>A guide for administrators to configure the nine core evaluation modules.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-8">
            <Step
                num="1"
                title="Access the Module Control Deck"
                description="Navigate to the 'Module Control Deck' from the sidebar under 'Administration'. This central hub provides access to all nine analysis modules."
                link={{ href: "/dashboard/evaluation/modules", text: "Go to Module Control Deck" }}
            />
            <Step
                num="2"
                title="Select a Module to Configure"
                description="From the control deck, you will find links to each specific module, such as TCA Scorecard, Risk Flags, Benchmark Comparison, and more. Click the 'Edit' icon on any module to open its dedicated settings page."
            />
            <Step
                num="3"
                title="Adjust Weights and Logic"
                description="On each module's configuration page, you can adjust various parameters. This includes changing weights for different scoring categories, modifying thresholds for 'red/yellow/green' flags, and editing the default metrics used in the analysis."
            />
             <Step
                num="4"
                title="Review the JSON Output"
                description="As you make changes in the UI, a JSON configuration object is updated in real-time on the page. This object reflects the exact settings that will be sent to the AI backend. It's a useful way to verify your changes before saving."
            />
            <Step
                num="5"
                title="Save Your Configuration"
                description="Once you are satisfied with your adjustments, click the 'Save Configuration' button. Your changes will be applied to all subsequent analyses run with that framework."
            />
             <Step
                num="6"
                title="Create Sector-Specific Setups"
                description="You can create multiple versions of these configurations for different sectors (e.g., a 'Tech' setup and a 'MedTech' setup). The appropriate configuration is selected when starting a new evaluation."
                link={{ href: "/dashboard/system-config", text: "Manage Sector Setups" }}
            />
        </CardContent>
      </Card>
    </div>
  );
}

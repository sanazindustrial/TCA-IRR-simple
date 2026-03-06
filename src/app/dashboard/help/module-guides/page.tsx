
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { modules } from '@/lib/module-guides';


export default function ModuleGuidesPage() {
  return (
    <div className="container mx-auto p-4 md:p-8">
      <header className="mb-8">
        <Link href="/dashboard/help" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary mb-4">
            <ArrowLeft className="size-4" />
            Back to Help & Support
        </Link>
        <h1 className="text-4xl md:text-5xl font-bold font-headline text-primary tracking-tight">
          Analysis Module Guides
        </h1>
        <p className="mt-4 text-lg text-muted-foreground max-w-3xl">
          A detailed breakdown of the nine core analysis modules in the evaluation system.
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {modules.map((mod, index) => {
            const Icon = mod.icon;
            return (
                <Card key={index} className="flex flex-col">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-3">
                            <Icon className="size-6 text-primary" />
                            {mod.title}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="flex-grow">
                        <p className="text-sm text-muted-foreground">{mod.description}</p>
                    </CardContent>
                </Card>
            )
        })}
      </div>
    </div>
  );
}

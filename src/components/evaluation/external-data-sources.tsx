'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger
} from '@/components/ui/accordion';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import {
    externalSourcesConfig,
    getSourcesByCategory,
    getConnectedSources,
    getFreeAndFreemiumSources,
    type ExternalSource
} from '@/lib/external-sources-config';
import {
    CheckCircle,
    XCircle,
    Settings,
    ExternalLink,
    Database,
    Zap,
    DollarSign,
    Users,
    TrendingUp,
    Shield,
    Brain,
    Globe,
    Building
} from 'lucide-react';

interface ExternalDataSourcesProps {
    framework: 'general' | 'medtech';
    className?: string;
}

const categoryIcons: Record<string, any> = {
    'Company Intelligence': Building,
    'Technology Sources': Database,
    'AI & ML Sources': Brain,
    'Financial Data': DollarSign,
    'Economic Data': TrendingUp,
    'Professional Networks': Users,
    'Social Media & Sentiment': Globe,
    'Clinical Trial Databases': Shield,
    'Drug & Regulatory': Shield,
    'Research & Medical': Shield,
};

const pricingColors = {
    'Free': 'bg-green-100 text-green-800 border-green-200',
    'Freemium': 'bg-blue-100 text-blue-800 border-blue-200',
    'Premium': 'bg-yellow-100 text-yellow-800 border-yellow-200',
    'Enterprise': 'bg-purple-100 text-purple-800 border-purple-200'
};

export function ExternalDataSources({ framework, className = '' }: ExternalDataSourcesProps) {
    const [sources, setSources] = useState(externalSourcesConfig);
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
    const { toast } = useToast();

    const sourcesByCategory = getSourcesByCategory();
    const connectedCount = getConnectedSources().length;
    const freeSourcesCount = getFreeAndFreemiumSources().length;

    // Filter sources based on framework
    const getRelevantSources = () => {
        if (framework === 'medtech') {
            return sources.filter(source =>
                source.category.includes('Clinical') ||
                source.category.includes('Medical') ||
                source.category.includes('Drug') ||
                source.category.includes('Research') ||
                source.category === 'Company Intelligence' ||
                source.category === 'Financial Data' ||
                source.category === 'Professional Networks'
            );
        }
        return sources.filter(source =>
            !source.category.includes('Clinical') &&
            !source.category.includes('Medical') &&
            !source.category.includes('Drug')
        );
    };

    const relevantSources = getRelevantSources();
    const relevantCategories = Object.entries(sourcesByCategory).filter(([category, sources]) =>
        sources.some(source => relevantSources.includes(source))
    );

    const toggleConnection = (sourceId: string) => {
        setSources(prev => prev.map(source =>
            source.id === sourceId
                ? { ...source, connected: !source.connected }
                : source
        ));

        const source = sources.find(s => s.id === sourceId);
        toast({
            title: source?.connected ? 'Source Disconnected' : 'Source Connected',
            description: `${source?.name} has been ${source?.connected ? 'disconnected from' : 'connected to'} your analysis pipeline.`,
        });
    };

    const connectAllFree = () => {
        setSources(prev => prev.map(source =>
            (source.pricing === 'Free' || source.pricing === 'Freemium') && relevantSources.includes(source)
                ? { ...source, connected: true }
                : source
        ));
        toast({
            title: 'Free Sources Connected',
            description: 'All free and freemium data sources have been connected.',
        });
    };

    return (
        <Card className={className}>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle className="flex items-center gap-2">
                            <Database className="h-5 w-5" />
                            External Data Sources
                            <Badge variant="outline" className="ml-2">
                                {connectedCount} Connected
                            </Badge>
                        </CardTitle>
                        <p className="text-sm text-muted-foreground mt-2">
                            Connect external data sources to enrich your analysis with real-time market intelligence
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={connectAllFree}>
                            <Zap className="h-4 w-4 mr-1" />
                            Connect All Free
                        </Button>
                        <Dialog>
                            <DialogTrigger asChild>
                                <Button variant="outline" size="sm">
                                    <Settings className="h-4 w-4 mr-1" />
                                    Configure
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                                <DialogHeader>
                                    <DialogTitle>Data Source Configuration</DialogTitle>
                                    <DialogDescription>
                                        Manage API keys and connection settings for external data sources
                                    </DialogDescription>
                                </DialogHeader>
                                <div className="space-y-4">
                                    {relevantSources.filter(source => source.connected).map(source => (
                                        <div key={source.id} className="p-4 border rounded-lg">
                                            <div className="flex items-center justify-between mb-2">
                                                <h4 className="font-medium">{source.name}</h4>
                                                <Badge className={pricingColors[source.pricing]}>
                                                    {source.cost}
                                                </Badge>
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor={`api-key-${source.id}`}>API Key</Label>
                                                <Input
                                                    id={`api-key-${source.id}`}
                                                    type="password"
                                                    placeholder="Enter API key..."
                                                />
                                                {source.apiEndpoint && (
                                                    <div className="text-xs text-muted-foreground">
                                                        Endpoint: {source.apiEndpoint}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </DialogContent>
                        </Dialog>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <div className="grid gap-4">
                    <div className="flex flex-wrap gap-2 mb-4">
                        <Button
                            variant={selectedCategory === null ? "default" : "outline"}
                            size="sm"
                            onClick={() => setSelectedCategory(null)}
                        >
                            All Categories ({relevantSources.length})
                        </Button>
                        {relevantCategories.map(([category, categorySources]) => {
                            const Icon = categoryIcons[category] || Database;
                            const connectedInCategory = categorySources.filter(s => s.connected && relevantSources.includes(s)).length;

                            return (
                                <Button
                                    key={category}
                                    variant={selectedCategory === category ? "default" : "outline"}
                                    size="sm"
                                    onClick={() => setSelectedCategory(category)}
                                    className="flex items-center gap-1"
                                >
                                    <Icon className="h-3 w-3" />
                                    {category} ({connectedInCategory}/{categorySources.filter(s => relevantSources.includes(s)).length})
                                </Button>
                            );
                        })}
                    </div>

                    <Accordion type="single" collapsible className="w-full">
                        {relevantCategories
                            .filter(([category]) => selectedCategory === null || selectedCategory === category)
                            .map(([category, categorySources]) => {
                                const Icon = categoryIcons[category] || Database;
                                const filteredSources = categorySources.filter(source => relevantSources.includes(source));
                                const connectedInCategory = filteredSources.filter(s => s.connected).length;

                                return (
                                    <AccordionItem key={category} value={category}>
                                        <AccordionTrigger className="text-left">
                                            <div className="flex items-center gap-2">
                                                <Icon className="h-4 w-4" />
                                                <span>{category}</span>
                                                <Badge variant="outline">
                                                    {connectedInCategory}/{filteredSources.length}
                                                </Badge>
                                            </div>
                                        </AccordionTrigger>
                                        <AccordionContent>
                                            <div className="grid gap-3 pt-2">
                                                {filteredSources.map(source => (
                                                    <div key={source.id} className="flex items-center justify-between p-3 border rounded-lg">
                                                        <div className="flex-1">
                                                            <div className="flex items-center gap-2 mb-1">
                                                                <h4 className="font-medium">{source.name}</h4>
                                                                <Badge className={pricingColors[source.pricing]}>
                                                                    {source.cost}
                                                                </Badge>
                                                                {source.connected ? (
                                                                    <CheckCircle className="h-4 w-4 text-green-600" />
                                                                ) : (
                                                                    <XCircle className="h-4 w-4 text-gray-400" />
                                                                )}
                                                            </div>
                                                            <p className="text-sm text-muted-foreground mb-2">
                                                                {source.description}
                                                            </p>
                                                            <div className="flex flex-wrap gap-1">
                                                                {source.features.slice(0, 3).map(feature => (
                                                                    <Badge key={feature} variant="secondary" className="text-xs">
                                                                        {feature}
                                                                    </Badge>
                                                                ))}
                                                                {source.features.length > 3 && (
                                                                    <Badge variant="secondary" className="text-xs">
                                                                        +{source.features.length - 3} more
                                                                    </Badge>
                                                                )}
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-2 ml-4">
                                                            {source.apiEndpoint && (
                                                                <Button
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    onClick={() => window.open(source.apiEndpoint, '_blank')}
                                                                >
                                                                    <ExternalLink className="h-4 w-4" />
                                                                </Button>
                                                            )}
                                                            <Switch
                                                                checked={source.connected}
                                                                onCheckedChange={() => toggleConnection(source.id)}
                                                            />
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </AccordionContent>
                                    </AccordionItem>
                                );
                            })}
                    </Accordion>

                    <div className="mt-4 p-4 bg-muted/50 rounded-lg">
                        <h4 className="font-medium mb-2">Data Collection Summary</h4>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            <div>
                                <span className="text-muted-foreground">Total Sources:</span>
                                <div className="font-medium">{relevantSources.length}</div>
                            </div>
                            <div>
                                <span className="text-muted-foreground">Connected:</span>
                                <div className="font-medium text-green-600">{connectedCount}</div>
                            </div>
                            <div>
                                <span className="text-muted-foreground">Free/Freemium:</span>
                                <div className="font-medium text-blue-600">{freeSourcesCount}</div>
                            </div>
                            <div>
                                <span className="text-muted-foreground">Framework:</span>
                                <div className="font-medium capitalize">{framework}</div>
                            </div>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
'use client';

import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

export interface ModuleConfig {
    enabled: boolean;
    weight: number;
}

export interface ModuleConfigurationProps {
    modules: Record<string, ModuleConfig>;
    setModules: (modules: Record<string, ModuleConfig>) => void;
}

const MODULE_DESCRIPTIONS = {
    'market-opportunity': 'Assesses the size, growth potential, and attractiveness of the target market',
    'product-technology': 'Evaluates the product innovation, technical differentiation, and scalability',
    'business-model': 'Analyzes revenue streams, unit economics, and business model viability',
    'team-execution': 'Reviews the founding team, key personnel, and execution capabilities',
    'financial-health': 'Examines financial metrics, burn rate, runway, and funding requirements',
    'competitive-landscape': 'Evaluates competitive positioning and sustainable advantages',
    'regulatory-compliance': 'Assesses regulatory risks and compliance requirements',
    'scalability': 'Reviews operational scalability and growth infrastructure',
    'risk-assessment': 'Identifies and evaluates key business and market risks'
};

export function ModuleConfiguration({
    modules,
    setModules,
}: ModuleConfigurationProps) {
    const updateModule = (moduleKey: string, updates: Partial<ModuleConfig>) => {
        setModules({
            ...modules,
            [moduleKey]: {
                ...modules[moduleKey],
                ...updates,
            },
        });
    };

    const toggleAll = (enabled: boolean) => {
        const updatedModules = { ...modules };
        Object.keys(updatedModules).forEach(key => {
            updatedModules[key].enabled = enabled;
        });
        setModules(updatedModules);
    };

    const resetWeights = () => {
        const updatedModules = { ...modules };
        Object.keys(updatedModules).forEach(key => {
            updatedModules[key].weight = 1;
        });
        setModules(updatedModules);
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center justify-between">
                    Analysis Module Configuration
                    <div className="flex space-x-2">
                        <button
                            onClick={() => toggleAll(true)}
                            className="text-sm text-primary hover:underline"
                        >
                            Enable All
                        </button>
                        <span className="text-muted-foreground">|</span>
                        <button
                            onClick={() => toggleAll(false)}
                            className="text-sm text-primary hover:underline"
                        >
                            Disable All
                        </button>
                        <span className="text-muted-foreground">|</span>
                        <button
                            onClick={resetWeights}
                            className="text-sm text-primary hover:underline"
                        >
                            Reset Weights
                        </button>
                    </div>
                </CardTitle>
            </CardHeader>
            <CardContent>
                <Accordion type="single" collapsible className="w-full">
                    {Object.entries(modules).map(([moduleKey, config]) => (
                        <AccordionItem key={moduleKey} value={moduleKey}>
                            <div className="flex items-center justify-between border-b">
                                <div className="flex items-center space-x-3 py-4">
                                    <Switch
                                        checked={config.enabled}
                                        onCheckedChange={(enabled) => updateModule(moduleKey, { enabled })}
                                    />
                                    <AccordionTrigger className="text-left flex-1 py-0 hover:no-underline">
                                        <div className="flex items-center justify-between w-full">
                                            <span className="font-medium">
                                                {moduleKey.split('-').map(word =>
                                                    word.charAt(0).toUpperCase() + word.slice(1)
                                                ).join(' ')}
                                            </span>
                                            <span className="text-sm text-muted-foreground mr-4">
                                                Weight: {config.weight}x
                                            </span>
                                        </div>
                                    </AccordionTrigger>
                                </div>
                            </div>
                            <AccordionContent>
                                <div className="space-y-4 pt-2">
                                    <p className="text-sm text-muted-foreground">
                                        {MODULE_DESCRIPTIONS[moduleKey as keyof typeof MODULE_DESCRIPTIONS]}
                                    </p>

                                    <div className="space-y-2">
                                        <Label htmlFor={`weight-${moduleKey}`}>
                                            Analysis Weight: {config.weight}x
                                        </Label>
                                        <Slider
                                            id={`weight-${moduleKey}`}
                                            min={0.1}
                                            max={3}
                                            step={0.1}
                                            value={[config.weight]}
                                            onValueChange={([value]) => updateModule(moduleKey, { weight: value })}
                                            className="w-full"
                                            disabled={!config.enabled}
                                        />
                                        <div className="flex justify-between text-xs text-muted-foreground">
                                            <span>0.1x (Low Priority)</span>
                                            <span>1x (Standard)</span>
                                            <span>3x (High Priority)</span>
                                        </div>
                                    </div>
                                </div>
                            </AccordionContent>
                        </AccordionItem>
                    ))}
                </Accordion>
            </CardContent>
        </Card>
    );
}
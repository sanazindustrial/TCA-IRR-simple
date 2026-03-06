'use client';

import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export interface CompanyInformationProps {
    companyName: string;
    setCompanyName: (name: string) => void;
    industry: string;
    setIndustry: (industry: string) => void;
    description: string;
    setDescription: (description: string) => void;
}

export function CompanyInformation({
    companyName,
    setCompanyName,
    industry,
    setIndustry,
    description,
    setDescription,
}: CompanyInformationProps) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Company Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="company-name">Company Name</Label>
                    <Input
                        id="company-name"
                        placeholder="Enter company name"
                        value={companyName}
                        onChange={(e) => setCompanyName(e.target.value)}
                    />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="industry">Industry</Label>
                    <Select value={industry} onValueChange={setIndustry}>
                        <SelectTrigger>
                            <SelectValue placeholder="Select industry" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="technology">Technology</SelectItem>
                            <SelectItem value="healthcare">Healthcare</SelectItem>
                            <SelectItem value="fintech">FinTech</SelectItem>
                            <SelectItem value="biotech">Biotech</SelectItem>
                            <SelectItem value="saas">SaaS</SelectItem>
                            <SelectItem value="ecommerce">E-commerce</SelectItem>
                            <SelectItem value="energy">Energy</SelectItem>
                            <SelectItem value="manufacturing">Manufacturing</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="description">Company Description</Label>
                    <Textarea
                        id="description"
                        placeholder="Provide a brief description of the company and its business model"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        rows={4}
                    />
                </div>
            </CardContent>
        </Card>
    );
}
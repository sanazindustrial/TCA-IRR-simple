
'use client';
import { DashboardCard } from '@/components/shared/dashboard-card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { Users } from 'lucide-react';
import Image from 'next/image';
import { Separator } from '../ui/separator';
import { useState } from 'react';
import { useEvaluationContext } from './evaluation-provider';
import { Textarea } from '../ui/textarea';

const initialTeamData = {
    members: [
      {
        id: '1',
        name: 'Alex Johnson',
        role: 'CEO & Founder',
        experience: '10+ years in SaaS, 2 prior exits',
        skills: 'Vision, Strategy, Fundraising',
        avatarId: 'avatar1',
      },
      {
        id: '2',
        name: 'Maria Garcia',
        role: 'CTO & Co-Founder',
        experience: '8 years in AI/ML engineering',
        skills: 'Tech, Product, Scalability',
        avatarId: 'avatar2',
      },
      {
        id: '3',
        name: 'David Chen',
        role: 'Head of Sales',
        experience: '7 years in B2B enterprise sales',
        skills: 'GTM, Partnerships, Revenue',
        avatarId: 'avatar3',
      },
    ],
    interpretation: 'The founding team exhibits a strong blend of market-facing and technical expertise. The CEO has a proven track record with prior exits, a significant positive signal. The CTO brings critical AI/ML skills. The Head of Sales has relevant B2B experience. A potential gap exists in marketing leadership, which should be a priority hire to accelerate GTM efforts.'
};


export function TeamAssessment() {
  const { isEditable } = useEvaluationContext();
  const [teamData, setTeamData] = useState(initialTeamData);
  
  const handleInterpretationChange = (value: string) => {
    setTeamData(prev => ({...prev, interpretation: value}));
  }

  return (
    <DashboardCard
      title="Team Assessment"
      icon={Users}
      description="Deep dive into human capital and founder analysis."
    >
      <div className="w-full overflow-x-auto space-y-6">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Member</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Key Skills</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {teamData.members.map((member) => {
              const avatar = PlaceHolderImages.find(p => p.id === member.avatarId);
              return (
                <TableRow key={member.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarImage src={avatar?.imageUrl} alt={member.name} data-ai-hint={avatar?.imageHint}/>
                        <AvatarFallback>
                            {member.name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="font-medium">{member.name}</span>
                    </div>
                  </TableCell>
                  <TableCell>{member.role}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {member.skills}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
        <Separator />
        <div>
            <h4 className="text-sm font-semibold mb-2 text-muted-foreground">AI Interpretation</h4>
             {isEditable ? (
                <Textarea value={teamData.interpretation} onChange={(e) => handleInterpretationChange(e.target.value)} rows={4} className="text-base"/>
            ) : (
                <p className="text-sm text-muted-foreground">{teamData.interpretation}</p>
            )}
        </div>
      </div>
    </DashboardCard>
  );
}

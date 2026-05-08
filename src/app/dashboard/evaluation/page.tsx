'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function EvaluationPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/dashboard/reports/triage');
  }, [router]);
  return null;
}

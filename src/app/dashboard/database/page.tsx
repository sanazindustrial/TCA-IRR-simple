'use client';
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import {
  Database,
  Search,
  FileCode2,
  Play,
  Eye,
  AlertTriangle,
  Loader2,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import * as Lucide from 'lucide-react';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { EvaluationProvider } from '@/components/evaluation/evaluation-provider';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

const queries = [
  {
    id: 'user-engagement',
    title: 'User Engagement Analysis',
    description: 'Analyze user activity patterns and count of reports created.',
    category: 'User Metrics',
    complexity: 'Medium',
    estCost: 0.05,
    estTime: 2.3,
    tags: ['engagement', 'users', 'activity'],
    icon: 'Users',
    sql: "SELECT user_id, COUNT(evaluation_id) as report_count, AVG(composite_score) as avg_score FROM evaluations GROUP BY user_id ORDER BY report_count DESC;",
  },
  {
    id: 'score-trends',
    title: 'Evaluation Score Trends',
    description: 'Track evaluation score trends by framework and time period.',
    category: 'AI/ML Analysis',
    complexity: 'Medium',
    estCost: 0.08,
    estTime: 3.1,
    tags: ['trends', 'scores', 'sectors'],
    icon: 'TrendingUp',
    sql: "SELECT DATE_TRUNC('month', created_at) as month, framework, AVG(composite_score) as avg_score FROM evaluations GROUP BY month, framework ORDER BY month;",
  },
  {
    id: 'model-accuracy',
    title: 'AI vs. Human Score Comparison',
    description: 'Compare AI-generated scores with human reviewer inputs from the results JSON.',
    category: 'AI/ML Analysis',
    complexity: 'Complex',
    estCost: 0.12,
    estTime: 4.7,
    tags: ['ai-accuracy', 'human-comparison', 'quality'],
    icon: 'Cpu',
    sql: "SELECT evaluation_id, analysis_results->'tcaData'->'compositeScore' as ai_score, analysis_results->'reviewerData'->'finalScore' as reviewer_score FROM evaluations WHERE analysis_results->'reviewerData'->'finalScore' IS NOT NULL;"
  },
  {
    id: 'request-analysis',
    title: 'User Request Analysis',
    description: 'Analyze submitted user requests by type and priority.',
    category: 'User Metrics',
    complexity: 'Simple',
    estCost: 0.03,
    estTime: 1.8,
    tags: ['requests', 'support', 'users'],
    icon: 'Smile',
    sql: "SELECT request_type, priority, COUNT(*) as request_count FROM app_requests GROUP BY request_type, priority ORDER BY request_count DESC;"
  },
  {
    id: 'system-performance',
    title: 'System Performance Metrics',
    description: 'Monitor average evaluation processing times.',
    category: 'Cost & Performance',
    complexity: 'Simple',
    estCost: 0.03,
    estTime: 1.8,
    tags: ['performance', 'processing-time', 'system-health'],
    icon: 'BarChart',
    sql: "SELECT AVG(completed_at - created_at) as avg_processing_time FROM evaluations WHERE completed_at IS NOT NULL;"
  },
  {
    id: 'active-companies',
    title: 'Most Evaluated Companies',
    description: 'Find which companies are being evaluated most frequently.',
    category: 'User Metrics',
    complexity: 'Medium',
    estCost: 0.06,
    estTime: 2.9,
    tags: ['companies', 'activity', 'top'],
    icon: 'Database',
    sql: "SELECT c.name, COUNT(e.evaluation_id) as evaluation_count FROM companies c JOIN evaluations e ON c.company_id = e.company_id GROUP BY c.name ORDER BY evaluation_count DESC LIMIT 10;"
  },
];

const complexityColors: { [key: string]: string } = {
    Simple: 'text-success',
    Medium: 'text-warning',
    Complex: 'text-destructive',
};

type QueryResult = { columns: string[]; rows: Record<string, unknown>[] };

const SqlEditorDialog = ({
    query, open, onOpenChange, onExecute,
}: {
    query?: (typeof queries)[0] | { title: string; sql: string } | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onExecute: (sql: string) => void;
}) => {
    const [sql, setSql] = useState(query?.sql || "SELECT * FROM evaluations WHERE created_at >= NOW() - INTERVAL '1 month';");

    React.useEffect(() => {
        setSql(query?.sql || "SELECT * FROM evaluations WHERE created_at >= NOW() - INTERVAL '1 month';");
    }, [query]);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-3xl">
                <DialogHeader>
                    <DialogTitle>{query?.title || 'SQL Query Editor'}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                    <Textarea
                        placeholder="SELECT * FROM evaluations..."
                        rows={10}
                        className="font-mono"
                        value={sql}
                        onChange={(e) => setSql(e.target.value)}
                    />
                    <Alert variant="default" className="bg-warning/10 border-warning/50 text-warning-foreground">
                        <AlertTriangle className="h-4 w-4 !text-warning" />
                        <AlertTitle className="text-warning">Cost Optimization Tips:</AlertTitle>
                        <AlertDescription className="text-warning/80">
                            <ul className="list-disc list-inside text-xs space-y-1 mt-2">
                                <li>Use LIMIT clauses to reduce result set size</li>
                                <li>Add WHERE conditions to filter data early</li>
                                <li>Use indexes on frequently queried columns</li>
                                <li>Avoid SELECT * in production queries</li>
                            </ul>
                        </AlertDescription>
                    </Alert>
                    <p className="text-sm text-muted-foreground">Only SELECT queries are permitted.</p>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                    <Button onClick={() => { onExecute(sql); onOpenChange(false); }}>
                        <Play className="mr-2" /> Execute Query
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

const QueryCard = ({ query, onExecute, onViewSql }: { query: (typeof queries)[0], onExecute: (q: any) => void, onViewSql: (q: any) => void }) => {
  const Icon = (Lucide as any)[query.icon] || Database;
  return (
    <Card className="flex flex-col">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <Icon className="size-6 text-primary" />
            <CardTitle className="text-lg">{query.title}</CardTitle>
          </div>
          <Badge
            variant="outline"
            className={complexityColors[query.complexity]}
          >
            {query.complexity}
          </Badge>
        </div>
        <CardDescription>{query.description}</CardDescription>
      </CardHeader>
      <CardContent className="flex-grow space-y-4">
        <div className="flex justify-between items-center text-sm text-muted-foreground">
          <div className="text-right">
            <p className="font-mono text-foreground">${query.estCost.toFixed(3)}</p>
            <p className="text-xs">Est. Cost</p>
          </div>
          <div className="text-right">
            <p className="font-mono text-foreground">{query.estTime.toFixed(1)}s</p>
            <p className="text-xs">Est. Time</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {query.tags.map((tag) => (
            <Badge key={tag} variant="secondary">
              {tag}
            </Badge>
          ))}
        </div>
      </CardContent>
      <CardFooter className="flex items-center gap-2">
        <Button className="w-full" onClick={() => onExecute(query)}>
          <Play className="mr-2" /> Execute
        </Button>
        <Button variant="outline" className="w-full" onClick={() => onViewSql(query)}>
          <Eye className="mr-2" /> View SQL
        </Button>
      </CardFooter>
    </Card>
  );
};

export default function DatabaseSearchPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [category, setCategory] = useState('all');
  const [isDialogOpen, setDialogOpen] = useState(false);
  const [selectedQuery, setSelectedQuery] = useState<(typeof queries)[0] | { title: string, sql: string } | null>(null);
  const [result, setResult] = useState<QueryResult | null>(null);
  const [queryError, setQueryError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [execLabel, setExecLabel] = useState<string | null>(null);
  const [execTime, setExecTime] = useState<number | null>(null);
  const { toast } = useToast();

  const runQuery = async (sql: string, label: string) => {
    setLoading(true);
    setResult(null);
    setQueryError(null);
    setExecLabel(label);
    setExecTime(null);

    const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;
    const t0 = performance.now();

    try {
      const res = await fetch('/api/database/query', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ query: sql }),
      });

      const elapsed = Math.round(performance.now() - t0);
      setExecTime(elapsed);
      const data = await res.json();

      if (!res.ok) {
        setQueryError(data.error || `Server returned ${res.status}`);
        toast({ title: 'Query Failed', description: data.error || `Error ${res.status}`, variant: 'destructive' });
        return;
      }

      setResult(data);
      toast({ title: 'Query Completed', description: `${data.rows?.length ?? 0} row(s) returned in ${elapsed} ms.` });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      setQueryError(msg);
      toast({ title: 'Query Error', description: msg, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleExecute = (q: { title: string; sql: string }) => {
    runQuery(q.sql, q.title);
  };

  const handleViewSql = (q: (typeof queries)[0]) => {
    setSelectedQuery(q);
    setDialogOpen(true);
  };

  const handleExecuteCustom = (sql: string) => {
    runQuery(sql, 'Custom Query');
  };

  const handleCopyResult = () => {
    if (!result) return;
    const header = result.columns.join('\t');
    const rows = result.rows.map(r => result.columns.map(c => String(r[c] ?? '')).join('\t')).join('\n');
    navigator.clipboard.writeText(`${header}\n${rows}`);
    toast({ title: 'Copied', description: 'Result copied to clipboard as TSV.' });
  };

  const filteredQueries = queries.filter((q) => {
    const searchMatch =
      q.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      q.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      q.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()));
    const categoryMatch = category === 'all' || q.category === category;
    return searchMatch && categoryMatch;
  });

  return (
        <EvaluationProvider role={'user'} reportType={'dd'} framework={'general'} onFrameworkChangeAction={function (): void {
      throw new Error('Function not implemented.');
    } } setReportTypeAction={function (): void {
      throw new Error('Function not implemented.');
    } } isLoading={false} handleRunAnalysisAction={function (): void {
      throw new Error('Function not implemented.');
    } }>
      <div className="container mx-auto p-4 md:p-8">
        <header className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-8">
            <div>
            <h1 className="text-2xl font-semibold flex items-center gap-2">
                <Database className="text-primary" />
                Database Search &amp; Data Mining
            </h1>
            <p className="text-muted-foreground">
                Advanced SQL queries and data analysis with cost optimization
            </p>
            </div>
            <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => { setSelectedQuery({title: "SQL Query Editor", sql: "SELECT * FROM evaluations WHERE created_at >= NOW() - INTERVAL '1 month';"}); setDialogOpen(true); }}>
                    <FileCode2 className="mr-2" /> SQL Editor
            </Button>
            </div>
        </header>

        <div className="flex items-center gap-4 mb-8">
            <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
                placeholder="Search queries by name, description, or tags..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
            />
            </div>
            <Select value={category} onValueChange={setCategory}>
            <SelectTrigger id="query-category-filter" className="w-[200px]">
                <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="User Metrics">User Metrics</SelectItem>
                <SelectItem value="AI/ML Analysis">AI/ML Analysis</SelectItem>
                <SelectItem value="Cost & Performance">
                Cost &amp; Performance
                </SelectItem>
            </SelectContent>
            </Select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredQueries.map((query) => (
            <QueryCard key={query.id} query={query} onExecute={handleExecute} onViewSql={handleViewSql} />
            ))}
        </div>
        {filteredQueries.length === 0 && (
                <div className='text-center col-span-full py-16 text-muted-foreground'>
                    <Search className='mx-auto mb-2 size-8'/>
                    <h3 className="font-semibold">No queries found.</h3>
                    <p>Try adjusting your search or filter criteria.</p>
                </div>
            )}

        {/* ===== RESULTS SECTION ===== */}
        {loading && (
          <Card className="mt-8">
            <CardContent className="flex items-center justify-center gap-3 py-12">
              <Loader2 className="size-6 animate-spin text-primary" />
              <span className="text-sm text-muted-foreground">Running <strong>{execLabel}</strong>…</span>
            </CardContent>
          </Card>
        )}

        {queryError && !loading && (
          <Alert variant="destructive" className="mt-8">
            <AlertCircle className="size-4" />
            <AlertTitle>Query Error</AlertTitle>
            <AlertDescription className="font-mono text-sm">{queryError}</AlertDescription>
          </Alert>
        )}

        {result && !loading && (
          <Card className="mt-8">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2 flex-wrap">
                <CheckCircle2 className="size-4 text-green-500 shrink-0" />
                <CardTitle className="text-sm">{execLabel} — Results</CardTitle>
                <Badge variant="secondary" className="ml-auto">
                  {result.rows.length} row{result.rows.length !== 1 ? 's' : ''}
                </Badge>
                {execTime !== null && (
                  <span className="text-xs text-muted-foreground">{execTime} ms</span>
                )}
                <Button variant="ghost" size="sm" onClick={handleCopyResult}>
                  Copy as TSV
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {result.columns.length === 0 ? (
                <p className="px-6 py-4 text-sm text-muted-foreground">Query returned no rows.</p>
              ) : (
                <ScrollArea className="w-full">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        {result.columns.map((col) => (
                          <TableHead key={col} className="whitespace-nowrap text-xs font-semibold">
                            {col}
                          </TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {result.rows.map((row, i) => (
                        <TableRow key={i}>
                          {result.columns.map((col) => (
                            <TableCell key={col} className="whitespace-nowrap text-xs font-mono max-w-[240px] truncate">
                              {row[col] === null || row[col] === undefined
                                ? <span className="text-muted-foreground italic">NULL</span>
                                : String(row[col])}
                            </TableCell>
                          ))}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  <ScrollBar orientation="horizontal" />
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        )}
      </div>
      <SqlEditorDialog 
        query={selectedQuery}
        open={isDialogOpen}
        onOpenChange={setDialogOpen}
        onExecute={handleExecuteCustom}
      />
    </EvaluationProvider>
  );
}

/**
 * External Data Fetcher Service
 * Automatically fetches data from configured external sources for triage report generation
 * 
 * Supports:
 * - Group A: Public/No-Auth sources (SEC EDGAR, Hacker News, Papers With Code)
 * - Group B: API Key sources (GitHub, Crunchbase, Alpha Vantage, FRED)
 * - Intelligent caching and rate limiting
 * - Aggregated company data enrichment
 */

import { externalSourcesConfig, ExternalSource, generateUserAgent } from './external-sources-config';

// ============================================================================
// Types & Interfaces
// ============================================================================

export interface ExternalDataResult {
  sourceId: string;
  sourceName: string;
  category: string;
  success: boolean;
  data: any;
  error?: string;
  fetchedAt: string;
  responseTime: number;
}

export interface AggregatedExternalData {
  companyIntelligence: {
    fundingHistory?: any[];
    competitorData?: any[];
    marketPosition?: any;
    revenueEstimates?: any;
  };
  technologyData: {
    githubMetrics?: any;
    techStack?: string[];
    developerActivity?: any;
    communityEngagement?: any;
  };
  financialData: {
    secFilings?: any[];
    marketData?: any;
    economicIndicators?: any;
  };
  newsAndSentiment: {
    recentNews?: any[];
    sentimentScore?: number;
    trendTopics?: string[];
  };
  fetchSummary: {
    totalSources: number;
    successfulFetches: number;
    failedFetches: number;
    totalResponseTime: number;
    fetchedAt: string;
  };
  rawResults: ExternalDataResult[];
}

export interface CompanySearchParams {
  companyName: string;
  domain?: string;
  ticker?: string;
  industry?: string;
  country?: string;
}

// ============================================================================
// API Key Management (Server-side only - would use env vars in production)
// ============================================================================

const API_KEYS: Record<string, string> = {
  // These would be loaded from environment variables in production
  'github': process.env.NEXT_PUBLIC_GITHUB_TOKEN || '',
  'crunchbase': process.env.NEXT_PUBLIC_CRUNCHBASE_KEY || '',
  'alpha-vantage': process.env.NEXT_PUBLIC_ALPHA_VANTAGE_KEY || '',
  'fred': process.env.NEXT_PUBLIC_FRED_KEY || '',
  'yahoo-finance': process.env.NEXT_PUBLIC_YAHOO_FINANCE_KEY || '',
  'huggingface': process.env.NEXT_PUBLIC_HUGGINGFACE_TOKEN || '',
};

// ============================================================================
// Rate Limiting & Caching
// ============================================================================

const rateLimitCache: Map<string, { lastRequest: number; requestCount: number }> = new Map();
const dataCache: Map<string, { data: any; timestamp: number; ttl: number }> = new Map();

const CACHE_TTL = 5 * 60 * 1000; // 5 minutes default cache
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute window
const MAX_REQUESTS_PER_WINDOW = 30;

function checkRateLimit(sourceId: string): boolean {
  const now = Date.now();
  const limit = rateLimitCache.get(sourceId);
  
  if (!limit || (now - limit.lastRequest) > RATE_LIMIT_WINDOW) {
    rateLimitCache.set(sourceId, { lastRequest: now, requestCount: 1 });
    return true;
  }
  
  if (limit.requestCount >= MAX_REQUESTS_PER_WINDOW) {
    return false;
  }
  
  limit.requestCount++;
  limit.lastRequest = now;
  return true;
}

function getCachedData(cacheKey: string): any | null {
  const cached = dataCache.get(cacheKey);
  if (cached && (Date.now() - cached.timestamp) < cached.ttl) {
    return cached.data;
  }
  return null;
}

function setCachedData(cacheKey: string, data: any, ttl: number = CACHE_TTL): void {
  dataCache.set(cacheKey, { data, timestamp: Date.now(), ttl });
}

// ============================================================================
// Individual Source Fetchers
// ============================================================================

/**
 * Fetch data from SEC EDGAR (Group A - No Auth)
 */
async function fetchSECEdgar(companyName: string): Promise<any> {
  try {
    const userAgent = generateUserAgent();
    const searchUrl = `https://efts.sec.gov/LATEST/search-index?q=${encodeURIComponent(companyName)}&dateRange=custom&startdt=2020-01-01&enddt=${new Date().toISOString().split('T')[0]}`;
    
    const response = await fetch(searchUrl, {
      headers: {
        'User-Agent': userAgent,
        'Accept': 'application/json',
      },
      signal: AbortSignal.timeout(10000),
    });
    
    if (!response.ok) {
      throw new Error(`SEC EDGAR returned ${response.status}`);
    }
    
    const data = await response.json();
    return {
      filings: data.hits?.hits?.slice(0, 10) || [],
      totalFilings: data.hits?.total?.value || 0,
      source: 'SEC EDGAR',
    };
  } catch (error) {
    console.warn('SEC EDGAR fetch failed:', error);
    return { filings: [], totalFilings: 0, error: String(error) };
  }
}

/**
 * Fetch data from Hacker News (Group A - No Auth)
 */
async function fetchHackerNews(searchTerm: string): Promise<any> {
  try {
    const searchUrl = `https://hn.algolia.com/api/v1/search?query=${encodeURIComponent(searchTerm)}&tags=story&hitsPerPage=10`;
    
    const response = await fetch(searchUrl, {
      signal: AbortSignal.timeout(10000),
    });
    
    if (!response.ok) {
      throw new Error(`Hacker News returned ${response.status}`);
    }
    
    const data = await response.json();
    return {
      stories: data.hits || [],
      totalHits: data.nbHits || 0,
      source: 'Hacker News',
    };
  } catch (error) {
    console.warn('Hacker News fetch failed:', error);
    return { stories: [], totalHits: 0, error: String(error) };
  }
}

/**
 * Fetch data from Papers With Code (Group A - No Auth)
 */
async function fetchPapersWithCode(searchTerm: string): Promise<any> {
  try {
    const searchUrl = `https://paperswithcode.com/api/v1/papers/?q=${encodeURIComponent(searchTerm)}&page=1&items_per_page=10`;
    
    const response = await fetch(searchUrl, {
      headers: {
        'Accept': 'application/json',
      },
      signal: AbortSignal.timeout(10000),
    });
    
    if (!response.ok) {
      throw new Error(`Papers With Code returned ${response.status}`);
    }
    
    const data = await response.json();
    return {
      papers: data.results || [],
      totalPapers: data.count || 0,
      source: 'Papers With Code',
    };
  } catch (error) {
    console.warn('Papers With Code fetch failed:', error);
    return { papers: [], totalPapers: 0, error: String(error) };
  }
}

/**
 * Fetch data from GitHub (Group B - Bearer Token)
 */
async function fetchGitHub(orgOrUser: string): Promise<any> {
  try {
    const headers: Record<string, string> = {
      'Accept': 'application/vnd.github.v3+json',
    };
    
    const token = API_KEYS['github'];
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    // Search for repos/orgs
    const searchUrl = `https://api.github.com/search/users?q=${encodeURIComponent(orgOrUser)}+type:org&per_page=5`;
    
    const response = await fetch(searchUrl, {
      headers,
      signal: AbortSignal.timeout(10000),
    });
    
    if (!response.ok) {
      throw new Error(`GitHub returned ${response.status}`);
    }
    
    const data = await response.json();
    
    // If we found an org, get more details
    if (data.items?.length > 0) {
      const orgUrl = data.items[0].url;
      const orgResponse = await fetch(orgUrl, { headers, signal: AbortSignal.timeout(10000) });
      if (orgResponse.ok) {
        const orgData = await orgResponse.json();
        return {
          organization: orgData,
          publicRepos: orgData.public_repos || 0,
          followers: orgData.followers || 0,
          source: 'GitHub',
        };
      }
    }
    
    return {
      searchResults: data.items || [],
      totalCount: data.total_count || 0,
      source: 'GitHub',
    };
  } catch (error) {
    console.warn('GitHub fetch failed:', error);
    return { searchResults: [], totalCount: 0, error: String(error) };
  }
}

/**
 * Fetch data from Alpha Vantage (Group B - API Key)
 */
async function fetchAlphaVantage(symbol: string): Promise<any> {
  try {
    const apiKey = API_KEYS['alpha-vantage'];
    if (!apiKey) {
      return { error: 'Alpha Vantage API key not configured' };
    }
    
    const url = `https://www.alphavantage.co/query?function=OVERVIEW&symbol=${encodeURIComponent(symbol)}&apikey=${apiKey}`;
    
    const response = await fetch(url, {
      signal: AbortSignal.timeout(10000),
    });
    
    if (!response.ok) {
      throw new Error(`Alpha Vantage returned ${response.status}`);
    }
    
    const data = await response.json();
    return {
      overview: data,
      source: 'Alpha Vantage',
    };
  } catch (error) {
    console.warn('Alpha Vantage fetch failed:', error);
    return { overview: null, error: String(error) };
  }
}

/**
 * Fetch data from FRED (Group B - API Key)
 */
async function fetchFRED(series: string = 'GDP'): Promise<any> {
  try {
    const apiKey = API_KEYS['fred'];
    if (!apiKey) {
      // FRED allows limited access without key
      const url = `https://api.stlouisfed.org/fred/series/observations?series_id=${series}&api_key=DEMO_KEY&file_type=json&limit=10`;
      const response = await fetch(url, { signal: AbortSignal.timeout(10000) });
      
      if (response.ok) {
        const data = await response.json();
        return {
          series,
          observations: data.observations?.slice(-10) || [],
          source: 'FRED',
        };
      }
    }
    
    const url = `https://api.stlouisfed.org/fred/series/observations?series_id=${series}&api_key=${apiKey}&file_type=json&limit=10`;
    
    const response = await fetch(url, {
      signal: AbortSignal.timeout(10000),
    });
    
    if (!response.ok) {
      throw new Error(`FRED returned ${response.status}`);
    }
    
    const data = await response.json();
    return {
      series,
      observations: data.observations?.slice(-10) || [],
      source: 'FRED',
    };
  } catch (error) {
    console.warn('FRED fetch failed:', error);
    return { series: null, observations: [], error: String(error) };
  }
}

/**
 * Fetch company news from free news aggregator
 */
async function fetchCompanyNews(companyName: string): Promise<any> {
  try {
    // Use a free news API or aggregate from multiple sources
    const hnData = await fetchHackerNews(companyName);
    
    return {
      news: hnData.stories?.map((story: any) => ({
        title: story.title,
        url: story.url,
        points: story.points,
        date: story.created_at,
        source: 'Hacker News',
      })) || [],
      totalArticles: hnData.totalHits || 0,
      source: 'News Aggregator',
    };
  } catch (error) {
    console.warn('News fetch failed:', error);
    return { news: [], totalArticles: 0, error: String(error) };
  }
}

// ============================================================================
// Main External Data Fetcher
// ============================================================================

/**
 * Fetch all available external data for a company
 */
export async function fetchExternalData(params: CompanySearchParams): Promise<AggregatedExternalData> {
  const startTime = Date.now();
  const results: ExternalDataResult[] = [];
  const { companyName, domain, ticker, industry } = params;
  
  // Helper to add result
  const addResult = (sourceId: string, sourceName: string, category: string, success: boolean, data: any, error?: string, responseTime: number = 0) => {
    results.push({
      sourceId,
      sourceName,
      category,
      success,
      data,
      error,
      fetchedAt: new Date().toISOString(),
      responseTime,
    });
  };
  
  // Parallel fetching with individual timeouts
  const fetchPromises: Promise<void>[] = [];
  
  // Group A: Public/No-Auth sources
  fetchPromises.push(
    (async () => {
      const start = Date.now();
      const cacheKey = `sec-edgar-${companyName}`;
      let data = getCachedData(cacheKey);
      if (!data && checkRateLimit('sec-edgar')) {
        data = await fetchSECEdgar(companyName);
        setCachedData(cacheKey, data);
      }
      addResult('sec-edgar', 'SEC EDGAR', 'Financial Data', !data?.error, data, data?.error, Date.now() - start);
    })()
  );
  
  fetchPromises.push(
    (async () => {
      const start = Date.now();
      const cacheKey = `hackernews-${companyName}`;
      let data = getCachedData(cacheKey);
      if (!data && checkRateLimit('hackernews')) {
        data = await fetchHackerNews(companyName);
        setCachedData(cacheKey, data);
      }
      addResult('hackernews', 'Hacker News', 'Technology Sources', !data?.error, data, data?.error, Date.now() - start);
    })()
  );
  
  fetchPromises.push(
    (async () => {
      const start = Date.now();
      const cacheKey = `pwc-${companyName}`;
      let data = getCachedData(cacheKey);
      if (!data && checkRateLimit('paperswithcode')) {
        data = await fetchPapersWithCode(industry || companyName);
        setCachedData(cacheKey, data);
      }
      addResult('paperswithcode', 'Papers With Code', 'AI & ML Sources', !data?.error, data, data?.error, Date.now() - start);
    })()
  );
  
  // Group B: API Key sources (if keys available)
  fetchPromises.push(
    (async () => {
      const start = Date.now();
      const cacheKey = `github-${companyName}`;
      let data = getCachedData(cacheKey);
      if (!data && checkRateLimit('github')) {
        data = await fetchGitHub(companyName);
        setCachedData(cacheKey, data);
      }
      addResult('github', 'GitHub', 'Technology Sources', !data?.error, data, data?.error, Date.now() - start);
    })()
  );
  
  if (ticker) {
    fetchPromises.push(
      (async () => {
        const start = Date.now();
        const cacheKey = `alphavantage-${ticker}`;
        let data = getCachedData(cacheKey);
        if (!data && checkRateLimit('alpha-vantage')) {
          data = await fetchAlphaVantage(ticker);
          setCachedData(cacheKey, data);
        }
        addResult('alpha-vantage', 'Alpha Vantage', 'Financial Data', !data?.error, data, data?.error, Date.now() - start);
      })()
    );
  }
  
  fetchPromises.push(
    (async () => {
      const start = Date.now();
      const cacheKey = `fred-gdp`;
      let data = getCachedData(cacheKey);
      if (!data && checkRateLimit('fred')) {
        data = await fetchFRED('GDP');
        setCachedData(cacheKey, data, 60 * 60 * 1000); // 1 hour cache for economic data
      }
      addResult('fred', 'FRED', 'Economic Data', !data?.error, data, data?.error, Date.now() - start);
    })()
  );
  
  fetchPromises.push(
    (async () => {
      const start = Date.now();
      const cacheKey = `news-${companyName}`;
      let data = getCachedData(cacheKey);
      if (!data && checkRateLimit('news-aggregator')) {
        data = await fetchCompanyNews(companyName);
        setCachedData(cacheKey, data);
      }
      addResult('news-aggregator', 'News Aggregator', 'News & Media', !data?.error, data, data?.error, Date.now() - start);
    })()
  );
  
  // Wait for all fetches to complete
  await Promise.allSettled(fetchPromises);
  
  // Aggregate results
  const successfulFetches = results.filter(r => r.success).length;
  const totalResponseTime = results.reduce((sum, r) => sum + r.responseTime, 0);
  
  // Process and categorize data
  const aggregated: AggregatedExternalData = {
    companyIntelligence: {},
    technologyData: {},
    financialData: {},
    newsAndSentiment: {},
    fetchSummary: {
      totalSources: results.length,
      successfulFetches,
      failedFetches: results.length - successfulFetches,
      totalResponseTime,
      fetchedAt: new Date().toISOString(),
    },
    rawResults: results,
  };
  
  // Populate categories from results
  results.forEach(result => {
    if (!result.success) return;
    
    switch (result.sourceId) {
      case 'sec-edgar':
        aggregated.financialData.secFilings = result.data.filings;
        break;
      case 'alpha-vantage':
        aggregated.financialData.marketData = result.data.overview;
        break;
      case 'fred':
        aggregated.financialData.economicIndicators = result.data.observations;
        break;
      case 'github':
        aggregated.technologyData.githubMetrics = {
          publicRepos: result.data.publicRepos,
          followers: result.data.followers,
          organization: result.data.organization,
        };
        aggregated.technologyData.developerActivity = result.data.searchResults;
        break;
      case 'hackernews':
        aggregated.technologyData.communityEngagement = {
          stories: result.data.stories,
          sentiment: calculateSentiment(result.data.stories),
        };
        aggregated.newsAndSentiment.trendTopics = extractTopics(result.data.stories);
        break;
      case 'paperswithcode':
        aggregated.technologyData.techStack = result.data.papers?.map((p: any) => p.title) || [];
        break;
      case 'news-aggregator':
        aggregated.newsAndSentiment.recentNews = result.data.news;
        aggregated.newsAndSentiment.sentimentScore = calculateNewsSentiment(result.data.news);
        break;
    }
  });
  
  return aggregated;
}

/**
 * Calculate simple sentiment score from stories/news
 */
function calculateSentiment(stories: any[]): number {
  if (!stories?.length) return 0.5;
  
  const avgPoints = stories.reduce((sum, s) => sum + (s.points || 0), 0) / stories.length;
  // Normalize to 0-1 scale
  return Math.min(1, Math.max(0, avgPoints / 200));
}

/**
 * Calculate news sentiment
 */
function calculateNewsSentiment(news: any[]): number {
  if (!news?.length) return 0.5;
  
  const avgPoints = news.reduce((sum, n) => sum + (n.points || 0), 0) / news.length;
  return Math.min(1, Math.max(0, (avgPoints + 10) / 100));
}

/**
 * Extract trending topics from stories
 */
function extractTopics(stories: any[]): string[] {
  if (!stories?.length) return [];
  
  const topics: string[] = [];
  stories.forEach(story => {
    if (story.title) {
      // Extract key words (simplified)
      const words = story.title.split(/\s+/).filter((w: string) => w.length > 4);
      topics.push(...words.slice(0, 3));
    }
  });
  
  // Return unique topics
  return [...new Set(topics)].slice(0, 10);
}

/**
 * Get connected sources that can be fetched
 */
export function getConnectedSources(): ExternalSource[] {
  return externalSourcesConfig.filter(source => 
    source.connected && 
    (source.requirementGroup === 'A' || 
     (source.requirementGroup === 'B' && API_KEYS[source.id]))
  );
}

/**
 * Get source status for all configured sources
 */
export function getSourceStatus(): Array<{ source: ExternalSource; available: boolean; reason?: string }> {
  return externalSourcesConfig.map(source => {
    let available = false;
    let reason: string | undefined;
    
    if (source.requirementGroup === 'A') {
      available = true;
    } else if (source.requirementGroup === 'B') {
      available = !!API_KEYS[source.id];
      if (!available) reason = 'API key not configured';
    } else if (source.requirementGroup === 'C') {
      available = false;
      reason = 'OAuth setup required';
    } else if (source.requirementGroup === 'D') {
      available = false;
      reason = 'Enterprise contract required';
    } else if (source.requirementGroup === 'E') {
      available = false;
      reason = 'Scraper infrastructure required';
    }
    
    return { source, available, reason };
  });
}

// ============================================================================
// Report Integration Helper
// ============================================================================

/**
 * Enrich analysis data with external data for report generation
 */
export async function enrichAnalysisWithExternalData(
  analysisData: any,
  companyName: string,
  options?: {
    domain?: string;
    ticker?: string;
    industry?: string;
  }
): Promise<{ analysis: any; externalData: AggregatedExternalData }> {
  console.log('[ExternalDataFetcher] Enriching analysis for:', companyName);
  
  const externalData = await fetchExternalData({
    companyName,
    domain: options?.domain,
    ticker: options?.ticker,
    industry: options?.industry,
  });
  
  console.log('[ExternalDataFetcher] Fetched from', externalData.fetchSummary.successfulFetches, 'sources');
  
  // Merge external data into analysis
  const enrichedAnalysis = {
    ...analysisData,
    externalData: {
      summary: externalData.fetchSummary,
      companyIntelligence: externalData.companyIntelligence,
      technologyData: externalData.technologyData,
      financialData: externalData.financialData,
      newsAndSentiment: externalData.newsAndSentiment,
    },
    enrichedAt: new Date().toISOString(),
  };
  
  return { analysis: enrichedAnalysis, externalData };
}

export default {
  fetchExternalData,
  enrichAnalysisWithExternalData,
  getConnectedSources,
  getSourceStatus,
};

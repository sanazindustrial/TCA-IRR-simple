/**
 * External API Integration Service
 * 
 * Connects to free external data sources for TCA analysis
 * Each API has a free tier with rate limits
 */

// API Configuration with free keys and endpoints
export const externalAPIConfig = {
    // Alpha Vantage - Stock market data (Free: 25 requests/day)
    alphaVantage: {
        baseUrl: 'https://www.alphavantage.co/query',
        apiKey: process.env.NEXT_PUBLIC_ALPHA_VANTAGE_KEY || 'demo', // Free demo key
        rateLimit: '25 requests/day',
    },

    // News API - News aggregation (Free: 100 requests/day)
    newsApi: {
        baseUrl: 'https://newsapi.org/v2',
        apiKey: process.env.NEXT_PUBLIC_NEWS_API_KEY || '',
        rateLimit: '100 requests/day',
    },

    // FRED API - Federal Reserve Economic Data (Free: Unlimited)
    fred: {
        baseUrl: 'https://api.stlouisfed.org/fred',
        apiKey: process.env.NEXT_PUBLIC_FRED_API_KEY || '',
        rateLimit: 'Unlimited',
    },

    // GitHub API - Public repos (Free: 60 requests/hour unauthenticated)
    github: {
        baseUrl: 'https://api.github.com',
        token: process.env.NEXT_PUBLIC_GITHUB_TOKEN || '',
        rateLimit: '60 requests/hour (unauthenticated)',
    },

    // OpenFDA - Drug/Medical device data (Free: 240 requests/min)
    openFda: {
        baseUrl: 'https://api.fda.gov',
        rateLimit: '240 requests/minute',
    },

    // ClinicalTrials.gov - Clinical trials data (Free: Unlimited)
    clinicalTrials: {
        baseUrl: 'https://clinicaltrials.gov/api/v2',
        rateLimit: 'Unlimited',
    },

    // SEC EDGAR - Financial filings (Free: 10 requests/second)
    secEdgar: {
        baseUrl: 'https://data.sec.gov',
        userAgent: 'TCA-IRR-App info@example.com',
        rateLimit: '10 requests/second',
    },

    // World Bank - Global economic data (Free: Unlimited)
    worldBank: {
        baseUrl: 'https://api.worldbank.org/v2',
        rateLimit: 'Unlimited',
    },

    // Hacker News - Tech news (Free: Unlimited)
    hackerNews: {
        baseUrl: 'https://hacker-news.firebaseio.com/v0',
        rateLimit: 'Unlimited',
    },

    // Papers With Code - ML research (Free: Unlimited)
    papersWithCode: {
        baseUrl: 'https://paperswithcode.com/api/v1',
        rateLimit: 'Unlimited',
    },
};

// Response types
export interface APIResponse<T> {
    success: boolean;
    data: T | null;
    error?: string;
    source: string;
    timestamp: string;
}

export interface StockQuote {
    symbol: string;
    price: number;
    change: number;
    changePercent: number;
    volume: number;
    timestamp: string;
}

export interface CompanyOverview {
    symbol: string;
    name: string;
    description: string;
    sector: string;
    industry: string;
    marketCap: number;
    peRatio: number;
    eps: number;
    dividendYield: number;
    country: string;
}

export interface NewsArticle {
    title: string;
    description: string;
    url: string;
    source: string;
    publishedAt: string;
    sentiment?: 'positive' | 'negative' | 'neutral';
}

export interface EconomicIndicator {
    id: string;
    title: string;
    value: number;
    units: string;
    date: string;
    frequency: string;
}

export interface ClinicalTrial {
    nctId: string;
    title: string;
    status: string;
    phase: string;
    conditions: string[];
    sponsor: string;
    startDate: string;
    completionDate?: string;
}

export interface GitHubRepo {
    name: string;
    fullName: string;
    description: string;
    stars: number;
    forks: number;
    language: string;
    topics: string[];
    url: string;
}

export interface SECFiling {
    accessionNumber: string;
    filingType: string;
    filedDate: string;
    companyName: string;
    cik: string;
    url: string;
}

class ExternalAPIService {
    private cache: Map<string, { data: any; timestamp: number }> = new Map();
    private cacheDuration = 5 * 60 * 1000; // 5 minutes cache

    // Utility: Check cache
    private getCached(key: string): any | null {
        const cached = this.cache.get(key);
        if (cached && Date.now() - cached.timestamp < this.cacheDuration) {
            return cached.data;
        }
        return null;
    }

    // Utility: Set cache
    private setCache(key: string, data: any): void {
        this.cache.set(key, { data, timestamp: Date.now() });
    }

    // Alpha Vantage: Get stock quote
    async getStockQuote(symbol: string): Promise<APIResponse<StockQuote>> {
        const cacheKey = `stock_${symbol}`;
        const cached = this.getCached(cacheKey);
        if (cached) return cached;

        try {
            const response = await fetch(
                `${externalAPIConfig.alphaVantage.baseUrl}?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${externalAPIConfig.alphaVantage.apiKey}`
            );
            const data = await response.json();

            if (data['Global Quote']) {
                const quote = data['Global Quote'];
                const result: APIResponse<StockQuote> = {
                    success: true,
                    data: {
                        symbol: quote['01. symbol'],
                        price: parseFloat(quote['05. price']),
                        change: parseFloat(quote['09. change']),
                        changePercent: parseFloat(quote['10. change percent']?.replace('%', '')),
                        volume: parseInt(quote['06. volume']),
                        timestamp: quote['07. latest trading day'],
                    },
                    source: 'Alpha Vantage',
                    timestamp: new Date().toISOString(),
                };
                this.setCache(cacheKey, result);
                return result;
            }

            return {
                success: false,
                data: null,
                error: data.Note || data['Error Message'] || 'No data available',
                source: 'Alpha Vantage',
                timestamp: new Date().toISOString(),
            };
        } catch (error) {
            return {
                success: false,
                data: null,
                error: error instanceof Error ? error.message : 'Failed to fetch stock quote',
                source: 'Alpha Vantage',
                timestamp: new Date().toISOString(),
            };
        }
    }

    // Alpha Vantage: Get company overview
    async getCompanyOverview(symbol: string): Promise<APIResponse<CompanyOverview>> {
        const cacheKey = `overview_${symbol}`;
        const cached = this.getCached(cacheKey);
        if (cached) return cached;

        try {
            const response = await fetch(
                `${externalAPIConfig.alphaVantage.baseUrl}?function=OVERVIEW&symbol=${symbol}&apikey=${externalAPIConfig.alphaVantage.apiKey}`
            );
            const data = await response.json();

            if (data.Symbol) {
                const result: APIResponse<CompanyOverview> = {
                    success: true,
                    data: {
                        symbol: data.Symbol,
                        name: data.Name,
                        description: data.Description,
                        sector: data.Sector,
                        industry: data.Industry,
                        marketCap: parseInt(data.MarketCapitalization),
                        peRatio: parseFloat(data.PERatio),
                        eps: parseFloat(data.EPS),
                        dividendYield: parseFloat(data.DividendYield),
                        country: data.Country,
                    },
                    source: 'Alpha Vantage',
                    timestamp: new Date().toISOString(),
                };
                this.setCache(cacheKey, result);
                return result;
            }

            return {
                success: false,
                data: null,
                error: 'No data available for this symbol',
                source: 'Alpha Vantage',
                timestamp: new Date().toISOString(),
            };
        } catch (error) {
            return {
                success: false,
                data: null,
                error: error instanceof Error ? error.message : 'Failed to fetch company overview',
                source: 'Alpha Vantage',
                timestamp: new Date().toISOString(),
            };
        }
    }

    // News API: Get company news
    async getCompanyNews(companyName: string, pageSize: number = 10): Promise<APIResponse<NewsArticle[]>> {
        const cacheKey = `news_${companyName}`;
        const cached = this.getCached(cacheKey);
        if (cached) return cached;

        try {
            // Use mock data if no API key (News API requires key for production)
            if (!externalAPIConfig.newsApi.apiKey) {
                return this.getMockNews(companyName);
            }

            const response = await fetch(
                `${externalAPIConfig.newsApi.baseUrl}/everything?q=${encodeURIComponent(companyName)}&pageSize=${pageSize}&sortBy=publishedAt&apiKey=${externalAPIConfig.newsApi.apiKey}`
            );
            const data = await response.json();

            if (data.articles) {
                const result: APIResponse<NewsArticle[]> = {
                    success: true,
                    data: data.articles.map((article: any) => ({
                        title: article.title,
                        description: article.description,
                        url: article.url,
                        source: article.source?.name,
                        publishedAt: article.publishedAt,
                    })),
                    source: 'News API',
                    timestamp: new Date().toISOString(),
                };
                this.setCache(cacheKey, result);
                return result;
            }

            return {
                success: false,
                data: null,
                error: data.message || 'Failed to fetch news',
                source: 'News API',
                timestamp: new Date().toISOString(),
            };
        } catch (error) {
            return {
                success: false,
                data: null,
                error: error instanceof Error ? error.message : 'Failed to fetch news',
                source: 'News API',
                timestamp: new Date().toISOString(),
            };
        }
    }

    // FRED: Get economic indicators
    async getEconomicIndicator(seriesId: string): Promise<APIResponse<EconomicIndicator>> {
        const cacheKey = `fred_${seriesId}`;
        const cached = this.getCached(cacheKey);
        if (cached) return cached;

        try {
            // Common FRED series: GDP, UNRATE, CPIAUCSL, DFF, etc.
            const apiKey = externalAPIConfig.fred.apiKey || 'demo';
            const response = await fetch(
                `${externalAPIConfig.fred.baseUrl}/series/observations?series_id=${seriesId}&api_key=${apiKey}&file_type=json&limit=1&sort_order=desc`
            );
            const data = await response.json();

            if (data.observations && data.observations.length > 0) {
                const obs = data.observations[0];
                const result: APIResponse<EconomicIndicator> = {
                    success: true,
                    data: {
                        id: seriesId,
                        title: seriesId, // Would need another call to get the title
                        value: parseFloat(obs.value),
                        units: 'N/A',
                        date: obs.date,
                        frequency: 'monthly',
                    },
                    source: 'FRED',
                    timestamp: new Date().toISOString(),
                };
                this.setCache(cacheKey, result);
                return result;
            }

            return {
                success: false,
                data: null,
                error: 'No data available',
                source: 'FRED',
                timestamp: new Date().toISOString(),
            };
        } catch (error) {
            return {
                success: false,
                data: null,
                error: error instanceof Error ? error.message : 'Failed to fetch FRED data',
                source: 'FRED',
                timestamp: new Date().toISOString(),
            };
        }
    }

    // GitHub: Search repositories
    async searchGitHubRepos(query: string, limit: number = 10): Promise<APIResponse<GitHubRepo[]>> {
        const cacheKey = `github_${query}`;
        const cached = this.getCached(cacheKey);
        if (cached) return cached;

        try {
            const headers: HeadersInit = {
                Accept: 'application/vnd.github.v3+json',
            };
            if (externalAPIConfig.github.token) {
                headers['Authorization'] = `token ${externalAPIConfig.github.token}`;
            }

            const response = await fetch(
                `${externalAPIConfig.github.baseUrl}/search/repositories?q=${encodeURIComponent(query)}&per_page=${limit}&sort=stars`,
                { headers }
            );
            const data = await response.json();

            if (data.items) {
                const result: APIResponse<GitHubRepo[]> = {
                    success: true,
                    data: data.items.map((repo: any) => ({
                        name: repo.name,
                        fullName: repo.full_name,
                        description: repo.description,
                        stars: repo.stargazers_count,
                        forks: repo.forks_count,
                        language: repo.language,
                        topics: repo.topics || [],
                        url: repo.html_url,
                    })),
                    source: 'GitHub',
                    timestamp: new Date().toISOString(),
                };
                this.setCache(cacheKey, result);
                return result;
            }

            return {
                success: false,
                data: null,
                error: data.message || 'No repositories found',
                source: 'GitHub',
                timestamp: new Date().toISOString(),
            };
        } catch (error) {
            return {
                success: false,
                data: null,
                error: error instanceof Error ? error.message : 'Failed to search GitHub',
                source: 'GitHub',
                timestamp: new Date().toISOString(),
            };
        }
    }

    // ClinicalTrials.gov: Search clinical trials
    async searchClinicalTrials(condition: string, limit: number = 10): Promise<APIResponse<ClinicalTrial[]>> {
        const cacheKey = `trials_${condition}`;
        const cached = this.getCached(cacheKey);
        if (cached) return cached;

        try {
            const response = await fetch(
                `${externalAPIConfig.clinicalTrials.baseUrl}/studies?query.cond=${encodeURIComponent(condition)}&pageSize=${limit}&format=json`
            );
            const data = await response.json();

            if (data.studies) {
                const result: APIResponse<ClinicalTrial[]> = {
                    success: true,
                    data: data.studies.map((study: any) => ({
                        nctId: study.protocolSection?.identificationModule?.nctId,
                        title: study.protocolSection?.identificationModule?.briefTitle,
                        status: study.protocolSection?.statusModule?.overallStatus,
                        phase: study.protocolSection?.designModule?.phases?.join(', ') || 'N/A',
                        conditions: study.protocolSection?.conditionsModule?.conditions || [],
                        sponsor: study.protocolSection?.sponsorCollaboratorsModule?.leadSponsor?.name,
                        startDate: study.protocolSection?.statusModule?.startDateStruct?.date,
                        completionDate: study.protocolSection?.statusModule?.completionDateStruct?.date,
                    })),
                    source: 'ClinicalTrials.gov',
                    timestamp: new Date().toISOString(),
                };
                this.setCache(cacheKey, result);
                return result;
            }

            return {
                success: false,
                data: null,
                error: 'No clinical trials found',
                source: 'ClinicalTrials.gov',
                timestamp: new Date().toISOString(),
            };
        } catch (error) {
            return {
                success: false,
                data: null,
                error: error instanceof Error ? error.message : 'Failed to search clinical trials',
                source: 'ClinicalTrials.gov',
                timestamp: new Date().toISOString(),
            };
        }
    }

    // OpenFDA: Search drugs
    async searchDrugs(query: string, limit: number = 10): Promise<APIResponse<any[]>> {
        const cacheKey = `fda_${query}`;
        const cached = this.getCached(cacheKey);
        if (cached) return cached;

        try {
            const response = await fetch(
                `${externalAPIConfig.openFda.baseUrl}/drug/label.json?search=openfda.brand_name:${encodeURIComponent(query)}&limit=${limit}`
            );
            const data = await response.json();

            if (data.results) {
                const result: APIResponse<any[]> = {
                    success: true,
                    data: data.results.map((drug: any) => ({
                        brandName: drug.openfda?.brand_name?.[0] || 'Unknown',
                        genericName: drug.openfda?.generic_name?.[0] || 'Unknown',
                        manufacturer: drug.openfda?.manufacturer_name?.[0] || 'Unknown',
                        route: drug.openfda?.route?.[0] || 'Unknown',
                        productType: drug.openfda?.product_type?.[0] || 'Unknown',
                        purpose: drug.purpose?.[0] || drug.indications_and_usage?.[0] || 'N/A',
                    })),
                    source: 'OpenFDA',
                    timestamp: new Date().toISOString(),
                };
                this.setCache(cacheKey, result);
                return result;
            }

            return {
                success: false,
                data: null,
                error: 'No drugs found',
                source: 'OpenFDA',
                timestamp: new Date().toISOString(),
            };
        } catch (error) {
            return {
                success: false,
                data: null,
                error: error instanceof Error ? error.message : 'Failed to search drugs',
                source: 'OpenFDA',
                timestamp: new Date().toISOString(),
            };
        }
    }

    // SEC EDGAR: Get company filings
    async getCompanyFilings(ticker: string): Promise<APIResponse<SECFiling[]>> {
        const cacheKey = `sec_${ticker}`;
        const cached = this.getCached(cacheKey);
        if (cached) return cached;

        try {
            // First, we need to get the CIK for the ticker
            const tickerResponse = await fetch(
                'https://www.sec.gov/files/company_tickers.json',
                {
                    headers: {
                        'User-Agent': externalAPIConfig.secEdgar.userAgent,
                    },
                }
            );
            const tickerData = await tickerResponse.json();

            // Find the CIK for the ticker
            const company = Object.values(tickerData as Record<string, { cik_str: string; ticker: string; title: string }>).find(
                (c) => c.ticker.toLowerCase() === ticker.toLowerCase()
            );

            if (!company) {
                return {
                    success: false,
                    data: null,
                    error: 'Company not found',
                    source: 'SEC EDGAR',
                    timestamp: new Date().toISOString(),
                };
            }

            const cik = String(company.cik_str).padStart(10, '0');

            // Get recent filings
            const filingsResponse = await fetch(
                `${externalAPIConfig.secEdgar.baseUrl}/submissions/CIK${cik}.json`,
                {
                    headers: {
                        'User-Agent': externalAPIConfig.secEdgar.userAgent,
                    },
                }
            );
            const filingsData = await filingsResponse.json();

            if (filingsData.filings?.recent) {
                const recent = filingsData.filings.recent;
                const filings: SECFiling[] = [];

                for (let i = 0; i < Math.min(10, recent.accessionNumber.length); i++) {
                    filings.push({
                        accessionNumber: recent.accessionNumber[i],
                        filingType: recent.form[i],
                        filedDate: recent.filingDate[i],
                        companyName: filingsData.name,
                        cik: cik,
                        url: `https://www.sec.gov/cgi-bin/browse-edgar?action=getcompany&CIK=${cik}&type=${recent.form[i]}&dateb=&owner=include&count=40`,
                    });
                }

                const result: APIResponse<SECFiling[]> = {
                    success: true,
                    data: filings,
                    source: 'SEC EDGAR',
                    timestamp: new Date().toISOString(),
                };
                this.setCache(cacheKey, result);
                return result;
            }

            return {
                success: false,
                data: null,
                error: 'No filings found',
                source: 'SEC EDGAR',
                timestamp: new Date().toISOString(),
            };
        } catch (error) {
            return {
                success: false,
                data: null,
                error: error instanceof Error ? error.message : 'Failed to fetch SEC filings',
                source: 'SEC EDGAR',
                timestamp: new Date().toISOString(),
            };
        }
    }

    // World Bank: Get country indicators
    async getWorldBankIndicator(countryCode: string, indicator: string): Promise<APIResponse<any>> {
        const cacheKey = `wb_${countryCode}_${indicator}`;
        const cached = this.getCached(cacheKey);
        if (cached) return cached;

        try {
            // Common indicators: NY.GDP.MKTP.CD (GDP), SP.POP.TOTL (Population), etc.
            const response = await fetch(
                `${externalAPIConfig.worldBank.baseUrl}/country/${countryCode}/indicator/${indicator}?format=json&per_page=10`
            );
            const data = await response.json();

            if (data && data[1] && data[1].length > 0) {
                const result: APIResponse<any> = {
                    success: true,
                    data: data[1].map((item: any) => ({
                        country: item.country.value,
                        indicator: item.indicator.value,
                        value: item.value,
                        date: item.date,
                    })),
                    source: 'World Bank',
                    timestamp: new Date().toISOString(),
                };
                this.setCache(cacheKey, result);
                return result;
            }

            return {
                success: false,
                data: null,
                error: 'No data available',
                source: 'World Bank',
                timestamp: new Date().toISOString(),
            };
        } catch (error) {
            return {
                success: false,
                data: null,
                error: error instanceof Error ? error.message : 'Failed to fetch World Bank data',
                source: 'World Bank',
                timestamp: new Date().toISOString(),
            };
        }
    }

    // Hacker News: Get top stories
    async getHackerNewsTopStories(limit: number = 10): Promise<APIResponse<any[]>> {
        const cacheKey = 'hn_top';
        const cached = this.getCached(cacheKey);
        if (cached) return cached;

        try {
            const response = await fetch(`${externalAPIConfig.hackerNews.baseUrl}/topstories.json`);
            const storyIds = await response.json();

            const stories = await Promise.all(
                storyIds.slice(0, limit).map(async (id: number) => {
                    const storyResponse = await fetch(
                        `${externalAPIConfig.hackerNews.baseUrl}/item/${id}.json`
                    );
                    return storyResponse.json();
                })
            );

            const result: APIResponse<any[]> = {
                success: true,
                data: stories.map((story: any) => ({
                    id: story.id,
                    title: story.title,
                    url: story.url,
                    score: story.score,
                    author: story.by,
                    time: new Date(story.time * 1000).toISOString(),
                    comments: story.descendants,
                })),
                source: 'Hacker News',
                timestamp: new Date().toISOString(),
            };
            this.setCache(cacheKey, result);
            return result;
        } catch (error) {
            return {
                success: false,
                data: null,
                error: error instanceof Error ? error.message : 'Failed to fetch Hacker News',
                source: 'Hacker News',
                timestamp: new Date().toISOString(),
            };
        }
    }

    // Test all API connections
    async testAllConnections(): Promise<{ source: string; status: 'connected' | 'error'; message: string }[]> {
        const results: { source: string; status: 'connected' | 'error'; message: string }[] = [];

        // Test Alpha Vantage
        try {
            const avResult = await this.getStockQuote('IBM');
            results.push({
                source: 'Alpha Vantage',
                status: avResult.success ? 'connected' : 'error',
                message: avResult.success ? 'Connected successfully' : (avResult.error || 'Failed'),
            });
        } catch (e) {
            results.push({ source: 'Alpha Vantage', status: 'error', message: 'Connection failed' });
        }

        // Test GitHub
        try {
            const ghResult = await this.searchGitHubRepos('ai', 1);
            results.push({
                source: 'GitHub',
                status: ghResult.success ? 'connected' : 'error',
                message: ghResult.success ? 'Connected successfully' : (ghResult.error || 'Failed'),
            });
        } catch (e) {
            results.push({ source: 'GitHub', status: 'error', message: 'Connection failed' });
        }

        // Test ClinicalTrials.gov
        try {
            const ctResult = await this.searchClinicalTrials('cancer', 1);
            results.push({
                source: 'ClinicalTrials.gov',
                status: ctResult.success ? 'connected' : 'error',
                message: ctResult.success ? 'Connected successfully' : (ctResult.error || 'Failed'),
            });
        } catch (e) {
            results.push({ source: 'ClinicalTrials.gov', status: 'error', message: 'Connection failed' });
        }

        // Test OpenFDA
        try {
            const fdaResult = await this.searchDrugs('aspirin', 1);
            results.push({
                source: 'OpenFDA',
                status: fdaResult.success ? 'connected' : 'error',
                message: fdaResult.success ? 'Connected successfully' : (fdaResult.error || 'Failed'),
            });
        } catch (e) {
            results.push({ source: 'OpenFDA', status: 'error', message: 'Connection failed' });
        }

        // Test Hacker News
        try {
            const hnResult = await this.getHackerNewsTopStories(1);
            results.push({
                source: 'Hacker News',
                status: hnResult.success ? 'connected' : 'error',
                message: hnResult.success ? 'Connected successfully' : (hnResult.error || 'Failed'),
            });
        } catch (e) {
            results.push({ source: 'Hacker News', status: 'error', message: 'Connection failed' });
        }

        return results;
    }

    // Mock news for demo when no API key
    private getMockNews(companyName: string): APIResponse<NewsArticle[]> {
        return {
            success: true,
            data: [
                {
                    title: `${companyName} Announces New Strategic Partnership`,
                    description: `Leading company ${companyName} has announced a new strategic partnership aimed at expanding market reach and innovation capabilities.`,
                    url: 'https://example.com/news/1',
                    source: 'Business Wire',
                    publishedAt: new Date().toISOString(),
                    sentiment: 'positive',
                },
                {
                    title: `Market Analysis: ${companyName}'s Growth Trajectory`,
                    description: `Analysts weigh in on ${companyName}'s recent market performance and future growth prospects in the technology sector.`,
                    url: 'https://example.com/news/2',
                    source: 'Financial Times',
                    publishedAt: new Date(Date.now() - 86400000).toISOString(),
                    sentiment: 'neutral',
                },
                {
                    title: `${companyName} Reports Strong Q1 Results`,
                    description: `${companyName} exceeded analyst expectations with strong revenue growth and improved margins in the first quarter.`,
                    url: 'https://example.com/news/3',
                    source: 'Reuters',
                    publishedAt: new Date(Date.now() - 172800000).toISOString(),
                    sentiment: 'positive',
                },
            ],
            source: 'Mock Data',
            timestamp: new Date().toISOString(),
        };
    }

    // Clear cache
    clearCache(): void {
        this.cache.clear();
    }
}

// Export singleton instance
export const externalAPI = new ExternalAPIService();

// Export utility functions for common use cases
export async function getCompanyData(companyName: string, ticker?: string) {
    const results: any = {
        company: companyName,
        timestamp: new Date().toISOString(),
    };

    // Get stock data if ticker provided
    if (ticker) {
        results.stock = await externalAPI.getStockQuote(ticker);
        results.overview = await externalAPI.getCompanyOverview(ticker);
        results.secFilings = await externalAPI.getCompanyFilings(ticker);
    }

    // Get news
    results.news = await externalAPI.getCompanyNews(companyName);

    // Get GitHub repos if it's a tech company
    results.github = await externalAPI.searchGitHubRepos(companyName, 5);

    return results;
}

export async function getMedTechData(condition: string, drugName?: string) {
    const results: any = {
        condition,
        timestamp: new Date().toISOString(),
    };

    // Get clinical trials
    results.clinicalTrials = await externalAPI.searchClinicalTrials(condition);

    // Get drug information
    if (drugName) {
        results.drugs = await externalAPI.searchDrugs(drugName);
    }

    return results;
}

export async function getMarketData(country: string = 'US') {
    const results: any = {
        country,
        timestamp: new Date().toISOString(),
    };

    // Get economic indicators
    results.gdp = await externalAPI.getWorldBankIndicator(country, 'NY.GDP.MKTP.CD');
    results.population = await externalAPI.getWorldBankIndicator(country, 'SP.POP.TOTL');

    // Get tech news
    results.techNews = await externalAPI.getHackerNewsTopStories(5);

    return results;
}

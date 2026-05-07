/**
 * External Data API Routes
 * Provides unified access to multiple free external data sources
 */

import { NextRequest, NextResponse } from 'next/server';

// Rate limiting cache
const rateLimit = new Map<string, { count: number; timestamp: number }>();
const RATE_LIMIT_WINDOW = 60000; // 1 minute
const RATE_LIMIT_MAX = 30; // 30 requests per minute

function checkRateLimit(ip: string): boolean {
    const now = Date.now();
    const record = rateLimit.get(ip);

    if (!record || now - record.timestamp > RATE_LIMIT_WINDOW) {
        rateLimit.set(ip, { count: 1, timestamp: now });
        return true;
    }

    if (record.count >= RATE_LIMIT_MAX) {
        return false;
    }

    record.count++;
    return true;
}

// SEC EDGAR - Free Company Filings
async function fetchSECFilings(ticker: string) {
    try {
        // Get company tickers mapping
        const tickersRes = await fetch('https://www.sec.gov/files/company_tickers.json', {
            headers: { 'User-Agent': 'TCA-IRR-App support@example.com' }
        });
        const tickers = await tickersRes.json();

        const company = Object.values(tickers as Record<string, any>).find(
            c => c.ticker?.toLowerCase() === ticker.toLowerCase()
        );

        if (!company) {
            return { success: false, error: 'Company not found in SEC database' };
        }

        const cik = String(company.cik_str).padStart(10, '0');

        // Get recent filings
        const filingsRes = await fetch(
            `https://data.sec.gov/submissions/CIK${cik}.json`,
            { headers: { 'User-Agent': 'TCA-IRR-App support@example.com' } }
        );
        const filingsData = await filingsRes.json();

        const recent = filingsData.filings?.recent;
        if (!recent) {
            return { success: true, data: [], source: 'SEC EDGAR' };
        }

        const filings = [];
        for (let i = 0; i < Math.min(15, recent.accessionNumber?.length || 0); i++) {
            filings.push({
                type: recent.form[i],
                date: recent.filingDate[i],
                description: recent.primaryDocDescription?.[i] || recent.form[i],
                accessionNumber: recent.accessionNumber[i],
                url: `https://www.sec.gov/cgi-bin/browse-edgar?action=getcompany&CIK=${cik}&type=${recent.form[i]}`
            });
        }

        return {
            success: true,
            data: {
                companyName: filingsData.name,
                cik: cik,
                filings: filings
            },
            source: 'SEC EDGAR'
        };
    } catch (error) {
        return { success: false, error: error instanceof Error ? error.message : 'Failed to fetch SEC data' };
    }
}

// ClinicalTrials.gov - Free Clinical Trial Data
async function fetchClinicalTrials(query: string, limit = 10) {
    try {
        const res = await fetch(
            `https://clinicaltrials.gov/api/v2/studies?query.cond=${encodeURIComponent(query)}&pageSize=${limit}&format=json`
        );
        const data = await res.json();

        if (!data.studies) {
            return { success: true, data: [], source: 'ClinicalTrials.gov' };
        }

        const trials = data.studies.map((study: any) => ({
            nctId: study.protocolSection?.identificationModule?.nctId,
            title: study.protocolSection?.identificationModule?.briefTitle,
            status: study.protocolSection?.statusModule?.overallStatus,
            phase: study.protocolSection?.designModule?.phases?.join(', ') || 'N/A',
            conditions: study.protocolSection?.conditionsModule?.conditions || [],
            sponsor: study.protocolSection?.sponsorCollaboratorsModule?.leadSponsor?.name,
            startDate: study.protocolSection?.statusModule?.startDateStruct?.date,
            enrollment: study.protocolSection?.designModule?.enrollmentInfo?.count
        }));

        return { success: true, data: trials, source: 'ClinicalTrials.gov' };
    } catch (error) {
        return { success: false, error: error instanceof Error ? error.message : 'Failed to fetch clinical trials' };
    }
}

// OpenFDA - Free Drug/Device Data
async function fetchFDAData(query: string, type: 'drug' | 'device' = 'drug', limit = 10) {
    try {
        const endpoint = type === 'drug'
            ? `https://api.fda.gov/drug/label.json?search=openfda.brand_name:${encodeURIComponent(query)}&limit=${limit}`
            : `https://api.fda.gov/device/510k.json?search=device_name:${encodeURIComponent(query)}&limit=${limit}`;

        const res = await fetch(endpoint);
        const data = await res.json();

        if (!data.results) {
            return { success: true, data: [], source: 'OpenFDA' };
        }

        const results = type === 'drug'
            ? data.results.map((drug: any) => ({
                brandName: drug.openfda?.brand_name?.[0] || 'Unknown',
                genericName: drug.openfda?.generic_name?.[0] || 'Unknown',
                manufacturer: drug.openfda?.manufacturer_name?.[0] || 'Unknown',
                route: drug.openfda?.route?.[0] || 'Unknown',
                productType: drug.openfda?.product_type?.[0] || 'Unknown',
                warnings: drug.warnings?.[0]?.substring(0, 200)
            }))
            : data.results.map((device: any) => ({
                deviceName: device.device_name,
                manufacturer: device.applicant,
                clearanceDate: device.decision_date,
                productCode: device.product_code,
                regulatoryClass: device.regulatory_class
            }));

        return { success: true, data: results, source: 'OpenFDA' };
    } catch (error) {
        return { success: false, error: error instanceof Error ? error.message : 'Failed to fetch FDA data' };
    }
}

// World Bank - Free Economic Indicators
async function fetchWorldBankData(countryCode: string, indicator: string) {
    try {
        // Common indicators: NY.GDP.MKTP.CD (GDP), SP.POP.TOTL (Population), FP.CPI.TOTL.ZG (Inflation)
        const res = await fetch(
            `https://api.worldbank.org/v2/country/${countryCode}/indicator/${indicator}?format=json&per_page=10`
        );
        const data = await res.json();

        if (!data[1] || data[1].length === 0) {
            return { success: true, data: [], source: 'World Bank' };
        }

        return {
            success: true,
            data: data[1].map((item: any) => ({
                country: item.country.value,
                indicator: item.indicator.value,
                value: item.value,
                year: item.date
            })),
            source: 'World Bank'
        };
    } catch (error) {
        return { success: false, error: error instanceof Error ? error.message : 'Failed to fetch World Bank data' };
    }
}

// GitHub - Free Repository/Tech Data
async function fetchGitHubData(query: string, limit = 10) {
    try {
        const res = await fetch(
            `https://api.github.com/search/repositories?q=${encodeURIComponent(query)}&per_page=${limit}&sort=stars`,
            { headers: { 'Accept': 'application/vnd.github.v3+json' } }
        );
        const data = await res.json();

        if (!data.items) {
            return { success: true, data: [], source: 'GitHub' };
        }

        return {
            success: true,
            data: data.items.map((repo: any) => ({
                name: repo.name,
                fullName: repo.full_name,
                description: repo.description,
                stars: repo.stargazers_count,
                forks: repo.forks_count,
                language: repo.language,
                url: repo.html_url,
                updatedAt: repo.updated_at
            })),
            source: 'GitHub'
        };
    } catch (error) {
        return { success: false, error: error instanceof Error ? error.message : 'Failed to fetch GitHub data' };
    }
}

// Patents - USPTO (via BigQuery public dataset simulation - mock for now)
async function fetchPatentData(query: string) {
    // USPTO doesn't have a simple public API, returning mock structure
    return {
        success: true,
        data: {
            note: 'Patent search requires USPTO API key or Google Patents integration',
            suggestion: 'Use Google Patents: https://patents.google.com/?q=' + encodeURIComponent(query)
        },
        source: 'USPTO Reference'
    };
}

// News Aggregator using free sources
async function fetchNewsData(query: string, limit = 10) {
    try {
        // Using Hacker News as free news source
        const searchRes = await fetch(
            `https://hn.algolia.com/api/v1/search?query=${encodeURIComponent(query)}&hitsPerPage=${limit}&tags=story`
        );
        const searchData = await searchRes.json();

        const articles = searchData.hits?.map((hit: any) => ({
            title: hit.title,
            url: hit.url || `https://news.ycombinator.com/item?id=${hit.objectID}`,
            source: 'Hacker News',
            author: hit.author,
            points: hit.points,
            comments: hit.num_comments,
            publishedAt: hit.created_at
        })) || [];

        return { success: true, data: articles, source: 'HackerNews/Algolia' };
    } catch (error) {
        return { success: false, error: error instanceof Error ? error.message : 'Failed to fetch news' };
    }
}

// Main API handler
export async function GET(request: NextRequest) {
    const ip = request.headers.get('x-forwarded-for') || 'unknown';

    if (!checkRateLimit(ip)) {
        return NextResponse.json(
            { error: 'Rate limit exceeded. Please try again later.' },
            { status: 429 }
        );
    }

    const { searchParams } = new URL(request.url);
    const source = searchParams.get('source');
    const query = searchParams.get('query') || '';
    const type = searchParams.get('type') || 'drug';
    const country = searchParams.get('country') || 'US';
    const indicator = searchParams.get('indicator') || 'NY.GDP.MKTP.CD';
    const limit = parseInt(searchParams.get('limit') || '10');

    try {
        let result;

        switch (source) {
            case 'sec':
                result = await fetchSECFilings(query);
                break;
            case 'clinical-trials':
                result = await fetchClinicalTrials(query, limit);
                break;
            case 'fda':
                result = await fetchFDAData(query, type as 'drug' | 'device', limit);
                break;
            case 'worldbank':
                result = await fetchWorldBankData(country, indicator);
                break;
            case 'github':
                result = await fetchGitHubData(query, limit);
                break;
            case 'patents':
                result = await fetchPatentData(query);
                break;
            case 'news':
                result = await fetchNewsData(query, limit);
                break;
            case 'all':
                // Fetch from multiple sources in parallel
                const [sec, trials, fda, github, news] = await Promise.all([
                    query ? fetchSECFilings(query) : Promise.resolve({ success: true, data: null }),
                    query ? fetchClinicalTrials(query, 5) : Promise.resolve({ success: true, data: [] }),
                    query ? fetchFDAData(query, 'drug', 5) : Promise.resolve({ success: true, data: [] }),
                    query ? fetchGitHubData(query, 5) : Promise.resolve({ success: true, data: [] }),
                    query ? fetchNewsData(query, 5) : Promise.resolve({ success: true, data: [] })
                ]);

                result = {
                    success: true,
                    data: {
                        secFilings: sec.data,
                        clinicalTrials: trials.data,
                        fdaData: fda.data,
                        githubRepos: github.data,
                        news: news.data
                    },
                    sources: ['SEC EDGAR', 'ClinicalTrials.gov', 'OpenFDA', 'GitHub', 'HackerNews']
                };
                break;
            default:
                return NextResponse.json(
                    {
                        error: 'Invalid source. Use: sec, clinical-trials, fda, worldbank, github, patents, news, or all',
                        availableSources: [
                            { name: 'sec', description: 'SEC EDGAR company filings', params: 'query=TICKER' },
                            { name: 'clinical-trials', description: 'Clinical trials data', params: 'query=CONDITION' },
                            { name: 'fda', description: 'FDA drug/device data', params: 'query=NAME&type=drug|device' },
                            { name: 'worldbank', description: 'Economic indicators', params: 'country=US&indicator=NY.GDP.MKTP.CD' },
                            { name: 'github', description: 'GitHub repositories', params: 'query=TOPIC' },
                            { name: 'patents', description: 'Patent references', params: 'query=INVENTION' },
                            { name: 'news', description: 'Tech news aggregation', params: 'query=TOPIC' },
                            { name: 'all', description: 'All sources combined', params: 'query=COMPANY' }
                        ]
                    },
                    { status: 400 }
                );
        }

        return NextResponse.json({
            ...result,
            timestamp: new Date().toISOString(),
            query: query
        });
    } catch (error) {
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Internal server error' },
            { status: 500 }
        );
    }
}

// POST handler - handles bulk fetch (triage wizard) and single source test
export async function POST(request: NextRequest) {
    const body = await request.json();

    // BULK FETCH MODE: Triage wizard sends { company, sources: string[] }
    if (body.sources && Array.isArray(body.sources)) {
        const company = (body.company as string) || '';
        const sources: string[] = body.sources;
        const results: Record<string, unknown> = {};

        await Promise.allSettled(
            sources.map(async (sourceId: string) => {
                try {
                    switch (sourceId) {
                        case 'sec-edgar':
                            results[sourceId] = await fetchSECFilings(company);
                            break;
                        case 'github':
                            results[sourceId] = await fetchGitHubData(company, 5);
                            break;
                        case 'hackernews':
                            results[sourceId] = await fetchNewsData(company, 10);
                            break;
                        case 'clinical-trials':
                            results[sourceId] = await fetchClinicalTrials(company, 5);
                            break;
                        case 'fda':
                            results[sourceId] = await fetchFDAData(company, 'drug', 5);
                            break;
                        case 'worldbank':
                            results[sourceId] = await fetchWorldBankData('US', 'NY.GDP.MKTP.CD');
                            break;
                        case 'paperswithcode':
                            results[sourceId] = await fetchNewsData(company + ' machine learning', 5);
                            break;
                        case 'patents':
                            results[sourceId] = await fetchPatentData(company);
                            break;
                        default:
                            // Paid / OAuth / Enterprise sources — return informational note
                            results[sourceId] = {
                                success: true,
                                data: {
                                    note: `${sourceId} requires API key or enterprise subscription`,
                                    suggestion: `Configure ${sourceId} API key in Settings > Data Sources`,
                                    company
                                },
                                source: sourceId
                            };
                    }
                } catch (err) {
                    results[sourceId] = {
                        success: false,
                        error: err instanceof Error ? err.message : 'Fetch failed',
                        source: sourceId
                    };
                }
            })
        );

        return NextResponse.json({
            success: true,
            data: results,
            fetched: Object.keys(results).length,
            timestamp: new Date().toISOString()
        });
    }

    // SINGLE SOURCE TEST MODE: { source, apiKey }
    const { source } = body as { source?: string };
    try {
        let testResult;

        switch (source) {
            case 'sec':
                testResult = await fetchSECFilings('AAPL');
                break;
            case 'clinical-trials':
                testResult = await fetchClinicalTrials('cancer', 1);
                break;
            case 'fda':
                testResult = await fetchFDAData('aspirin', 'drug', 1);
                break;
            case 'github':
                testResult = await fetchGitHubData('react', 1);
                break;
            default:
                return NextResponse.json({ success: true, message: 'Source requires no authentication' });
        }

        return NextResponse.json({
            success: testResult.success,
            message: testResult.success ? 'Connection successful' : (testResult as { error?: string }).error,
            source: source
        });
    } catch (error) {
        return NextResponse.json({
            success: false,
            message: error instanceof Error ? error.message : 'Connection test failed'
        }, { status: 500 });
    }
}

/**
 * External Sources Configuration v2.0
 * Complete workflow for 41 external data sources with administrative requirements.
 * 
 * Requirement Groups:
 * - Group A: Public/No-Auth (requires User-Agent for SEC EDGAR)
 * - Group B: Instant Key Freemium (requires business email, verified accounts)
 * - Group C: OAuth/App Registration (requires developer profile, redirect URL)
 * - Group D: Enterprise Contract (requires sales contact)
 * - Group E: Scraper/Dataset (requires Puppeteer, robots.txt compliance)
 */

// =============================================================================
// REQUIREMENT GROUPS & TYPES
// =============================================================================

export type RequirementGroup = 'A' | 'B' | 'C' | 'D' | 'E';

export interface AdministrativeRequirement {
  group: RequirementGroup;
  groupName: string;
  requirements: string[];
  setupSteps: string[];
}

export const REQUIREMENT_GROUPS: Record<RequirementGroup, AdministrativeRequirement> = {
  A: {
    group: 'A',
    groupName: 'Public/No-Auth',
    requirements: [
      'User-Agent string (required for SEC EDGAR)',
      'No account needed'
    ],
    setupSteps: [
      'Configure User-Agent header: "TCA-IRR-Bot/1.0 (contact@yourdomain.com)"',
      'Ready for immediate GET requests'
    ]
  },
  B: {
    group: 'B',
    groupName: 'Instant Key (Freemium)',
    requirements: [
      'Business email',
      'Verified account (click activation link)',
      'Mobile phone for 2FA (some providers like GitHub)'
    ],
    setupSteps: [
      'Sign up with business email',
      'Click verification link in email',
      'Generate API key in dashboard',
      'Add key to .env file'
    ]
  },
  C: {
    group: 'C',
    groupName: 'OAuth/App Registration',
    requirements: [
      'Developer profile application',
      'Redirect URL (even localhost)',
      'App description (~200 words)'
    ],
    setupSteps: [
      'Apply for developer status',
      'Create OAuth application',
      'Configure redirect URL',
      'Implement OAuth flow',
      'Store tokens securely'
    ]
  },
  D: {
    group: 'D',
    groupName: 'Enterprise Contract',
    requirements: [
      'Sales contact required',
      'Enterprise pricing negotiation'
    ],
    setupSteps: [
      'Contact sales team',
      'Negotiate contract terms',
      'Receive API credentials',
      'Integrate with enterprise support'
    ]
  },
  E: {
    group: 'E',
    groupName: 'Scraper/Dataset',
    requirements: [
      'Puppeteer/Playwright for scraping',
      'Robots.txt compliance',
      'Cron job for dataset downloads'
    ],
    setupSteps: [
      'Install Puppeteer or Playwright',
      'Check robots.txt rules',
      'Implement rate limiting',
      'Schedule periodic downloads'
    ]
  }
};

// =============================================================================
// INFRASTRUCTURE REQUIREMENTS
// =============================================================================

export interface InfrastructureRequirement {
  category: string;
  items: { name: string; description: string; required: boolean }[];
}

export const INFRASTRUCTURE_REQUIREMENTS: InfrastructureRequirement[] = [
  {
    category: 'Backend Stack',
    items: [
      { name: 'Node.js / Python / Go', description: 'Runtime for async API calls', required: true },
      { name: 'Axios or Fetch', description: 'HTTP request library', required: true },
      { name: 'RSS Parser', description: 'For TechCrunch feed (Group E)', required: false },
      { name: 'Puppeteer/Playwright', description: 'Headless browser for scraping', required: false }
    ]
  },
  {
    category: 'Data Storage & Performance',
    items: [
      { name: 'Redis or Memcached', description: 'Cache layer (mandatory for rate limits)', required: true },
      { name: 'Cron Job Manager', description: 'Schedule FDA/WHO dataset downloads', required: false }
    ]
  },
  {
    category: 'Security & Environment',
    items: [
      { name: 'Environment Variables (.env)', description: 'Store API keys securely', required: true },
      { name: 'AES-256 Encryption', description: 'For user-provided keys', required: false },
      { name: 'CORS Policy', description: 'Restrict backend access', required: true }
    ]
  },
  {
    category: 'Legal & Compliance',
    items: [
      { name: 'Attribution Display', description: 'Show data source in UI', required: true },
      { name: 'Rate Limit Compliance', description: 'Request throttling queue', required: true },
      { name: 'Robots.txt Adherence', description: 'For scraper sources', required: false }
    ]
  }
];

// =============================================================================
// COMPLIANCE & SECURITY CONFIG
// =============================================================================

export interface ComplianceConfig {
  tokenManagement: {
    refreshBeforeExpiry: number; // minutes
    storageMethod: 'redis' | 'memory' | 'database';
    encryptionRequired: boolean;
  };
  userAgent: {
    template: string;
    contactEmail: string;
  };
  rateLimiting: {
    defaultRequestsPerMinute: number;
    burstLimit: number;
    retryAfterSeconds: number;
  };
  scraping: {
    respectRobotsTxt: boolean;
    maxConcurrentRequests: number;
    requestDelayMs: number;
  };
}

export const COMPLIANCE_CONFIG: ComplianceConfig = {
  tokenManagement: {
    refreshBeforeExpiry: 5, // Refresh OAuth tokens 5 mins before expiry
    storageMethod: 'redis',
    encryptionRequired: true
  },
  userAgent: {
    template: 'TCA-IRR-Bot/1.0 ({contact})',
    contactEmail: 'contact@yourdomain.com'
  },
  rateLimiting: {
    defaultRequestsPerMinute: 30,
    burstLimit: 10,
    retryAfterSeconds: 60
  },
  scraping: {
    respectRobotsTxt: true,
    maxConcurrentRequests: 2,
    requestDelayMs: 1000 // 1 second between scraper requests
  }
};

// Helper to generate User-Agent string
export const generateUserAgent = (email?: string): string => {
  const contact = email || COMPLIANCE_CONFIG.userAgent.contactEmail;
  return COMPLIANCE_CONFIG.userAgent.template.replace('{contact}', contact);
};

// =============================================================================
// EXTERNAL SOURCE INTERFACE
// =============================================================================

export interface ExternalSource {
  // Basic Information
  id: string;
  name: string;
  description: string;
  category: string;

  // Pricing
  pricing: 'Free' | 'Freemium' | 'Premium' | 'Enterprise';
  cost: string;
  monthlyCost?: number;

  // Status
  connected: boolean;
  active?: boolean;
  enabled?: boolean;
  status?: string;

  // API Configuration
  apiEndpoint?: string;
  apiUrl?: string;
  baseUrl?: string;

  // Authentication
  requiresAuth?: boolean;
  authType?: 'none' | 'api_key' | 'bearer_token' | 'oauth2' | 'enterprise';
  apiKey?: string;

  // Documentation & Access
  documentation?: string;
  getKeyUrl?: string;  // NEW: URL to get API key
  accessUrl?: string;

  // Administrative Requirements (NEW)
  requirementGroup?: RequirementGroup;
  setupSteps?: string[];

  // Features
  features: string[];
  useCase: string[];
  dataPoints?: string[];

  // Metadata
  websiteUrl?: string;
  framework?: 'general' | 'medtech' | 'both';
  icon?: string;
  tags?: string[];
  type?: string;
  tcaModule?: string;

  // Health & Performance
  successRate?: number;
  rateLimit?: string;
  isConnected?: boolean;
}

export const externalSourcesConfig: ExternalSource[] = [
  // Company Intelligence Sources
  {
    id: 'crunchbase',
    name: 'Crunchbase',
    description: 'Startup database with company information, funding, and market data',
    category: 'Company Intelligence',
    pricing: 'Freemium',
    cost: '$29/mo',
    connected: true,
    apiEndpoint: 'https://api.crunchbase.com/api/v4',
    features: ['Company profiles', 'Funding rounds', 'Investor data', 'Market analytics'],
    useCase: ['Company validation', 'Competitive analysis', 'Market research'],
    requirementGroup: 'B',
    getKeyUrl: 'https://www.crunchbase.com/api',
    authType: 'api_key'
  },
  {
    id: 'pitchbook',
    name: 'PitchBook',
    description: 'Private market data and intelligence platform',
    category: 'Company Intelligence',
    pricing: 'Enterprise',
    cost: '$400/mo',
    connected: true,
    features: ['Private market data', 'Valuations', 'Deal sourcing', 'Fund performance'],
    useCase: ['Valuation analysis', 'Deal comparisons', 'Market benchmarking'],
    requirementGroup: 'D',
    getKeyUrl: 'https://pitchbook.com/request-a-free-trial',
    authType: 'enterprise'
  },
  {
    id: 'cb-insights',
    name: 'CB Insights',
    description: 'Market intelligence platform for emerging technology trends',
    category: 'Company Intelligence',
    pricing: 'Premium',
    cost: '$99/mo',
    connected: true,
    features: ['Market maps', 'Trend analysis', 'Company scoring', 'Patent analytics'],
    useCase: ['Market trends', 'Technology adoption', 'Competitive intelligence'],
    requirementGroup: 'D',
    getKeyUrl: 'https://www.cbinsights.com/research-request-demo',
    authType: 'enterprise'
  },
  {
    id: 'owler',
    name: 'Owler',
    description: 'Competitive intelligence and business insights',
    category: 'Company Intelligence',
    pricing: 'Freemium',
    cost: '$35/mo',
    connected: true,
    features: ['Company news', 'Competitive alerts', 'Revenue estimates', 'Employee counts'],
    useCase: ['Competitive monitoring', 'Market positioning', 'Business development'],
    requirementGroup: 'B',
    getKeyUrl: 'https://corp.owler.com/plans/',
    authType: 'api_key'
  },
  {
    id: 'similarweb',
    name: 'SimilarWeb',
    description: 'Website analytics and digital market intelligence',
    category: 'Company Intelligence',
    pricing: 'Freemium',
    cost: '$199/mo',
    connected: true,
    features: ['Website traffic', 'Audience analysis', 'App intelligence', 'Market share'],
    useCase: ['Digital performance', 'Market share analysis', 'User behavior'],
    requirementGroup: 'D',
    getKeyUrl: 'https://www.similarweb.com/corp/pricing/',
    authType: 'enterprise'
  },

  // Technology Sources
  {
    id: 'github',
    name: 'GitHub',
    description: 'Code repositories and developer collaboration platform',
    category: 'Technology Sources',
    pricing: 'Freemium',
    cost: '$4/mo',
    connected: true,
    apiEndpoint: 'https://api.github.com',
    features: ['Code analysis', 'Developer activity', 'Project popularity', 'Technology stack'],
    useCase: ['Technical assessment', 'Developer talent', 'Technology adoption'],
    requirementGroup: 'B',
    getKeyUrl: 'https://github.com/settings/tokens',
    authType: 'bearer_token'
  },
  {
    id: 'stackoverflow',
    name: 'Stack Overflow',
    description: 'Developer community and knowledge platform',
    category: 'Technology Sources',
    pricing: 'Freemium',
    cost: '$6/mo',
    connected: true,
    features: ['Developer insights', 'Technology trends', 'Skill assessment', 'Community engagement'],
    useCase: ['Technical expertise', 'Technology popularity', 'Developer resources'],
    requirementGroup: 'B',
    getKeyUrl: 'https://stackapps.com/apps/oauth/register',
    authType: 'api_key'
  },
  {
    id: 'techcrunch',
    name: 'TechCrunch',
    description: 'Technology news and startup coverage',
    category: 'Technology Sources',
    pricing: 'Freemium',
    cost: '$10/mo',
    connected: false,
    features: ['Tech news', 'Startup coverage', 'Industry analysis', 'Event information'],
    useCase: ['Market awareness', 'Industry trends', 'Startup ecosystem'],
    requirementGroup: 'E',
    getKeyUrl: 'https://techcrunch.com/feed/',
    authType: 'none'
  },
  {
    id: 'producthunt',
    name: 'Product Hunt',
    description: 'Product discovery and launch platform',
    category: 'Technology Sources',
    pricing: 'Freemium',
    cost: '$8/mo',
    connected: false,
    features: ['Product launches', 'User feedback', 'Innovation tracking', 'Maker community'],
    useCase: ['Product validation', 'Innovation trends', 'User engagement'],
    requirementGroup: 'C',
    getKeyUrl: 'https://www.producthunt.com/v2/oauth/applications',
    authType: 'oauth2'
  },
  {
    id: 'hackernews',
    name: 'Hacker News',
    description: 'Tech community discussions and news',
    category: 'Technology Sources',
    pricing: 'Free',
    cost: 'Free',
    connected: true,
    apiEndpoint: 'https://hacker-news.firebaseio.com/v0',
    features: ['Tech discussions', 'Industry news', 'Community sentiment', 'Trend identification'],
    useCase: ['Community sentiment', 'Technical trends', 'Industry discussions'],
    requirementGroup: 'A',
    getKeyUrl: 'https://github.com/HackerNews/API',
    authType: 'none'
  },

  // AI & ML Sources
  {
    id: 'huggingface',
    name: 'Hugging Face',
    description: 'AI models, datasets, and machine learning platform',
    category: 'AI & ML Sources',
    pricing: 'Freemium',
    cost: '$20/mo',
    connected: true,
    apiEndpoint: 'https://huggingface.co/api',
    features: ['AI model repository', 'Dataset access', 'Model performance', 'ML community'],
    useCase: ['AI capability assessment', 'Model benchmarking', 'Technology adoption'],
    requirementGroup: 'B',
    getKeyUrl: 'https://huggingface.co/settings/tokens',
    authType: 'bearer_token'
  },
  {
    id: 'paperswithcode',
    name: 'Papers With Code',
    description: 'Machine learning research papers with code implementation',
    category: 'AI & ML Sources',
    pricing: 'Free',
    cost: 'Free',
    connected: true,
    features: ['Research papers', 'Code implementations', 'Benchmarks', 'State-of-the-art tracking'],
    useCase: ['Research validation', 'Technical innovation', 'Academic credibility'],
    requirementGroup: 'A',
    getKeyUrl: 'https://paperswithcode.com/api/v1/docs/',
    authType: 'none'
  },

  // Financial Data Sources
  {
    id: 'sec-edgar',
    name: 'SEC EDGAR Database',
    description: 'US Securities and Exchange Commission filings',
    category: 'Financial Data',
    pricing: 'Free',
    cost: 'Free',
    connected: true,
    apiEndpoint: 'https://www.sec.gov/Archives/edgar',
    features: ['SEC filings', 'Financial statements', 'Regulatory documents', 'Corporate actions'],
    useCase: ['Financial analysis', 'Compliance verification', 'Corporate governance'],
    requirementGroup: 'A',
    getKeyUrl: 'https://www.sec.gov/developer',
    authType: 'none'
  },
  {
    id: 'yahoo-finance',
    name: 'Yahoo Finance',
    description: 'Financial market data and analysis',
    category: 'Financial Data',
    pricing: 'Freemium',
    cost: '$15/mo',
    connected: true,
    features: ['Stock prices', 'Financial news', 'Market data', 'Company financials'],
    useCase: ['Market valuation', 'Financial benchmarking', 'Investment analysis'],
    requirementGroup: 'B',
    getKeyUrl: 'https://www.yahoofinanceapi.com/',
    authType: 'api_key'
  },
  {
    id: 'alpha-vantage',
    name: 'Alpha Vantage',
    description: 'Real-time and historical financial market data API',
    category: 'Financial Data',
    pricing: 'Freemium',
    cost: '$25/mo',
    connected: true,
    apiEndpoint: 'https://www.alphavantage.co/query',
    features: ['Real-time data', 'Technical indicators', 'Fundamental data', 'Economic indicators'],
    useCase: ['Market analysis', 'Financial modeling', 'Risk assessment'],
    requirementGroup: 'B',
    getKeyUrl: 'https://www.alphavantage.co/support/#api-key',
    authType: 'api_key'
  },

  // Government & Economic Data
  {
    id: 'fred',
    name: 'Federal Reserve Economic Data (FRED)',
    description: 'US economic time series data from Federal Reserve',
    category: 'Economic Data',
    pricing: 'Free',
    cost: 'Free',
    connected: true,
    apiEndpoint: 'https://api.stlouisfed.org/fred',
    features: ['Economic indicators', 'Historical data', 'Forecasts', 'Regional data'],
    useCase: ['Economic analysis', 'Market conditions', 'Macroeconomic trends'],
    requirementGroup: 'B',
    getKeyUrl: 'https://fred.stlouisfed.org/docs/api/api_key.html',
    authType: 'api_key'
  },
  {
    id: 'world-bank',
    name: 'World Bank Open Data',
    description: 'Global development and economic indicators',
    category: 'Economic Data',
    pricing: 'Free',
    cost: 'Free',
    connected: true,
    apiEndpoint: 'https://api.worldbank.org/v2',
    features: ['Global indicators', 'Country data', 'Development metrics', 'Statistical data'],
    useCase: ['Global market analysis', 'Country risk assessment', 'Development trends'],
    requirementGroup: 'A',
    getKeyUrl: 'https://datahelpdesk.worldbank.org/knowledgebase/topics/125589-developer-information',
    authType: 'none'
  },

  // Medical & Healthcare (MedTech Framework)
  {
    id: 'clinicaltrials-gov',
    name: 'ClinicalTrials.gov',
    description: 'US clinical trials database',
    category: 'Clinical Trial Databases',
    pricing: 'Free',
    cost: 'Free',
    connected: true,
    apiEndpoint: 'https://clinicaltrials.gov/api',
    features: ['Clinical trials', 'Study protocols', 'Results data', 'Regulatory information'],
    useCase: ['Clinical validation', 'Regulatory pathway', 'Competitive analysis'],
    requirementGroup: 'A',
    getKeyUrl: 'https://clinicaltrials.gov/data-api/api',
    authType: 'none'
  },
  {
    id: 'fda-orange-book',
    name: 'FDA Orange Book',
    description: 'FDA approved drug products database',
    category: 'Drug & Regulatory',
    pricing: 'Free',
    cost: 'Free',
    connected: true,
    features: ['Approved drugs', 'Patent information', 'Generic equivalents', 'Regulatory status'],
    useCase: ['Drug development', 'IP analysis', 'Regulatory compliance'],
    requirementGroup: 'E',
    getKeyUrl: 'https://www.fda.gov/drugs/drug-approvals-and-databases/orange-book-data-files',
    authType: 'none'
  },
  {
    id: 'pubmed',
    name: 'PubMed',
    description: 'Biomedical literature database',
    category: 'Research & Medical',
    pricing: 'Free',
    cost: 'Free',
    connected: true,
    apiEndpoint: 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils',
    features: ['Medical literature', 'Research papers', 'Clinical studies', 'Biomedical data'],
    useCase: ['Research validation', 'Scientific credibility', 'Evidence base'],
    requirementGroup: 'B',
    getKeyUrl: 'https://www.ncbi.nlm.nih.gov/account/settings/',
    authType: 'api_key'
  },

  // Professional Networks
  {
    id: 'linkedin',
    name: 'LinkedIn',
    description: 'Professional network and talent insights',
    category: 'Professional Networks',
    pricing: 'Freemium',
    cost: '$30/mo',
    connected: true,
    features: ['Professional profiles', 'Company insights', 'Talent analytics', 'Network analysis'],
    useCase: ['Team assessment', 'Talent acquisition', 'Professional networks'],
    requirementGroup: 'C',
    getKeyUrl: 'https://www.linkedin.com/developers/apps',
    authType: 'oauth2'
  },
  {
    id: 'angellist',
    name: 'AngelList (Wellfound)',
    description: 'Startup jobs and investment platform',
    category: 'Professional Networks',
    pricing: 'Freemium',
    cost: '$25/mo',
    connected: true,
    features: ['Startup profiles', 'Job postings', 'Investor connections', 'Salary data'],
    useCase: ['Startup ecosystem', 'Talent market', 'Investment connections'],
    requirementGroup: 'B',
    getKeyUrl: 'https://angel.co/api',
    authType: 'api_key'
  },

  // Social Media & Sentiment
  {
    id: 'reddit',
    name: 'Reddit API',
    description: 'Community discussions and sentiment analysis',
    category: 'Social Media & Sentiment',
    pricing: 'Freemium',
    cost: '$20/mo',
    connected: true,
    apiEndpoint: 'https://www.reddit.com/api/v1',
    features: ['Community discussions', 'Sentiment analysis', 'Trend tracking', 'User engagement'],
    useCase: ['Market sentiment', 'Community feedback', 'Brand monitoring'],
    requirementGroup: 'C',
    getKeyUrl: 'https://www.reddit.com/prefs/apps',
    authType: 'oauth2'
  },
  {
    id: 'twitter',
    name: 'Twitter (X) API',
    description: 'Social sentiment and real-time discussions',
    category: 'Social Media & Sentiment',
    pricing: 'Freemium',
    cost: '$100/mo',
    connected: false,
    features: ['Social sentiment', 'Real-time trends', 'Influencer tracking', 'Brand monitoring'],
    useCase: ['Market sentiment', 'Brand awareness', 'Trend analysis'],
    requirementGroup: 'B',
    getKeyUrl: 'https://developer.twitter.com/en/portal/dashboard',
    authType: 'bearer_token'
  },

  // Intellectual Property
  {
    id: 'uspto',
    name: 'USPTO Patent Database',
    description: 'US patents and trademark database',
    category: 'Intellectual Property',
    pricing: 'Free',
    cost: 'Free',
    connected: true,
    apiEndpoint: 'https://developer.uspto.gov/api-catalog',
    features: ['Patent search', 'Trademark data', 'IP analytics', 'Filing status'],
    useCase: ['IP analysis', 'Patent landscape', 'Competitive intelligence'],
    requirementGroup: 'A',
    getKeyUrl: 'https://developer.uspto.gov/api-catalog',
    authType: 'none'
  },
  {
    id: 'google-patents',
    name: 'Google Patents',
    description: 'Global patent search and analysis',
    category: 'Intellectual Property',
    pricing: 'Free',
    cost: 'Free',
    connected: true,
    features: ['Global patents', 'Patent families', 'Citation analysis', 'Prior art search'],
    useCase: ['Patent research', 'Prior art analysis', 'IP strategy'],
    requirementGroup: 'E',
    getKeyUrl: 'https://patents.google.com/',
    authType: 'none'
  },
  {
    id: 'wipo',
    name: 'WIPO Global Brand Database',
    description: 'International trademarks and designs',
    category: 'Intellectual Property',
    pricing: 'Free',
    cost: 'Free',
    connected: true,
    features: ['International trademarks', 'Design patents', 'Madrid system', 'Brand protection'],
    useCase: ['Trademark research', 'Brand protection', 'International IP'],
    requirementGroup: 'A',
    getKeyUrl: 'https://www.wipo.int/branddb/en/',
    authType: 'none'
  },

  // Additional Medical/Healthcare Sources
  {
    id: 'eu-clinical-trials',
    name: 'EU Clinical Trials Register',
    description: 'European clinical trials database',
    category: 'Clinical Trial Databases',
    pricing: 'Free',
    cost: 'Free',
    connected: true,
    features: ['European trials', 'Study protocols', 'Regulatory data', 'Trial results'],
    useCase: ['European market', 'Regulatory pathway', 'Clinical development'],
    requirementGroup: 'A',
    getKeyUrl: 'https://www.clinicaltrialsregister.eu/',
    authType: 'none'
  },
  {
    id: 'who-ictrp',
    name: 'WHO ICTRP',
    description: 'Global clinical trial registry platform',
    category: 'Clinical Trial Databases',
    pricing: 'Free',
    cost: 'Free',
    connected: true,
    features: ['Global trials', 'Registry network', 'Trial transparency', 'Public health data'],
    useCase: ['Global clinical landscape', 'Public health research', 'Trial transparency'],
    requirementGroup: 'E',
    getKeyUrl: 'https://www.who.int/clinical-trials-registry-platform',
    authType: 'none'
  },
  {
    id: 'fda-purple-book',
    name: 'FDA Purple Book',
    description: 'FDA biological products database',
    category: 'Drug & Regulatory',
    pricing: 'Free',
    cost: 'Free',
    connected: true,
    features: ['Biological products', 'Biosimilars', 'Licensing info', 'Patent data'],
    useCase: ['Biologics development', 'Biosimilar analysis', 'FDA compliance'],
    requirementGroup: 'E',
    getKeyUrl: 'https://purplebooksearch.fda.gov/',
    authType: 'none'
  },
  {
    id: 'ema-clinical',
    name: 'EMA Clinical Data',
    description: 'European Medicines Agency clinical data',
    category: 'Drug & Regulatory',
    pricing: 'Free',
    cost: 'Free',
    connected: true,
    features: ['European approvals', 'Clinical data', 'Safety information', 'Regulatory decisions'],
    useCase: ['European regulatory', 'Safety analysis', 'Market access'],
    requirementGroup: 'A',
    getKeyUrl: 'https://clinicaldata.ema.europa.eu/',
    authType: 'none'
  },

  // Venture Capital & Investment
  {
    id: 'angellist-venture',
    name: 'AngelList Venture',
    description: 'Startup investor matching platform',
    category: 'VC & Investment',
    pricing: 'Free',
    cost: 'Free',
    connected: true,
    requirementGroup: 'B',
    getKeyUrl: 'https://angel.co/api',
    authType: 'api_key',
    features: ['Investor matching', 'Startup profiles', 'Funding data', 'Network access'],
    useCase: ['Fundraising', 'Investor relations', 'Market validation']
  },
  {
    id: 'gust',
    name: 'Gust',
    description: 'Angel investor platform',
    category: 'VC & Investment',
    pricing: 'Free',
    cost: 'Free',
    connected: true,
    features: ['Angel networks', 'Deal flow', 'Due diligence', 'Investor matching'],
    useCase: ['Angel funding', 'Investment pipeline', 'Due diligence'],
    requirementGroup: 'B',
    getKeyUrl: 'https://gust.com/premium',
    authType: 'api_key'
  },

  // Government Economic Sources
  {
    id: 'bea',
    name: 'Bureau of Economic Analysis (BEA)',
    description: 'GDP and economic statistics',
    category: 'Economic Data',
    pricing: 'Free',
    cost: 'Free',
    connected: true,
    apiEndpoint: 'https://apps.bea.gov/api',
    features: ['GDP data', 'Economic accounts', 'Regional data', 'Industry statistics'],
    useCase: ['Economic analysis', 'Market sizing', 'Regional trends'],
    requirementGroup: 'B',
    getKeyUrl: 'https://apps.bea.gov/API/signup/',
    authType: 'api_key'
  },
  {
    id: 'bls',
    name: 'Bureau of Labor Statistics (BLS)',
    description: 'Employment and wage data',
    category: 'Economic Data',
    pricing: 'Free',
    cost: 'Free',
    connected: true,
    apiEndpoint: 'https://api.bls.gov',
    features: ['Employment data', 'Wage statistics', 'Labor trends', 'Industry employment'],
    useCase: ['Labor market analysis', 'Wage benchmarking', 'Employment trends'],
    requirementGroup: 'B',
    getKeyUrl: 'https://www.bls.gov/developers/home.htm',
    authType: 'api_key'
  },

  // Additional Tech Sources
  {
    id: 'google-trends',
    name: 'Google Trends',
    description: 'Search trend analysis and market insights',
    category: 'Technology Sources',
    pricing: 'Free',
    cost: 'Free',
    connected: true,
    features: ['Search trends', 'Geographic data', 'Related queries', 'Market interest'],
    useCase: ['Market demand', 'Trend analysis', 'Geographic insights'],
    requirementGroup: 'E',
    getKeyUrl: 'https://trends.google.com/',
    authType: 'none'
  },
  {
    id: 'wayback-machine',
    name: 'Wayback Machine',
    description: 'Historical website analysis',
    category: 'Technology Sources',
    pricing: 'Free',
    cost: 'Free',
    connected: true,
    features: ['Website history', 'Content evolution', 'Historical analysis', 'Digital archaeology'],
    useCase: ['Company evolution', 'Historical analysis', 'Competitive history'],
    requirementGroup: 'A',
    getKeyUrl: 'https://archive.org/help/wayback_api.php',
    authType: 'none'
  },

  // News & Media
  {
    id: 'reuters',
    name: 'Reuters',
    description: 'Global news and financial information',
    category: 'News & Media',
    pricing: 'Freemium',
    cost: '$40/mo',
    connected: false,
    features: ['Global news', 'Financial data', 'Market analysis', 'Breaking news'],
    useCase: ['Market intelligence', 'News monitoring', 'Financial insights'],
    requirementGroup: 'D',
    getKeyUrl: 'https://www.reuters.com/info/api-developer-program/',
    authType: 'enterprise'
  },
  {
    id: 'wsj',
    name: 'Wall Street Journal',
    description: 'Business news and market analysis',
    category: 'News & Media',
    pricing: 'Premium',
    cost: '$39/mo',
    connected: false,
    features: ['Business news', 'Market analysis', 'Industry insights', 'Economic reporting'],
    useCase: ['Business intelligence', 'Market trends', 'Industry analysis'],
    requirementGroup: 'D',
    getKeyUrl: 'https://www.wsj.com/subscription-options',
    authType: 'enterprise'
  }
];

export const getSourcesByCategory = () => {
  const categories = externalSourcesConfig.reduce((acc, source) => {
    if (!acc[source.category]) {
      acc[source.category] = [];
    }
    acc[source.category].push(source);
    return acc;
  }, {} as Record<string, ExternalSource[]>);

  return categories;
};

export const getConnectedSources = () => {
  return externalSourcesConfig.filter(source => source.connected);
};

export const getSourcesByPricing = (pricing: ExternalSource['pricing']) => {
  return externalSourcesConfig.filter(source => source.pricing === pricing);
};

export const getFreeAndFreemiumSources = () => {
  return externalSourcesConfig.filter(source =>
    source.pricing === 'Free' || source.pricing === 'Freemium'
  );
};

// =============================================================================
// NEW HELPER FUNCTIONS FOR REQUIREMENT GROUPS
// =============================================================================

/**
 * Get sources by requirement group (A, B, C, D, or E)
 */
export const getSourcesByRequirementGroup = (group: RequirementGroup): ExternalSource[] => {
  return externalSourcesConfig.filter(source => source.requirementGroup === group);
};

/**
 * Get the API key registration URL for a specific source
 */
export const getKeyUrlForSource = (sourceId: string): string | undefined => {
  const source = externalSourcesConfig.find(s => s.id === sourceId);
  return source?.getKeyUrl;
};

/**
 * Get requirement group details for a source
 */
export const getRequirementGroupForSource = (sourceId: string): AdministrativeRequirement | undefined => {
  const source = externalSourcesConfig.find(s => s.id === sourceId);
  if (source?.requirementGroup) {
    return REQUIREMENT_GROUPS[source.requirementGroup];
  }
  return undefined;
};

/**
 * Get all sources grouped by their requirement group
 */
export const getSourcesGroupedByRequirement = (): Record<RequirementGroup, ExternalSource[]> => {
  const groups: Record<RequirementGroup, ExternalSource[]> = {
    A: [],
    B: [],
    C: [],
    D: [],
    E: []
  };

  externalSourcesConfig.forEach(source => {
    if (source.requirementGroup) {
      groups[source.requirementGroup].push(source);
    }
  });

  return groups;
};

/**
 * Get count of sources per requirement group
 */
export const getRequirementGroupCounts = (): Record<RequirementGroup, number> => {
  const grouped = getSourcesGroupedByRequirement();
  return {
    A: grouped.A.length,
    B: grouped.B.length,
    C: grouped.C.length,
    D: grouped.D.length,
    E: grouped.E.length
  };
};

// Aliases for backward compatibility
export { externalSourcesConfig as externalSources };
export type { ExternalSource as Source };

// Export types for data-sources page
export type ExternalSourceCategoryType = ExternalSource['category'];
export type ExternalSourcePricingType = ExternalSource['pricing'];
export type ExternalSourceStatusType = 'connected' | 'disconnected' | 'error';

// Category enum object for runtime use
export const ExternalSourceCategory = {
  COMPANY_INTELLIGENCE: 'Company Intelligence',
  TECHNOLOGY_SOURCES: 'Technology Sources',
  AI_ML: 'AI & ML Sources',
  FINANCIAL: 'Financial Data',
  MEDICAL: 'Research & Medical',
  ACADEMIC: 'Academic',
  GOVERNMENT: 'Economic Data',
  OTHER: 'Other',
} as const;

// Pricing enum object for runtime use
export const ExternalSourcePricing = {
  FREE: 'Free',
  PAID: 'Paid',
  FREEMIUM: 'Freemium',
  PREMIUM: 'Premium',
  ENTERPRISE: 'Enterprise',
} as const;

// Status enum object for runtime use
export const ExternalSourceStatus = {
  AVAILABLE: 'Available',
  CONNECTED: 'Connected',
  DISCONNECTED: 'Disconnected',
  ERROR: 'Error',
} as const;

export const sourceCategories = [
  'Company Intelligence',
  'Technology Sources',
  'AI & ML Sources',
  'Financial Data',
  'Economic Data',
  'Clinical Trial Databases',
  'Drug & Regulatory',
  'Research & Medical',
  'Professional Networks',
  'Social Media & Sentiment',
  'Intellectual Property',
  'VC & Investment',
  'News & Media'
];

export const sourceStatus = ['connected', 'disconnected', 'error'];
export const sourceTypes = ['API', 'Web Scraping', 'Database', 'Feed'];
export const sourcePricingList = ['Free', 'Freemium', 'Premium', 'Enterprise'];

// Compatibility exports for data-sources page (structured format with id/name/count)
export type SourceCategory = {
  id: string;
  name: string;
  count: number;
};

// Generate structured category array with counts from externalSourcesConfig
const allCategories = [...new Set(externalSourcesConfig.map(s => s.category))];
export const sourceCategoriesStructured: SourceCategory[] = [
  { id: 'all', name: 'All Categories', count: externalSourcesConfig.length },
  ...allCategories.map(cat => ({
    id: cat.toLowerCase().replace(/[\s&/]+/g, '-'),
    name: cat,
    count: externalSourcesConfig.filter(s => s.category === cat).length,
  })).sort((a, b) => a.name.localeCompare(b.name))
];

export const sourceStatusStructured = [
  { id: 'all', name: 'All Statuses' },
  { id: 'connected', name: 'Connected' },
  { id: 'disconnected', name: 'Disconnected' },
  { id: 'active', name: 'Active' },
  { id: 'inactive', name: 'Inactive' },
];

export const sourceTypesStructured = [
  { id: 'all', name: 'All Types' },
  { id: 'api', name: 'API' },
  { id: 'website', name: 'Website' },
  { id: 'database', name: 'Database' },
];

export const sourcePricingListStructured = [
  { id: 'all', name: 'All Pricing' },
  { id: 'free', name: 'Free' },
  { id: 'freemium', name: 'Freemium' },
  { id: 'premium', name: 'Premium' },
  { id: 'enterprise', name: 'Enterprise' },
];

// Alias for sources export (maps externalSourcesConfig to the Source type format)
export const sources: ExternalSource[] = externalSourcesConfig;

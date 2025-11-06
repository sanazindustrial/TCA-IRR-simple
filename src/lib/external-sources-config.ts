export interface ExternalSource {
  id: string;
  name: string;
  description: string;
  category: string;
  pricing: 'Free' | 'Freemium' | 'Premium' | 'Enterprise';
  cost: string;
  connected: boolean;
  apiEndpoint?: string;
  documentation?: string;
  features: string[];
  useCase: string[];
  websiteUrl?: string;
  framework?: 'general' | 'medtech' | 'both';
  icon?: string;
  requiresAuth?: boolean;
  tags?: string[];
  type?: string;
  successRate?: number;
  rateLimit?: string;
  apiUrl?: string;
  active?: boolean;
  apiKey?: string;
  isConnected?: boolean;
  status?: string;
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
    useCase: ['Company validation', 'Competitive analysis', 'Market research']
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
    useCase: ['Valuation analysis', 'Deal comparisons', 'Market benchmarking']
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
    useCase: ['Market trends', 'Technology adoption', 'Competitive intelligence']
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
    useCase: ['Competitive monitoring', 'Market positioning', 'Business development']
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
    useCase: ['Digital performance', 'Market share analysis', 'User behavior']
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
    useCase: ['Technical assessment', 'Developer talent', 'Technology adoption']
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
    useCase: ['Technical expertise', 'Technology popularity', 'Developer resources']
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
    useCase: ['Market awareness', 'Industry trends', 'Startup ecosystem']
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
    useCase: ['Product validation', 'Innovation trends', 'User engagement']
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
    useCase: ['Community sentiment', 'Technical trends', 'Industry discussions']
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
    useCase: ['AI capability assessment', 'Model benchmarking', 'Technology adoption']
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
    useCase: ['Research validation', 'Technical innovation', 'Academic credibility']
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
    useCase: ['Financial analysis', 'Compliance verification', 'Corporate governance']
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
    useCase: ['Market valuation', 'Financial benchmarking', 'Investment analysis']
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
    useCase: ['Market analysis', 'Financial modeling', 'Risk assessment']
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
    useCase: ['Economic analysis', 'Market conditions', 'Macroeconomic trends']
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
    useCase: ['Global market analysis', 'Country risk assessment', 'Development trends']
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
    useCase: ['Clinical validation', 'Regulatory pathway', 'Competitive analysis']
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
    useCase: ['Drug development', 'IP analysis', 'Regulatory compliance']
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
    useCase: ['Research validation', 'Scientific credibility', 'Evidence base']
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
    useCase: ['Team assessment', 'Talent acquisition', 'Professional networks']
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
    useCase: ['Startup ecosystem', 'Talent market', 'Investment connections']
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
    useCase: ['Market sentiment', 'Community feedback', 'Brand monitoring']
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
    useCase: ['Market sentiment', 'Brand awareness', 'Trend analysis']
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
    useCase: ['IP analysis', 'Patent landscape', 'Competitive intelligence']
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
    useCase: ['Patent research', 'Prior art analysis', 'IP strategy']
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
    useCase: ['Trademark research', 'Brand protection', 'International IP']
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
    useCase: ['European market', 'Regulatory pathway', 'Clinical development']
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
    useCase: ['Global clinical landscape', 'Public health research', 'Trial transparency']
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
    useCase: ['Biologics development', 'Biosimilar analysis', 'FDA compliance']
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
    useCase: ['European regulatory', 'Safety analysis', 'Market access']
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
    useCase: ['Angel funding', 'Investment pipeline', 'Due diligence']
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
    useCase: ['Economic analysis', 'Market sizing', 'Regional trends']
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
    useCase: ['Labor market analysis', 'Wage benchmarking', 'Employment trends']
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
    useCase: ['Market demand', 'Trend analysis', 'Geographic insights']
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
    useCase: ['Company evolution', 'Historical analysis', 'Competitive history']
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
    useCase: ['Market intelligence', 'News monitoring', 'Financial insights']
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
    useCase: ['Business intelligence', 'Market trends', 'Industry analysis']
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


export type Source = {
  id: string;
  name: string;
  category: string; // e.g., 'TCA Scorecard', 'Economic Analysis'
  description: string;
  url: string;
  apiUrl: string;
  apiKey?: string;
  type: 'API' | 'Website' | 'Database' | 'Reports/API' | 'Local';
  pricing: 'Free' | 'Freemium' | 'Premium' | 'Enterprise';
  rateLimit: string;
  successRate: number;
  avgResponse: number;
  tags: string[];
  connected: boolean;
  active: boolean;
  icon: string;
};

export type SourceCategory = {
  id: string;
  name:string;
  count: number;
};

const newSourcesData = {
  "tca_external_sources": {
    "company_intelligence": [
      {"id": 1, "name": "Crunchbase", "desc": "Startup database", "type": "Freemium", "price": 29, "status": "Connected"},
      {"id": 2, "name": "PitchBook", "desc": "Private market data", "type": "Enterprise", "price": 400, "status": "Connected"},
      {"id": 3, "name": "CB Insights", "desc": "Market intelligence", "type": "Premium", "price": 99, "status": "Connected"},
      {"id": 4, "name": "Owler", "desc": "Competitive intelligence", "type": "Freemium", "price": 35, "status": "Connected"},
      {"id": 5, "name": "SimilarWeb", "desc": "Website analytics", "type": "Freemium", "price": 199, "status": "Connected"},
      {"id": 6, "name": "Tracxn", "desc": "Startup and sector database", "type": "Premium", "price": 120, "status": "New"},
      {"id": 7, "name": "PrivCo", "desc": "Private company financials", "type": "Premium", "price": 150, "status": "New"},
      {"id": 8, "name": "Dealroom.co", "desc": "European startup data", "type": "Freemium", "price": 99, "status": "Connected"},
      {"id": 9, "name": "DataFox (Oracle)", "desc": "AI company intelligence", "type": "Enterprise", "status": "New"},
      {"id": 10, "name": "Apollo.io", "desc": "Firmographic enrichment", "type": "Freemium", "price": 25, "status": "New"}
    ],
    "technology_sources": [
      {"id": 11, "name": "GitHub", "desc": "Code repositories", "type": "Freemium", "price": 4, "status": "Connected"},
      {"id": 12, "name": "Stack Overflow", "desc": "Developer community", "type": "Freemium", "price": 6, "status": "Connected"},
      {"id": 13, "name": "TechCrunch", "desc": "Tech news", "type": "Freemium", "price": 10, "status": "Connected"},
      {"id": 14, "name": "Product Hunt", "desc": "Product discovery", "type": "Freemium", "price": 8, "status": "Connected"},
      {"id": 15, "name": "Hacker News", "desc": "Tech community", "type": "Free", "status": "Connected"},
      {"id": 16, "name": "BuiltWith", "desc": "Tech stack intelligence", "type": "Freemium", "price": 50, "status": "New"},
      {"id": 17, "name": "Kaggle Datasets", "desc": "Open industry data", "type": "Free", "status": "Connected"},
      {"id": 18, "name": "Papers With Code", "desc": "ML research", "type": "Free", "status": "Connected"},
      {"id": 19, "name": "OpenML", "desc": "AI/ML experiment datasets", "type": "Free", "status": "New"},
      {"id": 20, "name": "Weights & Biases", "desc": "Model lifecycle tracking", "type": "Freemium", "status": "New"}
    ],
    "intellectual_property": [
      {"id": 21, "name": "USPTO", "desc": "US patents", "type": "Free", "status": "Connected"},
      {"id": 22, "name": "Google Patents", "desc": "Global patent search", "type": "Free", "status": "Connected"},
      {"id": 23, "name": "WIPO", "desc": "International trademarks", "type": "Free", "status": "Connected"},
      {"id": 24, "name": "PatSnap", "desc": "Patent analytics", "type": "Premium", "price": 200, "status": "Connected"},
      {"id": 25, "name": "Lens.org", "desc": "Patent analytics", "type": "Freemium", "price": 50, "status": "Connected"}
    ],
    "financial_data": [
      {"id": 26, "name": "SEC EDGAR", "desc": "Regulatory filings", "type": "Free", "status": "Connected"},
      {"id": 27, "name": "Yahoo Finance", "desc": "Market data", "type": "Freemium", "price": 15, "status": "Connected"},
      {"id": 28, "name": "Bloomberg Terminal", "desc": "Professional market data", "type": "Enterprise", "price": 2000, "status": "Connected"},
      {"id": 29, "name": "Alpha Vantage", "desc": "Financial API", "type": "Freemium", "price": 25, "status": "Connected"},
      {"id": 30, "name": "Quandl (Nasdaq)", "desc": "Economic data", "type": "Freemium", "price": 50, "status": "Connected"},
      {"id": 31, "name": "Morningstar Direct", "desc": "Equity fundamentals", "type": "Premium", "status": "New"},
      {"id": 32, "name": "YCharts", "desc": "Financial analytics", "type": "Premium", "status": "New"}
    ],
    "professional_networks": [
      {"id": 33, "name": "LinkedIn", "desc": "Professional network", "type": "Freemium", "price": 30, "status": "Connected"},
      {"id": 34, "name": "AngelList", "desc": "Startup network", "type": "Freemium", "price": 25, "status": "Connected"},
      {"id": 35, "name": "Meetup", "desc": "Professional events", "type": "Free", "status": "Connected"},
      {"id": 36, "name": "Eventbrite", "desc": "Business conferences", "type": "Free", "status": "Connected"}
    ],
    "news_media": [
      {"id": 37, "name": "Reuters", "desc": "Global news", "type": "Freemium", "price": 40, "status": "Connected"},
      {"id": 38, "name": "Wall Street Journal", "desc": "Business news", "type": "Premium", "price": 39, "status": "Connected"},
      {"id": 39, "name": "Fierce Biotech", "desc": "Industry news", "type": "Freemium", "price": 12, "status": "Connected"},
      {"id": 40, "name": "BioPharma Dive", "desc": "Biotech news", "type": "Freemium", "price": 15, "status": "Connected"}
    ],
    "academic_research": [
      {"id": 41, "name": "arXiv", "desc": "Scientific papers", "type": "Free", "status": "Connected"},
      {"id": 42, "name": "PubMed", "desc": "Medical literature", "type": "Free", "status": "Connected"},
      {"id": 43, "name": "NIH Clinical Center", "desc": "NIH research", "type": "Free", "status": "Connected"},
      {"id": 44, "name": "Nature Medicine", "desc": "Medical research", "type": "Premium", "price": 249, "status": "Connected"}
    ],
    "regulatory_government": [
      {"id": 45, "name": "FDA Database", "desc": "Medical regulations", "type": "Free", "status": "Connected"},
      {"id": 46, "name": "ClinicalTrials.gov", "desc": "US clinical trials", "type": "Free", "status": "Connected"},
      {"id": 47, "name": "EU Clinical Trials Register", "desc": "European trials", "type": "Free", "status": "Connected"},
      {"id": 48, "name": "WHO ICTRP", "desc": "Global trials", "type": "Free", "status": "Connected"}
    ],
    "social_sentiment": [
      {"id": 49, "name": "Twitter (X)", "desc": "Social sentiment", "type": "Freemium", "price": 100, "status": "Connected"},
      {"id": 50, "name": "Reddit", "desc": "Community discussions", "type": "Freemium", "price": 20, "status": "Connected"},
      {"id": 51, "name": "Google Trends", "desc": "Market trends", "type": "Free", "status": "Connected"},
      {"id": 52, "name": "Alternative.me", "desc": "Market sentiment index", "type": "Free", "status": "New"}
    ],
    "market_research": [
      {"id": 53, "name": "Statista", "desc": "Market data", "type": "Freemium", "price": 59, "status": "Connected"},
      {"id": 54, "name": "Gartner", "desc": "Tech research", "type": "Enterprise", "price": 300, "status": "Connected"},
      {"id": 55, "name": "Forrester", "desc": "Market analysis", "type": "Enterprise", "price": 250, "status": "Connected"}
    ],
    "alternative_data": [
      {"id": 56, "name": "Planet Labs", "desc": "Satellite imagery", "type": "Enterprise", "price": 500, "status": "Connected"},
      {"id": 57, "name": "App Annie", "desc": "Mobile analytics", "type": "Freemium", "price": 80, "status": "Connected"},
      {"id": 58, "name": "Thinknum", "desc": "Alt-data signals", "type": "Premium", "status": "New"},
      {"id": 59, "name": "QuiverQuant", "desc": "Insider trading data", "type": "Freemium", "status": "New"}
    ],
    "esg_sustainability": [
      {"id": 60, "name": "MSCI ESG Research", "desc": "ESG ratings", "type": "Enterprise", "price": 400, "status": "Connected"},
      {"id": 61, "name": "CDP", "desc": "Climate data", "type": "Freemium", "price": 75, "status": "Connected"}
    ],
    "ai_ml_sources": [
      {"id": 62, "name": "Hugging Face", "desc": "AI models", "type": "Freemium", "price": 20, "status": "Connected"},
      {"id": 63, "name": "Papers With Code", "desc": "ML research", "type": "Free", "status": "Connected"}
    ],
    "economic_data": [
      {"id": 64, "name": "Federal Reserve (FRED)", "desc": "US economic data", "type": "Free", "status": "Connected"},
      {"id": 65, "name": "World Bank", "desc": "Global development data", "type": "Free", "status": "Connected"},
      {"id": 66, "name": "OECD", "desc": "International economy", "type": "Free", "status": "Connected"},
      {"id": 67, "name": "IMF Data", "desc": "Monetary fund stats", "type": "Free", "status": "Connected"}
    ],
    "vc_investment": [
      {"id": 68, "name": "Preqin", "desc": "VC investments", "type": "Enterprise", "price": 600, "status": "Connected"},
      {"id": 69, "name": "AngelList Venture", "desc": "Investor network", "type": "Free", "status": "Connected"},
      {"id": 70, "name": "F6S", "desc": "Funding platform", "type": "Free", "status": "Connected"},
      {"id": 71, "name": "VC4A", "desc": "Africa VC network", "type": "Free", "status": "Connected"}
    ],
    "team_assessment": [
      {"id": 72, "name": "LinkedIn Talent Insights", "desc": "Professional backgrounds", "type": "Free", "status": "Connected"},
      {"id": 73, "name": "GitHub Team Analytics", "desc": "Developer profiles", "type": "Free", "status": "Connected"},
      {"id": 74, "name": "Glassdoor Reviews", "desc": "Company culture", "type": "Free", "status": "Connected"},
      {"id": 75, "name": "Indeed Company Pages", "desc": "Hiring trends", "type": "Free", "status": "Connected"}
    ]
  },
   "iq_sources": [
    { "id": 76, "name": "CB Insights IQ", "desc": "Market intelligence, startup tracking, and emerging tech trends", "type": "Premium", "price": 99, "status": "New" },
    { "id": 77, "name": "Craft IQ", "desc": "Company intelligence and supply-chain visibility with ESG and vendor risk analytics", "type": "Freemium", "status": "New" },
    { "id": 78, "name": "Veridion IQ", "desc": "AI-powered company enrichment and B2B firmographics via API", "type": "Freemium", "status": "New" },
    { "id": 79, "name": "HG Insights IQ", "desc": "Technographics data — maps company software and infrastructure adoption", "type": "Enterprise", "status": "New" },
    { "id": 80, "name": "Crunchbase IQ", "desc": "Startup and company database with analytics, dashboards, and CRM exports", "type": "Freemium", "price": 49, "status": "New" },
    { "id": 81, "name": "Apollo IQ", "desc": "Contact and company data with CRM integration and enrichment tools", "type": "Freemium", "price": 39, "status": "New" },
    { "id": 82, "name": "ZoomInfo Sales IQ", "desc": "Company and contact database with buying-intent analytics", "type": "Premium", "price": 200, "status": "New" },
    { "id": 83, "name": "Clearbit Reveal IQ", "desc": "Real-time enrichment and visitor intelligence for SaaS GTM", "type": "Freemium", "status": "New" },
    { "id": 84, "name": "6sense Revenue IQ", "desc": "Predictive buyer-intent scoring for B2B pipelines", "type": "Enterprise", "status": "New" },
    { "id": 85, "name": "Morningstar Data IQ", "desc": "Financial and ESG analytics for portfolio management", "type": "Premium", "status": "New" },
    { "id": 86, "name": "Equifax Business IQ", "desc": "Credit and risk intelligence for SMBs and enterprises", "type": "Enterprise", "status": "New" },
    { "id": 87, "name": "ThomasNet Industry IQ", "desc": "Manufacturing and supplier intelligence (North America)", "type": "Freemium", "status": "New" },
    { "id": 88, "name": "ESG Enterprise IQ", "desc": "Environmental and sustainability scoring platform", "type": "Freemium", "status": "New" },
    { "id": 89, "name": "StartupBlink IQ", "desc": "Global startup ecosystem ranking and mapping", "type": "Freemium", "status": "New" },
    { "id": 90, "name": "Preqin IQ", "desc": "Alternative investments intelligence (VC, PE, hedge funds)", "type": "Enterprise", "price": 600, "status": "New" },
    { "id": 91, "name": "CBRE Market IQ", "desc": "Commercial real estate analytics and trends", "type": "Premium", "status": "New" },
    { "id": 92, "name": "Refinitiv Business IQ", "desc": "Financial markets, ESG, and company data", "type": "Enterprise", "status": "New" },
    { "id": 93, "name": "S&P Capital IQ", "desc": "Financial statements, valuation comps, and transactions", "type": "Enterprise", "price": 1000, "status": "New" },
    { "id": 94, "name": "Oracle DataFox IQ", "desc": "Company intelligence and CRM enrichment (Oracle Cloud)", "type": "Enterprise", "status": "New" }
  ]
};

const categoryMapping: { [key: string]: string } = {
  company_intelligence: 'Company Intelligence',
  technology_sources: 'Technology Sources',
  intellectual_property: 'Intellectual Property',
  financial_data: 'Financial Data',
  professional_networks: 'Professional Networks',
  news_media: 'News & Media',
  academic_research: 'Academic & Research',
  regulatory_government: 'Regulatory & Government',
  social_sentiment: 'Social & Sentiment',
  market_research: 'Market Research',
  alternative_data: 'Alternative Data',
  esg_sustainability: 'ESG & Sustainability',
  ai_ml_sources: 'AI & ML Sources',
  economic_data: 'Economic Data',
  vc_investment: 'VC & Investment',
  team_assessment: 'Team Assessment',
  iq_sources: 'IQ & Enrichment Platforms'
};

const iconMapping: { [key: string]: string } = {
  'Company Intelligence': 'Database',
  'Technology Sources': 'Cpu',
  'Intellectual Property': 'Lightbulb',
  'Financial Data': 'DollarSign',
  'Professional Networks': 'Users',
  'News & Media': 'BookOpen',
  'Academic & Research': 'Book',
  'Regulatory & Government': 'Landmark',
  'Social & Sentiment': 'MessageCircle',
  'Market Research': 'BarChart',
  'Alternative Data': 'FileSearch',
  'ESG & Sustainability': 'Leaf',
  'AI & ML Sources': 'BrainCircuit',
  'Economic Data': 'TrendingUp',
  'VC & Investment': 'Rocket',
  'Team Assessment': 'Users',
  'IQ & Enrichment Platforms': 'Lightbulb'
};


const allSourcesRaw = [
    ...Object.entries(newSourcesData.tca_external_sources).flatMap(([categoryKey, items]) => 
        (items as any[]).map(item => ({ ...item, categoryKey }))
    ),
    ...newSourcesData.iq_sources.map(item => ({ ...item, categoryKey: 'iq_sources' }))
];


export const sources: Source[] = allSourcesRaw.map((item: any) => {
    const categoryName = categoryMapping[item.categoryKey] || 'Uncategorized';
    const isConnected = item.status === 'Connected';
    const pricing = (item.type as string || 'Free').trim() as 'Free' | 'Freemium' | 'Premium' | 'Enterprise';
    return {
        id: String(item.id),
        name: item.name,
        category: categoryName,
        description: item.desc || item.focus,
        url: `https://www.${item.name.toLowerCase().replace(/ /g, '-').replace(/[().]/g, '')}.com`,
        apiUrl: `https://api.${item.name.toLowerCase().replace(/ /g, '-').replace(/[().]/g, '')}.com`,
        apiKey: isConnected && pricing === 'Free' ? 'N/A (Publicly Accessible)' : '',
        type: 'API',
        pricing: pricing,
        rateLimit: 'Varies',
        successRate: isConnected ? 98.5 : 0,
        avgResponse: isConnected ? 800 : 0,
        tags: [item.name.toLowerCase().replace(/ /g, '-'), categoryName.toLowerCase()],
        connected: isConnected,
        active: isConnected,
        icon: iconMapping[categoryName] || 'Database',
    };
});


export const sourceCategories: SourceCategory[] = [
    { id: 'all', name: 'All Categories', count: sources.length },
    ...Object.keys(categoryMapping)
        .map(key => ({
            id: categoryMapping[key].toLowerCase().replace(/[\s&/]+/g, '-'),
            name: categoryMapping[key],
            count: sources.filter(s => s.category === categoryMapping[key]).length,
        }))
        .filter(c => c.count > 0)
        .sort((a, b) => a.name.localeCompare(b.name)),
];

export const sourceStatus = [
    { id: 'all', name: 'All Statuses' },
    { id: 'connected', name: 'Connected' },
    { id: 'disconnected', name: 'Disconnected' },
    { id: 'active', name: 'Active' },
    { id: 'inactive', name: 'Inactive' },
];

export const sourceTypes = [
    { id: 'all', name: 'All Types' },
    { id: 'api', name: 'API' },
    { id: 'website', name: 'Website' },
    { id: 'database', name: 'Database' },
];

export const sourcePricingList = [
    {id: 'all', name: 'All Pricing'},
    {id: 'free', name: 'Free'},
    {id: 'freemium', name: 'Freemium'},
    {id: 'premium', name: 'Premium'},
    {id: 'enterprise', name: 'Enterprise'},
];

    
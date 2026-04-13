"""
Data Normalizer
Unified data transformation layer for all 41 external data sources.
Follows the requirement groups: A (Public), B (Freemium), C (OAuth), D (Enterprise), E (Scraper)
"""

import logging
from typing import Dict, List, Optional, Any, Union
from datetime import datetime
from dataclasses import dataclass, field
from enum import Enum
from abc import ABC, abstractmethod

logger = logging.getLogger(__name__)


class RequirementGroup(str, Enum):
    """
    Administrative Requirement Groups
    Group A: Public/No-Auth (requires User-Agent string)
    Group B: Instant Key Freemium (requires business email, verified accounts)
    Group C: OAuth/App Registration (requires developer profile, redirect URL)
    Group D: Enterprise Contract (requires sales contact)
    Group E: Scraper/Dataset (requires Puppeteer, robots.txt compliance)
    """
    GROUP_A = "public_no_auth"
    GROUP_B = "instant_key_freemium"
    GROUP_C = "oauth_app_registration"
    GROUP_D = "enterprise_contract"
    GROUP_E = "scraper_dataset"


@dataclass
class NormalizedCompanyData:
    """Unified company data structure"""
    source_id: str
    source_name: str
    company_name: str
    company_description: Optional[str] = None
    founded_year: Optional[int] = None
    headquarters: Optional[str] = None
    industry: Optional[str] = None
    employee_count: Optional[int] = None
    employee_range: Optional[str] = None
    website: Optional[str] = None
    linkedin_url: Optional[str] = None
    logo_url: Optional[str] = None
    funding_total: Optional[float] = None
    funding_rounds: List[Dict] = field(default_factory=list)
    investors: List[str] = field(default_factory=list)
    competitors: List[str] = field(default_factory=list)
    revenue_estimate: Optional[float] = None
    revenue_range: Optional[str] = None
    tech_stack: List[str] = field(default_factory=list)
    social_links: Dict[str, str] = field(default_factory=dict)
    raw_data: Dict = field(default_factory=dict)
    normalized_at: datetime = field(default_factory=datetime.utcnow)
    
    def to_dict(self) -> Dict:
        return {
            "source_id": self.source_id,
            "source_name": self.source_name,
            "company_name": self.company_name,
            "company_description": self.company_description,
            "founded_year": self.founded_year,
            "headquarters": self.headquarters,
            "industry": self.industry,
            "employee_count": self.employee_count,
            "employee_range": self.employee_range,
            "website": self.website,
            "linkedin_url": self.linkedin_url,
            "logo_url": self.logo_url,
            "funding_total": self.funding_total,
            "funding_rounds": self.funding_rounds,
            "investors": self.investors,
            "competitors": self.competitors,
            "revenue_estimate": self.revenue_estimate,
            "revenue_range": self.revenue_range,
            "tech_stack": self.tech_stack,
            "social_links": self.social_links,
            "normalized_at": self.normalized_at.isoformat()
        }


@dataclass
class NormalizedFinancialData:
    """Unified financial data structure"""
    source_id: str
    source_name: str
    ticker: Optional[str] = None
    company_name: Optional[str] = None
    price: Optional[float] = None
    price_change: Optional[float] = None
    price_change_percent: Optional[float] = None
    volume: Optional[int] = None
    market_cap: Optional[float] = None
    pe_ratio: Optional[float] = None
    eps: Optional[float] = None
    dividend_yield: Optional[float] = None
    fifty_two_week_high: Optional[float] = None
    fifty_two_week_low: Optional[float] = None
    beta: Optional[float] = None
    sector: Optional[str] = None
    industry: Optional[str] = None
    historical_prices: List[Dict] = field(default_factory=list)
    raw_data: Dict = field(default_factory=dict)
    normalized_at: datetime = field(default_factory=datetime.utcnow)
    
    def to_dict(self) -> Dict:
        return {
            "source_id": self.source_id,
            "source_name": self.source_name,
            "ticker": self.ticker,
            "company_name": self.company_name,
            "price": self.price,
            "price_change": self.price_change,
            "price_change_percent": self.price_change_percent,
            "volume": self.volume,
            "market_cap": self.market_cap,
            "pe_ratio": self.pe_ratio,
            "eps": self.eps,
            "dividend_yield": self.dividend_yield,
            "fifty_two_week_high": self.fifty_two_week_high,
            "fifty_two_week_low": self.fifty_two_week_low,
            "beta": self.beta,
            "sector": self.sector,
            "industry": self.industry,
            "historical_prices": self.historical_prices,
            "normalized_at": self.normalized_at.isoformat()
        }


@dataclass
class NormalizedResearchData:
    """Unified research/publication data structure (PubMed, arXiv, etc.)"""
    source_id: str
    source_name: str
    title: str
    abstract: Optional[str] = None
    authors: List[str] = field(default_factory=list)
    publication_date: Optional[datetime] = None
    journal: Optional[str] = None
    doi: Optional[str] = None
    pmid: Optional[str] = None
    arxiv_id: Optional[str] = None
    url: Optional[str] = None
    citations: Optional[int] = None
    keywords: List[str] = field(default_factory=list)
    mesh_terms: List[str] = field(default_factory=list)
    affiliations: List[str] = field(default_factory=list)
    raw_data: Dict = field(default_factory=dict)
    normalized_at: datetime = field(default_factory=datetime.utcnow)
    
    def to_dict(self) -> Dict:
        return {
            "source_id": self.source_id,
            "source_name": self.source_name,
            "title": self.title,
            "abstract": self.abstract,
            "authors": self.authors,
            "publication_date": self.publication_date.isoformat() if self.publication_date else None,
            "journal": self.journal,
            "doi": self.doi,
            "pmid": self.pmid,
            "arxiv_id": self.arxiv_id,
            "url": self.url,
            "citations": self.citations,
            "keywords": self.keywords,
            "mesh_terms": self.mesh_terms,
            "affiliations": self.affiliations,
            "normalized_at": self.normalized_at.isoformat()
        }


@dataclass
class NormalizedClinicalData:
    """Unified clinical trial data structure"""
    source_id: str
    source_name: str
    trial_id: str
    title: str
    status: Optional[str] = None
    phase: Optional[str] = None
    condition: Optional[str] = None
    conditions: List[str] = field(default_factory=list)
    interventions: List[str] = field(default_factory=list)
    sponsor: Optional[str] = None
    collaborators: List[str] = field(default_factory=list)
    enrollment: Optional[int] = None
    start_date: Optional[datetime] = None
    completion_date: Optional[datetime] = None
    primary_outcome: Optional[str] = None
    secondary_outcomes: List[str] = field(default_factory=list)
    locations: List[Dict] = field(default_factory=list)
    raw_data: Dict = field(default_factory=dict)
    normalized_at: datetime = field(default_factory=datetime.utcnow)
    
    def to_dict(self) -> Dict:
        return {
            "source_id": self.source_id,
            "source_name": self.source_name,
            "trial_id": self.trial_id,
            "title": self.title,
            "status": self.status,
            "phase": self.phase,
            "condition": self.condition,
            "conditions": self.conditions,
            "interventions": self.interventions,
            "sponsor": self.sponsor,
            "collaborators": self.collaborators,
            "enrollment": self.enrollment,
            "start_date": self.start_date.isoformat() if self.start_date else None,
            "completion_date": self.completion_date.isoformat() if self.completion_date else None,
            "primary_outcome": self.primary_outcome,
            "secondary_outcomes": self.secondary_outcomes,
            "locations": self.locations,
            "normalized_at": self.normalized_at.isoformat()
        }


@dataclass
class NormalizedNewsData:
    """Unified news/social data structure"""
    source_id: str
    source_name: str
    title: str
    content: Optional[str] = None
    summary: Optional[str] = None
    url: Optional[str] = None
    author: Optional[str] = None
    published_at: Optional[datetime] = None
    sentiment: Optional[str] = None  # positive, negative, neutral
    sentiment_score: Optional[float] = None
    categories: List[str] = field(default_factory=list)
    tags: List[str] = field(default_factory=list)
    mentions: List[str] = field(default_factory=list)
    engagement: Optional[Dict] = None  # likes, shares, comments
    raw_data: Dict = field(default_factory=dict)
    normalized_at: datetime = field(default_factory=datetime.utcnow)
    
    def to_dict(self) -> Dict:
        return {
            "source_id": self.source_id,
            "source_name": self.source_name,
            "title": self.title,
            "content": self.content,
            "summary": self.summary,
            "url": self.url,
            "author": self.author,
            "published_at": self.published_at.isoformat() if self.published_at else None,
            "sentiment": self.sentiment,
            "sentiment_score": self.sentiment_score,
            "categories": self.categories,
            "tags": self.tags,
            "mentions": self.mentions,
            "engagement": self.engagement,
            "normalized_at": self.normalized_at.isoformat()
        }


@dataclass
class NormalizedPatentData:
    """Unified patent/IP data structure"""
    source_id: str
    source_name: str
    patent_number: str
    title: str
    abstract: Optional[str] = None
    inventors: List[str] = field(default_factory=list)
    assignee: Optional[str] = None
    filing_date: Optional[datetime] = None
    publication_date: Optional[datetime] = None
    grant_date: Optional[datetime] = None
    status: Optional[str] = None
    claims: List[str] = field(default_factory=list)
    classifications: List[str] = field(default_factory=list)
    citations: List[str] = field(default_factory=list)
    cited_by: List[str] = field(default_factory=list)
    url: Optional[str] = None
    raw_data: Dict = field(default_factory=dict)
    normalized_at: datetime = field(default_factory=datetime.utcnow)
    
    def to_dict(self) -> Dict:
        return {
            "source_id": self.source_id,
            "source_name": self.source_name,
            "patent_number": self.patent_number,
            "title": self.title,
            "abstract": self.abstract,
            "inventors": self.inventors,
            "assignee": self.assignee,
            "filing_date": self.filing_date.isoformat() if self.filing_date else None,
            "publication_date": self.publication_date.isoformat() if self.publication_date else None,
            "grant_date": self.grant_date.isoformat() if self.grant_date else None,
            "status": self.status,
            "claims": self.claims,
            "classifications": self.classifications,
            "citations": self.citations,
            "cited_by": self.cited_by,
            "url": self.url,
            "normalized_at": self.normalized_at.isoformat()
        }


class BaseNormalizer(ABC):
    """Abstract base class for source-specific normalizers"""
    
    @abstractmethod
    def normalize(self, raw_data: Dict) -> Any:
        """Transform raw API response to normalized structure"""
        pass
    
    @staticmethod
    def safe_get(data: Dict, *keys, default=None):
        """Safely navigate nested dictionary keys"""
        result = data
        for key in keys:
            if isinstance(result, dict):
                result = result.get(key, default)
            else:
                return default
        return result if result is not None else default
    
    @staticmethod
    def parse_date(date_str: Optional[str]) -> Optional[datetime]:
        """Parse various date formats"""
        if not date_str:
            return None
        
        formats = [
            "%Y-%m-%d",
            "%Y-%m-%dT%H:%M:%SZ",
            "%Y-%m-%dT%H:%M:%S.%fZ",
            "%Y-%m-%d %H:%M:%S",
            "%d/%m/%Y",
            "%m/%d/%Y",
            "%B %d, %Y",
            "%Y"
        ]
        
        for fmt in formats:
            try:
                return datetime.strptime(date_str, fmt)
            except ValueError:
                continue
        
        logger.warning(f"Could not parse date: {date_str}")
        return None


# =============================================================================
# GROUP A: Public/No-Auth Normalizers
# =============================================================================

class SECEdgarNormalizer(BaseNormalizer):
    """Normalizer for SEC EDGAR filings (Group A - requires User-Agent)"""
    
    def normalize(self, raw_data: Dict) -> Dict:
        """Normalize SEC filing data"""
        filings = raw_data.get("filings", {}).get("recent", {})
        
        return {
            "source_id": "sec_edgar",
            "source_name": "SEC EDGAR",
            "requirement_group": RequirementGroup.GROUP_A.value,
            "cik": raw_data.get("cik"),
            "company_name": raw_data.get("name"),
            "sic": raw_data.get("sic"),
            "sic_description": raw_data.get("sicDescription"),
            "ticker_symbols": raw_data.get("tickers", []),
            "exchanges": raw_data.get("exchanges", []),
            "filings": [
                {
                    "form": filings.get("form", [])[i] if i < len(filings.get("form", [])) else None,
                    "filing_date": filings.get("filingDate", [])[i] if i < len(filings.get("filingDate", [])) else None,
                    "accession_number": filings.get("accessionNumber", [])[i] if i < len(filings.get("accessionNumber", [])) else None,
                    "primary_document": filings.get("primaryDocument", [])[i] if i < len(filings.get("primaryDocument", [])) else None,
                }
                for i in range(min(10, len(filings.get("form", []))))
            ],
            "normalized_at": datetime.utcnow().isoformat()
        }


class HackerNewsNormalizer(BaseNormalizer):
    """Normalizer for Hacker News API (Group A - no auth needed)"""
    
    def normalize(self, raw_data: Dict) -> NormalizedNewsData:
        return NormalizedNewsData(
            source_id="hacker_news",
            source_name="Hacker News",
            title=raw_data.get("title", ""),
            content=raw_data.get("text"),
            url=raw_data.get("url"),
            author=raw_data.get("by"),
            published_at=datetime.fromtimestamp(raw_data.get("time", 0)) if raw_data.get("time") else None,
            engagement={
                "score": raw_data.get("score", 0),
                "comments": raw_data.get("descendants", 0)
            },
            raw_data=raw_data
        )


class WorldBankNormalizer(BaseNormalizer):
    """Normalizer for World Bank API (Group A - no auth needed)"""
    
    def normalize(self, raw_data: List) -> Dict:
        # World Bank returns [metadata, data_array]
        if len(raw_data) < 2:
            return {"error": "Invalid response format"}
        
        metadata = raw_data[0] if isinstance(raw_data[0], dict) else {}
        data = raw_data[1] if isinstance(raw_data[1], list) else []
        
        indicators = []
        for item in data:
            indicators.append({
                "country": self.safe_get(item, "country", "value"),
                "country_code": self.safe_get(item, "countryiso3code"),
                "indicator": self.safe_get(item, "indicator", "value"),
                "indicator_id": self.safe_get(item, "indicator", "id"),
                "year": item.get("date"),
                "value": item.get("value"),
            })
        
        return {
            "source_id": "world_bank",
            "source_name": "World Bank",
            "requirement_group": RequirementGroup.GROUP_A.value,
            "total_records": metadata.get("total", 0),
            "indicators": indicators,
            "normalized_at": datetime.utcnow().isoformat()
        }


class PubMedNormalizer(BaseNormalizer):
    """Normalizer for PubMed/NCBI API (Group A - no auth needed)"""
    
    def normalize(self, raw_data: Dict) -> List[NormalizedResearchData]:
        articles = []
        
        pubmed_articles = raw_data.get("PubmedArticle", [])
        if not isinstance(pubmed_articles, list):
            pubmed_articles = [pubmed_articles]
        
        for article in pubmed_articles:
            medline = self.safe_get(article, "MedlineCitation", default={})
            article_data = self.safe_get(medline, "Article", default={})
            
            # Parse authors
            author_list = self.safe_get(article_data, "AuthorList", default=[])
            authors = []
            for author in author_list if isinstance(author_list, list) else []:
                name = f"{author.get('ForeName', '')} {author.get('LastName', '')}".strip()
                if name:
                    authors.append(name)
            
            # Parse mesh terms
            mesh_heading_list = self.safe_get(medline, "MeshHeadingList", default=[])
            mesh_terms = [
                self.safe_get(m, "DescriptorName", "#text", default="")
                for m in mesh_heading_list if isinstance(mesh_heading_list, list)
            ]
            
            articles.append(NormalizedResearchData(
                source_id="pubmed",
                source_name="PubMed",
                title=self.safe_get(article_data, "ArticleTitle", default=""),
                abstract=self.safe_get(article_data, "Abstract", "AbstractText", default=""),
                authors=authors,
                publication_date=self.parse_date(
                    self.safe_get(article_data, "ArticleDate", "Year")
                ),
                journal=self.safe_get(article_data, "Journal", "Title"),
                pmid=str(self.safe_get(medline, "PMID", "#text", default="")),
                doi=self._extract_doi(article_data),
                mesh_terms=mesh_terms,
                raw_data=article
            ))
        
        return articles
    
    def _extract_doi(self, article_data: Dict) -> Optional[str]:
        """Extract DOI from article data"""
        elocation_ids = article_data.get("ELocationID", [])
        if not isinstance(elocation_ids, list):
            elocation_ids = [elocation_ids]
        
        for loc in elocation_ids:
            if isinstance(loc, dict) and loc.get("@EIdType") == "doi":
                return loc.get("#text")
        return None


class ClinicalTrialsNormalizer(BaseNormalizer):
    """Normalizer for ClinicalTrials.gov API (Group A - no auth needed)"""
    
    def normalize(self, raw_data: Dict) -> List[NormalizedClinicalData]:
        trials = []
        
        studies = raw_data.get("studies", [])
        
        for study in studies:
            protocol = study.get("protocolSection", {})
            identification = protocol.get("identificationModule", {})
            status = protocol.get("statusModule", {})
            description = protocol.get("descriptionModule", {})
            conditions = protocol.get("conditionsModule", {})
            sponsor = protocol.get("sponsorCollaboratorsModule", {})
            design = protocol.get("designModule", {})
            
            trials.append(NormalizedClinicalData(
                source_id="clinicaltrials_gov",
                source_name="ClinicalTrials.gov",
                trial_id=identification.get("nctId", ""),
                title=identification.get("officialTitle") or identification.get("briefTitle", ""),
                status=status.get("overallStatus"),
                phase=", ".join(design.get("phases", [])),
                conditions=conditions.get("conditions", []),
                interventions=self._extract_interventions(protocol),
                sponsor=self.safe_get(sponsor, "leadSponsor", "name"),
                enrollment=self.safe_get(design, "enrollmentInfo", "count"),
                start_date=self.parse_date(self.safe_get(status, "startDateStruct", "date")),
                completion_date=self.parse_date(self.safe_get(status, "completionDateStruct", "date")),
                raw_data=study
            ))
        
        return trials
    
    def _extract_interventions(self, protocol: Dict) -> List[str]:
        """Extract intervention names"""
        arms = protocol.get("armsInterventionsModule", {}).get("interventions", [])
        return [arm.get("name", "") for arm in arms if arm.get("name")]


class USPTONormalizer(BaseNormalizer):
    """Normalizer for USPTO Patents API (Group A - no auth needed)"""
    
    def normalize(self, raw_data: Dict) -> List[NormalizedPatentData]:
        patents = []
        
        results = raw_data.get("results", [])
        
        for patent in results:
            patents.append(NormalizedPatentData(
                source_id="uspto_patents",
                source_name="USPTO",
                patent_number=patent.get("patentNumber", ""),
                title=patent.get("patentTitle", ""),
                abstract=patent.get("abstract"),
                inventors=patent.get("inventorName", []) if isinstance(patent.get("inventorName"), list) else [patent.get("inventorName")] if patent.get("inventorName") else [],
                assignee=patent.get("assigneeName"),
                filing_date=self.parse_date(patent.get("filingDate")),
                grant_date=self.parse_date(patent.get("grantDate")),
                classifications=patent.get("uspcClass", []) if isinstance(patent.get("uspcClass"), list) else [],
                url=f"https://patft.uspto.gov/netacgi/nph-Parser?patentnumber={patent.get('patentNumber', '')}",
                raw_data=patent
            ))
        
        return patents


# =============================================================================
# GROUP B: Instant Key (Freemium) Normalizers  
# =============================================================================

class GitHubNormalizer(BaseNormalizer):
    """Normalizer for GitHub API (Group B - requires token for higher limits)"""
    
    def normalize_repo(self, raw_data: Dict) -> Dict:
        """Normalize repository data"""
        return {
            "source_id": "github",
            "source_name": "GitHub",
            "requirement_group": RequirementGroup.GROUP_B.value,
            "repo_name": raw_data.get("full_name"),
            "description": raw_data.get("description"),
            "language": raw_data.get("language"),
            "stars": raw_data.get("stargazers_count", 0),
            "forks": raw_data.get("forks_count", 0),
            "watchers": raw_data.get("watchers_count", 0),
            "open_issues": raw_data.get("open_issues_count", 0),
            "created_at": raw_data.get("created_at"),
            "updated_at": raw_data.get("updated_at"),
            "pushed_at": raw_data.get("pushed_at"),
            "topics": raw_data.get("topics", []),
            "license": self.safe_get(raw_data, "license", "name"),
            "homepage": raw_data.get("homepage"),
            "owner": {
                "login": self.safe_get(raw_data, "owner", "login"),
                "avatar_url": self.safe_get(raw_data, "owner", "avatar_url"),
                "type": self.safe_get(raw_data, "owner", "type"),
            },
            "normalized_at": datetime.utcnow().isoformat()
        }
    
    def normalize_user(self, raw_data: Dict) -> Dict:
        """Normalize user/org data"""
        return {
            "source_id": "github",
            "source_name": "GitHub",
            "login": raw_data.get("login"),
            "name": raw_data.get("name"),
            "company": raw_data.get("company"),
            "location": raw_data.get("location"),
            "bio": raw_data.get("bio"),
            "public_repos": raw_data.get("public_repos", 0),
            "followers": raw_data.get("followers", 0),
            "following": raw_data.get("following", 0),
            "created_at": raw_data.get("created_at"),
            "avatar_url": raw_data.get("avatar_url"),
            "normalized_at": datetime.utcnow().isoformat()
        }
    
    def normalize(self, raw_data: Dict) -> Dict:
        """Auto-detect and normalize"""
        if "stargazers_count" in raw_data:
            return self.normalize_repo(raw_data)
        return self.normalize_user(raw_data)


class AlphaVantageNormalizer(BaseNormalizer):
    """Normalizer for Alpha Vantage API (Group B - requires API key)"""
    
    def normalize(self, raw_data: Dict) -> NormalizedFinancialData:
        # Handle different response types
        if "Global Quote" in raw_data:
            return self._normalize_quote(raw_data["Global Quote"])
        elif "Time Series (Daily)" in raw_data:
            return self._normalize_time_series(raw_data)
        elif "Meta Data" in raw_data:
            return self._normalize_time_series(raw_data)
        else:
            return NormalizedFinancialData(
                source_id="alpha_vantage",
                source_name="Alpha Vantage",
                raw_data=raw_data
            )
    
    def _normalize_quote(self, quote: Dict) -> NormalizedFinancialData:
        """Normalize global quote data"""
        return NormalizedFinancialData(
            source_id="alpha_vantage",
            source_name="Alpha Vantage",
            ticker=quote.get("01. symbol"),
            price=float(quote.get("05. price", 0)),
            price_change=float(quote.get("09. change", 0)),
            price_change_percent=float(quote.get("10. change percent", "0").replace("%", "")),
            volume=int(quote.get("06. volume", 0)),
            raw_data=quote
        )
    
    def _normalize_time_series(self, raw_data: Dict) -> NormalizedFinancialData:
        """Normalize time series data"""
        meta = raw_data.get("Meta Data", {})
        
        # Find time series key
        ts_key = None
        for key in raw_data.keys():
            if "Time Series" in key:
                ts_key = key
                break
        
        time_series = raw_data.get(ts_key, {}) if ts_key else {}
        
        historical = []
        for date_str, values in list(time_series.items())[:30]:  # Last 30 days
            historical.append({
                "date": date_str,
                "open": float(values.get("1. open", 0)),
                "high": float(values.get("2. high", 0)),
                "low": float(values.get("3. low", 0)),
                "close": float(values.get("4. close", 0)),
                "volume": int(values.get("5. volume", 0))
            })
        
        return NormalizedFinancialData(
            source_id="alpha_vantage",
            source_name="Alpha Vantage",
            ticker=meta.get("2. Symbol"),
            historical_prices=historical,
            raw_data=raw_data
        )


class FREDNormalizer(BaseNormalizer):
    """Normalizer for FRED API (Group B - requires API key)"""
    
    def normalize(self, raw_data: Dict) -> Dict:
        observations = raw_data.get("observations", [])
        
        return {
            "source_id": "fred",
            "source_name": "FRED",
            "requirement_group": RequirementGroup.GROUP_B.value,
            "series_id": raw_data.get("id"),
            "title": raw_data.get("title"),
            "units": raw_data.get("units"),
            "frequency": raw_data.get("frequency"),
            "observations": [
                {
                    "date": obs.get("date"),
                    "value": float(obs.get("value")) if obs.get("value") and obs.get("value") != "." else None
                }
                for obs in observations
            ],
            "normalized_at": datetime.utcnow().isoformat()
        }


# =============================================================================
# Data Normalizer Factory
# =============================================================================

class DataNormalizer:
    """
    Central data normalization service.
    Maps source IDs to their appropriate normalizers and provides unified interface.
    """
    
    # Source ID to normalizer mapping
    NORMALIZERS = {
        # Group A: Public/No-Auth
        "sec_edgar": SECEdgarNormalizer(),
        "hacker_news": HackerNewsNormalizer(),
        "world_bank": WorldBankNormalizer(),
        "pubmed": PubMedNormalizer(),
        "clinicaltrials_gov": ClinicalTrialsNormalizer(),
        "uspto_patents": USPTONormalizer(),
        
        # Group B: Instant Key (Freemium)
        "github": GitHubNormalizer(),
        "alpha_vantage": AlphaVantageNormalizer(),
        "fred": FREDNormalizer(),
    }
    
    # Requirement group mapping for all 41 sources
    SOURCE_GROUPS = {
        # Group A: Public/No-Auth (requires User-Agent for some)
        "sec_edgar": RequirementGroup.GROUP_A,
        "hacker_news": RequirementGroup.GROUP_A,
        "world_bank": RequirementGroup.GROUP_A,
        "pubmed": RequirementGroup.GROUP_A,
        "clinicaltrials_gov": RequirementGroup.GROUP_A,
        "uspto_patents": RequirementGroup.GROUP_A,
        "arxiv": RequirementGroup.GROUP_A,
        "wayback_machine": RequirementGroup.GROUP_A,
        "stack_overflow": RequirementGroup.GROUP_A,  # API key optional
        "techcrunch": RequirementGroup.GROUP_A,  # RSS feed
        "papers_with_code": RequirementGroup.GROUP_A,
        
        # Group B: Instant Key (Freemium)
        "github": RequirementGroup.GROUP_B,
        "alpha_vantage": RequirementGroup.GROUP_B,
        "fred": RequirementGroup.GROUP_B,
        "bea": RequirementGroup.GROUP_B,
        "bls": RequirementGroup.GROUP_B,
        "hugging_face": RequirementGroup.GROUP_B,
        "crunchbase": RequirementGroup.GROUP_B,
        "product_hunt": RequirementGroup.GROUP_B,
        "owler": RequirementGroup.GROUP_B,
        "newsapi": RequirementGroup.GROUP_B,
        
        # Group C: OAuth/App Registration
        "linkedin": RequirementGroup.GROUP_C,
        "twitter_x": RequirementGroup.GROUP_C,
        "reddit": RequirementGroup.GROUP_C,
        
        # Group D: Enterprise Contract
        "pitchbook": RequirementGroup.GROUP_D,
        "cb_insights": RequirementGroup.GROUP_D,
        "similarweb": RequirementGroup.GROUP_D,
        "bloomberg": RequirementGroup.GROUP_D,
        
        # Group E: Scraper/Dataset
        "google_trends": RequirementGroup.GROUP_E,
        "eu_clinical_trials": RequirementGroup.GROUP_E,
        "wellfound": RequirementGroup.GROUP_E,
        "who_ictrp": RequirementGroup.GROUP_E,
        "fda_orange_book": RequirementGroup.GROUP_E,
    }
    
    @classmethod
    def normalize(cls, source_id: str, raw_data: Any) -> Any:
        """
        Normalize raw data from any source.
        
        Args:
            source_id: External source identifier
            raw_data: Raw API response data
            
        Returns:
            Normalized data structure
        """
        normalizer = cls.NORMALIZERS.get(source_id)
        
        if normalizer:
            try:
                return normalizer.normalize(raw_data)
            except Exception as e:
                logger.error(f"Normalization failed for {source_id}: {e}")
                return {
                    "source_id": source_id,
                    "error": str(e),
                    "raw_data": raw_data,
                    "normalized_at": datetime.utcnow().isoformat()
                }
        else:
            # Return raw data with minimal wrapper for unsupported sources
            logger.warning(f"No normalizer found for source: {source_id}")
            return {
                "source_id": source_id,
                "source_name": source_id.replace("_", " ").title(),
                "data": raw_data,
                "normalized_at": datetime.utcnow().isoformat()
            }
    
    @classmethod
    def get_requirement_group(cls, source_id: str) -> Optional[RequirementGroup]:
        """Get the requirement group for a source"""
        return cls.SOURCE_GROUPS.get(source_id)
    
    @classmethod
    def get_sources_by_group(cls, group: RequirementGroup) -> List[str]:
        """Get all sources in a requirement group"""
        return [
            source_id for source_id, source_group in cls.SOURCE_GROUPS.items()
            if source_group == group
        ]
    
    @classmethod
    def get_supported_sources(cls) -> List[str]:
        """Get list of sources with normalizers"""
        return list(cls.NORMALIZERS.keys())
    
    @classmethod
    def get_all_sources(cls) -> List[str]:
        """Get list of all mapped sources"""
        return list(cls.SOURCE_GROUPS.keys())


# Export main class
__all__ = [
    "DataNormalizer",
    "RequirementGroup",
    "NormalizedCompanyData",
    "NormalizedFinancialData",
    "NormalizedResearchData",
    "NormalizedClinicalData",
    "NormalizedNewsData",
    "NormalizedPatentData",
]

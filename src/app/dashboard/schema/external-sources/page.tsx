
import { CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

const externalSourcesSchema = `-- schema/external_sources.sql

-- Create an enum type for source types for data consistency
CREATE TYPE source_type AS ENUM ('API', 'Website', 'Database');

-- Create an enum type for pricing tiers
CREATE TYPE pricing_tier AS ENUM ('Free', 'Freemium', 'Premium', 'Enterprise');

-- Main table to store all external data source configurations
CREATE TABLE external_sources (
    source_id VARCHAR(255) PRIMARY KEY, -- A unique identifier string for the source, e.g., 'crunchbase'
    name VARCHAR(255) NOT NULL,
    category VARCHAR(255) NOT NULL,
    description TEXT,
    url VARCHAR(1024),
    api_url VARCHAR(1024),
    api_key_encrypted VARCHAR(1024), -- API keys should always be stored encrypted at rest
    source_type source_type,
    pricing pricing_tier,
    rate_limit VARCHAR(100),
    success_rate NUMERIC(5, 2), -- e.g., 99.50
    avg_response_ms INTEGER, -- Average response time in milliseconds
    tags TEXT[], -- Array of text tags for better searching
    is_active BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ,
    
    UNIQUE (name)
);

CREATE INDEX idx_external_sources_category ON external_sources(category);
CREATE INDEX idx_external_sources_tags ON external_sources USING GIN(tags);

-- Table to log connection tests and their outcomes
CREATE TABLE source_connection_logs (
    log_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source_id VARCHAR(255) REFERENCES external_sources(source_id) ON DELETE CASCADE,
    test_timestamp TIMESTAMPTZ DEFAULT NOW(),
    was_successful BOOLEAN NOT NULL,
    response_code INTEGER,
    error_message TEXT
);

CREATE INDEX idx_source_connection_logs_source_id ON source_connection_logs(source_id);
`;

const SchemaViewer = ({ content }: { content: string }) => {
  return (
    <pre className="bg-muted/50 p-4 rounded-lg overflow-x-auto text-sm font-mono">
      <code>{content}</code>
    </pre>
  );
};


export default function ExternalSourcesSchema() {
    return (
        <div>
            <CardHeader className="px-0">
                <CardTitle>External Sources Schema</CardTitle>
                <CardDescription>
                    Defines tables for storing and managing configurations for all external data sources.
                </CardDescription>
            </CardHeader>
            <SchemaViewer content={externalSourcesSchema} />
        </div>
    )
}

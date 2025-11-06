
import { CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

const systemConfigSchema = `-- schema/system_configurations.sql

-- Enum type for variable scope
CREATE TYPE env_var_scope AS ENUM ('frontend', 'backend');

-- Table to store system-wide environment variables
CREATE TABLE system_env_variables (
    var_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) UNIQUE NOT NULL,
    value_encrypted VARCHAR(2048) NOT NULL, -- Always store encrypted
    scope env_var_scope NOT NULL,
    description TEXT,
    is_secret BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ
);

CREATE INDEX idx_system_env_variables_name ON system_env_variables(name);
CREATE INDEX idx_system_env_variables_scope ON system_env_variables(scope);

-- Table to store API keys for various services
CREATE TABLE system_api_keys (
    key_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    service_name VARCHAR(100) UNIQUE NOT NULL, -- e.g., 'OpenAI', 'Gemini', 'Crunchbase'
    key_value_encrypted VARCHAR(2048) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    last_tested_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ
);

CREATE INDEX idx_system_api_keys_service_name ON system_api_keys(service_name);
`;

const SchemaViewer = ({ content }: { content: string }) => {
  return (
    <pre className="bg-muted/50 p-4 rounded-lg overflow-x-auto text-sm font-mono">
      <code>{content}</code>
    </pre>
  );
};


export default function SystemConfigurationSchema() {
    return (
        <div>
            <CardHeader className="px-0">
                <CardTitle>System Configuration Schema</CardTitle>
                <CardDescription>
                    Defines tables for storing environment variables and API keys securely.
                </CardDescription>
            </CardHeader>
            <SchemaViewer content={systemConfigSchema} />
        </div>
    )
}

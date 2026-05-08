
import { CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

const moduleConfigSchema = `-- schema/module_configurations.sql

-- Table to store versioned configurations for each analysis module
CREATE TABLE module_configurations (
    config_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    module_id VARCHAR(50) NOT NULL, -- e.g., 'tca', 'risk', 'benchmark'
    version INTEGER NOT NULL,
    name VARCHAR(255) NOT NULL, -- e.g., "Q3 2024 Default", "MedTech Optimized v2"
    description TEXT,
    configuration_data JSONB NOT NULL, -- The actual JSON configuration object
    is_default BOOLEAN DEFAULT FALSE, -- Marks the factory default config
    is_active BOOLEAN DEFAULT FALSE, -- The currently active config for a module
    created_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES users(user_id),

    -- Ensure only one active and one default config per module
    UNIQUE (module_id, version)
);

CREATE INDEX idx_module_configurations_module_id ON module_configurations(module_id);
CREATE INDEX idx_module_configurations_active ON module_configurations(module_id) WHERE is_active = TRUE;
CREATE INDEX idx_module_configurations_default ON module_configurations(module_id) WHERE is_default = TRUE;


-- Table to log all changes to configurations for audit purposes
CREATE TABLE config_history (
    history_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    config_id UUID REFERENCES module_configurations(config_id),
    changed_by UUID REFERENCES users(user_id),
    changed_at TIMESTAMPTZ DEFAULT NOW(),
    change_description TEXT NOT NULL,
    previous_configuration_data JSONB
);

CREATE INDEX idx_config_history_config_id ON config_history(config_id);
`;

const SchemaViewer = ({ content }: { content: string }) => {
  return (
    <pre className="bg-muted/50 p-4 rounded-lg overflow-x-auto text-sm font-mono">
      <code>{content}</code>
    </pre>
  );
};


export default function ModuleConfigurationsSchema() {
    return (
        <div>
            <CardHeader className="px-0">
                <CardTitle>Module Configurations Schema</CardTitle>
                <CardDescription>
                    Defines tables for saving, versioning, and rolling back analysis module configurations.
                </CardDescription>
            </CardHeader>
            <SchemaViewer content={moduleConfigSchema} />
        </div>
    )
}

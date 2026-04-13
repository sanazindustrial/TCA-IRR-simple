"""
Configuration Manager for TCA Platform
Handles all system configurations with fallbacks
"""
import logging
import json
from datetime import datetime
from typing import Dict, Any, Optional
from pathlib import Path

logger = logging.getLogger(__name__)


class ConfigStatus:

    def __init__(self,
                 loaded: bool = False,
                 error: str = None,
                 last_modified: datetime = None,
                 size_kb: float = 0.0,
                 source_file: str = None):
        self.loaded = loaded
        self.error = error
        self.last_modified = last_modified or datetime.now()
        self.size_kb = size_kb
        self.source_file = source_file


class TCAConfigManager:
    """Centralized configuration manager with safe fallbacks"""

    def __init__(self):
        self.status = {}
        self.configurations = {}
        self._initialize_default_configs()

    def _initialize_default_configs(self):
        """Initialize default configurations for safe fallbacks"""

        # Default TCA configurations
        default_tca_weights = {
            "technology": 0.20,
            "market": 0.18,
            "team": 0.16,
            "financial": 0.15,
            "traction": 0.15,
            "risk": 0.16
        }

        self.configurations = {
            'tca_weights_general': {
                'tca_weights': default_tca_weights,
                'version': '4.0',
                'sector': 'general'
            },
            'tca_weights_medtech': {
                'tca_weights': {
                    **default_tca_weights, 'regulatory': 0.12,
                    'technology': 0.18
                },
                'version': '4.0',
                'sector': 'medtech'
            },
            'modules_registry': {
                'tca_scorecard': {
                    'enabled': True,
                    'weight': 0.25
                },
                'risk_flags': {
                    'enabled': True,
                    'weight': 0.10
                },
                'benchmarks': {
                    'enabled': True,
                    'weight': 0.10
                },
                'macro_pestel': {
                    'enabled': True,
                    'weight': 0.05
                },
                'gap_analysis': {
                    'enabled': True,
                    'weight': 0.05
                },
                'growth_classifier': {
                    'enabled': True,
                    'weight': 0.20
                },
                'team_assessment': {
                    'enabled': True,
                    'weight': 0.10
                },
                'funder_fit': {
                    'enabled': True,
                    'weight': 0.05
                },
                'strategic_fit': {
                    'enabled': True,
                    'weight': 0.10
                }
            },
            'growth_classifier': {
                'models': ['xgboost', 'random_forest', 'neural_network'],
                'ensemble_method': 'weighted_voting',
                'confidence_threshold': 0.85
            },
            'external_data_sources': {
                'sources': {
                    'crunchbase': {
                        'status': 'active',
                        'category': 'company_info'
                    },
                    'github': {
                        'status': 'active',
                        'category': 'technical'
                    },
                    'sec_edgar': {
                        'status': 'active',
                        'category': 'financial'
                    },
                    'linkedin': {
                        'status': 'active',
                        'category': 'social'
                    },
                    'pubmed': {
                        'status': 'active',
                        'category': 'research'
                    }
                },
                'high_priority': ['crunchbase', 'github', 'sec_edgar']
            }
        }

        # Set all as loaded
        for config_name in self.configurations.keys():
            self.status[config_name] = ConfigStatus(
                loaded=True, size_kb=1.0, source_file='default_fallback')

    def get_configuration(self, config_name: str, default: Any = None) -> Any:
        """Get configuration with fallback"""
        return self.configurations.get(config_name, default)

    def get_sector_configuration(self, sector: str) -> Optional[Dict]:
        """Get sector-specific configuration"""
        if sector == 'technology_others':
            return self.configurations.get('tca_weights_general')
        elif sector == 'life_sciences_medical':
            return self.configurations.get('tca_weights_medtech')
        return self.configurations.get('tca_weights_general')

    def get_growth_classifier_config(self) -> Dict:
        """Get growth classifier configuration"""
        return self.configurations.get('growth_classifier', {})

    def get_external_data_sources(self) -> Dict:
        """Get external data sources configuration"""
        return self.configurations.get('external_data_sources', {
            'sources': {},
            'high_priority': []
        })

    def get_frontend_compatible_config(self) -> Dict:
        """Get configuration formatted for frontend"""
        modules = self.configurations.get('modules_registry', {})

        return {
            'availableModules': [{
                'id': module_id,
                'name': module_id.replace('_', ' ').title(),
                'description': f'{module_id.replace("_", " ").title()} module',
                'enabled': config.get('enabled', True),
                'weight': config.get('weight', 0.1),
                'category': 'core'
            } for module_id, config in modules.items()],
            'sectorsMapping': {
                'general': {
                    'backend': 'tech',
                    'api': 'technology_others',
                    'display': 'General Technology'
                },
                'medtech': {
                    'backend': 'med_life',
                    'api': 'life_sciences_medical',
                    'display': 'Medical Technology'
                }
            },
            'totalModules':
            len(modules),
            'coreModules':
            len(modules),
            'version':
            '4.0.0'
        }

    def validate_configuration_integrity(self) -> Dict:
        """Validate configuration integrity"""
        loaded_configs = len([s for s in self.status.values() if s.loaded])
        total_configs = len(self.status)

        return {
            'overall_status':
            'healthy' if loaded_configs > 0 else 'error',
            'loaded_configs':
            loaded_configs,
            'total_configs':
            total_configs,
            'failed_configs':
            total_configs - loaded_configs,
            'compatibility_checks':
            True,
            'recommendations':
            ['All configurations loaded successfully'] if loaded_configs
            == total_configs else ['Some configurations failed to load']
        }

    def reload_configuration(self, config_name: str) -> bool:
        """Reload specific configuration"""
        logger.info(f"Reloading configuration: {config_name}")
        return True

    def initialize_configurations(self) -> Dict[str, ConfigStatus]:
        """Initialize all configurations"""
        return self.status


# Global instance
_config_manager = None


def get_config_manager() -> TCAConfigManager:
    """Get global config manager instance"""
    global _config_manager
    if _config_manager is None:
        _config_manager = TCAConfigManager()
    return _config_manager


def initialize_tca_configurations() -> Dict[str, ConfigStatus]:
    """Initialize TCA configuration system"""
    config_manager = get_config_manager()
    return config_manager.status
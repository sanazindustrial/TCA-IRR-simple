#!/usr/bin/env python3
"""
Test script for the new 9-module analysis system
Tests data mapping from uploaded files and module activation controls
"""

import sys
import json
from pathlib import Path

# Add the backend to the Python path
backend_path = Path(__file__).parent / "backend"
sys.path.insert(0, str(backend_path))

from app.models.module_config import (ModuleConfiguration,
                                      NineCoreAnalysisModules, ModuleStatus,
                                      DataMappingRule, ModuleDataProcessor)
from app.services.ai_service import AnalysisProcessor


def test_module_configuration():
    """Test the module configuration system"""
    print("🧪 Testing Module Configuration System...")

    # Create a test configuration
    config = ModuleConfiguration(
        modules=NineCoreAnalysisModules(
            tca_scorecard=ModuleStatus.ACTIVE,
            risk_assessment=ModuleStatus.ACTIVE,
            market_analysis=ModuleStatus.ACTIVE,
            team_assessment=ModuleStatus.ACTIVE,
            financial_health=ModuleStatus.ACTIVE,
            technology_assessment=ModuleStatus.
            INACTIVE,  # Test inactive module
            business_model=ModuleStatus.ACTIVE,
            growth_potential=ModuleStatus.TESTING,
            investment_readiness=ModuleStatus.ACTIVE),
        weighted_scoring=True,
        module_weights={
            "tca_scorecard": 0.20,
            "risk_assessment": 0.15,
            "market_analysis": 0.15,
            "team_assessment": 0.15,
            "financial_health": 0.15,
            "technology_assessment": 0.10,
            "business_model": 0.10,
            "growth_potential": 0.10,
            "investment_readiness": 0.10
        })

    print(
        f"✅ Configuration created with {len(config.get_active_modules())} active modules"
    )
    print(f"   Active modules: {config.get_active_modules()}")
    print(f"   Inactive modules: {config.get_inactive_modules()}")
    return config


def test_data_mapping():
    """Test the data mapping system"""
    print("\n🔄 Testing Data Mapping System...")

    # Create test mapping rules
    mapping_rules = [
        DataMappingRule(source_field="company_name",
                        target_field="company_data.name",
                        data_type="string",
                        required=True),
        DataMappingRule(source_field="industry_sector",
                        target_field="company_data.industry",
                        data_type="string",
                        required=True),
        DataMappingRule(source_field="annual_revenue_usd",
                        target_field="company_data.financial_data.revenue",
                        data_type="number",
                        required=False,
                        transformation_rule="convert_to_float"),
        DataMappingRule(source_field="team_size",
                        target_field="company_data.team_size",
                        data_type="number",
                        required=False)
    ]

    # Test uploaded file data
    uploaded_data = {
        "company_name": "TechStart AI",
        "industry_sector": "Artificial Intelligence",
        "annual_revenue_usd": "250000",
        "team_size": 8,
        "development_stage": "MVP",
        "funding_raised": "500000"
    }

    # Create data processor
    processor = ModuleDataProcessor(mapping_rules)

    # Process the data
    mapped_data = processor.process_uploaded_data(uploaded_data)

    print(f"✅ Data mapping completed")
    print(f"   Original fields: {list(uploaded_data.keys())}")
    print(f"   Mapped structure: {json.dumps(mapped_data, indent=2)}")

    return mapped_data, processor


def test_analysis_processor():
    """Test the enhanced analysis processor"""
    print("\n🚀 Testing Enhanced Analysis Processor...")

    # Create test company data
    company_data = {
        "name": "TechStart AI",
        "industry": "artificial intelligence",
        "market_size": 15000000000,  # $15B market
        "development_stage": "mvp",
        "team_size": 8,
        "customer_validation": True,
        "revenue_model": "subscription",
        "patents": ["AI-ML-001", "DATA-PROC-002"],
        "team_data": {
            "founders": [{
                "name":
                "Jane Doe",
                "role":
                "CEO",
                "background":
                "Former VP at Tech Giant, led team of 50, 15 years experience"
            }, {
                "name":
                "John Smith",
                "role":
                "CTO",
                "background":
                "Technical lead at startup with successful exit, PhD in AI"
            }],
            "key_personnel": [{
                "name":
                "Alice Johnson",
                "role":
                "Head of Product",
                "background":
                "10 years product management experience"
            }]
        },
        "financial_data": {
            "revenue": 150000,  # $150k ARR
            "burn_rate": 45000,  # $45k/month
            "runway_months": 18,
            "funding_raised": 500000
        },
        "market_data": {
            "competitive_intensity": "medium",
            "target_market": "Enterprise SaaS"
        },
        "technology_stack": "AWS, Python, React, PostgreSQL"
    }

    # Create processor with test configuration
    config = ModuleConfiguration()  # Use default active configuration
    processor = AnalysisProcessor()

    print("📊 Running comprehensive analysis...")

    try:
        # Run the analysis
        result = processor.process_comprehensive_analysis(company_data, config)

        print(f"✅ Analysis completed successfully!")
        print(f"   Modules executed: {len(result.get('module_results', {}))}")
        print(
            f"   Overall confidence: {result.get('overall_confidence', 0):.1f}/10"
        )
        print(
            f"   Analysis timestamp: {result.get('analysis_metadata', {}).get('timestamp', 'N/A')}"
        )

        # Display key results
        if 'tca_scorecard' in result.get('module_results', {}):
            scorecard = result['module_results']['tca_scorecard']
            if 'composite_score' in scorecard:
                print(
                    f"   TCA Composite Score: {scorecard['composite_score']}/100"
                )

        if 'risk_assessment' in result.get('module_results', {}):
            risk = result['module_results']['risk_assessment']
            if 'overall_risk_score' in risk:
                print(
                    f"   Overall Risk Score: {risk['overall_risk_score']}/10")

        return result

    except Exception as e:
        print(f"❌ Analysis failed: {str(e)}")
        import traceback
        traceback.print_exc()
        return None


def test_module_weights():
    """Test module weighting system"""
    print("\n⚖️  Testing Module Weighting System...")

    config = ModuleConfiguration(
        weighted_scoring=True,
        module_weights={
            "tca_scorecard": 0.25,  # Increased weight for core assessment
            "risk_assessment": 0.20,  # High importance for risk
            "market_analysis": 0.15,
            "team_assessment": 0.15,
            "financial_health": 0.15,
            "technology_assessment": 0.05,
            "business_model": 0.05,
            "growth_potential": 0.05,  # Reduced weights for secondary modules
            "investment_readiness": 0.05
        })

    total_weight = sum(config.module_weights.values())
    print(f"✅ Custom weighting configured")
    print(f"   Total weight: {total_weight} (should be 1.0)")
    print(f"   Highest weighted: TCA Scorecard (25%)")
    print(f"   Risk Assessment weight: 20%")

    assert abs(total_weight - 1.0) < 0.001, "Weights must sum to 1.0"
    return config


def main():
    """Run all tests"""
    print("🏁 Starting 9-Module Analysis System Tests\n")

    # Test 1: Module Configuration
    config = test_module_configuration()

    # Test 2: Data Mapping
    mapped_data, processor = test_data_mapping()

    # Test 3: Analysis Processor
    result = test_analysis_processor()

    # Test 4: Module Weights
    weighted_config = test_module_weights()

    print("\n📋 Test Summary:")
    print(f"✅ Module Configuration: {'PASS' if config else 'FAIL'}")
    print(f"✅ Data Mapping: {'PASS' if mapped_data else 'FAIL'}")
    print(f"✅ Analysis Processing: {'PASS' if result else 'FAIL'}")
    print(f"✅ Module Weighting: {'PASS' if weighted_config else 'FAIL'}")

    if result:
        print(f"\n🎯 Final Analysis Result Structure:")
        print(f"   - Module Results: {len(result.get('module_results', {}))}")
        print(f"   - Metadata: {bool(result.get('analysis_metadata'))}")
        print(
            f"   - Overall Confidence: {result.get('overall_confidence', 0):.1f}"
        )

        # Show which modules were executed
        executed_modules = list(result.get('module_results', {}).keys())
        print(f"   - Executed Modules: {', '.join(executed_modules)}")


if __name__ == "__main__":
    main()
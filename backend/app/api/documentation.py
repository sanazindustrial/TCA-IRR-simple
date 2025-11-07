"""
API Documentation enhancements for TCA Investment Analysis Platform
"""

from typing import Dict, Any
from fastapi.openapi.utils import get_openapi


def custom_openapi_schema(app) -> Dict[str, Any]:
    """Generate custom OpenAPI schema with enhanced documentation"""

    if app.openapi_schema:
        return app.openapi_schema

    openapi_schema = get_openapi(
        title="TCA Investment Analysis Platform API",
        version="1.0.0",
        description="""
# TCA Investment Analysis Platform API

## Overview

The Technology Company Assessment (TCA) Investment Analysis Platform provides comprehensive 
tools for evaluating technology companies and their investment potential. This API enables 
automated analysis of companies across multiple dimensions including technology, market, 
team, and financial metrics.

## Key Features

- **Company Management**: Create and manage company profiles with detailed information
- **Automated Analysis**: AI-powered analysis across multiple evaluation frameworks
- **Risk Assessment**: Comprehensive risk evaluation with mitigation strategies
- **Benchmark Comparison**: Industry benchmarking and competitive analysis
- **Investment Tracking**: Monitor and track investment activities and performance
- **User Management**: Role-based access control for different user types

## Analysis Types

### TCA Scorecard
Comprehensive technology company assessment providing scores across:
- Technology readiness and innovation
- Market opportunity and positioning  
- Team strength and experience
- Financial health and projections
- Overall investment risk rating

### Benchmark Comparison
Industry comparison analysis including:
- Peer company performance metrics
- Market positioning assessment
- Competitive advantage identification
- Growth trajectory analysis

### Risk Assessment
Detailed risk evaluation covering:
- Technology and product risks
- Market and competitive risks
- Team and execution risks
- Financial and funding risks
- Regulatory and compliance risks

### Founder Analysis
Leadership and team assessment including:
- Founder background and experience
- Team composition and skills
- Leadership capability assessment
- Past performance and track record

## Authentication

The API uses JWT (JSON Web Token) authentication. All protected endpoints require a valid 
Bearer token in the Authorization header.

Example:
```
Authorization: Bearer <your-jwt-token>
```

## Rate Limiting

API requests are rate-limited based on user role:
- **Admin**: 1000 requests per minute
- **Analyst**: 500 requests per minute  
- **Reviewer**: 200 requests per minute
- **User**: 100 requests per minute

## Error Handling

The API returns standardized error responses with appropriate HTTP status codes:

- **400**: Bad Request - Invalid input data
- **401**: Unauthorized - Authentication required
- **403**: Forbidden - Insufficient permissions
- **404**: Not Found - Resource does not exist
- **429**: Too Many Requests - Rate limit exceeded
- **500**: Internal Server Error - System error

## Data Formats

All request and response bodies use JSON format. Timestamps are in ISO 8601 format.
        """,
        routes=app.routes,
        tags=[{
            "name": "Authentication",
            "description": "User authentication and authorization operations"
        }, {
            "name": "Users",
            "description": "User management operations (admin only)"
        }, {
            "name": "Companies",
            "description": "Company profile creation and management"
        }, {
            "name": "Analysis",
            "description": "Analysis management and processing operations"
        }, {
            "name":
            "TCA Analysis",
            "description":
            "Technology Company Assessment specific analysis operations"
        }, {
            "name": "Investments",
            "description": "Investment tracking and management"
        }, {
            "name": "Administration",
            "description": "System administration operations (admin only)"
        }])

    # Add security schemes
    openapi_schema["components"]["securitySchemes"] = {
        "BearerAuth": {
            "type":
            "http",
            "scheme":
            "bearer",
            "bearerFormat":
            "JWT",
            "description":
            "JWT token authentication. Include your token in the Authorization header."
        }
    }

    # Add global security
    openapi_schema["security"] = [{"BearerAuth": []}]

    # Add server information
    openapi_schema["servers"] = [{
        "url": "https://tca-irr-app.azurewebsites.net/api/v1",
        "description": "Production server"
    }, {
        "url": "http://localhost:8000/api/v1",
        "description": "Development server"
    }]

    # Add contact information
    openapi_schema["info"]["contact"] = {
        "name": "TCA Platform Support",
        "email": "support@tca-platform.com",
        "url": "https://tca-platform.com/support"
    }

    # Add license information
    openapi_schema["info"]["license"] = {
        "name": "Proprietary",
        "url": "https://tca-platform.com/license"
    }

    # Add examples for common responses
    openapi_schema["components"]["examples"] = {
        "SuccessResponse": {
            "summary": "Successful operation",
            "value": {
                "success": True,
                "message": "Operation completed successfully",
                "timestamp": "2024-01-01T00:00:00Z"
            }
        },
        "ErrorResponse": {
            "summary": "Error response",
            "value": {
                "success": False,
                "message": "An error occurred",
                "error_code": "VALIDATION_ERROR",
                "timestamp": "2024-01-01T00:00:00Z"
            }
        },
        "TCAScorecard": {
            "summary": "TCA Scorecard Example",
            "value": {
                "overall_score":
                85.5,
                "technology_score":
                88.0,
                "market_score":
                82.5,
                "team_score":
                89.0,
                "financial_score":
                78.5,
                "risk_score":
                65.0,
                "recommendation":
                "Strong investment opportunity with moderate risk",
                "confidence_level":
                87.5,
                "key_insights": [
                    "Strong technical team with proven track record",
                    "Large addressable market with clear growth trajectory",
                    "Innovative technology with competitive moat"
                ],
                "risk_factors": [
                    "Competitive market with established players",
                    "Regulatory uncertainty in target markets"
                ],
                "mitigation_strategies": [
                    "Develop strategic partnerships",
                    "Engage with regulatory bodies early"
                ]
            }
        }
    }

    app.openapi_schema = openapi_schema
    return app.openapi_schema


def add_endpoint_examples():
    """Return endpoint examples for documentation"""
    return {
        "/auth/login": {
            "request_example": {
                "username": "user123",
                "password": "password123"
            },
            "response_example": {
                "access_token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
                "token_type": "bearer",
                "expires_in": 1800
            }
        },
        "/companies": {
            "request_example": {
                "name": "TechCorp Inc.",
                "description": "AI-powered analytics platform",
                "website": "https://techcorp.com",
                "industry": "Software",
                "stage": "growth",
                "location": "San Francisco, CA",
                "founded_year": 2020,
                "employee_count": 25
            }
        },
        "/tca/scorecard/{company_id}": {
            "response_example": {
                "overall_score": 85.5,
                "technology_score": 88.0,
                "market_score": 82.5,
                "team_score": 89.0,
                "financial_score": 78.5,
                "risk_score": 65.0,
                "recommendation": "Strong investment opportunity",
                "confidence_level": 87.5
            }
        }
    }
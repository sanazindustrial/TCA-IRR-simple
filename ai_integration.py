"""
AI Integration Module for TCA IRR Backend
Interfaces with the existing Genkit AI flows
"""

import os
import asyncio
import logging
from typing import Dict, Any, Optional
import json
import httpx
from pathlib import Path

logger = logging.getLogger(__name__)


class AIFlowsClient:
    """Client to interface with Genkit AI flows"""

    def __init__(self, genkit_url: str = "http://localhost:3100"):
        self.genkit_url = genkit_url
        self.client = httpx.AsyncClient(
            timeout=300)  # 5 minute timeout for AI operations

    async def generate_tca_scorecard(
            self, company_data: Dict[str, Any]) -> Dict[str, Any]:
        """Generate TCA scorecard using AI flow"""
        try:
            response = await self.client.post(
                f"{self.genkit_url}/generateTCAScorecard", json=company_data)
            response.raise_for_status()
            return response.json()
        except Exception as e:
            logger.error(f"TCA Scorecard generation failed: {e}")
            return {"error": str(e), "status": "failed"}

    async def generate_founder_fit_analysis(
            self, founder_data: Dict[str, Any]) -> Dict[str, Any]:
        """Generate founder fit analysis"""
        try:
            response = await self.client.post(
                f"{self.genkit_url}/generateFounderFitAnalysis",
                json=founder_data)
            response.raise_for_status()
            return response.json()
        except Exception as e:
            logger.error(f"Founder fit analysis failed: {e}")
            return {"error": str(e), "status": "failed"}

    async def generate_risk_flags(
            self, company_data: Dict[str, Any]) -> Dict[str, Any]:
        """Generate risk flags and mitigation strategies"""
        try:
            response = await self.client.post(
                f"{self.genkit_url}/generateRiskFlagsAndMitigation",
                json=company_data)
            response.raise_for_status()
            return response.json()
        except Exception as e:
            logger.error(f"Risk flags generation failed: {e}")
            return {"error": str(e), "status": "failed"}

    async def generate_comprehensive_analysis(
            self, evaluation_data: Dict[str, Any]) -> Dict[str, Any]:
        """Generate comprehensive company analysis"""
        try:
            response = await self.client.post(
                f"{self.genkit_url}/generateComprehensiveAnalysis",
                json=evaluation_data)
            response.raise_for_status()
            return response.json()
        except Exception as e:
            logger.error(f"Comprehensive analysis failed: {e}")
            return {"error": str(e), "status": "failed"}

    async def generate_team_assessment(
            self, team_data: Dict[str, Any]) -> Dict[str, Any]:
        """Generate team assessment"""
        try:
            response = await self.client.post(
                f"{self.genkit_url}/generateTeamAssessment", json=team_data)
            response.raise_for_status()
            return response.json()
        except Exception as e:
            logger.error(f"Team assessment failed: {e}")
            return {"error": str(e), "status": "failed"}

    async def generate_benchmark_comparison(
            self, benchmark_data: Dict[str, Any]) -> Dict[str, Any]:
        """Generate benchmark comparison"""
        try:
            response = await self.client.post(
                f"{self.genkit_url}/generateBenchmarkComparison",
                json=benchmark_data)
            response.raise_for_status()
            return response.json()
        except Exception as e:
            logger.error(f"Benchmark comparison failed: {e}")
            return {"error": str(e), "status": "failed"}

    async def generate_gap_analysis(
            self, gap_data: Dict[str, Any]) -> Dict[str, Any]:
        """Generate gap analysis"""
        try:
            response = await self.client.post(
                f"{self.genkit_url}/generateGapAnalysis", json=gap_data)
            response.raise_for_status()
            return response.json()
        except Exception as e:
            logger.error(f"Gap analysis failed: {e}")
            return {"error": str(e), "status": "failed"}

    async def close(self):
        """Close the HTTP client"""
        await self.client.aclose()


class EvaluationProcessor:
    """Processes evaluations using AI flows"""

    def __init__(self):
        self.ai_client = AIFlowsClient()

    async def process_full_evaluation(
            self, evaluation_data: Dict[str, Any]) -> Dict[str, Any]:
        """Process a full evaluation using multiple AI flows"""
        results = {
            "status": "processing",
            "modules": {},
            "summary": {},
            "errors": []
        }

        try:
            company_info = evaluation_data.get("company_information", {})

            # Run core analyses in parallel
            tasks = []

            if evaluation_data.get("modules", {}).get("tca_scorecard", False):
                tasks.append(
                    ("tca_scorecard",
                     self.ai_client.generate_tca_scorecard(company_info)))

            if evaluation_data.get("modules", {}).get("founder_fit", False):
                founder_data = evaluation_data.get("founder_information", {})
                tasks.append(
                    ("founder_fit",
                     self.ai_client.generate_founder_fit_analysis(founder_data)
                     ))

            if evaluation_data.get("modules", {}).get("risk_analysis", False):
                tasks.append(
                    ("risk_analysis",
                     self.ai_client.generate_risk_flags(company_info)))

            if evaluation_data.get("modules", {}).get("team_assessment",
                                                      False):
                team_data = evaluation_data.get("team_information", {})
                tasks.append(
                    ("team_assessment",
                     self.ai_client.generate_team_assessment(team_data)))

            if evaluation_data.get("modules", {}).get("benchmark_comparison",
                                                      False):
                benchmark_data = evaluation_data.get("benchmark_data", {})
                tasks.append(("benchmark_comparison",
                              self.ai_client.generate_benchmark_comparison(
                                  benchmark_data)))

            # Execute all tasks
            if tasks:
                task_results = await asyncio.gather(
                    *[task[1] for task in tasks], return_exceptions=True)

                for i, (module_name, _) in enumerate(tasks):
                    result = task_results[i]
                    if isinstance(result, Exception):
                        results["errors"].append(
                            f"{module_name}: {str(result)}")
                        results["modules"][module_name] = {
                            "status": "failed",
                            "error": str(result)
                        }
                    else:
                        results["modules"][module_name] = result

            # Generate comprehensive analysis if requested
            if evaluation_data.get("modules", {}).get("comprehensive_analysis",
                                                      False):
                comprehensive_result = await self.ai_client.generate_comprehensive_analysis(
                    {
                        "company_info": company_info,
                        "module_results": results["modules"]
                    })
                results["comprehensive_analysis"] = comprehensive_result

            # Determine overall status
            if results["errors"]:
                results["status"] = "completed_with_errors"
            else:
                results["status"] = "completed"

            # Generate summary
            results["summary"] = self._generate_summary(results)

        except Exception as e:
            logger.error(f"Evaluation processing failed: {e}")
            results["status"] = "failed"
            results["error"] = str(e)

        return results

    def _generate_summary(self, results: Dict[str, Any]) -> Dict[str, Any]:
        """Generate a summary of the evaluation results"""
        summary = {
            "total_modules":
            len(results["modules"]),
            "completed_modules":
            sum(1 for module in results["modules"].values()
                if module.get("status") != "failed"),
            "failed_modules":
            sum(1 for module in results["modules"].values()
                if module.get("status") == "failed"),
            "processing_time":
            "N/A",  # Could be calculated with start/end times
            "overall_score":
            None,  # Extract from TCA scorecard if available
            "key_insights": []
        }

        # Extract overall score from TCA scorecard
        tca_result = results["modules"].get("tca_scorecard")
        if tca_result and "overall_score" in tca_result:
            summary["overall_score"] = tca_result["overall_score"]

        # Extract key insights from various modules
        for module_name, module_result in results["modules"].items():
            if isinstance(module_result,
                          dict) and "key_insights" in module_result:
                summary["key_insights"].extend(module_result["key_insights"])

        return summary

    async def close(self):
        """Close the AI client"""
        await self.ai_client.close()


# Global processor instance
evaluation_processor = EvaluationProcessor()


async def process_evaluation_task(evaluation_id: str,
                                  evaluation_data: Dict[str, Any], db_manager):
    """Background task to process an evaluation"""
    logger.info(f"Starting evaluation processing for {evaluation_id}")

    try:
        # Update status to processing
        async with db_manager.get_connection() as conn:
            await conn.execute(
                """
                UPDATE evaluations 
                SET status = 'processing', updated_at = NOW()
                WHERE evaluation_id = $1
            """, evaluation_id)

        # Process the evaluation
        results = await evaluation_processor.process_full_evaluation(
            evaluation_data)

        # Update with results
        async with db_manager.get_connection() as conn:
            await conn.execute(
                """
                UPDATE evaluations 
                SET status = $1, results = $2, updated_at = NOW(), 
                    completed_at = CASE WHEN $1 IN ('completed', 'completed_with_errors', 'failed') 
                                       THEN NOW() ELSE completed_at END
                WHERE evaluation_id = $3
            """, results["status"], json.dumps(results), evaluation_id)

        logger.info(
            f"Evaluation {evaluation_id} completed with status: {results['status']}"
        )

    except Exception as e:
        logger.error(f"Evaluation {evaluation_id} processing failed: {e}")

        # Update status to failed
        async with db_manager.get_connection() as conn:
            await conn.execute(
                """
                UPDATE evaluations 
                SET status = 'failed', results = $1, updated_at = NOW(), completed_at = NOW()
                WHERE evaluation_id = $2
            """, json.dumps({
                    "error": str(e),
                    "status": "failed"
                }), evaluation_id)

"""
GitHub repository analysis endpoints.
"""
import asyncio
import logging
import os
from fastapi import APIRouter, Form, HTTPException
from fastapi.concurrency import run_in_threadpool
from typing import Optional

from app.services.github.github_client import GitHubClient
from app.services.github.repo_analyzer import RepositoryAnalyzer

logger = logging.getLogger(__name__)

router = APIRouter()


@router.post("/github/analyze")
async def analyze_github_repos(
    github_username: str = Form(..., description="GitHub username or profile URL"),
    job_role: str = Form(..., description="Target job role"),
    job_description: str = Form("", description="Optional job description for better matching"),
    pinned_repos: Optional[str] = Form(None, description="Comma-separated list of priority repo names"),
    use_ai: bool = Form(False, description="Use AI for enhanced analysis (slower, deeper)"),
    github_token: Optional[str] = Form(None, description="Optional GitHub token for higher rate limits")
):
    """
    Analyze GitHub repositories and rank by relevance to job role.
    
    Args:
        github_username: GitHub username or profile URL
        job_role: Target job role (e.g., 'software-engineer', 'data-scientist')
        job_description: Optional job description text
        pinned_repos: Comma-separated repo names to prioritize (e.g., "repo1,repo2,repo3")
        use_ai: Whether to use AI for enhanced analysis (up to 20 repos)
        github_token: Optional GitHub personal access token
        
    Returns:
        JSON with analyzed repositories, top recommendations, and insights
    """
    try:
        timeout_seconds = float(os.getenv("GITHUB_ANALYZE_TIMEOUT_SECONDS", "35"))
        # Initialize clients
        github_client = GitHubClient(access_token=github_token)
        analyzer = RepositoryAnalyzer()
        
        # Extract username from URL if needed
        username = github_client.extract_username_from_url(github_username)
        
        # Parse pinned repos
        pinned_list = []
        if pinned_repos:
            pinned_list = [r.strip() for r in pinned_repos.split(',') if r.strip()]
        
        logger.info(f"Analyzing repositories for user: {username}, role: {job_role}, AI: {use_ai}, pinned: {len(pinned_list)}")
        
        # Fetch repositories
        try:
            repositories = await asyncio.wait_for(
                run_in_threadpool(github_client.get_user_repositories, username),
                timeout=timeout_seconds,
            )
        except asyncio.TimeoutError:
            raise HTTPException(
                status_code=504,
                detail="GitHub fetch timed out. Try again, add a GitHub token, or analyze fewer repos.",
            )
        
        if not repositories:
            return {
                "username": username,
                "total_repos": 0,
                "analyzed_repos": 0,
                "top_repositories": [],
                "all_repositories": [],
                "insights": {},
                "rate_limit": github_client.get_rate_limit(),
                "ai_used": False
            }
        
        # Analyze and score repositories
        try:
            analyzed_repos = await asyncio.wait_for(
                run_in_threadpool(
                    lambda: analyzer.analyze_repositories(
                        repositories,
                        job_role,
                        job_description,
                        use_ai=use_ai,
                        pinned_repos=pinned_list,
                    )
                ),
                timeout=timeout_seconds,
            )
        except asyncio.TimeoutError:
            raise HTTPException(
                status_code=504,
                detail="GitHub analysis timed out. Disable AI mode or provide pinned repos for a faster pass.",
            )
        
        # Get insights
        insights = await run_in_threadpool(analyzer.get_insights, repositories)
        
        # Get top 5 repositories
        top_repos = analyzed_repos[:5]
        
        # Get rate limit info
        rate_limit = await run_in_threadpool(github_client.get_rate_limit)
        
        # Check if any repos were AI-enhanced
        ai_used = any(repo.get("ai_enhanced", False) for repo in analyzed_repos)
        
        return {
            "username": username,
            "total_repos": len(repositories),
            "analyzed_repos": len(analyzed_repos),
            "job_role": job_role,
            "top_repositories": top_repos,
            "all_repositories": analyzed_repos,
            "insights": insights,
            "rate_limit": rate_limit,
            "ai_used": ai_used,
            "analysis_mode": "ai" if ai_used else "heuristic"
        }
        
    except ValueError as e:
        logger.error(f"Validation error: {e}")
        raise HTTPException(status_code=400, detail=str(e))
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to analyze GitHub repos: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to analyze repositories: {str(e)}")


@router.get("/github/rate-limit")
async def get_rate_limit(github_token: Optional[str] = None):
    """
    Get current GitHub API rate limit status.
    
    Args:
        github_token: Optional GitHub personal access token
        
    Returns:
        Rate limit information
    """
    try:
        github_client = GitHubClient(access_token=github_token)
        rate_limit = github_client.get_rate_limit()
        
        return {
            "rate_limit": rate_limit,
            "authenticated": github_token is not None
        }
    except Exception as e:
        logger.error(f"Failed to get rate limit: {e}")
        raise HTTPException(status_code=500, detail=str(e))

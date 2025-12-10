"""
GitHub API client for fetching and analyzing repositories.
"""
import os
import logging
from typing import List, Dict, Any, Optional
from github import Github, GithubException
from datetime import datetime
from pathlib import Path
from dotenv import load_dotenv

# Load environment variables from .env file
env_path = Path(__file__).resolve().parent.parent.parent.parent / '.env'
load_dotenv(dotenv_path=env_path)

logger = logging.getLogger(__name__)


class GitHubClient:
    def __init__(self, access_token: Optional[str] = None):
        """
        Initialize GitHub client.
        
        Args:
            access_token: Optional GitHub personal access token for higher rate limits
        """
        # Use provided token or environment variable
        token = access_token or os.getenv("GITHUB_TOKEN")
        
        if token:
            self.client = Github(token)
            logger.info("GitHub client initialized with authentication")
        else:
            self.client = Github()
            logger.warning("GitHub client initialized without authentication (60 req/hour limit)")
    
    def get_user_repositories(self, username: str) -> List[Dict[str, Any]]:
        """
        Fetch all public repositories for a given username.
        
        Args:
            username: GitHub username
            
        Returns:
            List of repository dictionaries with metadata
        """
        try:
            user = self.client.get_user(username)
            repos = []
            
            for repo in user.get_repos():
                # For freshers, include ALL repos (even forks show learning)
                # Skip only if it's a fork with absolutely no activity
                if repo.fork and repo.stargazers_count == 0 and repo.forks_count == 0:
                    # Check if they made any commits
                    try:
                        commits = list(repo.get_commits()[:1])
                        if not commits:
                            continue  # Empty fork, skip
                    except:
                        continue  # Can't access commits, skip
                
                # Check for README first
                has_readme = self._has_readme(repo)
                readme_content = self.get_readme_content(repo) if has_readme else ""
                
                repo_data = {
                    "name": repo.name,
                    "full_name": repo.full_name,
                    "description": repo.description or "",
                    "url": repo.html_url,
                    "homepage": repo.homepage,
                    "language": repo.language,
                    "languages": self._get_languages(repo),
                    "topics": repo.get_topics(),
                    "stars": repo.stargazers_count,
                    "forks": repo.forks_count,
                    "watchers": repo.watchers_count,
                    "created_at": repo.created_at.isoformat() if repo.created_at else None,
                    "updated_at": repo.updated_at.isoformat() if repo.updated_at else None,
                    "pushed_at": repo.pushed_at.isoformat() if repo.pushed_at else None,
                    "size": repo.size,
                    "is_fork": repo.fork,
                    "has_readme": has_readme,
                    "readme_content": readme_content,
                    "open_issues": repo.open_issues_count,
                    "license": repo.license.name if repo.license else None,
                }
                
                repos.append(repo_data)
            
            logger.info(f"Fetched {len(repos)} repositories for user {username}")
            return repos
            
        except GithubException as e:
            logger.error(f"GitHub API error for user {username}: {e}")
            raise ValueError(f"Failed to fetch repositories: {e.data.get('message', str(e))}")
        except Exception as e:
            logger.error(f"Unexpected error fetching repos for {username}: {e}")
            raise
    
    def _get_languages(self, repo) -> Dict[str, int]:
        """Get language breakdown for a repository."""
        try:
            languages = repo.get_languages()
            return dict(languages)
        except Exception as e:
            logger.warning(f"Failed to get languages for {repo.name}: {e}")
            return {}
    
    def _has_readme(self, repo) -> bool:
        """Check if repository has a README file."""
        try:
            repo.get_readme()
            return True
        except:
            return False
    
    def get_readme_content(self, repo) -> str:
        """Extract README content for analysis."""
        try:
            readme = repo.get_readme()
            # Decode content (it's base64 encoded)
            content = readme.decoded_content.decode('utf-8')
            # Limit to first 2000 chars to avoid token limits
            return content[:2000]
        except Exception as e:
            logger.warning(f"Failed to get README for {repo.name}: {e}")
            return ""
    
    def get_rate_limit(self) -> Dict[str, Any]:
        """
        Get current rate limit status.
        
        Returns:
            Dictionary with rate limit information
        """
        try:
            rate_limit = self.client.get_rate_limit()
            
            # PyGithub returns a RateLimit object with core, search, graphql attributes
            # Each is a Rate object with limit, remaining, reset
            return {
                "limit": rate_limit.core.limit,
                "remaining": rate_limit.core.remaining,
                "reset_at": rate_limit.core.reset.isoformat() if rate_limit.core.reset else None,
                "used": rate_limit.core.limit - rate_limit.core.remaining
            }
        except Exception as e:
            logger.error(f"Failed to get rate limit: {e}")
            # Return safe defaults
            return {
                "limit": 60,
                "remaining": 0,
                "reset_at": None,
                "used": 60
            }
    
    def extract_username_from_url(self, github_input: str) -> str:
        """
        Extract username from GitHub URL or return username as-is.
        
        Args:
            github_input: GitHub URL or username
            
        Returns:
            GitHub username
        """
        # If it's a URL, extract username
        if "github.com" in github_input:
            # Handle various URL formats:
            # https://github.com/username
            # https://github.com/username/repo
            # github.com/username
            parts = github_input.rstrip('/').split('/')
            
            # Find 'github.com' and get the next part
            try:
                github_index = next(i for i, part in enumerate(parts) if 'github.com' in part)
                username = parts[github_index + 1]
                return username
            except (IndexError, StopIteration):
                raise ValueError("Invalid GitHub URL format")
        
        # Otherwise, assume it's already a username
        return github_input.strip()

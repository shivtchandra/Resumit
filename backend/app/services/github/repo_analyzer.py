"""
Repository analyzer for scoring relevance to job roles.
"""
import logging
from typing import List, Dict, Any
import re

logger = logging.getLogger(__name__)


# Job role to keywords/technologies mapping
JOB_ROLE_KEYWORDS = {
    "software-engineer": {
        "languages": ["Python", "Java", "JavaScript", "TypeScript", "Go", "C++", "C#", "Ruby"],
        "topics": ["api", "backend", "frontend", "web", "mobile", "microservices", "rest", "graphql"],
        "keywords": ["application", "service", "platform", "system", "framework", "library"]
    },
    "data-scientist": {
        "languages": ["Python", "R", "Julia", "SQL"],
        "topics": ["machine-learning", "ml", "ai", "data-science", "deep-learning", "nlp", 
                  "computer-vision", "tensorflow", "pytorch", "scikit-learn", "pandas", "numpy"],
        "keywords": ["model", "prediction", "analysis", "dataset", "neural", "algorithm", "classification"]
    },
    "data-analyst": {
        "languages": ["Python", "R", "SQL"],
        "topics": ["data-analysis", "visualization", "dashboard", "analytics", "bi", "tableau", 
                  "powerbi", "excel", "statistics"],
        "keywords": ["analysis", "report", "insight", "metric", "kpi", "dashboard", "visualization"]
    },
    "frontend-developer": {
        "languages": ["JavaScript", "TypeScript", "HTML", "CSS"],
        "topics": ["react", "vue", "angular", "svelte", "nextjs", "ui", "ux", "responsive", 
                  "css", "sass", "tailwind", "webpack", "vite"],
        "keywords": ["component", "interface", "design", "responsive", "animation", "user"]
    },
    "backend-developer": {
        "languages": ["Python", "Java", "Go", "Node.js", "C#", "Ruby", "PHP"],
        "topics": ["api", "rest", "graphql", "database", "sql", "nosql", "microservices", 
                  "server", "fastapi", "express", "django", "flask", "spring"],
        "keywords": ["api", "endpoint", "database", "server", "authentication", "authorization"]
    },
    "devops-engineer": {
        "languages": ["Python", "Go", "Bash", "Shell"],
        "topics": ["docker", "kubernetes", "k8s", "ci-cd", "terraform", "ansible", "aws", 
                  "azure", "gcp", "jenkins", "github-actions", "gitlab-ci"],
        "keywords": ["deployment", "infrastructure", "automation", "pipeline", "container", "orchestration"]
    },
    "mobile-developer": {
        "languages": ["Swift", "Kotlin", "Java", "Dart", "JavaScript"],
        "topics": ["ios", "android", "mobile", "react-native", "flutter", "swiftui", "jetpack"],
        "keywords": ["app", "mobile", "ios", "android", "native", "cross-platform"]
    },
    "machine-learning-engineer": {
        "languages": ["Python", "C++", "Java"],
        "topics": ["machine-learning", "ml", "deep-learning", "tensorflow", "pytorch", "keras",
                  "mlops", "model-deployment", "neural-network"],
        "keywords": ["model", "training", "inference", "deployment", "pipeline", "optimization"]
    },
    "full-stack-developer": {
        "languages": ["JavaScript", "TypeScript", "Python", "Java"],
        "topics": ["react", "vue", "angular", "nodejs", "express", "fastapi", "django", 
                  "database", "api", "full-stack"],
        "keywords": ["full-stack", "end-to-end", "frontend", "backend", "database"]
    }
}


class RepositoryAnalyzer:
    def __init__(self):
        """Initialize repository analyzer."""
        self.job_role_keywords = JOB_ROLE_KEYWORDS
    
    def analyze_repositories(
        self,
        repositories: List[Dict[str, Any]],
        job_role: str,
        job_description: str = "",
        use_ai: bool = False,
        pinned_repos: List[str] = None
    ) -> List[Dict[str, Any]]:
        """
        Analyze and score repositories by relevance to job role.
        
        Args:
            repositories: List of repository dictionaries
            job_role: Target job role
            job_description: Optional job description for additional context
            use_ai: Whether to use AI for enhanced analysis (up to 20 repos)
            pinned_repos: List of repo names to prioritize (always analyzed)
            
        Returns:
            List of repositories with relevance scores, sorted by score
        """
        analyzed_repos = []
        
        for repo in repositories:
            score, details = self._calculate_relevance_score(repo, job_role, job_description)
            
            analyzed_repo = {
                **repo,
                "relevance_score": score,
                "relevance_details": details,
                "why_relevant": self._generate_relevance_explanation(repo, details, job_role),
                "suggested_resume_text": self._generate_resume_text(repo, job_role),
                "ai_enhanced": False
            }
            
            analyzed_repos.append(analyzed_repo)
        
        # Sort by relevance score (descending)
        analyzed_repos.sort(key=lambda x: x["relevance_score"], reverse=True)
        
        # Apply AI enhancement to top repositories if requested
        if use_ai:
            analyzed_repos = self._enhance_with_ai(
                analyzed_repos,
                job_role,
                job_description,
                pinned_repos=pinned_repos or []
            )
        
        return analyzed_repos
    
    def _enhance_with_ai(
        self,
        repositories: List[Dict[str, Any]],
        job_role: str,
        job_description: str,
        pinned_repos: List[str] = None,
        max_repos: int = 20
    ) -> List[Dict[str, Any]]:
        """
        Enhance repositories with AI using smart multi-tier filtering.
        
        Industry best practices:
        - User pinning (3-5 priority repos)
        - High-value detection (stars, forks, recent activity, complexity)
        - Increased coverage (20 repos instead of 10)
        
        Args:
            repositories: Sorted list of repositories
            job_role: Target job role
            job_description: Job description
            pinned_repos: List of repo names user wants to prioritize
            max_repos: Maximum number of repos to enhance (default: 20)
            
        Returns:
            Enhanced repositories list
        """
        try:
            from .ai_analyzer import GitHubAIAnalyzer
            from datetime import datetime, timedelta
            
            ai_analyzer = GitHubAIAnalyzer()
            pinned_repos = pinned_repos or []
            
            # TIER 1: User-pinned repos (ALWAYS analyze)
            must_analyze = [r for r in repositories if r['name'] in pinned_repos]
            
            # TIER 2: High-value repos (hidden gems)
            high_value = []
            for repo in repositories:
                # Skip if already in must_analyze
                if repo['name'] in pinned_repos:
                    continue
                    
                # High-value indicators
                has_stars = repo.get('stars', 0) > 10
                has_forks = repo.get('forks', 0) > 5
                is_complex = len(repo.get('languages', {})) >= 3
                
                # Check if recently updated (< 6 months)
                is_recent = False
                if repo.get('pushed_at'):
                    try:
                        pushed_at = datetime.fromisoformat(repo['pushed_at'].replace('Z', '+00:00'))
                        is_recent = datetime.now(pushed_at.tzinfo) - pushed_at < timedelta(days=180)
                    except:
                        pass
                
                # Add if meets any high-value criteria
                if has_stars or has_forks or is_complex or is_recent:
                    high_value.append(repo)
            
            # TIER 3: Top 15 by algorithmic score
            top_scored = [r for r in repositories[:15] if r['name'] not in pinned_repos]
            
            # Combine all tiers and deduplicate
            to_analyze = []
            seen_names = set()
            
            for repo in must_analyze + high_value + top_scored:
                if repo['name'] not in seen_names:
                    to_analyze.append(repo)
                    seen_names.add(repo['name'])
                    
                # Stop at max_repos
                if len(to_analyze) >= max_repos:
                    break
            
            logger.info(f"Smart filtering: {len(must_analyze)} pinned, {len(high_value)} high-value, analyzing {len(to_analyze)} total")
            
            # Enhance selected repos with AI
            for repo in to_analyze:
                try:
                    ai_analysis = ai_analyzer.analyze_repository(
                        repo,
                        job_role,
                        job_description
                    )
                    
                    if ai_analysis:
                        repo["ai_enhanced"] = True
                        repo["ai_analysis"] = ai_analysis
                        
                        # Use AI-generated resume bullets if available
                        resume_bullets = ai_analysis.get("suggested_resume_bullets", [])
                        if resume_bullets:
                            repo["suggested_resume_text"] = "\n".join(resume_bullets)
                        
                        # Add detailed reasoning fields for transparency
                        repo["why_relevant"] = ai_analysis.get("would_you_interview", "")
                        repo["first_impression"] = ai_analysis.get("first_impression", "")
                        repo["can_they_code"] = ai_analysis.get("can_they_code", "")
                        repo["problem_solving"] = ai_analysis.get("problem_solving_ability", "")
                        repo["tech_stack_fit"] = ai_analysis.get("tech_stack_fit", "")
                        repo["passion_and_effort"] = ai_analysis.get("passion_and_effort", "")
                        repo["interview_worthy"] = ai_analysis.get("interview_worthy", False)
                        
                        # Add strengths and red flags
                        repo["strengths"] = ai_analysis.get("strengths", [])
                        repo["red_flags"] = ai_analysis.get("red_flags", [])
                        repo["interview_questions"] = ai_analysis.get("interview_questions", [])
                        repo["improvement_advice"] = ai_analysis.get("improvement_advice", [])
                        
                        # Override relevance score if AI provides one
                        if "relevance_score" in ai_analysis:
                            repo["relevance_score"] = ai_analysis["relevance_score"]
                        
                        # Add match level based on score
                        score = repo["relevance_score"]
                        if score >= 75:
                            repo["match_level"] = "high"
                        elif score >= 50:
                            repo["match_level"] = "medium"
                        else:
                            repo["match_level"] = "low"
                except Exception as e:
                    logger.warning(f"AI enhancement failed for {repo['name']}: {e}")
                    continue
            
            return repositories
            
        except Exception as e:
            logger.error(f"Failed to initialize AI analyzer: {e}")
            return repositories
    
    def _calculate_relevance_score(
        self,
        repo: Dict[str, Any],
        job_role: str,
        job_description: str
    ) -> tuple[float, Dict[str, Any]]:
        """
        Calculate relevance score for a repository.
        
        Returns:
            Tuple of (score, details_dict)
        """
        score = 0.0
        details = {
            "language_match": 0,
            "topic_match": 0,
            "description_match": 0,
            "quality_score": 0
        }
        
        # Get job role keywords
        role_keywords = self.job_role_keywords.get(job_role, {
            "languages": [],
            "topics": [],
            "keywords": []
        })
        
        # 1. Language Match (40 points max)
        language_score = self._score_languages(repo, role_keywords["languages"])
        details["language_match"] = language_score
        score += language_score
        
        # 2. Topic Match (30 points max)
        topic_score = self._score_topics(repo, role_keywords["topics"])
        details["topic_match"] = topic_score
        score += topic_score
        
        # 3. Description/Keywords Match (20 points max)
        description_score = self._score_description(
            repo,
            role_keywords["keywords"],
            job_description
        )
        details["description_match"] = description_score
        score += description_score
        
        # 4. Quality/Activity Score (10 points max)
        quality_score = self._score_quality(repo)
        details["quality_score"] = quality_score
        score += quality_score
        
        return min(score, 100), details
    
    def _score_languages(self, repo: Dict[str, Any], target_languages: List[str]) -> float:
        """Score based on programming language match."""
        score = 0.0
        
        # Primary language match
        if repo.get("language") in target_languages:
            score += 20
        
        # Languages breakdown match
        repo_languages = repo.get("languages", {})
        if repo_languages:
            total_bytes = sum(repo_languages.values())
            for lang, bytes_count in repo_languages.items():
                if lang in target_languages:
                    # Weight by percentage of codebase
                    percentage = bytes_count / total_bytes if total_bytes > 0 else 0
                    score += 20 * percentage
        
        return min(score, 40)
    
    def _score_topics(self, repo: Dict[str, Any], target_topics: List[str]) -> float:
        """Score based on repository topics/tags."""
        score = 0.0
        repo_topics = [t.lower() for t in repo.get("topics", [])]
        
        if not repo_topics:
            return 0
        
        # Count matching topics
        matches = sum(1 for topic in repo_topics if any(
            target.lower() in topic or topic in target.lower()
            for target in target_topics
        ))
        
        # Score based on match ratio
        if matches > 0:
            score = min(30, matches * 10)
        
        return score
    
    def _score_description(
        self,
        repo: Dict[str, Any],
        target_keywords: List[str],
        job_description: str
    ) -> float:
        """Score based on description and keywords."""
        score = 0.0
        description = (repo.get("description") or "").lower()
        
        if not description:
            return 0
        
        # Check for target keywords
        matches = sum(1 for keyword in target_keywords if keyword.lower() in description)
        score += min(15, matches * 3)
        
        # Check for job description keywords if provided
        if job_description:
            jd_words = set(re.findall(r'\b\w+\b', job_description.lower()))
            # Filter out common words
            common_words = {'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for'}
            jd_words = jd_words - common_words
            
            desc_words = set(re.findall(r'\b\w+\b', description))
            overlap = len(jd_words & desc_words)
            
            if overlap > 0:
                score += min(5, overlap * 0.5)
        
        return min(score, 20)
    
    def _score_quality(self, repo: Dict[str, Any]) -> float:
        """Score based on repository quality indicators."""
        score = 0.0
        
        # Stars (max 4 points)
        stars = repo.get("stars", 0)
        if stars > 100:
            score += 4
        elif stars > 50:
            score += 3
        elif stars > 10:
            score += 2
        elif stars > 0:
            score += 1
        
        # Has README (2 points)
        if repo.get("has_readme"):
            score += 2
        
        # Recent activity (2 points)
        if repo.get("pushed_at"):
            from datetime import datetime, timedelta
            try:
                pushed_at = datetime.fromisoformat(repo["pushed_at"].replace('Z', '+00:00'))
                if datetime.now(pushed_at.tzinfo) - pushed_at < timedelta(days=180):
                    score += 2
            except:
                pass
        
        # Has license (1 point)
        if repo.get("license"):
            score += 1
        
        # Not a fork or has significant stars (1 point)
        if not repo.get("is_fork") or stars > 10:
            score += 1
        
        return min(score, 10)
    
    def _generate_relevance_explanation(
        self,
        repo: Dict[str, Any],
        details: Dict[str, Any],
        job_role: str
    ) -> str:
        """Generate human-readable explanation of why repo is relevant."""
        reasons = []
        
        # Language match
        if details["language_match"] > 20:
            lang = repo.get("language", "")
            reasons.append(f"Uses {lang}")
        
        # Topic match
        if details["topic_match"] > 10:
            topics = repo.get("topics", [])[:3]
            if topics:
                reasons.append(f"Topics: {', '.join(topics)}")
        
        # Quality
        if details["quality_score"] > 5:
            stars = repo.get("stars", 0)
            if stars > 10:
                reasons.append(f"{stars} stars")
        
        if reasons:
            return f"Strong match: {' • '.join(reasons)}"
        else:
            return "Moderate relevance to role"
    
    def _generate_resume_text(self, repo: Dict[str, Any], job_role: str) -> str:
        """Generate suggested resume-ready text for the project."""
        name = repo.get("name", "").replace('-', ' ').replace('_', ' ').title()
        description = repo.get("description", "")
        language = repo.get("language", "")
        stars = repo.get("stars", 0)
        
        # Build resume text
        text = f"{name}"
        
        if description:
            text += f": {description}"
        
        if language:
            text += f" Built with {language}."
        
        if stars > 10:
            text += f" ({stars}+ GitHub stars)"
        
        return text
    
    def get_insights(self, repositories: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Generate insights about the user's repositories.
        
        Args:
            repositories: List of repository dictionaries
            
        Returns:
            Dictionary with insights
        """
        if not repositories:
            return {
                "primary_languages": [],
                "expertise_areas": [],
                "total_stars": 0,
                "most_starred_repo": None
            }
        
        # Count languages
        language_counts = {}
        for repo in repositories:
            lang = repo.get("language")
            if lang:
                language_counts[lang] = language_counts.get(lang, 0) + 1
        
        primary_languages = sorted(
            language_counts.items(),
            key=lambda x: x[1],
            reverse=True
        )[:5]
        
        # Count topics for expertise areas
        topic_counts = {}
        for repo in repositories:
            for topic in repo.get("topics", []):
                topic_counts[topic] = topic_counts.get(topic, 0) + 1
        
        expertise_areas = sorted(
            topic_counts.items(),
            key=lambda x: x[1],
            reverse=True
        )[:5]
        
        # Total stars
        total_stars = sum(repo.get("stars", 0) for repo in repositories)
        
        # Most starred repo
        most_starred = max(repositories, key=lambda x: x.get("stars", 0))
        
        return {
            "primary_languages": [lang for lang, _ in primary_languages],
            "expertise_areas": [topic for topic, _ in expertise_areas],
            "total_stars": total_stars,
            "most_starred_repo": most_starred.get("name"),
            "total_repos": len(repositories),
            "repos_with_readme": sum(1 for r in repositories if r.get("has_readme")),
            "average_stars": total_stars / len(repositories) if repositories else 0
        }

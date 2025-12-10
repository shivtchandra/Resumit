"""
Comprehensive Resume Analyzer
Provides Jobscan-style analysis: missing keywords, skills, certifications, and actionable insights.
"""

import json
import os
import re
from typing import Dict, Any, List, Set
from pathlib import Path
import logging

logger = logging.getLogger(__name__)


class ComprehensiveAnalyzer:
    def __init__(self):
        """Initialize with certification database."""
        cert_path = Path(__file__).parent.parent.parent / "data" / "certifications.json"
        try:
            with open(cert_path, 'r') as f:
                self.cert_data = json.load(f)
        except Exception as e:
            logger.warning(f"Could not load certifications database: {e}")
            self.cert_data = {"certifications_by_role": {}, "general_certifications": []}
    
    def extract_keywords(self, text: str) -> Set[str]:
        """Extract meaningful keywords from text."""
        # Remove common words
        stop_words = {'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 
                     'of', 'with', 'by', 'from', 'as', 'is', 'was', 'are', 'were', 'been',
                     'be', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would',
                     'should', 'could', 'may', 'might', 'must', 'can', 'this', 'that',
                     'these', 'those', 'i', 'you', 'he', 'she', 'it', 'we', 'they'}
        
        # Extract words (2+ chars, alphanumeric + some special chars)
        words = re.findall(r'\b[a-zA-Z][a-zA-Z0-9+#\-.]{1,}\b', text.lower())
        
        # Filter out stop words and very short words
        keywords = {w for w in words if w not in stop_words and len(w) >= 2}
        
        # Also extract multi-word technical terms (e.g., "machine learning", "CI/CD")
        phrases = re.findall(r'\b(?:[A-Z][a-z]+(?:\s+[A-Z][a-z]+)+|[A-Z]{2,}(?:/[A-Z]{2,})?)\b', text)
        keywords.update(p.lower() for p in phrases)
        
        return keywords
    
    def detect_missing_keywords(self, resume_text: str, jd_text: str) -> List[str]:
        """Find important keywords in JD that are missing from resume."""
        resume_keywords = self.extract_keywords(resume_text)
        jd_keywords = self.extract_keywords(jd_text)
        
        # Find keywords in JD but not in resume
        missing = jd_keywords - resume_keywords
        
        # Filter to keep only likely important terms (length > 3 or known tech terms)
        tech_terms = {'aws', 'gcp', 'api', 'sql', 'css', 'html', 'ios', 'ux', 'ui', 'ml', 'ai', 'ci', 'cd'}
        important_missing = [
            kw for kw in missing 
            if len(kw) > 3 or kw in tech_terms
        ]
        
        return sorted(important_missing)[:15]  # Top 15
    
    def detect_missing_skills(self, resume_text: str, jd_text: str) -> Dict[str, List[str]]:
        """Detect technical and soft skills mentioned in JD but missing from resume."""
        # Common technical skills
        tech_skills = {
            'python', 'java', 'javascript', 'typescript', 'react', 'angular', 'vue',
            'node.js', 'express', 'django', 'flask', 'spring', 'docker', 'kubernetes',
            'aws', 'azure', 'gcp', 'terraform', 'ansible', 'jenkins', 'git', 'github',
            'sql', 'postgresql', 'mysql', 'mongodb', 'redis', 'elasticsearch',
            'graphql', 'rest', 'api', 'microservices', 'ci/cd', 'devops',
            'machine learning', 'deep learning', 'tensorflow', 'pytorch', 'scikit-learn',
            'pandas', 'numpy', 'spark', 'hadoop', 'kafka'
        }
        
        # Common soft skills
        soft_skills = {
            'leadership', 'communication', 'teamwork', 'problem solving',
            'analytical', 'critical thinking', 'collaboration', 'mentoring',
            'stakeholder management', 'agile', 'scrum', 'project management'
        }
        
        resume_lower = resume_text.lower()
        jd_lower = jd_text.lower()
        
        missing_tech = [skill for skill in tech_skills if skill in jd_lower and skill not in resume_lower]
        missing_soft = [skill for skill in soft_skills if skill in jd_lower and skill not in resume_lower]
        
        return {
            "technical": sorted(missing_tech)[:10],
            "soft": sorted(missing_soft)[:5]
        }
    
    def detect_role_from_jd(self, jd_text: str) -> str:
        """Detect the role type from job description."""
        jd_lower = jd_text.lower()
        
        role_patterns = {
            "data_scientist": ["data scientist", "machine learning", "ml engineer", "ai engineer"],
            "devops_engineer": ["devops", "site reliability", "sre", "infrastructure engineer"],
            "full_stack_developer": ["full stack", "fullstack", "full-stack"],
            "cloud_engineer": ["cloud engineer", "cloud architect", "cloud infrastructure"],
            "software_engineer": ["software engineer", "backend engineer", "frontend engineer"]
        }
        
        for role, patterns in role_patterns.items():
            if any(pattern in jd_lower for pattern in patterns):
                return role
        
        return "software_engineer"  # Default
    
    def recommend_certifications(self, jd_text: str, resume_text: str) -> List[Dict[str, Any]]:
        """Recommend relevant certifications based on JD and resume."""
        role = self.detect_role_from_jd(jd_text)
        jd_lower = jd_text.lower()
        resume_lower = resume_text.lower()
        
        recommendations = []
        
        # Get role-specific certifications
        role_certs = self.cert_data.get("certifications_by_role", {}).get(role, [])
        
        for cert in role_certs:
            # Check if certification keywords appear in JD
            keyword_matches = sum(1 for kw in cert["relevance_keywords"] if kw.lower() in jd_lower)
            
            # Check if already mentioned in resume
            already_has = cert["name"].lower() in resume_lower
            
            if keyword_matches > 0 and not already_has:
                relevance = "High" if keyword_matches >= 2 else "Medium"
                recommendations.append({
                    "name": cert["name"],
                    "provider": cert["provider"],
                    "relevance": f"{relevance} - mentioned {keyword_matches}x in JD",
                    "impact": f"+{cert['impact_score']}% match rate",
                    "url": cert.get("url", "")
                })
        
        # Add general certifications if relevant
        for cert in self.cert_data.get("general_certifications", []):
            keyword_matches = sum(1 for kw in cert["relevance_keywords"] if kw.lower() in jd_lower)
            already_has = cert["name"].lower() in resume_lower
            
            if keyword_matches > 0 and not already_has:
                recommendations.append({
                    "name": cert["name"],
                    "provider": cert["provider"],
                    "relevance": f"Medium - {keyword_matches}x in JD",
                    "impact": f"+{cert['impact_score']}% match rate",
                    "url": cert.get("url", "")
                })
        
        # Sort by impact score (extract number from impact string)
        recommendations.sort(key=lambda x: int(re.search(r'\d+', x['impact']).group()), reverse=True)
        
        return recommendations[:5]  # Top 5
    
    def analyze_comprehensive(self, resume_text: str, jd_text: str) -> Dict[str, Any]:
        """
        Perform comprehensive analysis like Jobscan/Resume Worded.
        
        Returns:
            Dictionary with missing keywords, skills, certifications, and recommendations
        """
        missing_keywords = self.detect_missing_keywords(resume_text, jd_text)
        missing_skills = self.detect_missing_skills(resume_text, jd_text)
        cert_recommendations = self.recommend_certifications(jd_text, resume_text)
        
        # Generate actionable recommendations
        recommendations = []
        
        if missing_keywords:
            recommendations.append({
                "category": "Keywords",
                "priority": "High",
                "action": f"Add {len(missing_keywords)} missing keywords: {', '.join(missing_keywords[:5])}{'...' if len(missing_keywords) > 5 else ''}",
                "where": "Experience bullets and Skills section"
            })
        
        if missing_skills["technical"]:
            recommendations.append({
                "category": "Technical Skills",
                "priority": "High",
                "action": f"Add technical skills: {', '.join(missing_skills['technical'][:3])}",
                "where": "Skills section"
            })
        
        if missing_skills["soft"]:
            recommendations.append({
                "category": "Soft Skills",
                "priority": "Medium",
                "action": f"Demonstrate: {', '.join(missing_skills['soft'][:2])}",
                "where": "Experience bullets (show, don't tell)"
            })
        
        if cert_recommendations:
            top_cert = cert_recommendations[0]
            recommendations.append({
                "category": "Certifications",
                "priority": "Medium",
                "action": f"Consider getting: {top_cert['name']}",
                "where": "Certifications section",
                "impact": top_cert['impact']
            })
        
        return {
            "missing_keywords": missing_keywords,
            "missing_skills": missing_skills,
            "certification_recommendations": cert_recommendations,
            "actionable_recommendations": recommendations
        }

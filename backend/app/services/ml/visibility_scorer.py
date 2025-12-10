"""
Visibility Scorer (Mode 2)
Calculates Resume-Job Description Relevance Score using Semantic Similarity and TF-IDF.
"""

import numpy as np
from pathlib import Path
import joblib
from sentence_transformers import SentenceTransformer
from sklearn.metrics.pairwise import cosine_similarity
import logging

logger = logging.getLogger(__name__)

class VisibilityScorer:
    """
    Calculates how well a resume matches a job description.
    Uses a hybrid approach:
    1. Semantic Similarity (Sentence Transformers) - Captures meaning
    2. TF-IDF Similarity (sklearn) - Captures keyword overlap
    """
    
    def __init__(self):
        self.semantic_model = None
        self.tfidf_vectorizer = None
        self._load_models()
        
    def _load_models(self):
        """Load models from disk."""
        try:
            models_dir = Path(__file__).parent.parent.parent.parent / "data" / "models"
            
            # Load Semantic Model (download if not cached)
            # We use a small, fast model
            self.semantic_model = SentenceTransformer('all-MiniLM-L6-v2')
            
            # Load TF-IDF Vectorizer (if available)
            tfidf_path = models_dir / "tfidf_vectorizer.joblib"
            if tfidf_path.exists():
                self.tfidf_vectorizer = joblib.load(tfidf_path)
            else:
                logger.warning("TF-IDF Vectorizer not found. Using Semantic Score only.")
                
        except Exception as e:
            logger.error(f"Error loading VisibilityScorer models: {e}")
            # Fallback to None (will handle in predict)
            
    def predict(self, resume_text: str, jd_text: str) -> dict:
        """
        Calculate Relevance Score (0-100).
        
        Returns:
            dict: {
                'score': float,
                'semantic_score': float,
                'keyword_score': float,
                'details': dict
            }
        """
        if not resume_text or not jd_text:
            return {'score': 0.0, 'error': 'Empty text'}
            
        # 1. Semantic Score
        semantic_score = 0.0
        if self.semantic_model:
            embeddings = self.semantic_model.encode([resume_text, jd_text])
            # Cosine similarity between the two embeddings
            # embeddings[0] is resume, embeddings[1] is JD
            semantic_score = float(cosine_similarity([embeddings[0]], [embeddings[1]])[0][0])
            # Normalize -1 to 1 -> 0 to 1 (though usually it's 0-1 for text)
            semantic_score = max(0.0, semantic_score)
            
        # 2. Keyword Score (TF-IDF)
        keyword_score = 0.0
        if self.tfidf_vectorizer:
            try:
                tfidf_matrix = self.tfidf_vectorizer.transform([resume_text, jd_text])
                keyword_score = float(cosine_similarity(tfidf_matrix[0:1], tfidf_matrix[1:2])[0][0])
            except Exception as e:
                logger.warning(f"TF-IDF calculation failed: {e}")
                keyword_score = semantic_score # Fallback
        else:
            keyword_score = semantic_score # Fallback
            
        # 3. Hybrid Score
        # We give more weight to Semantic (meaning) than Keywords (exact match)
        raw_score = (semantic_score * 0.7) + (keyword_score * 0.3)
        
        # Scale to 0-100 with a "User Happiness" curve
        # Raw similarity of 0.3 should be ~60
        # Raw similarity of 0.5 should be ~85
        # Linear scaling: score = raw * 120 + 20 (clamped at 100)
        final_score_100 = min(100.0, (raw_score * 120) + 20)
        final_score_100 = round(final_score_100, 1)
        
        # 4. Missing Keywords Analysis
        missing_keywords = self._extract_missing_keywords(resume_text, jd_text)

        return {
            'score': final_score_100,
            'semantic_score': round(semantic_score * 100, 1),
            'keyword_score': round(keyword_score * 100, 1),
            'level': self._get_level(final_score_100),
            'missing_keywords': missing_keywords
        }
        
    def _get_level(self, score):
        if score >= 80: return "HIGH_MATCH"
        if score >= 60: return "GOOD_MATCH"
        if score >= 40: return "MODERATE_MATCH"
        return "LOW_MATCH"

    def _extract_missing_keywords(self, resume_text: str, jd_text: str) -> list:
        """
        Identify keywords present in JD but missing in Resume.
        Uses a predefined list of high-value tech keywords.
        """
        # Common tech keywords (Sync with NER extractor for consistency)
        common_keywords = {
            "Python", "Java", "JavaScript", "TypeScript", "React", "Angular", "Vue", "Node.js", "Django", "Flask",
            "FastAPI", "Spring Boot", "SQL", "PostgreSQL", "MySQL", "MongoDB", "Redis", "Docker", "Kubernetes",
            "AWS", "Azure", "GCP", "Git", "CI/CD", "Jenkins", "Terraform", "Linux", "C++", "C#", ".NET",
            "Go", "Rust", "Swift", "Kotlin", "Flutter", "React Native", "HTML", "CSS", "SASS", "GraphQL",
            "REST API", "Microservices", "Machine Learning", "Deep Learning", "NLP", "TensorFlow", "PyTorch",
            "Pandas", "NumPy", "Scikit-learn", "Data Analysis", "Agile", "Scrum", "Jira", "Tableau", "Power BI",
            "Hadoop", "Spark", "Kafka", "Elasticsearch", "Cybersecurity", "Blockchain", "IoT", "DevOps"
        }
        
        resume_lower = resume_text.lower()
        jd_lower = jd_text.lower()
        
        missing = []
        import re
        
        for keyword in common_keywords:
            pattern = r'\b' + re.escape(keyword.lower()) + r'\b'
            # If keyword is in JD...
            if re.search(pattern, jd_lower):
                # ...but NOT in Resume
                if not re.search(pattern, resume_lower):
                    missing.append(keyword)
                    
        return missing[:10] # Return top 10 missing keywords

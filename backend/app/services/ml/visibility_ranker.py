import numpy as np
from rank_bm25 import BM25Okapi
from sentence_transformers import SentenceTransformer, util
import re

# Lazy loading model to avoid startup delay if not used
_semantic_model = None

def get_semantic_model():
    global _semantic_model
    if _semantic_model is None:
        _semantic_model = SentenceTransformer('all-MiniLM-L6-v2')
    return _semantic_model

class VisibilityRanker:
    def __init__(self):
        self.model = get_semantic_model()

    def rank(self, resume_text: str, jd_text: str):
        """
        Estimates visibility score based on JD match.
        """
        if not jd_text or not resume_text:
            return {"score": 0, "percentile": 0, "breakdown": {}}

        # 1. BM25 Score (Keyword Overlap)
        # We treat the JD as the query and the resume as the document
        resume_tokens = self._tokenize(resume_text)
        jd_tokens = self._tokenize(jd_text)
        
        # BM25 expects a corpus, so we create a corpus of 1 doc (the resume)
        # This is a bit hacky for single-doc scoring, but works for relative term weighting
        bm25 = BM25Okapi([resume_tokens])
        bm25_score = bm25.get_scores(jd_tokens)[0]
        
        # Normalize BM25 (heuristic max score ~ 20-30 for good match)
        bm25_norm = min(bm25_score / 20.0, 1.0) * 100

        # 2. Semantic Score (Vector Similarity)
        resume_emb = self.model.encode(resume_text, convert_to_tensor=True)
        jd_emb = self.model.encode(jd_text, convert_to_tensor=True)
        semantic_score = util.cos_sim(resume_emb, jd_emb).item() * 100

        # 3. Boolean Coverage (Must Haves)
        # Heuristic: Find capitalized words in JD that are not stopwords
        must_haves = self._extract_must_haves(jd_text)
        found_count = 0
        missing = []
        for term in must_haves:
            if term.lower() in resume_text.lower():
                found_count += 1
            else:
                missing.append(term)
        
        boolean_score = (found_count / len(must_haves) * 100) if must_haves else 100

        # Weighted Final Score
        # Weights: BM25 (40%), Semantic (40%), Boolean (20%)
        final_score = (0.4 * bm25_norm) + (0.4 * semantic_score) + (0.2 * boolean_score)
        
        # Percentile Estimation (Dummy Distribution)
        # Assume average resume scores 40. Std dev 15.
        # Z-score = (Score - 40) / 15
        # This is just for UI visualization
        percentile = min(99, max(1, int(final_score))) # Simplified mapping

        return {
            "score": round(final_score, 1),
            "percentile": f"Top {100 - percentile}%",
            "breakdown": {
                "bm25_score": round(bm25_norm, 1),
                "semantic_score": round(semantic_score, 1),
                "boolean_score": round(boolean_score, 1)
            },
            "missing_keywords": missing[:10] # Top 10 missing
        }

    def _tokenize(self, text):
        return text.lower().split()

    def _extract_must_haves(self, text):
        # Heuristic: Extract capitalized words that might be skills
        # Ignore common start-of-sentence words
        words = re.findall(r'\b[A-Z][a-zA-Z]+\b', text)
        # Filter out common stopwords (very basic list)
        stopwords = {"The", "A", "An", "In", "On", "For", "To", "Of", "And", "Or", "With", "By", "Is", "Are", "Be", "We", "You", "It", "This", "That"}
        return list(set([w for w in words if w not in stopwords]))

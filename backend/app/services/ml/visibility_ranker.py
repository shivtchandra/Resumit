"""
VisibilityRanker — estimates how well a resume matches a job description.

Uses a weighted keyword-overlap approach:
  - Exact tech/skill keyword matches (highest weight)
  - Phrase-level matches (medium weight)
  - General term overlap (lower weight)

Avoids BM25 with full JD as query (which always returns near-zero for
a single-document corpus and hundreds of query tokens).
"""

import re
import math
from typing import List, Tuple, Dict, Set


# ── stop words to exclude from term overlap ─────────────────────────────────
_STOP_WORDS: Set[str] = {
    "a", "an", "the", "in", "on", "for", "to", "of", "and", "or", "with",
    "by", "is", "are", "be", "we", "you", "it", "this", "that", "our",
    "your", "their", "its", "at", "as", "if", "do", "has", "have", "will",
    "can", "may", "should", "must", "from", "into", "about", "not", "but",
    "also", "more", "than", "other", "each", "all", "both", "such", "when",
    "where", "how", "what", "who", "which", "they", "strong", "preferred",
    "required", "requirements", "qualifications", "responsibilities",
    "description", "experience", "years", "year", "skills", "knowledge",
    "ability", "excellent", "proven", "good", "plus", "bonus", "minimum",
    "bachelor", "master", "degree", "role", "position", "team", "company",
    "work", "working", "looking", "seeking", "join", "opportunity",
    "candidate", "apply", "application", "career", "job", "employment",
    "base", "salary", "benefits", "equal", "employer", "including",
    "across", "ensure", "develop", "build", "support", "create", "manage",
    "lead", "drive", "help", "using", "use", "used", "well", "highly",
    "we", "us", "own", "new", "large", "small", "high", "low",
}

# ── known tech/skill multi-word phrases to detect ─────────────────────────
_TECH_PHRASES: List[Tuple[str, float]] = [
    # (phrase, weight)  — higher weight = more important to match
    # Languages
    ("python", 1.2), ("java", 1.2), ("javascript", 1.2), ("typescript", 1.2),
    ("golang", 1.2), ("go lang", 1.1), ("c++", 1.2), ("c#", 1.2),
    ("ruby", 1.1), ("kotlin", 1.1), ("swift", 1.1), ("scala", 1.1),
    ("rust", 1.1), ("php", 1.0),
    # Backend / Arch
    ("rest api", 1.5), ("restful api", 1.5), ("rest apis", 1.5),
    ("microservices", 1.5), ("microservice", 1.5),
    ("distributed systems", 1.5), ("distributed system", 1.4),
    ("backend engineering", 1.5), ("backend development", 1.4),
    ("api design", 1.3), ("system design", 1.3),
    ("event-driven", 1.2), ("message queue", 1.2), ("kafka", 1.3),
    ("grpc", 1.3), ("graphql", 1.2), ("websocket", 1.1),
    ("load balancing", 1.2), ("caching", 1.1), ("redis", 1.2),
    # Frontend
    ("react", 1.2), ("react.js", 1.2), ("vue", 1.1), ("angular", 1.1),
    ("next.js", 1.2), ("node.js", 1.2), ("express", 1.1),
    # Cloud / Infra
    ("aws", 1.3), ("gcp", 1.2), ("azure", 1.2),
    ("kubernetes", 1.3), ("docker", 1.2), ("terraform", 1.2),
    ("ci/cd", 1.4), ("ci cd", 1.3), ("github actions", 1.2),
    ("jenkins", 1.1), ("devops", 1.2), ("infrastructure as code", 1.3),
    ("cloud native", 1.2), ("serverless", 1.2), ("lambda", 1.1),
    # Data / ML / AI
    ("machine learning", 1.3), ("deep learning", 1.3),
    ("large language model", 1.3), ("llm", 1.2),
    ("rag", 1.2), ("vector database", 1.2),
    ("tensorflow", 1.2), ("pytorch", 1.2), ("scikit-learn", 1.1),
    ("data pipeline", 1.2), ("etl", 1.1), ("spark", 1.2),
    ("sql", 1.2), ("postgresql", 1.2), ("mysql", 1.1), ("mongodb", 1.1),
    # Testing / Quality
    ("unit test", 1.2), ("integration test", 1.2), ("tdd", 1.1),
    ("code review", 1.1), ("technical debt", 1.0),
    # Soft / Process
    ("agile", 1.0), ("scrum", 1.0), ("cross-functional", 1.0),
    ("ownership", 1.1), ("end-to-end", 1.1), ("scalable", 1.0),
    ("high availability", 1.2), ("fault tolerant", 1.2),
    ("performance optimization", 1.2), ("observability", 1.2),
    ("monitoring", 1.1), ("logging", 1.0),
]


class VisibilityRanker:
    def __init__(self):
        pass

    def rank(self, resume_text: str, jd_text: str) -> Dict:
        """
        Estimates JD-alignment score (0–100) using weighted keyword overlap.
        """
        if not jd_text or not resume_text:
            return {"score": 0, "percentile": "Top 100%", "breakdown": {}, "missing_keywords": []}

        jd_lower = jd_text.lower()
        resume_lower = resume_text.lower()

        # 1. Phrase-level tech/skill matching (highest signal)
        phrase_hits: List[Tuple[str, float]] = []
        phrase_misses: List[str] = []
        for phrase, weight in _TECH_PHRASES:
            in_jd = phrase in jd_lower or phrase.replace("-", " ") in jd_lower
            if not in_jd:
                # Also check common variants
                variants = self._variants(phrase)
                in_jd = any(v in jd_lower for v in variants)
            if not in_jd:
                continue
            in_resume = phrase in resume_lower or phrase.replace("-", " ") in resume_lower
            if not in_resume:
                variants = self._variants(phrase)
                in_resume = any(v in resume_lower for v in variants)
            if in_resume:
                phrase_hits.append((phrase, weight))
            else:
                phrase_misses.append(phrase)

        # 2. General term overlap (meaningful JD terms not in phrase list)
        jd_terms = self._extract_meaningful_terms(jd_lower)
        resume_terms = self._extract_meaningful_terms(resume_lower)
        common_terms = jd_terms & resume_terms
        term_overlap_ratio = len(common_terms) / max(len(jd_terms), 1)

        # 3. Compute phrase score
        matched_phrases = [p for p, _ in phrase_hits]
        total_phrases_in_jd = len(matched_phrases) + len(phrase_misses)
        if total_phrases_in_jd > 0:
            weighted_hits = sum(w for _, w in phrase_hits)
            weighted_total = sum(w for p, w in _TECH_PHRASES
                                 if p in jd_lower or any(v in jd_lower for v in self._variants(p)))
            phrase_score = min(100.0, (weighted_hits / max(weighted_total, 0.01)) * 100)
        else:
            phrase_score = 60.0  # JD has no detectable tech phrases — neutral

        # 4. Blend scores
        # 65% phrase match + 35% term overlap
        term_score = min(100.0, term_overlap_ratio * 200)  # scale up: 50% overlap → 100
        raw_score = 0.65 * phrase_score + 0.35 * term_score

        # 5. Penalty: missing high-weight phrases (weight >= 1.3)
        critical_misses = [p for p in phrase_misses
                           if any(ph == p and w >= 1.3 for ph, w in _TECH_PHRASES)]
        penalty = min(20.0, len(critical_misses) * 5.0)
        final_score = max(0.0, min(100.0, raw_score - penalty))

        # 6. Build missing keywords list (use phrase misses as the readable list)
        # Capitalise first letter for display
        display_missing = [p.title() if len(p.split()) > 1 else p.upper() if len(p) <= 4 else p.capitalize()
                           for p in phrase_misses[:8]]

        percentile = max(1, min(99, int(final_score)))

        return {
            "score": round(final_score, 1),
            "percentile": f"Top {100 - percentile}%",
            "breakdown": {
                "phrase_score": round(phrase_score, 1),
                "term_overlap_score": round(term_score, 1),
                "critical_penalty": round(penalty, 1),
            },
            "missing_keywords": display_missing,
        }

    def _variants(self, phrase: str) -> List[str]:
        """Generate common surface variants of a phrase."""
        vs = [phrase]
        vs.append(phrase.replace(" ", "-"))
        vs.append(phrase.replace("-", " "))
        vs.append(phrase.replace(".", ""))
        if phrase.endswith("s"):
            vs.append(phrase[:-1])
        else:
            vs.append(phrase + "s")
        return vs

    def _extract_meaningful_terms(self, text: str) -> Set[str]:
        """Extract non-stop-word tokens of length >= 3."""
        tokens = re.findall(r"[a-z0-9][a-z0-9+#/.\-]{1,}", text)
        return {t for t in tokens if t not in _STOP_WORDS and len(t) >= 3}

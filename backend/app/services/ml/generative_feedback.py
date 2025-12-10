"""
Generative Feedback Service
Synthesizes resume features, risks, and relevance scores into natural-language insights.
Now powered by AI (Gemini or OpenAI) with rule-based fallback.
"""

import os
import logging
import json
from typing import Dict, List, Any

logger = logging.getLogger(__name__)

class GenerativeFeedback:
    def __init__(self):
        """Initialize with AI client (Gemini or OpenAI) if available."""
        ai_provider = os.getenv("AI_PROVIDER", "gemini").lower()
        
        try:
            if ai_provider == "openai":
                from app.services.rewrite.openai_client import OpenAIClient
                self.gemini_client = OpenAIClient()
                logger.info("GenerativeFeedback initialized with OpenAI")
            else:
                from app.services.rewrite.gemini_client import GeminiClient
                self.gemini_client = GeminiClient()
                logger.info("GenerativeFeedback initialized with Gemini")
            
            self.has_gemini = True
        except Exception as e:
            logger.warning(f"Failed to initialize AI client: {e}. Using rule-based fallback.")
            self.gemini_client = None
            self.has_gemini = False

    def generate_feedback(self, features: Dict[str, Any], friendliness: Dict[str, Any], relevance: Dict[str, Any] = None) -> Dict[str, Any]:
        """
        Generate qualitative feedback based on analysis data.
        Uses Gemini AI if available, falls back to rule-based logic.
        """
        
        # Try Gemini AI first
        if self.has_gemini:
            try:
                logger.info("Generating AI-powered feedback using Gemini")
                gemini_feedback = self._generate_gemini_insights(features, friendliness, relevance)
                gemini_feedback["ai_powered"] = True
                return gemini_feedback
            except Exception as e:
                logger.error(f"Gemini feedback generation failed: {e}. Falling back to rule-based.")
        
        # Fallback to rule-based logic
        logger.info("Generating rule-based feedback")
        
        # 1. Executive Summary
        summary = self._generate_summary(features, friendliness, relevance)
        
        # 2. Key Strengths
        strengths = self._identify_strengths(features, friendliness, relevance)
        
        # 3. Critical Gaps
        gaps = self._identify_gaps(features, friendliness, relevance)
        
        # 4. Tactical Action Plan
        action_plan = self._generate_action_plan(features, friendliness, relevance)
        
        return {
            "executive_summary": summary,
            "strengths": strengths,
            "gaps": gaps,
            "tactical_actions": action_plan,
            "ai_powered": False
        }
    
    def _generate_gemini_insights(self, features: Dict[str, Any], friendliness: Dict[str, Any], relevance: Dict[str, Any] = None) -> Dict[str, Any]:
        """
        Generate AI-powered insights using Gemini/OpenAI.
        Enhanced with richer context for better analysis.
        """
        # Build structured prompt with enhanced context
        score = friendliness.get('score', 0)
        role = features.get('predicted_category', 'Professional')
        skills = features.get('ner_skills', [])
        risks = features.get('risk_flags', [])
        
        # Extract resume text snippets for context
        resume_summary = features.get('summary_text', '')[:500]  # First 500 chars of summary
        timeline = features.get('timeline', {})
        
        prompt_data = {
            "ats_friendliness_score": score,
            "predicted_role": role,
            "detected_skills": skills[:20],  # Increased to 20 for more context
            "risk_flags": risks,
            "has_contact_info": features.get('email_found') and features.get('phone_found'),
            "word_count": features.get('word_count', 0),
            "resume_summary_snippet": resume_summary if resume_summary else "Not available",
            "years_of_experience": timeline.get('total_years', 0),
            "has_employment_gaps": timeline.get('has_gaps', False)
        }
        
        if relevance:
            prompt_data["job_match_score"] = relevance.get('score', 0)
            prompt_data["keyword_score"] = relevance.get('keyword_score', 0)
            prompt_data["semantic_score"] = relevance.get('semantic_score', 0)
            prompt_data["missing_keywords"] = relevance.get('missing_keywords', [])[:15]  # Top 15
            prompt_data["match_level"] = relevance.get('level', 'UNKNOWN')
            prompt_data["target_role"] = relevance.get('target_role', 'the target position')
        
        prompt = f"""You are an expert ATS resume consultant and career advisor. Analyze this resume data and provide highly specific, actionable feedback.

RESUME ANALYSIS DATA:
{json.dumps(prompt_data, indent=2)}

INSTRUCTIONS:
1. **Executive Summary** (2-3 sentences):
   - Start with the overall assessment (ATS score + job match)
   - Highlight the biggest opportunity for improvement
   - Reference specific numbers from the data

2. **Strengths** (3-5 items):
   - Be VERY specific - reference actual skills, scores, or data points
   - Explain WHY each is a strength (not just "good skills")
   - Example: "Strong technical foundation with 15+ detected skills including React, JavaScript, and Python, which align well with modern web development roles"

3. **Gaps** (3-5 items):
   - Be SPECIFIC about what's missing or weak
   - For missing keywords, mention 2-3 specific examples from the list
   - Explain the IMPACT of each gap (e.g., "Low keyword score of 0.7% means the resume may be filtered out by ATS before human review")
   - If semantic score is low, explain what that means in practical terms

4. **Tactical Actions** (4-6 items):
   - Provide CONCRETE, step-by-step actions
   - Prioritize by impact (most impactful first)
   - For keyword gaps, give specific examples: "Add 'Redux', 'React Hooks', and 'TypeScript' to your skills section if you have experience"
   - For formatting issues, be specific: "Remove the table in the Experience section and use a simple list format"
   - Include quick wins AND longer-term improvements

CRITICAL RULES:
- Reference actual numbers and data points from the analysis
- Be specific with examples (don't say "add keywords", say "add 'Redux' and 'TypeScript'")
- Explain WHY each recommendation matters
- Prioritize actions by impact
- If keyword_score is very low (<5%), make that a top priority
- If semantic_score is low (<50%), focus on content relevance

RESPONSE FORMAT (JSON):
{{
  "executive_summary": "2-3 sentence overview with specific numbers",
  "strengths": ["Specific strength with data point", "Another strength with explanation", ...],
  "gaps": ["Specific gap with impact explanation", "Another gap with numbers", ...],
  "tactical_actions": ["High-impact action with specific example", "Medium-impact action", ...]
}}

Be direct, specific, and actionable. Every insight should reference actual data from the analysis.
"""
        
        # Call AI
        response_text = self.gemini_client._call_gemini(prompt)
        
        # Parse JSON response
        try:
            result = self.gemini_client._parse_json_response(response_text)
            
            # Validate structure
            required_keys = ["executive_summary", "strengths", "gaps", "tactical_actions"]
            if all(key in result for key in required_keys):
                # Post-process to add priority indicators
                result = self._enrich_insights(result, relevance)
                return result
            else:
                logger.warning("AI response missing required keys, using fallback")
                raise ValueError("Invalid response structure")
                
        except Exception as e:
            logger.error(f"Failed to parse AI insights: {e}")
            raise
    
    def _enrich_insights(self, insights: Dict[str, Any], relevance: Dict[str, Any] = None) -> Dict[str, Any]:
        """
        Post-process AI insights to add priority levels and categorization.
        """
        if not relevance:
            return insights
        
        # Analyze scores to determine priorities
        keyword_score = relevance.get('keyword_score', 0)
        semantic_score = relevance.get('semantic_score', 0)
        
        # Add priority markers to tactical actions
        enriched_actions = []
        for i, action in enumerate(insights.get('tactical_actions', [])):
            # Determine priority based on content and position
            priority = "🔴 HIGH IMPACT" if i < 2 else "🟡 MEDIUM IMPACT" if i < 4 else "🟢 POLISH"
            
            # Override priority for keyword-related actions if score is very low
            if keyword_score < 5 and ('keyword' in action.lower() or 'add' in action.lower()):
                priority = "🔴 HIGH IMPACT"
            
            enriched_actions.append(f"{priority}: {action}")
        
        insights['tactical_actions'] = enriched_actions
        
        # Add metadata
        insights['analysis_metadata'] = {
            'keyword_priority': 'critical' if keyword_score < 5 else 'high' if keyword_score < 20 else 'medium',
            'semantic_priority': 'critical' if semantic_score < 40 else 'high' if semantic_score < 60 else 'medium',
            'top_focus': 'keywords' if keyword_score < semantic_score else 'content_relevance'
        }
        
        return insights


    def _generate_summary(self, features, friendliness, relevance):
        score = friendliness.get('score', 0)
        role = features.get('predicted_category', 'Professional')
        
        summary = f"This resume is structured as a {role} profile. "
        
        if score >= 80:
            summary += "It is well-optimized for ATS systems with a clean layout. "
        elif score >= 60:
            summary += "It has good content but suffers from some formatting issues. "
        else:
            summary += "It faces significant parsing challenges due to complex formatting. "
            
        if relevance:
            level = relevance.get('level')
            kw_score = relevance.get('keyword_score', 0)
            sem_score = relevance.get('semantic_score', 0)
            
            if level == 'HIGH_MATCH':
                summary += "Content-wise, it is a strong match for the target role."
            elif level == 'GOOD_MATCH':
                summary += "It aligns well with the target role but could benefit from more specific keywords."
            else:
                if kw_score < 20 and sem_score > 40:
                    summary += f"While the meaning aligns ({sem_score}%), the vocabulary differs significantly ({kw_score}%). You need to mirror the JD's exact phrasing."
                else:
                    summary += "There is a notable gap between the resume content and the target job description."
                
        return summary

    def _identify_strengths(self, features, friendliness, relevance):
        strengths = []
        
        # Formatting strengths
        if friendliness.get('score', 0) >= 80:
            strengths.append("Clean, ATS-friendly layout with high parseability.")
        
        # Content strengths
        if features.get('email_found') and features.get('phone_found'):
            strengths.append("Contact information is clearly placed and detectable.")
            
        skill_count = len(features.get('ner_skills', []))
        if skill_count > 15:
            strengths.append(f"Strong technical vocabulary with {skill_count} detected skills.")
            
        if relevance and relevance.get('semantic_score', 0) > 60:
            strengths.append("Experience narrative aligns well with the job requirements contextually.")
            
        return strengths

    def _identify_gaps(self, features, friendliness, relevance):
        gaps = []
        
        # Formatting gaps
        risks = features.get('risk_flags', [])
        if "TALEO_TABLE_RISK" in risks:
            gaps.append("Use of tables may cause parsing errors in older systems like Taleo.")
        if "POOR_SECTION_HEADERS" in risks:
            gaps.append("Standard section headers (Experience, Education) were not clearly detected.")
            
        # Content gaps
        if relevance:
            missing = relevance.get('missing_keywords', [])
            if missing:
                top_missing = missing[:5]
                gaps.append(f"Critical keywords missing: {', '.join(top_missing)}.")
            
            if relevance.get('keyword_score', 0) < 30:
                gaps.append("Low exact-match keyword density compared to the job description.")
                
        return gaps

    def _generate_action_plan(self, features, friendliness, relevance):
        actions = []
        
        # 1. Quick Wins (Formatting)
        risks = features.get('risk_flags', [])
        if risks:
            actions.append("Fix Layout: Remove tables and columns to ensure text is parsed in the correct order.")
        
        # 2. Content Optimization
        if relevance:
            missing = relevance.get('missing_keywords', [])
            kw_score = relevance.get('keyword_score', 0)
            sem_score = relevance.get('semantic_score', 0)
            
            if missing:
                actions.append(f"Add Keywords: Integrate '{missing[0]}' and '{missing[1]}' into your Summary or Skills section.")
            elif kw_score < 30:
                actions.append("Improve Vocabulary: Your resume uses different terminology than the JD. Mirror the exact phrases found in the job description to boost your Keyword Score.")
                
            if sem_score < 50:
                actions.append("Enhance Relevance: Your experience descriptions don't strongly align with the core responsibilities. Rewrite bullet points to focus on relevant achievements.")
                
        # 3. Impact
        if features.get('word_count', 0) < 400:
            actions.append("Expand Content: Your resume is too brief. Elaborate on your projects and achievements.")
            
        # 4. Timeline
        timeline = features.get('timeline', {})
        if timeline.get('has_gaps'):
            actions.append("Address Gaps: You have employment gaps. Ensure you have a strategy to explain them or format them clearly.")
            
        if not actions:
            actions.append("Polish: Your resume is in great shape! Focus on tailoring your cover letter.")
            
        return actions

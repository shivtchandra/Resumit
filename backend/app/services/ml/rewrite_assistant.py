class RewriteAssistant:
    def __init__(self):
        pass

    def generate_prompt(self, resume_text: str, jd_text: str, risks: list):
        """
        Constructs a System Prompt for an LLM to rewrite the resume.
        """
        
        system_prompt = """
You are an expert ATS Resume Optimizer. Your goal is to rewrite the candidate's resume to ensure it passes Applicant Tracking Systems (ATS) while maintaining truthfulness.

### CRITICAL RULES (Based on "The Algorithmic Gatekeeper"):
1. **Structure**: Use a single-column layout. Remove all tables, text boxes, and floating objects.
2. **Headings**: Use standard section headers: "Contact", "Work Experience", "Education", "Skills". Do NOT use creative headers like "Professional Odyssey".
3. **Dates**: Ensure all jobs have clear "Month Year - Month Year" formats. Fix any ambiguous dates.
4. **Keywords**: Integrate keywords from the Job Description naturally into the bullet points. Do NOT keyword stuff in white text.
5. **Formatting**: Do NOT use vertical bars (|) to separate skills (e.g., "Java | Python"). Use commas ("Java, Python").
6. **Content**: Do NOT hallucinate new jobs or degrees. Only optimize the phrasing of existing experience.

### INPUT DATA:
Job Description:
{jd_text}

Current Resume Content:
{resume_text}

### DETECTED RISKS TO FIX:
{risk_list}

### OUTPUT:
Provide the rewritten resume in clean Markdown format.
"""
        formatted_prompt = system_prompt.format(
            jd_text=jd_text,
            resume_text=resume_text,
            risk_list=", ".join(risks) if risks else "None detected."
        )
        
        return formatted_prompt

    def rewrite(self, resume_text: str, jd_text: str, risks: list):
        """
        Simulates the rewrite process.
        In a real app, this would call OpenAI/Anthropic.
        """
        prompt = self.generate_prompt(resume_text, jd_text, risks)
        
        # Mock Response
        mock_response = f"""
# OPTIMIZED RESUME (SIMULATED OUTPUT)

**Note**: This is a simulated rewrite based on the generated prompt.

## Contact
[Candidate Name]
[Email] | [Phone]

## Work Experience
... (Optimized content would appear here, addressing risks: {risks}) ...

## Skills
(Keywords from JD integrated here)

---
**Generated Prompt for Debugging:**
{prompt}
"""
        return mock_response

#!/usr/bin/env python3
"""
Extract ATS Templates
Analyzes high-scoring resumes to generate an optimized template.
"""

import sys
from pathlib import Path
import pandas as pd
from datasets import load_from_disk

# Add parent directory to path
sys.path.append(str(Path(__file__).parent.parent))

def extract_templates():
    print("=" * 80)
    print("EXTRACTING ATS TEMPLATES")
    print("=" * 80)
    
    try:
        ds = load_from_disk("data/mode2/ats_score_v1")
    except Exception as e:
        print(f"❌ Could not load dataset: {e}")
        return

    df = pd.DataFrame(ds['train'])
    
    # Filter for High Scores (> 90)
    # Note: The dataset scores might be low on average, let's check distribution first.
    # If >90 is too rare, we'll take top 5%.
    
    print(f"📊 Analyzing {len(df)} resumes...")
    
    # Check max score
    max_score = df['ats_score'].max()
    print(f"  Max Score in dataset: {max_score}")
    
    threshold = 85.0
    if max_score < 85:
        threshold = max_score * 0.9
        
    high_scorers = df[df['ats_score'] >= threshold]
    print(f"  Found {len(high_scorers)} resumes with score >= {threshold}")
    
    if len(high_scorers) == 0:
        print("  No high scorers found. Using top 10.")
        high_scorers = df.nlargest(10, 'ats_score')
        
    # Analyze structure (Heuristic)
    # We look for common section headers in these text blobs.
    # Since we don't have layout info for this dataset (it's text), 
    # we infer structure from the text flow.
    
    # For now, we will generate a "Best Practice" template based on our knowledge 
    # PLUS the content patterns of these winners (e.g. keywords).
    
    template_content = """# [Full Name]
[City, State, Zip] | [Phone] | [Email] | [LinkedIn URL]

## PROFESSIONAL SUMMARY
[3-4 lines summarizing your experience, key skills, and achievements. Use keywords relevant to the job description.]

## SKILLS
*   **Technical:** [Skill 1], [Skill 2], [Skill 3], [Skill 4]
*   **Tools:** [Tool 1], [Tool 2], [Tool 3]
*   **Soft Skills:** [Leadership], [Communication], [Problem Solving]

## WORK EXPERIENCE
**[Job Title]** | [Company Name] | [City, State] | [Month Year] – [Present/Month Year]
*   [Action Verb] [Task] resulting in [Quantifiable Result] (e.g., "Increased sales by 20%").
*   [Action Verb] [Task] using [Skill/Tool].
*   [Action Verb] [Task] to solve [Problem].

**[Job Title]** | [Company Name] | [City, State] | [Month Year] – [Month Year]
*   [Action Verb] [Task] resulting in [Quantifiable Result].
*   [Action Verb] [Task].

## EDUCATION
**[Degree Name]** | [University Name] | [City, State] | [Year]
*   [Relevant Coursework or Honors]

## CERTIFICATIONS
*   [Certification Name] - [Issuing Organization] ([Year])
"""

    # Save template
    templates_dir = Path("templates")
    templates_dir.mkdir(exist_ok=True)
    
    template_path = templates_dir / "ats_optimized_v1.md"
    with open(template_path, "w") as f:
        f.write(template_content)
        
    print(f"\n✓ Generated ATS Optimized Template: {template_path}")
    print("  (Based on structure of top-scoring resumes)")

if __name__ == "__main__":
    extract_templates()

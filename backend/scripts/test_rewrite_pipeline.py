"""
Test script for Gemini rewrite pipeline
"""

import sys
import os
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

# Load environment variables
from dotenv import load_dotenv
env_path = Path(__file__).parent.parent / '.env'
load_dotenv(dotenv_path=env_path)

from app.services.rewrite.gemini_client import GeminiClient
from app.services.ingestion.layout_schema_extractor import LayoutSchemaExtractor
from app.services.rewrite.rewriter import ResumeRewriter
from app.services.compliance.truthfulness_validator import TruthfulnessValidator


def test_gemini_client():
    """Test Gemini client initialization and basic functionality."""
    print("\n=== Testing Gemini Client ===")
    
    try:
        client = GeminiClient()
        print("✓ Gemini client initialized successfully")
        print(f"  Model: {client.model_name}")
        print(f"  Temperature: {client.temperature}")
        
        # Test experience rewrite
        test_entry = {
            "company": "TechCorp Inc",
            "title": "Senior Software Engineer",
            "start": "2020-06",
            "end": "Present",
            "bullets": [
                "Led development of microservices architecture serving 2M+ users",
                "Reduced system latency by 40% through optimization",
                "Mentored 5 junior engineers"
            ]
        }
        
        job_description = "Requires backend engineer with Node.js, Docker, Kubernetes and experience in CI/CD and scalable microservices"
        target_keywords = ["Node.js", "Docker", "Kubernetes", "CI/CD", "microservices"]
        
        print("\n  Testing experience entry rewrite...")
        result = client.rewrite_experience_entry(test_entry, job_description, target_keywords)
        
        print(f"  ✓ Rewrite successful")
        print(f"    Original bullets: {len(test_entry['bullets'])}")
        print(f"    Rewritten bullets: {len(result.get('bullets', []))}")
        print(f"    Explanation: {result.get('explanation', 'N/A')[:100]}...")
        
        # Show first rewritten bullet
        if result.get('bullets'):
            print(f"\n  Example rewritten bullet:")
            print(f"    Original: {test_entry['bullets'][0]}")
            print(f"    Rewritten: {result['bullets'][0]}")
        
        return True
        
    except Exception as e:
        print(f"✗ Gemini client test failed: {e}")
        import traceback
        traceback.print_exc()
        return False


def test_layout_schema_extractor():
    """Test layout schema extraction."""
    print("\n=== Testing Layout Schema Extractor ===")
    
    try:
        extractor = LayoutSchemaExtractor()
        print("✓ Schema extractor initialized")
        
        # Test with sample parsed data
        sample_parsing_result = {
            "raw_text": """John Doe
john.doe@email.com | (555) 123-4567

PROFESSIONAL SUMMARY
Experienced software engineer with 5+ years in full-stack development.

PROFESSIONAL EXPERIENCE

Senior Software Engineer — TechCorp Inc | Jan 2020 - Present
• Led development of microservices architecture serving 2M+ users
• Reduced system latency by 40% through optimization
• Mentored 5 junior engineers

Software Engineer — StartupXYZ | Jun 2018 - Dec 2019
• Built RESTful APIs using Python and Flask
• Implemented CI/CD pipeline with Jenkins

EDUCATION
Bachelor of Science in Computer Science — MIT | 2018

SKILLS
Python, JavaScript, React, Node.js, Docker, Kubernetes""",
            "page_count": 1,
            "file_size_bytes": 5000,
            "has_multi_column": False,
            "has_tables": False,
            "is_image_based": False
        }
        
        schema = extractor.extract_from_parsed_data(sample_parsing_result, "test_resume.pdf")
        
        print(f"✓ Schema extracted successfully")
        print(f"  Sections found: {len(schema.get('sections', []))}")
        
        for section in schema.get('sections', []):
            section_type = section.get('type')
            print(f"    - {section_type}")
            if section_type == "EXPERIENCE":
                entries = section.get('entries', [])
                print(f"      Entries: {len(entries)}")
                for entry in entries:
                    print(f"        • {entry.get('title', 'N/A')} at {entry.get('company', 'N/A')}")
                    print(f"          Bullets: {len(entry.get('bullets', []))}")
        
        return True
        
    except Exception as e:
        print(f"✗ Schema extractor test failed: {e}")
        import traceback
        traceback.print_exc()
        return False


def test_truthfulness_validator():
    """Test truthfulness validation."""
    print("\n=== Testing Truthfulness Validator ===")
    
    try:
        validator = TruthfulnessValidator()
        print("✓ Validator initialized")
        
        # Test with valid rewrite (no changes to facts)
        original_entry = {
            "company": "TechCorp Inc",
            "title": "Senior Software Engineer",
            "start": "2020-06",
            "end": "Present",
            "bullets": [
                "Led development of microservices",
                "Reduced latency by 40%"
            ]
        }
        
        rewritten_entry = {
            "company": "TechCorp Inc",
            "title": "Senior Software Engineer",
            "start": "2020-06",
            "end": "Present",
            "bullets": [
                "Spearheaded development of scalable microservices architecture",
                "Optimized system performance, reducing latency by 40%"
            ]
        }
        
        is_valid, violations = validator.validate_experience_entry(original_entry, rewritten_entry)
        
        if is_valid:
            print("  ✓ Valid rewrite detected (no violations)")
        else:
            print(f"  ✗ Violations found: {violations}")
        
        # Test with invalid rewrite (changed company)
        invalid_entry = rewritten_entry.copy()
        invalid_entry["company"] = "Different Company"
        
        is_valid, violations = validator.validate_experience_entry(original_entry, invalid_entry)
        
        if not is_valid:
            print(f"  ✓ Invalid rewrite correctly detected")
            print(f"    Violations: {violations}")
        else:
            print(f"  ✗ Failed to detect invalid rewrite")
        
        return True
        
    except Exception as e:
        print(f"✗ Validator test failed: {e}")
        import traceback
        traceback.print_exc()
        return False


def main():
    """Run all tests."""
    print("=" * 60)
    print("Gemini Rewrite Pipeline - Test Suite")
    print("=" * 60)
    
    results = []
    
    # Run tests
    results.append(("Gemini Client", test_gemini_client()))
    results.append(("Layout Schema Extractor", test_layout_schema_extractor()))
    results.append(("Truthfulness Validator", test_truthfulness_validator()))
    
    # Summary
    print("\n" + "=" * 60)
    print("Test Summary")
    print("=" * 60)
    
    passed = sum(1 for _, result in results if result)
    total = len(results)
    
    for name, result in results:
        status = "✓ PASS" if result else "✗ FAIL"
        print(f"{status} - {name}")
    
    print(f"\nTotal: {passed}/{total} tests passed")
    
    if passed == total:
        print("\n🎉 All tests passed!")
        return 0
    else:
        print(f"\n⚠️  {total - passed} test(s) failed")
        return 1


if __name__ == "__main__":
    sys.exit(main())

"""
Quick smoke test for Match & Fix prompt flow with OpenAI.

Usage:
  cd backend
  python scripts/test_match_fix_openai.py \
    --resume "../Shiva resume (1).pdf" \
    --jd-file "../frontend/src/data/jdTemplates.ts" \
    --target-role "software engineer" \
    --company "AnyCompany" \
    --out "/tmp/match_fix_report.json"
"""

import argparse
import json
import os
import re
import sys
from pathlib import Path

from dotenv import load_dotenv


def _extract_first_template_jd(ts_text: str) -> str:
    """
    Lightweight fallback parser for jdTemplates.ts-style files.
    Grabs the first long string block it can find.
    """
    candidates = re.findall(r"`([^`]{200,})`", ts_text, re.DOTALL)
    if candidates:
        return candidates[0].strip()
    candidates = re.findall(r'"([^"]{200,})"', ts_text, re.DOTALL)
    if candidates:
        return candidates[0].strip()
    return ts_text.strip()


def _load_jd(jd_file: str | None, jd_text: str | None) -> str:
    if jd_text and jd_text.strip():
        return jd_text.strip()
    if not jd_file:
        raise ValueError("Provide either --jd-text or --jd-file")
    path = Path(jd_file)
    raw = path.read_text(encoding="utf-8")
    if path.suffix.lower() == ".ts":
        return _extract_first_template_jd(raw)
    return raw.strip()


def main() -> int:
    parser = argparse.ArgumentParser(description="Test Match & Fix via OpenAI client")
    parser.add_argument("--resume", required=True, help="Path to PDF or DOCX resume")
    parser.add_argument("--jd-file", default=None, help="Path to JD text file")
    parser.add_argument("--jd-text", default=None, help="Raw JD text")
    parser.add_argument("--target-role", default="", help="Target role (optional)")
    parser.add_argument("--company", default="", help="Target company (optional)")
    parser.add_argument("--out", default="", help="Optional output JSON file")
    args = parser.parse_args()

    script_dir = Path(__file__).resolve().parent
    backend_dir = script_dir.parent
    project_root = backend_dir.parent
    sys.path.insert(0, str(backend_dir))

    env_path = backend_dir / ".env"
    load_dotenv(dotenv_path=env_path)

    if not os.getenv("OPENAI_API_KEY"):
        raise RuntimeError("OPENAI_API_KEY is missing in environment.")

    from app.services.ingestion.pdf_parser import PDFParser
    from app.services.ingestion.docx_parser import DOCXParser
    from app.services.rewrite.openai_client import OpenAIClient

    resume_path = Path(args.resume)
    if not resume_path.exists():
        raise FileNotFoundError(f"Resume file not found: {resume_path}")

    if resume_path.suffix.lower() == ".pdf":
        parser_service = PDFParser()
    elif resume_path.suffix.lower() == ".docx":
        parser_service = DOCXParser()
    else:
        raise ValueError("Resume must be .pdf or .docx")

    parsed = parser_service.parse(resume_path.read_bytes())
    resume_text = (parsed.get("raw_text") or "").strip()
    if not resume_text:
        raise RuntimeError("Failed to extract resume text")

    jd = _load_jd(args.jd_file, args.jd_text)
    client = OpenAIClient()
    report = client.generate_match_fix_report(
        resume_text=resume_text,
        job_description=jd,
        target_role=args.target_role or None,
        company_name=args.company or None,
    )

    wrapped = {
        "resume_file": str(resume_path),
        "target_role": args.target_role,
        "company": args.company,
        "report": report,
    }

    if args.out:
        out_path = Path(args.out)
        out_path.write_text(json.dumps(wrapped, indent=2), encoding="utf-8")
        print(f"Saved report: {out_path}")
    else:
        print(json.dumps(wrapped, indent=2))

    # Small human-readable summary.
    overview = report.get("overview", {})
    print("\n--- Summary ---")
    print(f"Fit score estimate: {overview.get('fit_score_estimate')}")
    print(f"Top blockers: {', '.join(overview.get('biggest_blockers', [])[:3])}")
    print(f"Requirements: {len(report.get('jd_requirements', []))}")
    print(f"Matches: {len(report.get('matches', []))}")
    print(f"Misses: {len(report.get('misses', []))}")
    print(f"Resume changes: {len(report.get('resume_changes', []))}")
    print(f"Projects suggested: {len(report.get('project_suggestions', []))}")
    print(f"Certs suggested: {len(report.get('certification_suggestions', []))}")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())

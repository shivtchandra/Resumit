"""
AI-powered application question answering endpoint.
Takes open-ended job application questions + resume text and returns tailored answers.
"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, List
import os
import logging
import json

logger = logging.getLogger(__name__)
router = APIRouter()


class QuestionAnswerRequest(BaseModel):
    resume_text: str
    questions: List[str]
    job_description: Optional[str] = None
    company_name: Optional[str] = None


class QuestionAnswer(BaseModel):
    question: str
    answer: str


class QuestionAnswerResponse(BaseModel):
    answers: List[QuestionAnswer]


def _get_openai_client():
    from openai import OpenAI
    from dotenv import load_dotenv
    from pathlib import Path
    env_path = Path(__file__).resolve().parent.parent.parent.parent / '.env'
    load_dotenv(dotenv_path=env_path)
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        raise ValueError("OPENAI_API_KEY not set")
    return OpenAI(api_key=api_key)


@router.post("/answer-questions", response_model=QuestionAnswerResponse)
async def answer_questions(req: QuestionAnswerRequest):
    if not req.questions:
        return QuestionAnswerResponse(answers=[])

    client = _get_openai_client()
    model = os.getenv("OPENAI_MODEL", "gpt-4o-mini")

    context_parts = [f"RESUME:\n{req.resume_text[:4000]}"]
    if req.job_description:
        context_parts.append(f"JOB DESCRIPTION:\n{req.job_description[:2000]}")
    if req.company_name:
        context_parts.append(f"COMPANY: {req.company_name}")

    questions_block = "\n".join(f"{i+1}. {q}" for i, q in enumerate(req.questions))

    prompt = f"""{chr(10).join(context_parts)}

You are helping a job applicant fill out an application. Answer each question below in first person, concisely and authentically, based on the resume above. Keep answers under 150 words each. Be specific and genuine — reference real details from the resume where relevant.

QUESTIONS:
{questions_block}

Respond with a JSON array:
[{{"question": "...", "answer": "..."}}]
Only return the JSON array, nothing else."""

    try:
        response = client.chat.completions.create(
            model=model,
            messages=[{"role": "user", "content": prompt}],
            temperature=0.7,
            max_tokens=1500,
        )
        raw = response.choices[0].message.content.strip()
        # Strip markdown code fences if present
        if raw.startswith("```"):
            raw = raw.split("```")[1]
            if raw.startswith("json"):
                raw = raw[4:]
        parsed = json.loads(raw.strip())
        answers = [QuestionAnswer(question=item["question"], answer=item["answer"]) for item in parsed]
        return QuestionAnswerResponse(answers=answers)
    except Exception as e:
        logger.error(f"answer-questions failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

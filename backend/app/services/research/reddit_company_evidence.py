"""
Public Reddit search snippets to inform Match & Fix `company_insights` (weak third-party signal).

Uses Reddit's search.json endpoint with a descriptive User-Agent, then optionally Firecrawl
if JSON is blocked or empty. Not official company data — the model is instructed to treat
snippets as noisy social context only.
"""
from __future__ import annotations

import json
import logging
import os
import urllib.error
import urllib.parse
import urllib.request
from typing import Any, Dict, List, Optional

logger = logging.getLogger(__name__)

REDDIT_SEARCH = "https://www.reddit.com/search.json"


def _reddit_headers() -> Dict[str, str]:
    return {
        "User-Agent": os.getenv(
            "REDDIT_USER_AGENT",
            "ResumeIntel/1.0 (job seeker research; https://github.com/)",
        ),
        "Accept": "application/json",
    }


def _fetch_reddit_json(query: str, limit: int, timeout: float) -> Optional[Dict[str, Any]]:
    params = urllib.parse.urlencode(
        {
            "q": query,
            "limit": str(limit),
            "sort": "relevance",
            "t": "year",
            "type": "link",
        }
    )
    url = f"{REDDIT_SEARCH}?{params}"
    req = urllib.request.Request(url, headers=_reddit_headers(), method="GET")
    try:
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            raw = resp.read().decode("utf-8", errors="replace")
        return json.loads(raw)
    except urllib.error.HTTPError as exc:
        logger.warning("Reddit search HTTP %s: %s", exc.code, exc.reason)
        return None
    except Exception as exc:
        logger.warning("Reddit search failed: %s", exc)
        return None


def _posts_from_listing(data: Dict[str, Any], max_posts: int) -> List[str]:
    out: List[str] = []
    children = (data.get("data") or {}).get("children") or []
    for child in children[:max_posts]:
        if not isinstance(child, dict):
            continue
        if child.get("kind") != "t3":
            continue
        p = child.get("data") or {}
        if not isinstance(p, dict):
            continue
        title = str(p.get("title") or "").strip()
        if not title:
            continue
        sub = str(p.get("subreddit_name_prefixed") or p.get("subreddit") or "").strip() or "r/?"
        score = p.get("score")
        selftext = str(p.get("selftext") or "").strip()
        body = (selftext[:420] + "…") if len(selftext) > 420 else selftext
        line = f"{sub} | score {score} | {title}"
        if body:
            line += f"\n{body}"
        out.append(line)
    return out


def fetch_reddit_company_evidence(
    company_name: str,
    role_hint: str = "",
    timeout: Optional[float] = None,
) -> str:
    """
    Return a plain-text block of Reddit post snippets for prompt injection, or "".
    """
    name = (company_name or "").strip()
    if len(name) < 2:
        return ""

    if os.getenv("OPENAI_MATCHFIX_REDDIT", "1").strip().lower() not in ("1", "true", "yes"):
        return ""

    t = float(os.getenv("OPENAI_MATCHFIX_REDDIT_TIMEOUT", "12") or 12) if timeout is None else float(timeout)
    limit = int(os.getenv("OPENAI_MATCHFIX_REDDIT_POST_LIMIT", "10") or 10)
    cap = int(os.getenv("OPENAI_MATCHFIX_REDDIT_SNIPPET_CHARS", "4500") or 4500)

    role = (role_hint or "").replace("-", " ").strip()[:48]
    query = f'{name} (hiring OR interview OR onsite OR "recruiter" OR offer OR layoff)'
    if role:
        query = f"({query}) ({role})"

    lines: List[str] = []
    payload = _fetch_reddit_json(query, limit=limit, timeout=max(4.0, min(t, 25.0)))
    if isinstance(payload, dict):
        lines.extend(_posts_from_listing(payload, max_posts=limit))

    if not lines:
        api_key = os.getenv("FIRECRAWL_API_KEY", "").strip()
        if api_key:
            try:
                from app.services.github.firecrawl_github_scraper import _firecrawl_scrape_markdown

                q = urllib.parse.quote(query)
                search_url = f"https://www.reddit.com/search/?q={q}&type=posts"
                md, err = _firecrawl_scrape_markdown(search_url, timeout=int(max(5, min(t, 20))))
                if md:
                    lines.append(md[: min(4000, cap)])
                elif err:
                    logger.info("Reddit Firecrawl fallback: %s", err)
            except Exception as exc:
                logger.warning("Reddit Firecrawl fallback failed: %s", exc)

    if not lines:
        return ""

    blob = "\n\n---\n\n".join(lines)
    return blob[:cap] if blob else ""

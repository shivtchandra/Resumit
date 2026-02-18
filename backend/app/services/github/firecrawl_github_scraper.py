"""
Firecrawl-powered GitHub profile scraper.

Scrapes https://github.com/{username} to extract:
  - Bio, location, follower/following counts
  - Pinned repositories (name, description, language, stars, forks)
  - Recent activity signals

Falls back gracefully if Firecrawl is unavailable or the API key is missing.
"""
import os
import re
import logging
import httpx
from typing import Optional, Any

logger = logging.getLogger(__name__)

FIRECRAWL_BASE_URL = "https://api.firecrawl.dev/v1"


def _firecrawl_scrape_markdown(url: str, timeout: int = 15) -> tuple[str, Optional[str]]:
    """
    Scrape a URL via Firecrawl and return markdown + optional error.
    """
    api_key = os.getenv("FIRECRAWL_API_KEY", "").strip()
    if not api_key:
        return "", "FIRECRAWL_API_KEY not set"

    try:
        with httpx.Client(timeout=timeout + 5) as client:
            resp = client.post(
                f"{FIRECRAWL_BASE_URL}/scrape",
                headers={
                    "Authorization": f"Bearer {api_key}",
                    "Content-Type": "application/json",
                },
                json={
                    "url": url,
                    "formats": ["markdown"],
                    "onlyMainContent": True,
                    "waitFor": 1000,
                    "timeout": timeout * 1000,
                },
            )
        resp.raise_for_status()
        data = resp.json() or {}
        markdown = ((data.get("data") or {}).get("markdown") or "").strip()
        if not markdown:
            return "", "Firecrawl returned empty content"
        return markdown, None
    except httpx.TimeoutException:
        logger.warning("Firecrawl scrape timed out for %s", url)
        return "", "Firecrawl request timed out"
    except httpx.HTTPError as exc:
        logger.warning("Firecrawl scrape failed for %s: %s", url, exc)
        return "", str(exc)


def scrape_github_profile(username: str, timeout: int = 15) -> dict:
    """
    Scrape a GitHub profile page using Firecrawl and extract structured data.

    Args:
        username: GitHub username (already validated)
        timeout:  HTTP timeout in seconds

    Returns:
        dict with keys:
            bio           (str)
            location      (str)
            followers     (int)
            following     (int)
            pinned_repos  (list[dict])  — each has name, description, language, stars, forks
            profile_url   (str)
            raw_markdown  (str)         — full markdown from Firecrawl (for debugging)
            error         (str | None)
    """
    profile_url = f"https://github.com/{username}"
    markdown, error = _firecrawl_scrape_markdown(profile_url, timeout=timeout)
    if error:
        return _empty_result(username, error)

    parsed = _parse_profile_markdown(markdown, username)
    parsed["profile_url"] = profile_url
    parsed["raw_markdown"] = markdown[:3000]   # cap for downstream use
    parsed["error"] = None
    return parsed


def scrape_github_repositories(username: str, timeout: int = 14, max_repos: int = 18) -> dict:
    """
    Scrape the GitHub repositories tab using Firecrawl and extract repo cards.
    """
    repos_url = f"https://github.com/{username}?tab=repositories"
    markdown, error = _firecrawl_scrape_markdown(repos_url, timeout=timeout)
    if error:
        return {
            "repositories": [],
            "error": error,
            "source_url": repos_url,
            "raw_markdown": "",
        }

    repositories = _extract_repositories_from_markdown(markdown, username, max_repos=max_repos)
    return {
        "repositories": repositories,
        "error": None,
        "source_url": repos_url,
        "raw_markdown": markdown[:3000],
    }


# ─────────────────────────────────────────────────────────────────────────────
# Markdown parser
# ─────────────────────────────────────────────────────────────────────────────

def _parse_profile_markdown(md: str, username: str) -> dict:
    """
    Extract structured fields from Firecrawl's markdown of a GitHub profile page.
    GitHub's rendered HTML → markdown has recognisable patterns we can regex against.
    """
    result = {
        "bio": "",
        "location": "",
        "followers": 0,
        "following": 0,
        "pinned_repos": [],
    }

    lines = md.splitlines()

    # ── Bio ──────────────────────────────────────────────────────────────────
    # Usually appears early, before pinned repos. Skip header-only lines.
    for line in lines[:40]:
        stripped = line.strip()
        if (
            stripped
            and not stripped.startswith("#")
            and not stripped.startswith("!")
            and not stripped.startswith("[")
            and username.lower() not in stripped.lower()
            and len(stripped) > 15
            and len(stripped) < 250
        ):
            result["bio"] = stripped
            break

    # ── Location ─────────────────────────────────────────────────────────────
    loc_m = re.search(r"📍\s*(.+)", md)
    if not loc_m:
        loc_m = re.search(r"(?i)location[:\s]+([^\n]{3,60})", md)
    if loc_m:
        result["location"] = loc_m.group(1).strip()

    # ── Followers / Following ─────────────────────────────────────────────────
    # GitHub renders: "X followers · Y following"  or  "followers: X"
    fol_m = re.search(r"(\d[\d,]*)\s+followers", md, re.IGNORECASE)
    if fol_m:
        result["followers"] = int(fol_m.group(1).replace(",", ""))

    fing_m = re.search(r"(\d[\d,]*)\s+following", md, re.IGNORECASE)
    if fing_m:
        result["following"] = int(fing_m.group(1).replace(",", ""))

    # ── Pinned repos ─────────────────────────────────────────────────────────
    # Firecrawl markdown of pinned repos looks like:
    #   ### username/repo-name
    #   Short description line
    #   Python  ★ 12  ⑂ 3
    #
    # We try two patterns:
    #   1. Explicit "Pinned" section heading → extract repos under it
    #   2. Repo-link pattern across the full doc
    pinned = _extract_pinned_repos(md, username)
    result["pinned_repos"] = pinned

    return result


def _extract_pinned_repos(md: str, username: str) -> list:
    """
    Try to pull pinned repo cards from Firecrawl markdown.
    Returns list of dicts: {name, description, language, stars, forks, url}
    """
    pinned = []

    # ── Strategy 1: look for "/{username}/{repo}" markdown links ─────────────
    # Pattern: [repo-name](https://github.com/username/repo-name)
    repo_link_pattern = re.compile(
        rf"\[([^\]]+)\]\(https://github\.com/{re.escape(username)}/([A-Za-z0-9_.\-]+)\)",
        re.IGNORECASE,
    )

    seen = set()
    for m in repo_link_pattern.finditer(md):
        repo_name = m.group(2)
        if repo_name.lower() == username.lower():
            continue  # skip self-link to profile
        if repo_name in seen:
            continue
        seen.add(repo_name)

        # Look for description/language/stars near this match
        start = m.start()
        snippet = md[max(0, start - 50): start + 400]
        pinned.append(_parse_repo_card(repo_name, snippet, username))

        if len(pinned) >= 6:
            break

    # ── Strategy 2: heading-style  ### username/repo ─────────────────────────
    if not pinned:
        heading_pattern = re.compile(
            rf"#{2,4}\s+{re.escape(username)}/([A-Za-z0-9_.\-]+)",
            re.IGNORECASE,
        )
        for m in heading_pattern.finditer(md):
            repo_name = m.group(1)
            if repo_name in seen:
                continue
            seen.add(repo_name)
            snippet = md[m.start(): m.start() + 400]
            pinned.append(_parse_repo_card(repo_name, snippet, username))
            if len(pinned) >= 6:
                break

    return pinned


def _extract_repositories_from_markdown(md: str, username: str, max_repos: int = 18) -> list[dict[str, Any]]:
    """
    Extract repository cards from the repositories tab markdown.
    """
    repos: list[dict[str, Any]] = []
    seen = set()
    repo_link_pattern = re.compile(
        rf"\[([^\]]+)\]\(https://github\.com/{re.escape(username)}/([A-Za-z0-9_.\-]+)\)",
        re.IGNORECASE,
    )

    for match in repo_link_pattern.finditer(md):
        repo_name = (match.group(2) or "").strip()
        if not repo_name or repo_name.lower() == username.lower():
            continue
        if repo_name in seen:
            continue
        seen.add(repo_name)

        start = match.start()
        snippet = md[max(0, start - 120): start + 650]
        repo_card = _parse_repo_card(repo_name, snippet, username)
        repo_card.update({
            "full_name": f"{username}/{repo_name}",
            "topics": _extract_topics_from_text((repo_card.get("description") or "") + " " + snippet),
            "languages": {},
            "has_readme": bool(repo_card.get("description")),
            "open_issues": 0,
            "license": None,
            "is_fork": bool(re.search(r"\bfork\b", snippet, re.IGNORECASE)),
            "created_at": None,
            "updated_at": None,
            "pushed_at": _extract_updated_at_iso(snippet),
            "size": 0,
            "homepage": None,
            "watchers": repo_card.get("stars", 0),
        })
        repos.append(repo_card)
        if len(repos) >= max_repos:
            break

    return repos


def _extract_topics_from_text(text: str) -> list[str]:
    tokens = re.findall(r"[A-Za-z0-9#+.\-]{2,}", (text or "").lower())
    # Keep only technical/domain signals to avoid noisy tokens like "updated/on/oct".
    allowed = {
        "react", "reactjs", "typescript", "javascript", "node", "nodejs", "express",
        "python", "java", "go", "rust", "c++", "c#", "sql", "postgres", "postgresql",
        "mysql", "mongodb", "docker", "kubernetes", "aws", "gcp", "azure",
        "fastapi", "django", "flask", "spring", "graphql", "rest", "api",
        "ml", "ai", "tensorflow", "pytorch", "nlp", "llm", "rag",
        "streamlit", "nextjs", "tailwind", "vite", "prisma", "redis",
        "devops", "ci", "cd", "cicd", "jenkins", "terraform",
    }
    alias = {
        "react.js": "react",
        "node.js": "nodejs",
        "next.js": "nextjs",
        "ci/cd": "cicd",
    }
    topics: list[str] = []
    seen = set()
    for token in tokens:
        norm = alias.get(token, token)
        if norm not in allowed:
            continue
        if norm in seen:
            continue
        seen.add(norm)
        topics.append(norm)
        if len(topics) >= 8:
            break
    return topics


def _extract_updated_at_iso(snippet: str) -> Optional[str]:
    """
    Parse 'Updated on Mon DD, YYYY' patterns from markdown snippets.
    """
    m = re.search(r"Updated\s+on\s+([A-Za-z]{3,9}\s+\d{1,2},\s+\d{4})", snippet, re.IGNORECASE)
    if not m:
        return None
    raw = m.group(1).strip()
    try:
        from datetime import datetime
        dt = datetime.strptime(raw, "%b %d, %Y")
    except ValueError:
        try:
            from datetime import datetime
            dt = datetime.strptime(raw, "%B %d, %Y")
        except ValueError:
            return None
    return dt.isoformat()


def _parse_repo_card(repo_name: str, snippet: str, username: str) -> dict:
    """Extract description, language, stars, forks from a repo card snippet."""
    card: dict = {
        "name": repo_name,
        "description": "",
        "language": "",
        "stars": 0,
        "forks": 0,
        "url": f"https://github.com/{username}/{repo_name}",
    }

    # Stars — ★ 12  or  12 stars
    stars_m = re.search(r"[★\*⭐]\s*(\d+)|(\d+)\s+stars?", snippet, re.IGNORECASE)
    if stars_m:
        card["stars"] = int(stars_m.group(1) or stars_m.group(2))

    # Forks — ⑂ 3  or  3 forks
    forks_m = re.search(r"[⑂⎇]\s*(\d+)|(\d+)\s+forks?", snippet, re.IGNORECASE)
    if forks_m:
        card["forks"] = int(forks_m.group(1) or forks_m.group(2))

    # Language — usually a capitalised word on its own line near the card
    lang_m = re.search(
        r"\b(Python|JavaScript|TypeScript|Java|Go|Rust|C\+\+|C#|Ruby|Swift|Kotlin|"
        r"HTML|CSS|Shell|Scala|R|MATLAB|Dart|Lua|Elixir|Haskell|PHP)\b",
        snippet,
    )
    if lang_m:
        card["language"] = lang_m.group(1)

    # Description — first non-blank, non-heading, non-link line after repo name
    for line in snippet.splitlines():
        stripped = line.strip()
        if (
            stripped
            and not stripped.startswith("#")
            and not stripped.startswith("[")
            and not stripped.startswith("!")
            and repo_name not in stripped
            and username not in stripped
            and len(stripped) > 8
            and len(stripped) < 180
            and not re.match(r"^[\★⭐⑂⎇\d]", stripped)
        ):
            card["description"] = stripped
            break

    return card


def _empty_result(username: str, error: str) -> dict:
    return {
        "bio": "",
        "location": "",
        "followers": 0,
        "following": 0,
        "pinned_repos": [],
        "profile_url": f"https://github.com/{username}",
        "raw_markdown": "",
        "error": error,
    }

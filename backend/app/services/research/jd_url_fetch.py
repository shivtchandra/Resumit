"""
Resolve a job-description form field: plain text unchanged, or fetch when the value is a single http(s) URL.

Uses Firecrawl when configured (better for JS-heavy boards); otherwise a simple HTTP GET with HTML stripped.
"""
from __future__ import annotations

import ipaddress
import logging
import os
import re
from typing import Optional
from urllib.parse import urlparse

logger = logging.getLogger(__name__)

_URL_LINE = re.compile(r"^https?://\S+$", re.IGNORECASE)


def _blocked_url(url: str) -> bool:
    try:
        p = urlparse(url)
    except Exception:
        return True
    if p.scheme not in ("http", "https") or not p.netloc:
        return True
    host = (p.hostname or "").lower()
    if host in frozenset(
        {
            "localhost",
            "127.0.0.1",
            "0.0.0.0",
            "::1",
            "metadata.google.internal",
            "169.254.169.254",
        }
    ):
        return True
    try:
        ip = ipaddress.ip_address(host)
        if ip.is_private or ip.is_loopback or ip.is_link_local or ip.is_multicast or ip.is_reserved:
            return True
    except ValueError:
        pass
    return False


def _extract_single_url(raw: str) -> Optional[str]:
    """If the field is only one line and it is an http(s) URL, return it; else None."""
    text = (raw or "").strip()
    if not text or len(text) > 4096:
        return None
    lines = [ln.strip() for ln in text.splitlines() if ln.strip()]
    if len(lines) != 1:
        return None
    cand = lines[0]
    if not _URL_LINE.match(cand):
        return None
    if _blocked_url(cand):
        raise ValueError("That URL cannot be fetched (blocked host). Paste the job text instead.")
    return cand


def _strip_html_to_text(html: str, max_chars: int) -> str:
    s = re.sub(r"(?is)<script[^>]*>.*?</script>", " ", html)
    s = re.sub(r"(?is)<style[^>]*>.*?</style>", " ", s)
    s = re.sub(r"(?is)<noscript[^>]*>.*?</noscript>", " ", s)
    s = re.sub(r"<[^>]+>", " ", s)
    s = re.sub(r"\s+", " ", s).strip()
    return s[:max_chars]


def _fetch_via_firecrawl(url: str, timeout: int) -> str:
    try:
        from app.services.github.firecrawl_github_scraper import _firecrawl_scrape_markdown
    except Exception as exc:  # pragma: no cover
        logger.debug("Firecrawl import failed: %s", exc)
        return ""
    md, err = _firecrawl_scrape_markdown(url, timeout=min(timeout, 45))
    if err:
        logger.info("JD URL Firecrawl: %s", err)
    return (md or "").strip()


def _fetch_via_http(url: str, timeout: float) -> str:
    try:
        import httpx
    except ImportError:
        raise ValueError(
            "Could not fetch the job URL (httpx unavailable). Paste the job description text, "
            "or set FIRECRAWL_API_KEY for reliable scraping."
        ) from None
    headers = {
        "User-Agent": os.getenv(
            "JD_URL_FETCH_USER_AGENT",
            "Mozilla/5.0 (compatible; ResumeIntel/1.0; +https://github.com/) AppleWebKit/537.36",
        ),
        "Accept": "text/html,application/xhtml+xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
    }
    max_bytes = int(os.getenv("JD_URL_FETCH_MAX_BYTES", "2000000") or 2000000)
    max_chars = int(os.getenv("JD_URL_MAX_CHARS", "120000") or 120000)
    chunks: list[bytes] = []
    ctype = ""
    with httpx.Client(follow_redirects=True, timeout=timeout) as client:
        with client.stream("GET", url, headers=headers) as resp:
            resp.raise_for_status()
            ctype = (resp.headers.get("content-type") or "").lower()
            total = 0
            for chunk in resp.iter_bytes():
                if not chunk:
                    continue
                chunks.append(chunk)
                total += len(chunk)
                if total >= max_bytes:
                    break
    raw_bytes = b"".join(chunks)
    text = raw_bytes.decode("utf-8", errors="replace")
    if "html" in ctype or text.lstrip().lower().startswith("<!doctype") or "<html" in text[:2000].lower():
        text = _strip_html_to_text(text, max_chars)
    else:
        text = text.strip()[:max_chars]
    return text


def resolve_job_description_if_url(raw: str) -> str:
    """
    Return job description text. If `raw` is a single public http(s) URL, fetch and return page text/markdown.

    Raises:
        ValueError: URL-only input but fetch failed or body empty.
    """
    stripped = (raw or "").strip()
    if not stripped:
        return ""

    url = _extract_single_url(stripped)
    if not url:
        return stripped

    timeout = float(os.getenv("JD_URL_FETCH_TIMEOUT", "28") or 28)
    timeout = max(5.0, min(timeout, 60.0))
    max_chars = int(os.getenv("JD_URL_MAX_CHARS", "120000") or 120000)

    body = ""
    if os.getenv("FIRECRAWL_API_KEY", "").strip():
        body = _fetch_via_firecrawl(url, timeout=int(timeout))
        if len(body) > max_chars:
            body = body[:max_chars]

    if len(body) < 200:
        try:
            http_body = _fetch_via_http(url, timeout=timeout)
            if len(http_body) > len(body):
                body = http_body[:max_chars]
        except Exception as exc:
            if not body:
                logger.warning("JD URL fetch failed for %s: %s", url, exc)
                raise ValueError(
                    "Could not fetch that job URL (site may block bots or require login). "
                    "Paste the full job description text, or set FIRECRAWL_API_KEY for better extraction."
                ) from exc

    body = (body or "").strip()
    if len(body) < 80:
        raise ValueError(
            "The job URL returned very little text (login wall or empty page). "
            "Paste the job description manually or try FIRECRAWL_API_KEY."
        )
    return f"[Fetched from job posting URL]\n{body}"

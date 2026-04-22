/**
 * Resumit — Universal JD Content Script
 * Detects the job description on any job board using platform-specific
 * selectors first, then a smart keyword-proximity fallback.
 * Must be plain JS (not TypeScript) — runs verbatim in the page.
 */

(function () {
  let lastUrl = location.href;
  // Notify background on SPA navigation (LinkedIn, Wellfound etc.)
  const observer = new MutationObserver(() => {
    if (location.href !== lastUrl) {
      lastUrl = location.href;
      chrome.runtime.sendMessage({ type: 'URL_CHANGED', url: lastUrl });
    }
  });
  if (document.body) {
    observer.observe(document.body, { childList: true, subtree: true });
  } else {
    document.addEventListener('DOMContentLoaded', function () {
      observer.observe(document.body, { childList: true, subtree: true });
    });
  }

  chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
    if (msg.type === 'PING_JD') {
      try {
        const jd = extractJD();
        sendResponse({ jd, url: location.href });
      } catch (e) {
        sendResponse({ jd: '', url: location.href, error: String(e && e.message) });
      }
      return true;
    }
  });

  function extractJD() {
    const url = location.href;

    const platformSelectors = {
      'linkedin.com': [
        '.jobs-description__content .jobs-box__html-content',
        '.jobs-description',
        '.job-view-layout .jobs-description-content__text',
      ],
      'indeed.com': ['#jobDescriptionText', '.jobsearch-jobDescriptionText'],
      'greenhouse.io': ['#content', '#app_body .section-wrapper'],
      'lever.co': ['.posting-description', '.section-wrapper'],
      'workday.com': ['[data-automation-id="jobPostingDescription"]'],
      'myworkdayjobs.com': ['[data-automation-id="jobPostingDescription"]'],
      'wellfound.com': [
        '[class*="jobListing"] [class*="description"]',
        '[class*="job-description"]',
        '[class*="jobDescription"]',
        '[data-test="job-description"]',
        '.styles_description__',
        'div[class*="Description"]',
      ],
      'angel.co': [
        '[class*="jobListing"] [class*="description"]',
        '[class*="job-description"]',
      ],
      'jobs.ashbyhq.com': ['.ashby-job-posting-brief-description', '[class*="Content"]'],
      'boards.greenhouse.io': ['#content'],
      'apply.workable.com': ['.styles--jobDetails--', '[class*="description"]'],
      'careers.': ['[class*="job-description"]', '[class*="description-content"]'],
    };

    const matchedKey = Object.keys(platformSelectors).find((k) => url.includes(k));
    if (matchedKey) {
      for (const sel of platformSelectors[matchedKey]) {
        try {
          const el = document.querySelector(sel);
          if (el && el.innerText && el.innerText.trim().length > 80) {
            return cleanText(el.innerText);
          }
        } catch (_e) {
          /* bad selector, skip */
        }
      }
    }

    return smartFallback();
  }

  function smartFallback() {
    const JD_SIGNALS = [
      'responsibilities',
      'requirements',
      'qualifications',
      "what you'll do",
      "what we're looking for",
      'about the role',
      'about this role',
      'you will',
      "you'll",
      'we are looking',
      "we're looking",
      'ideal candidate',
      'role overview',
      'job description',
      'minimum qualifications',
      'preferred qualifications',
      'experience with',
      'experience in',
      'years of experience',
    ];

    const allBlocks = Array.from(
      document.querySelectorAll(
        'div, section, article, main, [class*="description"], [class*="content"], [class*="detail"]'
      )
    );

    const scored = allBlocks
      .filter((el) => {
        const text = (el.innerText && el.innerText.trim()) || '';
        return text.length > 200 && text.length < 20000;
      })
      .map((el) => {
        const text = el.innerText.trim().toLowerCase();
        const score = JD_SIGNALS.reduce((acc, sig) => acc + (text.includes(sig) ? 1 : 0), 0);
        return { el, text: el.innerText.trim(), score, len: el.innerText.trim().length };
      })
      .filter((b) => b.score > 0)
      .sort((a, b) => {
        const lenScoreA = a.len > 500 && a.len < 8000 ? 2 : 1;
        const lenScoreB = b.len > 500 && b.len < 8000 ? 2 : 1;
        return b.score * lenScoreB - a.score * lenScoreA;
      });

    if (scored.length > 0) return cleanText(scored[0].text);

    const biggest = allBlocks
      .filter((el) => {
        const t = (el.innerText && el.innerText.trim()) || '';
        return t.length > 300 && t.length < 15000;
      })
      .sort((a, b) => b.innerText.length - a.innerText.length)[0];

    return biggest ? cleanText(biggest.innerText.trim()) : '';
  }

  function cleanText(text) {
    return text
      .replace(/\n{3,}/g, '\n\n')
      .replace(/[ \t]{2,}/g, ' ')
      .trim();
  }
})();

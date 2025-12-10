import re

def extract_email(text):
    email_regex = r'[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}'
    match = re.search(email_regex, text)
    return match.group(0) if match else None

def extract_phone(text):
    # Basic phone regex, can be improved
    phone_regex = r'\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}'
    match = re.search(phone_regex, text)
    return match.group(0) if match else None

def count_keywords(text, keywords):
    text_lower = text.lower()
    count = 0
    for kw in keywords:
        if kw.lower() in text_lower:
            count += 1
    return count

def detect_sections(text):
    """
    Detects standard sections based on common headers.
    Returns a list of detected sections.
    """
    standard_headers = [
        "experience", "work history", "employment",
        "education", "academic",
        "skills", "technical skills", "competencies",
        "projects",
        "summary", "profile", "objective"
    ]
    
    detected = []
    text_lower = text.lower()
    # Simple check: if the header exists as a line or near a newline
    # This is a heuristic; a real parser would check for bold/caps/newlines.
    for header in standard_headers:
        if re.search(r'(^|\n)\s*' + re.escape(header) + r'\s*($|:|\n)', text_lower, re.MULTILINE):
            detected.append(header)
            
    return list(set(detected))

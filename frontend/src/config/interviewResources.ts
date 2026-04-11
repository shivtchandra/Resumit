/**
 * Verified URL lookup table for interview prep resources.
 * The AI generates resource names dynamically; this table resolves them to real URLs.
 * Update this file to add/remove resources — no prompt changes needed.
 */

export interface ResourceEntry {
    url: string;
    icon: 'youtube' | 'code' | 'users' | 'cloud' | 'book' | 'list' | 'map';
}

export const RESOURCE_URLS: Record<string, ResourceEntry> = {
    // YouTube — Coding & DSA
    'NeetCode':           { url: 'https://www.youtube.com/@NeetCode', icon: 'youtube' },
    'TakeUForward':       { url: 'https://www.youtube.com/@takeUforward', icon: 'youtube' },
    'Striver':            { url: 'https://www.youtube.com/@takeUforward', icon: 'youtube' },
    'Back To Back SWE':   { url: 'https://www.youtube.com/@BackToBackSWE', icon: 'youtube' },
    'William Fiset':      { url: 'https://www.youtube.com/@WilliamFiset-videos', icon: 'youtube' },
    'CS Dojo':            { url: 'https://www.youtube.com/@CSDojo', icon: 'youtube' },
    'AlgoMaster':         { url: 'https://www.youtube.com/@AlgoMaster', icon: 'youtube' },
    'freeCodeCamp':       { url: 'https://www.youtube.com/@freecodecamp', icon: 'youtube' },

    // YouTube — System Design
    'Gaurav Sen':         { url: 'https://www.youtube.com/@gaborsen', icon: 'youtube' },
    'ByteByteGo':         { url: 'https://www.youtube.com/@ByteByteGo', icon: 'youtube' },
    'Exponent':           { url: 'https://www.youtube.com/@tryexponent', icon: 'youtube' },
    'Hussein Nasser':     { url: 'https://www.youtube.com/@haborsen', icon: 'youtube' },
    'CodeKarle':          { url: 'https://www.youtube.com/@codeKarle', icon: 'youtube' },
    'Hello Interview':    { url: 'https://www.youtube.com/@hello_interview', icon: 'youtube' },

    // YouTube — Behavioral & Career
    'Jeff Su':            { url: 'https://www.youtube.com/@JeffSu', icon: 'youtube' },
    'Andrew LaCivita':    { url: 'https://www.youtube.com/@AndrewLaCivita', icon: 'youtube' },

    // Practice platforms
    'LeetCode':           { url: 'https://leetcode.com/', icon: 'code' },
    'HackerRank':         { url: 'https://www.hackerrank.com/', icon: 'code' },
    'NeetCode Practice':  { url: 'https://neetcode.io/practice', icon: 'code' },
    'NeetCode Roadmap':   { url: 'https://neetcode.io/roadmap', icon: 'map' },
    'Striver SDE Sheet':  { url: 'https://takeuforward.org/interviews/strivers-sde-sheet-top-coding-interview-problems/', icon: 'list' },

    // Mock interviews
    'Pramp':              { url: 'https://www.pramp.com/', icon: 'users' },
    'Interviewing.io':    { url: 'https://interviewing.io/', icon: 'users' },

    // Cloud & Certification prep
    'AWS Skill Builder':  { url: 'https://skillbuilder.aws/', icon: 'cloud' },
    'AWS Cloud Quest':    { url: 'https://aws.amazon.com/training/digital/aws-cloud-quest/', icon: 'cloud' },
    'Google Cloud Skills': { url: 'https://www.cloudskillsboost.google/', icon: 'cloud' },
    'Google Cloud Skills Boost': { url: 'https://www.cloudskillsboost.google/', icon: 'cloud' },
    'KodeKloud':          { url: 'https://kodekloud.com/', icon: 'cloud' },

    // Reading & reference
    'Tech Interview Handbook': { url: 'https://www.techinterviewhandbook.org/', icon: 'book' },
    'System Design Primer':    { url: 'https://github.com/donnemartin/system-design-primer', icon: 'book' },
};

/**
 * Resolve an AI-recommended resource name to a verified URL.
 * Uses case-insensitive substring matching as fallback.
 */
export function resolveResource(name: string): ResourceEntry | null {
    // Exact match first
    if (RESOURCE_URLS[name]) return RESOURCE_URLS[name];

    // Case-insensitive substring match
    const lower = name.toLowerCase();
    const key = Object.keys(RESOURCE_URLS).find(k => lower.includes(k.toLowerCase()) || k.toLowerCase().includes(lower));
    return key ? RESOURCE_URLS[key] : null;
}

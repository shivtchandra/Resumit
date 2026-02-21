import axios from 'axios';
import type { AnalysisResult, BackendAnalysisResponse, FullRewriteResult, BrutalRewriteResult, InterviewAnswerScoreResult } from '../types';

const PROD_FALLBACK_API_BASE_URL = 'https://resume-backend.onrender.com';
const DEFAULT_API_BASE_URL = import.meta.env.DEV ? 'http://localhost:8000' : PROD_FALLBACK_API_BASE_URL;
const RAW_API_BASE_URL = (import.meta.env.VITE_API_URL || DEFAULT_API_BASE_URL).trim();
const API_BASE_URL = RAW_API_BASE_URL ? RAW_API_BASE_URL.replace(/\/api\/v1\/?$/, '') : '';

export const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Additional Types
export interface Template {
    template_id: string;
    name: string;
    role: string;
    experience_level: string;
    ats_compatibility: string[];
    ats_success_rate: number;
    download_url: string;
    preview_image_url?: string;
    description?: string;
}

export interface RewriteResult {
    original: string;
    rewritten: string | null;
    improvements: string[];
    status: 'success' | 'fallback';
    provider?: 'gemini' | 'openai';
    prompt?: string;
}

export interface AnalysisOptions {
    targetRole?: string;
    targetATS?: string;
    analysisMode?: 'jd_or_general' | 'jd_only' | 'general_only';
    feedbackTone?: 'brutal' | 'professional';
    companyName?: string;
    githubUsername?: string;
    linkedinText?: string;
    githubToken?: string;
}

const mapLegacyAnalysisResponse = (file: File, data: BackendAnalysisResponse): AnalysisResult => {
    if (!data.features || !data.friendliness) {
        throw new Error('Unexpected legacy analysis response format');
    }

    const features = data.features;
    const friendliness = data.friendliness;
    const relevance = data.relevance;

    return {
        filename: file.name,
        file_size_bytes: file.size,
        word_count: features.word_count,
        friendliness_score: friendliness.score,
        match_score: relevance?.score,
        relevance_score: relevance?.score,
        vendor_compatibility: {
            taleo: { status: features.risk_flags.includes('TALEO_TABLE_RISK') ? 'fail' : 'pass', issues: [] },
            workday: { status: features.risk_flags.includes('WORKDAY_PARSING_RISK') ? 'fail' : 'pass', issues: [] },
            greenhouse: { status: 'pass', issues: [] },
            icims: { status: features.risk_flags.includes('ICIMS_FRAGMENTATION_RISK') ? 'fail' : 'pass', issues: [] }
        },
        critical_issues: friendliness.issues.map((issue) => ({
            severity: issue.penalty > 10 ? 'critical' : 'warning',
            type: issue.type,
            title: issue.type.replace(/_/g, ' '),
            description: issue.message,
            fix_suggestions: []
        })),
        ats_extracted: {
            skills: features.ner_skills || [],
            job_titles: [],
            education: [],
            contact: [
                features.email_found ? 'Email Detected' : 'No Email',
                features.phone_found ? 'Phone Detected' : 'No Phone'
            ],
            raw_text: features.raw_text || 'No text extracted'
        },
        timeline: {
            jobs: features.timeline?.jobs?.map((job: { title?: string; company?: string; start_date?: string; end_date?: string }) => ({
                role: job.title || '',
                company: job.company || '',
                startDate: job.start_date || '',
                endDate: job.end_date || ''
            })) || [],
            gaps: features.timeline?.gaps || []
        },
        recommendations: friendliness.advice || [],
        visibility_breakdown: relevance ? {
            semantic_score: relevance.semantic_score,
            keyword_score: relevance.keyword_score,
            level: relevance.level
        } : undefined,
        missing_keywords: relevance?.missing_keywords || [],
        ai_insights: data.ai_insights
    };
};

const normalizeTimeline = (timeline: BackendAnalysisResponse['timeline']): AnalysisResult['timeline'] => {
    if (!timeline) return undefined;

    const jobs = (timeline.jobs || []).map((job: Record<string, unknown>) => ({
        role: String(job.role || job.title || ''),
        company: String(job.company || ''),
        startDate: String(job.startDate || job.start_date || job.start || ''),
        endDate: String(job.endDate || job.end_date || job.end || ''),
    }));

    return {
        jobs,
        gaps: timeline.gaps || [],
    };
};

const mapModernAnalysisResponse = (file: File, data: BackendAnalysisResponse): AnalysisResult => {
    const recommendations = (data.recommendations || []).map((item) => {
        if (typeof item === 'string') {
            return item;
        }
        return item.message || 'Recommendation available';
    });

    return {
        filename: data.filename || file.name,
        file_size_bytes: data.file_size_bytes || file.size,
        word_count: data.word_count || 0,
        friendliness_score: data.friendliness_score || 0,
        match_score: data.match_score || undefined,
        relevance_score: data.match_score || undefined,
        analysis_summary: data.analysis_summary,
        vendor_compatibility: data.vendor_compatibility || {},
        critical_issues: data.critical_issues || [],
        ats_extracted: data.ats_extracted || {
            skills: [],
            job_titles: [],
            education: [],
            contact: [],
            raw_text: ''
        },
        timeline: normalizeTimeline(data.timeline),
        recommendations,
        visibility_breakdown: data.visibility_breakdown,
        missing_keywords: data.missing_keywords,
        roast_report: data.roast_report,
        roast_markdown: data.roast_markdown,
        content_decisions: data.content_decisions,
        external_profile_intel: data.external_profile_intel,
        interview_prep: data.interview_prep,
        top_actions: data.top_actions,
        score_calibration: data.score_calibration,
        beginner_checklist: data.beginner_checklist,
        comprehensive_analysis: data.comprehensive_analysis,
    };
};

// Analysis API
// Uses an async job pattern: POST /analyze/full returns a job_id immediately,
// then we poll GET /analyze/status/{job_id} until done.  This sidesteps
// Render's hard 30-second HTTP request timeout on the free/starter tier.
export const analyzeResume = async (
    file: File,
    jobDescription?: string,
    targetRoleOrOptions?: string | AnalysisOptions,
    targetATS?: string
): Promise<AnalysisResult> => {
    const options: AnalysisOptions = typeof targetRoleOrOptions === 'string'
        ? { targetRole: targetRoleOrOptions, targetATS }
        : (targetRoleOrOptions || {});

    const formData = new FormData();
    formData.append('file', file);
    if (jobDescription) formData.append('job_description', jobDescription);
    if (options.targetRole) formData.append('target_role', options.targetRole);
    if (options.targetATS) formData.append('target_ats', options.targetATS);
    if (options.analysisMode) formData.append('analysis_mode', options.analysisMode);
    if (options.feedbackTone) formData.append('feedback_tone', options.feedbackTone);
    if (options.companyName) formData.append('company_name', options.companyName);
    if (options.githubUsername) formData.append('github_username', options.githubUsername);
    if (options.linkedinText) formData.append('linkedin_text', options.linkedinText);
    if (options.githubToken) formData.append('github_token', options.githubToken);

    // Step 1: Enqueue the job — this returns in <1s
    const enqueueResponse = await api.post<{ job_id: string; status: string }>(
        '/api/v1/analyze/full',
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' }, timeout: 0 }
    );
    const jobId = enqueueResponse.data.job_id;
    if (!jobId) throw new Error('Server did not return a job_id.');

    // Step 2: Poll until done
    const POLL_INTERVAL_MS = 3000;
    while (true) {
        await new Promise<void>((res) => setTimeout(res, POLL_INTERVAL_MS));

        let statusResponse;
        try {
            statusResponse = await api.get<{
                status: 'pending' | 'done' | 'error';
                result?: BackendAnalysisResponse;
                error?: string;
            }>(`/api/v1/analyze/status/${jobId}`, { timeout: 0 });
        } catch (error) {
            const message = error instanceof Error ? error.message.toLowerCase() : '';
            // Keep polling on transient network hiccups.
            if (message.includes('timed out') || message.includes('no response from server')) {
                continue;
            }
            throw error;
        }

        const { status, result, error } = statusResponse.data;

        if (status === 'error') {
            throw new Error(error || 'Analysis failed on the server.');
        }

        if (status === 'done' && result) {
            if (typeof result.friendliness_score === 'number') {
                return mapModernAnalysisResponse(file, result);
            }
            return mapLegacyAnalysisResponse(file, result);
        }
        // status === 'pending' → keep polling
    }

};

// Templates API
const mockTemplates: Template[] = [
    {
        template_id: 'mock-1',
        name: 'Modern Professional',
        role: 'Software Engineer',
        experience_level: 'Mid',
        ats_compatibility: ['taleo', 'workday', 'greenhouse'],
        ats_success_rate: 0.95,
        download_url: '#',
        description: 'Clean, ATS-optimized template for software engineers'
    },
    {
        template_id: 'mock-2',
        name: 'Executive Leader',
        role: 'Product Manager',
        experience_level: 'Senior',
        ats_compatibility: ['workday', 'greenhouse', 'icims'],
        ats_success_rate: 0.92,
        download_url: '#',
        description: 'Professional template for senior product managers'
    },
    {
        template_id: 'mock-3',
        name: 'Data Science Pro',
        role: 'Data Scientist',
        experience_level: 'Mid',
        ats_compatibility: ['taleo', 'greenhouse', 'icims'],
        ats_success_rate: 0.94,
        download_url: '#',
        description: 'Technical template optimized for data science roles'
    },
    {
        template_id: 'mock-4',
        name: 'Creative Designer',
        role: 'Designer',
        experience_level: 'Entry',
        ats_compatibility: ['workday', 'greenhouse'],
        ats_success_rate: 0.88,
        download_url: '#',
        description: 'Modern template for design professionals'
    },
    {
        template_id: 'mock-5',
        name: 'Marketing Specialist',
        role: 'Marketing',
        experience_level: 'Mid',
        ats_compatibility: ['taleo', 'workday', 'icims'],
        ats_success_rate: 0.91,
        download_url: '#',
        description: 'Professional template for marketing roles'
    },
    {
        template_id: 'mock-6',
        name: 'Senior Engineer',
        role: 'Software Engineer',
        experience_level: 'Senior',
        ats_compatibility: ['taleo', 'workday', 'greenhouse', 'icims'],
        ats_success_rate: 0.97,
        download_url: '#',
        description: 'Premium template for senior engineering positions'
    }
];

export const getTemplates = async (params?: { role?: string; ats_vendor?: string; experience_level?: string }): Promise<Template[]> => {
    try {
        const response = await api.get('/api/v1/templates/recommend', { params });
        const data = response.data;
        const templateList = Array.isArray(data) ? data : data.templates;

        if (!Array.isArray(templateList)) {
            return [];
        }

        return templateList.map((template: {
            id?: string;
            template_id?: string;
            name: string;
            role: string;
            experience_level: string;
            ats_vendors?: string[];
            ats_compatibility?: string[];
            ats_success_rate: number;
            file_url?: string;
            download_url?: string;
            preview_image_url?: string;
            description?: string;
        }) => ({
            template_id: template.id || template.template_id || '',
            name: template.name,
            role: template.role,
            experience_level: template.experience_level,
            ats_compatibility: template.ats_compatibility || template.ats_vendors || [],
            ats_success_rate: template.ats_success_rate,
            download_url: template.download_url || template.file_url || '#',
            preview_image_url: template.preview_image_url,
            description: template.description,
        }));
    } catch {
        let filtered = [...mockTemplates];

        if (params?.role) {
            filtered = filtered.filter(t => t.role === params.role);
        }
        if (params?.ats_vendor) {
            const atsVendor = params.ats_vendor;
            filtered = filtered.filter(t => t.ats_compatibility.includes(atsVendor));
        }
        if (params?.experience_level) {
            filtered = filtered.filter(t => t.experience_level === params.experience_level);
        }

        return filtered;
    }
};

export const getTemplateDetails = async (templateId: string) => {
    const response = await api.get(`/api/v1/templates/${templateId}`);
    return response.data;
};

export const exportTemplate = async (
    templateId: string,
    userData: Record<string, unknown>
): Promise<{ download_url: string }> => {
    const response = await api.post('/api/v1/templates/export', {
        template_id: templateId,
        user_data: userData,
    });
    return response.data;
};

// Rewrite API
export const rewriteSection = async (data: {
    layout_schema?: Record<string, unknown>;
    section_index?: number;
    section?: string;
    content?: string;
    job_description?: string;
    target_keywords?: string[];
    ats_rules?: string[];
}): Promise<RewriteResult> => {
    const response = await api.post<RewriteResult>('/api/v1/rewrite/section', data);
    return response.data;
};

export const rewriteFullResume = async (
    file: File,
    jobDescription: string,
    userId: string = 'anonymous'
): Promise<FullRewriteResult> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('job_description', jobDescription);
    formData.append('user_id', userId);

    const response = await api.post<FullRewriteResult>('/api/v1/rewrite/full', formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    });
    return response.data;
};

// Health Check
export const healthCheck = async (): Promise<{ status: string; version: string }> => {
    const response = await api.get('/health');
    return response.data;
};

// Custom error class for rate limiting
export class RateLimitError extends Error {
    isRateLimit: true = true;
    retryAfter: number;
    constructor(retryAfter = 60) {
        super('RATE_LIMITED');
        this.name = 'RateLimitError';
        this.retryAfter = retryAfter;
    }
}

// Error handling interceptor
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.code === 'ERR_CANCELED') {
            throw new Error('Request canceled by user.');
        }
        if (error.code === 'ECONNABORTED') {
            throw new Error('Request timed out. Please retry in a moment.');
        }
        if (error.response) {
            // Detect rate limit (429) and throw typed error
            if (error.response.status === 429) {
                const detail = error.response.data?.detail;
                const retryAfter =
                    (typeof detail === 'object' ? detail?.retry_after_seconds : null) || 60;
                throw new RateLimitError(retryAfter);
            }
            const detail = error.response.data?.detail;
            const message =
                typeof detail === 'object' ? detail?.message || JSON.stringify(detail) : detail || error.response.statusText;
            throw new Error(message);
        } else if (error.request) {
            throw new Error('No response from server. Please check if the backend is running.');
        } else {
            throw new Error(error.message);
        }
    }
);

export default api;


// Brutal Review API
export const rewriteWithBrutalFeedback = async (
    file: File,
    jobDescription: string,
    companyName?: string,
    userId: string = 'anonymous',
    signal?: AbortSignal
): Promise<BrutalRewriteResult> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('job_description', jobDescription);
    if (companyName) formData.append('company_name', companyName);
    formData.append('user_id', userId);

    const response = await api.post<BrutalRewriteResult>('/api/v1/rewrite/brutal', formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
        // Render cold starts + AI rewrite can exceed 90s on first hit.
        timeout: 150000,
        signal,
    });
    return response.data;
};

// GitHub Analysis API
export const analyzeGitHubRepos = async (
    githubUsername: string,
    jobRole: string,
    options?: {
        jobDescription?: string;
        pinnedRepos?: string;
        useAI?: boolean;
        githubToken?: string;
    }
): Promise<import('../types/github').GitHubAnalysisResult> => {
    const formData = new FormData();
    formData.append('github_username', githubUsername);
    formData.append('job_role', jobRole);
    if (options?.jobDescription) formData.append('job_description', options.jobDescription);
    if (options?.pinnedRepos) formData.append('pinned_repos', options.pinnedRepos);
    if (typeof options?.useAI === 'boolean') formData.append('use_ai', String(options.useAI));
    if (options?.githubToken) formData.append('github_token', options.githubToken);

    const response = await api.post<import('../types/github').GitHubAnalysisResult>(
        '/api/v1/github/analyze',
        formData,
        {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
            timeout: 45000,
        }
    );
    return response.data;
};

export const scoreInterviewAnswer = async (payload: {
    question: string;
    answer: string;
    company_name?: string;
    target_role?: string;
    job_description?: string;
}): Promise<InterviewAnswerScoreResult> => {
    const response = await api.post<InterviewAnswerScoreResult>('/api/v1/analyze/interview/score', payload);
    return response.data;
};

import axios from 'axios';
import type { AnalysisResult, BackendAnalysisResponse, FullRewriteResult, BrutalRewriteResult } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

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

// Analysis API
export const analyzeResume = async (
    file: File,
    jobDescription?: string,
    targetRole?: string,
    targetATS?: string
): Promise<AnalysisResult> => {
    const formData = new FormData();
    formData.append('file', file);
    if (jobDescription) formData.append('job_description', jobDescription);
    if (targetRole) formData.append('target_role', targetRole);
    if (targetATS) formData.append('target_ats', targetATS);

    const response = await api.post<BackendAnalysisResponse>('/analyze', formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    });

    const data = response.data;

    // Map backend response to AnalysisResult
    return {
        filename: file.name,
        file_size_bytes: file.size,
        word_count: data.features.word_count,
        friendliness_score: data.friendliness.score,
        match_score: data.relevance?.score,
        vendor_compatibility: {
            taleo: { status: data.features.risk_flags.includes('TALEO_TABLE_RISK') ? 'fail' : 'pass', issues: [] },
            workday: { status: data.features.risk_flags.includes('WORKDAY_PARSING_RISK') ? 'fail' : 'pass', issues: [] },
            greenhouse: { status: 'pass', issues: [] },
            icims: { status: data.features.risk_flags.includes('ICIMS_FRAGMENTATION_RISK') ? 'fail' : 'pass', issues: [] }
        },
        critical_issues: data.friendliness.issues.map((issue: any) => ({
            severity: issue.penalty > 10 ? 'critical' : 'warning',
            type: issue.type,
            title: issue.type.replace(/_/g, ' '),
            description: issue.message,
            fix_suggestions: []
        })),
        ats_extracted: {
            skills: data.features.ner_skills || [],
            job_titles: [], // Backend doesn't return this yet
            education: [], // Backend doesn't return this yet
            contact: [
                data.features.email_found ? 'Email Detected' : 'No Email',
                data.features.phone_found ? 'Phone Detected' : 'No Phone'
            ],
            raw_text: data.features.raw_text || 'No text extracted'
        },
        timeline: {
            jobs: data.features.timeline?.jobs?.map((job: any) => ({
                role: job.title,
                company: job.company,
                startDate: job.start_date,
                endDate: job.end_date
            })) || [],
            gaps: data.features.timeline?.gaps || []
        },
        recommendations: data.friendliness.advice || [],
        visibility_breakdown: data.relevance ? {
            semantic_score: data.relevance.semantic_score,
            keyword_score: data.relevance.keyword_score,
            level: data.relevance.level
        } : undefined,
        missing_keywords: data.relevance?.missing_keywords || [],
        ai_insights: data.ai_insights
    };
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
        return response.data;
    } catch {
        // Return mock data if backend is unavailable
        console.warn('Backend unavailable, using mock template data');
        let filtered = [...mockTemplates];

        if (params?.role) {
            filtered = filtered.filter(t => t.role === params.role);
        }
        if (params?.ats_vendor) {
            filtered = filtered.filter(t => t.ats_compatibility.includes(params.ats_vendor!));
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
    const response = await api.post('/templates/export', {
        template_id: templateId,
        user_data: userData,
    });
    return response.data;
};

// Rewrite API
// Rewrite API
export const rewriteSection = async (data: {
    layout_schema?: Record<string, unknown>;
    section_index?: number;
    section?: string; // Legacy support
    content?: string; // Legacy support
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

// Error handling interceptor
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response) {
            // Server responded with error
            const message = error.response.data?.detail || error.response.statusText;
            throw new Error(message);
        } else if (error.request) {
            // Request made but no response
            throw new Error('No response from server. Please check if the backend is running.');
        } else {
            // Error in request setup
            throw new Error(error.message);
        }
    }
);

export default api;


// Brutal Review API
export const rewriteWithBrutalFeedback = async (
    file: File,
    jobDescription: string,
    userId: string = 'anonymous'
): Promise<BrutalRewriteResult> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('job_description', jobDescription);
    formData.append('user_id', userId);

    const response = await api.post<BrutalRewriteResult>('/api/v1/rewrite/brutal', formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    });
    return response.data;
};

// GitHub Analysis API
export const analyzeGitHubRepos = async (
    githubUsername: string,
    jobRole: string,
    jobDescription?: string
): Promise<import('../types/github').GitHubAnalysisResult> => {
    const formData = new FormData();
    formData.append('github_username', githubUsername);
    formData.append('job_role', jobRole);
    if (jobDescription) formData.append('job_description', jobDescription);

    const response = await api.post<import('../types/github').GitHubAnalysisResult>(
        '/api/v1/github/analyze',
        formData,
        {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        }
    );
    return response.data;
};


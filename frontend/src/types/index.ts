// Backend API Response Types
export interface AnalysisResult {
    filename: string;
    file_size_bytes: number;
    word_count: number;
    friendliness_score: number;
    match_score?: number;
    vendor_compatibility: {
        [key: string]: {
            status: 'pass' | 'warning' | 'fail';
            issues: string[];
        };
    };
    critical_issues: Array<{
        severity: 'critical' | 'warning' | 'info';
        type: string;
        title: string;
        description: string;
        fix_suggestions: string[];
    }>;
    ats_extracted: {
        skills: string[];
        job_titles: string[];
        education: string[];
        contact: string[];
        raw_text: string;
    };
    timeline?: {
        jobs: TimelineItem[];
        gaps: Array<Record<string, unknown>>;
    };
    recommendations: string[];
    visibility_breakdown?: Record<string, unknown>;
    original_text?: string;
    rewritten_text?: string;
    comprehensive_analysis?: {
        missing_keywords: string[];
        missing_technical_skills: string[];
        missing_soft_skills: string[];
        certification_recommendations: Array<{
            name: string;
            provider: string;
            relevance: string;
            impact: string;
        }>;
        actionable_recommendations: string[];
    };
    missing_keywords?: string[];
    ai_insights?: {
        executive_summary: string;
        strengths: string[];
        gaps: string[];
        tactical_actions: string[];
    };
}

export interface TimelineItem {
    role: string;
    company: string;
    startDate: string;
    endDate: string;
    description?: string;
    [key: string]: unknown;
}

export interface BackendAnalysisResponse {
    features: {
        email_found: boolean;
        phone_found: boolean;
        section_count: number;
        detected_sections: string[];
        z_order_score: number;
        floating_objects: number;
        is_image_based: boolean;
        risk_flags: string[];
        word_count: number;
        raw_text: string;
        ner_skills: string[];
        ner_entities: Record<string, unknown>;
        predicted_category: string;
        category_confidence: number;
        timeline: {
            jobs: TimelineItem[];
            gaps: Array<Record<string, unknown>>;
        };
    };
    friendliness: {
        score: number;
        risk_level: string;
        issues: Array<{
            type: string;
            penalty: number;
            message: string;
        }>;
        advice: string[];
        model_type: string;
    };
    relevance: {
        score: number;
        semantic_score: number;
        keyword_score: number;
        level: string;
        missing_keywords?: string[];
    } | null;
    ai_insights?: {
        executive_summary: string;
        strengths: string[];
        gaps: string[];
        tactical_actions: string[];
    };
}

// Legacy types (kept for backward compatibility)
export interface ResumeFeatures {
    email_found: boolean;
    phone_found: boolean;
    section_count: number;
    detected_sections: string[];
    z_order_score: number;
    floating_objects: number;
    is_image_based: boolean;
    risk_flags: string[];
    word_count: number;
    ner_skills: string[];
    predicted_category: string;
    category_confidence: number;
    timeline: {
        gaps: Array<Record<string, unknown>>;
        total_experience_years: number;
        has_gaps: boolean;
        timeline_score: number;
        date_count: number;
    };
}

export interface FriendlinessResult {
    score: number;
    risk_level: 'ATS_FRIENDLY' | 'MODERATE_RISK' | 'HIGH_RISK';
    issues: Array<{
        type: string;
        penalty: number;
        message: string;
    }>;
    advice: string[];
}

export interface RelevanceResult {
    score: number;
    semantic_score: number;
    keyword_score: number;
    level: 'HIGH_MATCH' | 'GOOD_MATCH' | 'MODERATE_MATCH' | 'LOW_MATCH';
    missing_keywords?: string[];
}

export interface FullRewriteResult {
    before_score: number;
    after_score: number;
    before_friendliness: number;
    after_friendliness: number;
    file_url: string;
    docx_path?: string;
    pdf_path?: string;
    original_text?: string;
    rewritten_text?: string;
    delta_report: {
        total_changes: number;
        keywords_added: string[];
        keywords_added_count: number;
        score_improvement: number;
        friendliness_improvement: number;
        keywords_before: number;
        keywords_after: number;
    };
    explanations: string[];
}

// Brutal Review Types
export interface Change {
    section: string;
    type: 'added' | 'removed' | 'rewritten';
    before: string;
    after: string;
    reason: string;
    jd_signal: string;
}

export interface CompanyExpectations {
    role_summary: string;
    what_the_company_cares_about: string[];
    ideal_candidate_snapshot: string[];
}

export interface MissingSkill {
    skill: string;
    why_it_matters: string;
    how_to_build_it: string;
    success_story?: string;
}

export interface ActionItem {
    action: string;
    how_to_do_it: string;
    resources: string[];
    time_estimate: string;
    what_helped_others: string;
}

export interface HarshReview {
    overall_verdict: string;
    strengths: string[];
    weaknesses: string[];
    missing_or_weak_skills: MissingSkill[];
    risk_flags: string[];
    would_I_interview_you: 'yes' | 'no' | 'maybe';
    rationale: string;
    top_3_actions: ActionItem[];
}

export interface BrutalRewriteResult {
    plain_text: string;
    marked_up_resume: string;
    changes: Change[];
    company_expectations: CompanyExpectations;
    harsh_review: HarshReview;
    original_text: string;
}

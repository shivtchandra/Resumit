// Backend API Response Types
export interface AnalysisResult {
    filename: string;
    file_size_bytes: number;
    word_count: number;
    friendliness_score: number;
    match_score?: number;
    relevance_score?: number;
    analysis_summary?: {
        mode: string;
        tone: string;
        generation_mode?: 'ai' | 'heuristic' | string;
        candidate_name?: string;
        overall_score: number;
        ats_score: number;
        jd_fit_score?: number | null;
        ats_score_raw?: number | null;
    };
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
    roast_report?: {
        strengths: string[];
        weaknesses: string[];
        hard_truths: string[];
        priority_fixes: string[];
        needs_fixing?: string[];
        resume_loopholes?: string[];
        should_remove?: string[];
        what_is_good_rich?: Array<Record<string, unknown>>;
        what_is_bad_rich?: Array<Record<string, unknown>>;
        hard_truths_rich?: Array<Record<string, unknown>>;
        priority_fixes_rich?: Array<Record<string, unknown>>;
        role_fit_verdict?: {
            best_fit_roles: string[];
            weak_fit_roles: string[];
            verdict: string;
        };
    };
    content_decisions?: {
        keep: string[];
        rewrite: string[];
        remove: string[];
        proof_needed: string[];
    };
    external_profile_intel?: {
        github_best_projects: Array<{
            name: string;
            rank?: number;
            score: number;
            reason: string;
            resume_bullet?: string;
            resume_keep_note?: string;
            language?: string;
            stars?: number;
            url?: string;
        }>;
        github_drop_projects: Array<{
            name: string;
            rank?: number;
            score: number;
            reason: string;
            resume_action?: string;
        }>;
        github_summary: string;
        linkedin_must_include: string[];
        linkedin_remove: string[];
        linkedin_summary: string;
        detected_github_url?: string;
        detected_linkedin_url?: string;
        detected_github_username?: string;
        extracted_profile_urls?: string[];
    };
    interview_prep?: {
        company: string;
        likely_questions: Array<{
            category: string;
            question: string;
            why_asked: string;
            prep_tip: string;
            answer_framework?: string;
            sample_answer?: string;
        }>;
        prep_plan: string[];
    };
    top_actions?: string[];
    score_calibration?: {
        raw_score: number;
        adjusted_score: number;
        total_penalty: number;
        penalties: Array<{
            reason: string;
            penalty: number;
        }>;
    };
    beginner_checklist?: {
        role: string;
        readiness_score: number;
        gate_status: 'pass' | 'warning' | 'fail';
        must_fix_before_apply: string[];
        checklist: Array<{
            id: string;
            label: string;
            required: boolean;
            passed: boolean;
            why_it_matters: string;
            how_to_fix: string;
        }>;
    };
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
            url?: string;
        }>;
        actionable_recommendations: string[];
        action_plan?: Array<{
            title: string;
            priority: string;
            effort: string;
            why: string;
            steps: string[];
            example: string;
        }>;
        sample_resume_upgrades?: Array<{
            area: string;
            before: string;
            after: string;
            reason: string;
            placement?: string;
        }>;
        project_domain_coverage?: Array<{
            project: string;
            domains: string[];
            evidence?: string;
            positioning_tip?: string;
            // enriched fields from AI
            project_name?: string;
            primary_domain?: string;
            domain_tags?: string[];
            tech_stack?: string[];
            complexity_signal?: 'Low' | 'Mid' | 'High';
            complexity_reason?: string;
            what_is_good?: string;
            what_is_missing?: string;
            rewritten_bullet?: string;
        }>;
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
    filename?: string;
    file_size_bytes?: number;
    word_count?: number;
    friendliness_score?: number;
    match_score?: number | null;
    analysis_summary?: AnalysisResult["analysis_summary"];
    vendor_compatibility?: AnalysisResult["vendor_compatibility"];
    critical_issues?: AnalysisResult["critical_issues"];
    ats_extracted?: AnalysisResult["ats_extracted"];
    timeline?: AnalysisResult["timeline"];
    recommendations?: Array<{ type?: string; message?: string } | string>;
    visibility_breakdown?: Record<string, unknown>;
    missing_keywords?: string[];
    roast_report?: AnalysisResult["roast_report"];
    content_decisions?: AnalysisResult["content_decisions"];
    external_profile_intel?: AnalysisResult["external_profile_intel"];
    interview_prep?: AnalysisResult["interview_prep"];
    top_actions?: string[];
    score_calibration?: AnalysisResult["score_calibration"];
    beginner_checklist?: AnalysisResult["beginner_checklist"];
    comprehensive_analysis?: AnalysisResult["comprehensive_analysis"];

    // Legacy payload
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
    type: 'added' | 'removed' | 'rewritten' | 'add' | 'remove' | 'rewrite';
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
    generation_mode?: 'ai' | 'hybrid' | 'fallback' | string;
    warnings?: string[];
    interview_prep?: {
        company: string;
        likely_questions: Array<{
            category: 'resume_deep_dive' | 'jd_alignment' | 'company_fit' | string;
            question: string;
            why_asked: string;
            prep_tip: string;
            answer_framework?: string;
            sample_answer?: string;
        }>;
        prep_plan: string[];
    };
    original_text: string;
}

export interface InterviewAnswerScoreResult {
    score: number;
    band: 'weak' | 'average' | 'good' | 'strong' | string;
    strengths: string[];
    improvements: string[];
    improved_answer: string;
    evaluation_mode: 'ai' | 'heuristic' | string;
}

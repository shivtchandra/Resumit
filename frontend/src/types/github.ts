// GitHub repository analysis types

export interface GitHubRepository {
    name: string;
    full_name: string;
    description: string;
    url: string;
    homepage: string | null;
    language: string | null;
    languages: Record<string, number>;
    topics: string[];
    stars: number;
    forks: number;
    watchers: number;
    created_at: string | null;
    updated_at: string | null;
    pushed_at: string | null;
    size: number;
    is_fork: boolean;
    has_readme: boolean;
    open_issues: number;
    license: string | null;
    relevance_score?: number;
    relevance_details?: {
        language_match: number;
        topic_match: number;
        description_match: number;
        quality_score: number;
    };
    why_relevant?: string;
    suggested_resume_text?: string;
    ai_enhanced?: boolean;
    first_impression?: string;
    can_they_code?: string;
    problem_solving?: string;
    tech_stack_fit?: string;
    passion_and_effort?: string;
    interview_worthy?: boolean;
    strengths?: string[];
    red_flags?: string[];
    interview_questions?: string[];
    improvement_advice?: string[];
    match_level?: 'high' | 'medium' | 'low';
}

export interface GitHubAnalysisResult {
    username: string;
    total_repos: number;
    analyzed_repos: number;
    job_role: string;
    ai_used?: boolean;
    analysis_mode?: 'ai' | 'heuristic';
    top_repositories: GitHubRepository[];
    all_repositories: GitHubRepository[];
    insights: {
        primary_languages: string[];
        expertise_areas: string[];
        total_stars: number;
        most_starred_repo: string | null;
        total_repos: number;
        repos_with_readme: number;
        average_stars: number;
    };
    rate_limit: {
        limit: number;
        remaining: number;
        reset_at: string | null;
        used: number;
    };
}

// src/types/assessment.ts

export interface MCQuestion {
    id: number;
    question: string;
    options: string[];
    correct_answer: number;
    skill: string;
    difficulty: string;
    explanation: string;
}

export interface SAQuestion {
    id: number;
    question: string;
    sample_answer: string;
    skill: string;
    difficulty: string;
}

export interface CaseStudy {
    id: number;
    title: string;
    scenario: string;
    questions: string[];
    skills: string[];
    difficulty: string;
}

export interface AptitudeQuestion {
    id: number;
    question: string;
    correct_answer: string;
    explanation: string;
}

export interface SkillCoverage {
    skill_name: string;
    question_count: number;
    coverage_percentage: number;
    quality: string;
}

export interface AssessmentResult {
    assessment_id: string;
    role_name: string;
    target_skills: string[];
    difficulty_level: 'easy' | 'medium' | 'hard';
    mcqs: MCQuestion[];
    saqs: SAQuestion[];
    case_study: CaseStudy;
    aptitude_questions: AptitudeQuestion[];
    skill_coverage: SkillCoverage[];
    total_questions: number;
    estimated_duration_minutes: number;
    created_at?: string;
    updated_at?: string;
    is_published?: boolean;
}

export interface GenerateAssessmentRequest {
    role: string;
    skills: string[];
    difficulty: 'easy' | 'medium' | 'hard';
}

export interface UpdateAssessmentRequest {
    assessment_id: string;
    role_name: string;
    target_skills: string[];
    difficulty_level: 'easy' | 'medium' | 'hard';
    mcqs: MCQuestion[];
    saqs: SAQuestion[];
    case_study: CaseStudy | null;
    aptitude_questions: AptitudeQuestion[];
    skill_coverage: SkillCoverage[];
    total_questions: number;
    estimated_duration_minutes: number;
}

export interface AssessmentStatus {
    assessment_id: string;
    status: 'generating' | 'completed' | 'failed';
    progress_percentage: number;
    current_step: string;
    estimated_completion_seconds: number;
    error_message?: string;
}

export interface AssessmentListItem {
    assessment_id: string;
    role_name: string;
    target_skills: string[];
    difficulty_level: string;
    total_questions: number;
    estimated_duration_minutes: number;
    created_by_email: string;
    created_at: string;
    updated_at: string;
    is_published: boolean;
    deployed_courses_count: number;
}

export interface DeployAssessmentRequest {
    assessment_id: string;
    course_id: number;
}

export interface Course {
    id: number;
    name: string;
}
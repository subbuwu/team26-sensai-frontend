export interface MCQuestion {
  id: number;
  question: string;
  options: string[];
  correct_answer: number; // Index of correct option (0-3)
  skill: string;
  difficulty: 'easy' | 'medium' | 'hard';
  explanation: string;
}

export interface SAQuestion {
  id: number;
  question: string;
  sample_answer: string;
  skill: string;
  difficulty: 'easy' | 'medium' | 'hard';
}

export interface CaseStudy {
  id: number;
  title: string;
  scenario: string;
  questions: string[];
  skills: string[];
  difficulty: 'easy' | 'medium' | 'hard';
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
  quality: 'excellent' | 'good' | 'adequate' | 'insufficient';
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
}

// Request types for the API
export interface GenerateAssessmentRequest {
  role: string;
  skills: string[];
  difficulty: 'easy' | 'medium' | 'hard';
}

export interface GenerateAssessmentResponse extends AssessmentResult {}

// Status types (for compatibility with polling frontend)
export interface AssessmentStatus {
  assessment_id: string;
  status: 'generating' | 'completed' | 'failed';
  progress_percentage: number;
  current_step: string;
  estimated_completion_seconds: number;
  error_message?: string;
  completed_at?: string;
}

// Utility types for frontend components
export type QuestionType = 'mcq' | 'saq' | 'case' | 'aptitude';

export interface QuestionBreakdown {
  mcqs: number;
  saqs: number;
  case_study_questions: number;
  aptitude_questions: number;
}

export interface AssessmentSummary {
  assessment_id: string;
  role_name: string;
  target_skills: string[];
  difficulty_level: string;
  total_questions: number;
  estimated_duration_minutes: number;
  question_breakdown: QuestionBreakdown;
  skill_coverage: SkillCoverage[];
  status: string;
}

// Error handling types
export interface AssessmentError {
  message: string;
  code?: string;
  details?: any;
}

// Frontend state management types
export interface AssessmentGenerationState {
  isLoading: boolean;
  isGenerating: boolean;
  currentAssessment: AssessmentResult | null;
  error: AssessmentError | null;
  generationProgress: number;
}

// Form validation types
export interface AssessmentFormData {
  role: string;
  skills: string[];
  difficulty: 'easy' | 'medium' | 'hard';
}

export interface FormValidationErrors {
  role?: string;
  skills?: string;
  difficulty?: string;
  general?: string;
}

// API response wrapper types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp?: string;
}

// Utility functions types
export type CoverageQuality = SkillCoverage['quality'];
export type DifficultyLevel = AssessmentResult['difficulty_level'];

// Constants for frontend use
export const QUESTION_TYPES: Record<QuestionType, string> = {
  mcq: 'Multiple Choice',
  saq: 'Short Answer',
  case: 'Case Study',
  aptitude: 'Aptitude'
};

export const DIFFICULTY_LEVELS: Record<DifficultyLevel, string> = {
  easy: 'Easy',
  medium: 'Medium', 
  hard: 'Hard'
};

export const COVERAGE_QUALITY_LABELS: Record<CoverageQuality, string> = {
  excellent: 'Excellent',
  good: 'Good',
  adequate: 'Adequate',
  insufficient: 'Insufficient'
};

// Type guards for runtime type checking
export const isAssessmentResult = (obj: any): obj is AssessmentResult => {
  return (
    typeof obj === 'object' &&
    typeof obj.assessment_id === 'string' &&
    typeof obj.role_name === 'string' &&
    Array.isArray(obj.target_skills) &&
    typeof obj.difficulty_level === 'string' &&
    Array.isArray(obj.mcqs) &&
    Array.isArray(obj.saqs) &&
    typeof obj.case_study === 'object' &&
    Array.isArray(obj.aptitude_questions) &&
    Array.isArray(obj.skill_coverage) &&
    typeof obj.total_questions === 'number' &&
    typeof obj.estimated_duration_minutes === 'number'
  );
};

export const isMCQuestion = (obj: any): obj is MCQuestion => {
  return (
    typeof obj === 'object' &&
    typeof obj.id === 'number' &&
    typeof obj.question === 'string' &&
    Array.isArray(obj.options) &&
    typeof obj.correct_answer === 'number' &&
    typeof obj.skill === 'string' &&
    typeof obj.difficulty === 'string' &&
    typeof obj.explanation === 'string'
  );
};

export const isValidDifficulty = (difficulty: string): difficulty is DifficultyLevel => {
  return ['easy', 'medium', 'hard'].includes(difficulty);
};

export const isValidCoverageQuality = (quality: string): quality is CoverageQuality => {
  return ['excellent', 'good', 'adequate', 'insufficient'].includes(quality);
};

// Default values for initialization
export const DEFAULT_ASSESSMENT_STATE: AssessmentGenerationState = {
  isLoading: false,
  isGenerating: false,
  currentAssessment: null,
  error: null,
  generationProgress: 0
};

export const DEFAULT_FORM_DATA: AssessmentFormData = {
  role: '',
  skills: [],
  difficulty: 'medium'
};

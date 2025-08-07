"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import {
    ChevronDown,
    ChevronUp,
    Clock,
    Target,
    BookOpen,
    BarChart3,
    Check,
    AlertCircle,
    Eye,
    Layers,

    Brain
} from "lucide-react";
import { AssessmentResult, } from "@/types/assessment";

export default function AssessmentPreviewPage() {
    const params = useParams();
    const assessmentId = params?.id as string;
    
    const [assessment, setAssessment] = useState<AssessmentResult | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
        overview: true,
        mcqs: true,
        saqs: true,
        case_study: true,
        aptitude: true,
        coverage: true
    });

    useEffect(() => {
        if (assessmentId) {
            fetchAssessment();
        }
    }, [assessmentId]);

    const fetchAssessment = async () => {
        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/role_assessment/${assessmentId}`);
            
            if (response.ok) {
                const data = await response.json();
                setAssessment(data);
            } else if (response.status === 404) {
                setError("Assessment not found");
            } else {
                throw new Error('Failed to fetch assessment');
            }
        } catch (error) {
            console.error('Error fetching assessment:', error);
            setError("Failed to load assessment");
        } finally {
            setIsLoading(false);
        }
    };

    const toggleSection = (section: string) => {
        setExpandedSections(prev => ({
            ...prev,
            [section]: !prev[section]
        }));
    };

    const getCoverageQualityColor = (quality: string) => {
        switch (quality) {
            case 'excellent': return 'text-green-400 bg-green-400/10 border-green-400/30';
            case 'good': return 'text-blue-400 bg-blue-400/10 border-blue-400/30';
            case 'adequate': return 'text-yellow-400 bg-yellow-400/10 border-yellow-400/30';
            case 'insufficient': return 'text-red-400 bg-red-400/10 border-red-400/30';
            default: return 'text-gray-400 bg-gray-400/10 border-gray-400/30';
        }
    };

    const getDifficultyColor = (difficulty: string) => {
        switch (difficulty) {
            case 'easy': return 'bg-green-600/20 text-green-400';
            case 'medium': return 'bg-yellow-600/20 text-yellow-400';
            case 'hard': return 'bg-red-600/20 text-red-400';
            default: return 'bg-gray-600/20 text-gray-400';
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-black text-white flex items-center justify-center">
                <div className="text-center">
                    <div className="w-12 h-12 border-t-2 border-b-2 border-purple-600 rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-gray-400">Loading assessment...</p>
                </div>
            </div>
        );
    }

    if (error || !assessment) {
        return (
            <div className="min-h-screen bg-black text-white flex items-center justify-center">
                <div className="text-center max-w-md">
                    <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
                    <h2 className="text-2xl font-bold text-white mb-2">Assessment Not Found</h2>
                    <p className="text-gray-400">{error || "This assessment does not exist or has been removed."}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-black text-white">
            {/* Header */}
            <header className="border-b border-gray-800 bg-black/50 backdrop-blur-sm sticky top-0 z-10">
                <div className="container mx-auto px-4 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <Image
                                src="/images/sensai-logo.svg"
                                alt="SensAI Logo"
                                width={120}
                                height={40}
                                className="w-[100px] h-auto"
                                priority
                            />
                            <div className="h-8 w-px bg-gray-700" />
                            <span className="text-sm text-gray-400">Assessment Preview</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Eye className="w-5 h-5 text-gray-400" />
                            <span className="text-sm text-gray-400">Public Preview</span>
                        </div>
                    </div>
                </div>
            </header>

            <div className="container mx-auto px-4 py-8 max-w-5xl">
                {/* Hero Section */}
                <div className="bg-gradient-to-r from-purple-900/20 to-blue-900/20 border border-purple-800/30 rounded-2xl p-8 mb-8">
                    <div className="flex items-start justify-between mb-6">
                        <div>
                            <h1 className="text-4xl font-bold text-white mb-2">
                                {assessment.role_name} Assessment
                            </h1>
                            <p className="text-gray-400 text-lg">
                                Comprehensive evaluation of skills and competencies
                            </p>
                        </div>
                        <span className={`px-4 py-2 rounded-lg text-sm font-medium ${getDifficultyColor(assessment.difficulty_level)}`}>
                            {assessment.difficulty_level.toUpperCase()}
                        </span>
                    </div>

                    {/* Quick Stats */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="bg-black/30 rounded-lg p-4 text-center">
                            <BookOpen className="w-8 h-8 text-purple-400 mx-auto mb-2" />
                            <div className="text-2xl font-bold text-white">{assessment.total_questions}</div>
                            <div className="text-xs text-gray-400">Questions</div>
                        </div>
                        <div className="bg-black/30 rounded-lg p-4 text-center">
                            <Clock className="w-8 h-8 text-blue-400 mx-auto mb-2" />
                            <div className="text-2xl font-bold text-white">{assessment.estimated_duration_minutes}</div>
                            <div className="text-xs text-gray-400">Minutes</div>
                        </div>
                        <div className="bg-black/30 rounded-lg p-4 text-center">
                            <Target className="w-8 h-8 text-green-400 mx-auto mb-2" />
                            <div className="text-2xl font-bold text-white">{assessment.target_skills.length}</div>
                            <div className="text-xs text-gray-400">Skills</div>
                        </div>
                        <div className="bg-black/30 rounded-lg p-4 text-center">
                            <BarChart3 className="w-8 h-8 text-yellow-400 mx-auto mb-2" />
                            <div className="text-2xl font-bold text-white">4</div>
                            <div className="text-xs text-gray-400">Sections</div>
                        </div>
                    </div>
                </div>

                {/* Skills Overview */}
                <div className="bg-[#111111] rounded-xl border border-gray-800 p-6 mb-6">
                    <h2 className="text-xl font-semibold text-white mb-4 flex items-center">
                        <Layers className="w-5 h-5 mr-2 text-purple-400" />
                        Skills Assessed
                    </h2>
                    <div className="flex flex-wrap gap-2">
                        {assessment.target_skills.map((skill, index) => (
                            <span
                                key={index}
                                className="px-4 py-2 bg-purple-600/20 border border-purple-600/30 text-purple-300 rounded-lg text-sm font-medium"
                            >
                                {skill}
                            </span>
                        ))}
                    </div>
                </div>

                {/* Question Sections */}
                <div className="space-y-6">
                    {/* MCQs Section */}
                    {assessment.mcqs && assessment.mcqs.length > 0 && (
                        <div className="bg-[#111111] rounded-xl border border-gray-800 overflow-hidden">
                            <button
                                onClick={() => toggleSection('mcqs')}
                                className="w-full p-6 flex items-center justify-between hover:bg-gray-900/50 transition-colors"
                            >
                                <div className="flex items-center">
                                    <div className="w-10 h-10 bg-purple-600/20 rounded-lg flex items-center justify-center mr-4">
                                        <span className="text-purple-400 font-bold">{assessment.mcqs.length}</span>
                                    </div>
                                    <h3 className="text-xl font-semibold text-white">Multiple Choice Questions</h3>
                                </div>
                                {expandedSections.mcqs ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
                            </button>
                            
                            {expandedSections.mcqs && (
                                <div className="p-6 pt-0 space-y-4">
                                    {assessment.mcqs.map((q, idx) => (
                                        <div key={q.id} className="bg-gray-800/30 rounded-lg p-5">
                                            <div className="flex items-start justify-between mb-3">
                                                <span className="bg-purple-600/20 text-purple-400 px-2 py-1 rounded text-xs font-medium">
                                                    Q{idx + 1}
                                                </span>
                                                <div className="flex gap-2">
                                                    <span className="bg-blue-600/20 text-blue-400 px-2 py-1 rounded text-xs">
                                                        {q.skill}
                                                    </span>
                                                    <span className={`px-2 py-1 rounded text-xs ${getDifficultyColor(q.difficulty)}`}>
                                                        {q.difficulty}
                                                    </span>
                                                </div>
                                            </div>
                                            <p className="text-white font-medium mb-3">{q.question}</p>
                                            <div className="space-y-2">
                                                {q.options.map((option, optIdx) => (
                                                    <div
                                                        key={optIdx}
                                                        className={`p-3 rounded-lg text-sm border ${
                                                            optIdx === q.correct_answer
                                                                ? 'bg-green-600/10 border-green-600/30 text-green-300'
                                                                : 'bg-gray-700/30 border-gray-600 text-gray-300'
                                                        }`}
                                                    >
                                                        <span className="font-medium mr-2">{String.fromCharCode(65 + optIdx)}.</span>
                                                        {option}
                                                        {optIdx === q.correct_answer && (
                                                            <Check className="w-4 h-4 text-green-400 float-right mt-0.5" />
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                            {q.explanation && (
                                                <div className="mt-3 p-3 bg-blue-600/10 border border-blue-600/20 rounded-lg">
                                                    <p className="text-xs text-blue-400 font-medium mb-1">💡 Explanation</p>
                                                    <p className="text-blue-300 text-sm">{q.explanation}</p>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* SAQs Section */}
                    {assessment.saqs && assessment.saqs.length > 0 && (
                        <div className="bg-[#111111] rounded-xl border border-gray-800 overflow-hidden">
                            <button
                                onClick={() => toggleSection('saqs')}
                                className="w-full p-6 flex items-center justify-between hover:bg-gray-900/50 transition-colors"
                            >
                                <div className="flex items-center">
                                    <div className="w-10 h-10 bg-blue-600/20 rounded-lg flex items-center justify-center mr-4">
                                        <span className="text-blue-400 font-bold">{assessment.saqs.length}</span>
                                    </div>
                                    <h3 className="text-xl font-semibold text-white">Short Answer Questions</h3>
                                </div>
                                {expandedSections.saqs ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
                            </button>
                            
                            {expandedSections.saqs && (
                                <div className="p-6 pt-0 space-y-4">
                                    {assessment.saqs.map((q, idx) => (
                                        <div key={q.id} className="bg-gray-800/30 rounded-lg p-5">
                                            <div className="flex items-start justify-between mb-3">
                                                <span className="bg-blue-600/20 text-blue-400 px-2 py-1 rounded text-xs font-medium">
                                                    Q{idx + 1}
                                                </span>
                                                <div className="flex gap-2">
                                                    <span className="bg-purple-600/20 text-purple-400 px-2 py-1 rounded text-xs">
                                                        {q.skill}
                                                    </span>
                                                    <span className={`px-2 py-1 rounded text-xs ${getDifficultyColor(q.difficulty)}`}>
                                                        {q.difficulty}
                                                    </span>
                                                </div>
                                            </div>
                                            <p className="text-white font-medium mb-3">{q.question}</p>
                                            <div className="bg-gray-700/30 border border-gray-600 rounded-lg p-4">
                                                <p className="text-xs text-gray-400 font-medium mb-2">Sample Answer:</p>
                                                <p className="text-gray-300 text-sm leading-relaxed">{q.sample_answer}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Case Study Section */}
                    {assessment.case_study && (
                        <div className="bg-[#111111] rounded-xl border border-gray-800 overflow-hidden">
                            <button
                                onClick={() => toggleSection('case_study')}
                                className="w-full p-6 flex items-center justify-between hover:bg-gray-900/50 transition-colors"
                            >
                                <div className="flex items-center">
                                    <div className="w-10 h-10 bg-green-600/20 rounded-lg flex items-center justify-center mr-4">
                                        <Brain className="w-6 h-6 text-green-400" />
                                    </div>
                                    <h3 className="text-xl font-semibold text-white">Case Study</h3>
                                </div>
                                {expandedSections.case_study ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
                            </button>
                            
                            {expandedSections.case_study && (
                                <div className="p-6 pt-0">
                                    <div className="bg-gray-800/30 rounded-lg p-6">
                                        <h4 className="text-xl font-semibold text-white mb-3">{assessment.case_study.title}</h4>
                                        <div className="mb-4">
                                            <span className={`px-2 py-1 rounded text-xs ${getDifficultyColor(assessment.case_study.difficulty)}`}>
                                                {assessment.case_study.difficulty}
                                            </span>
                                        </div>
                                        <div className="bg-gray-700/30 border border-gray-600 rounded-lg p-4 mb-4">
                                            <p className="text-gray-300 leading-relaxed">{assessment.case_study.scenario}</p>
                                        </div>
                                        <div className="space-y-3">
                                            <h5 className="text-sm font-medium text-gray-400 uppercase tracking-wider">Questions to Consider:</h5>
                                            {assessment.case_study.questions.map((question, index) => (
                                                <div key={index} className="bg-gray-700/20 border border-gray-600 rounded-lg p-4">
                                                    <div className="flex items-start space-x-3">
                                                        <span className="bg-green-600/20 text-green-400 px-2 py-1 rounded text-xs font-medium">
                                                            {index + 1}
                                                        </span>
                                                        <p className="text-white">{question}</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                        <div className="mt-4 flex flex-wrap gap-2">
                                            {assessment.case_study.skills.map((skill, index) => (
                                                <span key={index} className="bg-blue-600/20 text-blue-400 px-2 py-1 rounded text-xs">
                                                    {skill}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Aptitude Questions Section */}
                    {assessment.aptitude_questions && assessment.aptitude_questions.length > 0 && (
                        <div className="bg-[#111111] rounded-xl border border-gray-800 overflow-hidden">
                            <button
                                onClick={() => toggleSection('aptitude')}
                                className="w-full p-6 flex items-center justify-between hover:bg-gray-900/50 transition-colors"
                            >
                                <div className="flex items-center">
                                    <div className="w-10 h-10 bg-yellow-600/20 rounded-lg flex items-center justify-center mr-4">
                                        <span className="text-yellow-400 font-bold">{assessment.aptitude_questions.length}</span>
                                    </div>
                                    <h3 className="text-xl font-semibold text-white">Aptitude Questions</h3>
                                </div>
                                {expandedSections.aptitude ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
                            </button>
                            
                            {expandedSections.aptitude && (
                                <div className="p-6 pt-0 space-y-4">
                                    {assessment.aptitude_questions.map((q, idx) => (
                                        <div key={q.id} className="bg-gray-800/30 rounded-lg p-5">
                                            <div className="flex items-start justify-between mb-3">
                                                <span className="bg-yellow-600/20 text-yellow-400 px-2 py-1 rounded text-xs font-medium">
                                                    Q{idx + 1}
                                                </span>
                                            </div>
                                            <p className="text-white font-medium mb-3">{q.question}</p>
                                            <div className="bg-green-600/10 border border-green-600/30 rounded-lg p-3 mb-3">
                                                <p className="text-xs text-green-400 font-medium mb-1">Answer:</p>
                                                <p className="text-green-300">{q.correct_answer}</p>
                                            </div>
                                            {q.explanation && (
                                                <div className="bg-blue-600/10 border border-blue-600/20 rounded-lg p-3">
                                                    <p className="text-xs text-blue-400 font-medium mb-1">💡 Explanation</p>
                                                    <p className="text-blue-300 text-sm">{q.explanation}</p>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Skill Coverage Analysis */}
                    {assessment.skill_coverage && assessment.skill_coverage.length > 0 && (
                        <div className="bg-[#111111] rounded-xl border border-gray-800 overflow-hidden">
                            <button
                                onClick={() => toggleSection('coverage')}
                                className="w-full p-6 flex items-center justify-between hover:bg-gray-900/50 transition-colors"
                            >
                                <div className="flex items-center">
                                    <BarChart3 className="w-5 h-5 mr-3 text-purple-400" />
                                    <h3 className="text-xl font-semibold text-white">Skill Coverage Analysis</h3>
                                </div>
                                {expandedSections.coverage ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
                            </button>
                            
                            {expandedSections.coverage && (
                                <div className="p-6 pt-0">
                                    <div className="space-y-3">
                                        {assessment.skill_coverage.map((coverage, index) => (
                                            <div key={index} className="bg-gray-800/30 rounded-lg p-4">
                                                <div className="flex items-center justify-between mb-2">
                                                    <span className="font-medium text-white">{coverage.skill_name}</span>
                                                    <div className="flex items-center gap-3">
                                                        <span className="text-sm text-gray-400">
                                                            {coverage.question_count} questions
                                                        </span>
                                                        <span className={`px-2 py-1 rounded text-xs font-medium border ${getCoverageQualityColor(coverage.quality)}`}>
                                                            {coverage.quality}
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className="w-full bg-gray-700 rounded-full h-2 overflow-hidden">
                                                    <div 
                                                        className="bg-gradient-to-r from-purple-600 to-blue-600 h-2 rounded-full transition-all duration-300"
                                                        style={{ width: `${coverage.coverage_percentage}%` }}
                                                    ></div>
                                                </div>
                                                <p className="text-xs text-gray-400 mt-1">{coverage.coverage_percentage}% coverage</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="mt-12 pt-8 border-t border-gray-800 text-center">
                    <p className="text-gray-400 text-sm">
                        Generated with AI by SensAI Assessment Platform
                    </p>
                    <p className="text-gray-500 text-xs mt-2">
                        This is a preview of the assessment structure and content
                    </p>
                </div>
            </div>
        </div>
    );
}
"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import {
    ChevronDown,
    ChevronUp,
    Clock,
    Target,
    BookOpen,
    AlertCircle,
    Play,
} from "lucide-react";
import { AssessmentResult } from "@/types/assessment";

export default function AssessmentPreviewPage() {
    const params = useParams();
    const router = useRouter();
    const assessmentId = params?.id as string;
    
    const [assessment, setAssessment] = useState<AssessmentResult | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
        mcqs: true,
        saqs: false,
        case_study: false,
        aptitude: false,
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

    const handleTakeAssessment = () => {
        router.push(`/assessment/${assessmentId}`);
    };

    const toggleSection = (section: string) => {
        setExpandedSections(prev => ({
            ...prev,
            [section]: !prev[section]
        }));
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-black text-white flex items-center justify-center">
                <div className="text-center">
                    <div className="w-12 h-12 border-t-2 border-b-2 border-white rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-gray-400">Loading assessment...</p>
                </div>
            </div>
        );
    }

    if (error || !assessment) {
        return (
            <div className="min-h-screen bg-black text-white flex items-center justify-center">
                <div className="text-center max-w-md">
                    <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h2 className="text-2xl font-semibold text-white mb-2">Assessment Not Found</h2>
                    <p className="text-gray-400">{error || "This assessment does not exist or has been removed."}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-black text-white">
            {/* Header */}
            <header className="border-b border-gray-800">
                <div className="container mx-auto px-4 py-4">
                    <div className="flex items-center justify-between">
                        <Image
                            src="/images/sensai-logo.svg"
                            alt="SensAI Logo"
                            width={100}
                            height={40}
                            className="w-[100px] h-auto"
                            priority
                        />
                        <span className="text-sm text-gray-500">Assessment Preview</span>
                    </div>
                </div>
            </header>

            <div className="container mx-auto px-4 py-8 max-w-4xl">
                {/* Title Section */}
                <div className="mb-8">
                    <h1 className="text-4xl font-semibold text-white mb-4">
                        {assessment.role_name} Assessment
                    </h1>
                    <p className="text-gray-400 text-lg mb-6">
                        Comprehensive evaluation for {assessment.role_name} role
                    </p>

                    {/* Stats */}
                    <div className="flex items-center gap-6 text-sm text-gray-400 mb-8">
                        <div className="flex items-center gap-2">
                            <BookOpen className="w-4 h-4" />
                            <span>{assessment.total_questions} questions</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4" />
                            <span>{assessment.estimated_duration_minutes} minutes</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Target className="w-4 h-4" />
                            <span>{assessment.difficulty_level}</span>
                        </div>
                    </div>

                    {/* CTA Button */}
                    <div className="text-center mb-8">
                        <button
                            onClick={handleTakeAssessment}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-lg font-medium text-lg flex items-center gap-3 mx-auto transition-colors"
                        >
                            <Play className="w-5 h-5" />
                            Take Assessment
                        </button>
                        <p className="text-sm text-gray-500 mt-2">
                            Complete the assessment in {assessment.estimated_duration_minutes} minutes
                        </p>
                    </div>
                </div>

                {/* Skills */}
                <div className="mb-8">
                    <h2 className="text-lg font-medium text-white mb-3">Skills Assessed</h2>
                    <div className="flex flex-wrap gap-2">
                        {assessment.target_skills.map((skill, index) => (
                            <span
                                key={index}
                                className="px-3 py-1.5 bg-gray-900 border border-gray-800 text-white rounded-lg text-sm"
                            >
                                {skill}
                            </span>
                        ))}
                    </div>
                </div>

                {/* Question Sections Preview (No Answers) */}
                <div className="space-y-4">
                    {/* MCQs Section */}
                    {assessment.mcqs && assessment.mcqs.length > 0 && (
                        <div className="border border-gray-800 rounded-lg overflow-hidden">
                            <button
                                onClick={() => toggleSection('mcqs')}
                                className="w-full p-4 bg-gray-900 flex items-center justify-between hover:bg-gray-800/50 transition-colors"
                            >
                                <h3 className="text-lg font-medium text-white">
                                    Multiple Choice Questions ({assessment.mcqs.length})
                                </h3>
                                {expandedSections.mcqs ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                            </button>
                            
                            {expandedSections.mcqs && (
                                <div className="p-4 bg-black space-y-4">
                                    {assessment.mcqs.slice(0, 3).map((q, idx) => (
                                        <div key={q.id} className="pb-4 border-b border-gray-800 last:border-0">
                                            <p className="text-white mb-3">
                                                {idx + 1}. {q.question}
                                            </p>
                                            <div className="space-y-2 ml-4">
                                                {q.options.map((option, optIdx) => (
                                                    <div key={optIdx} className="flex items-start gap-3 text-gray-400">
                                                        <span className="font-medium">{String.fromCharCode(65 + optIdx)}.</span>
                                                        <span className="flex-1">{option}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                    {assessment.mcqs.length > 3 && (
                                        <p className="text-gray-500 text-center">... and {assessment.mcqs.length - 3} more questions</p>
                                    )}
                                </div>
                            )}
                        </div>
                    )}

                    {/* SAQs Section */}
                    {assessment.saqs && assessment.saqs.length > 0 && (
                        <div className="border border-gray-800 rounded-lg overflow-hidden">
                            <button
                                onClick={() => toggleSection('saqs')}
                                className="w-full p-4 bg-gray-900 flex items-center justify-between hover:bg-gray-800/50 transition-colors"
                            >
                                <h3 className="text-lg font-medium text-white">
                                    Short Answer Questions ({assessment.saqs.length})
                                </h3>
                                {expandedSections.saqs ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                            </button>
                            
                            {expandedSections.saqs && (
                                <div className="p-4 bg-black space-y-4">
                                    {assessment.saqs.slice(0, 2).map((q, idx) => (
                                        <div key={q.id} className="pb-4 border-b border-gray-800 last:border-0">
                                            <p className="text-white mb-3">
                                                {idx + 1}. {q.question}
                                            </p>
                                        </div>
                                    ))}
                                    {assessment.saqs.length > 2 && (
                                        <p className="text-gray-500 text-center">... and {assessment.saqs.length - 2} more questions</p>
                                    )}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Case Study Section */}
                    {assessment.case_study && (
                        <div className="border border-gray-800 rounded-lg overflow-hidden">
                            <button
                                onClick={() => toggleSection('case_study')}
                                className="w-full p-4 bg-gray-900 flex items-center justify-between hover:bg-gray-800/50 transition-colors"
                            >
                                <h3 className="text-lg font-medium text-white">Case Study</h3>
                                {expandedSections.case_study ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                            </button>
                            
                            {expandedSections.case_study && (
                                <div className="p-4 bg-black">
                                    <h4 className="text-xl font-medium text-white mb-3">
                                        {assessment.case_study.title}
                                    </h4>
                                    <p className="text-gray-300 mb-4 leading-relaxed">
                                        {assessment.case_study.scenario.substring(0, 200)}...
                                    </p>
                                    <p className="text-gray-500">
                                        {assessment.case_study.questions.length} questions included
                                    </p>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Aptitude Questions Section */}
                    {assessment.aptitude_questions && assessment.aptitude_questions.length > 0 && (
                        <div className="border border-gray-800 rounded-lg overflow-hidden">
                            <button
                                onClick={() => toggleSection('aptitude')}
                                className="w-full p-4 bg-gray-900 flex items-center justify-between hover:bg-gray-800/50 transition-colors"
                            >
                                <h3 className="text-lg font-medium text-white">
                                    Aptitude Questions ({assessment.aptitude_questions.length})
                                </h3>
                                {expandedSections.aptitude ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                            </button>
                            
                            {expandedSections.aptitude && (
                                <div className="p-4 bg-black space-y-4">
                                    {assessment.aptitude_questions.slice(0, 2).map((q, idx) => (
                                        <div key={q.id} className="pb-4 border-b border-gray-800 last:border-0">
                                            <p className="text-white mb-3">
                                                {idx + 1}. {q.question}
                                            </p>
                                        </div>
                                    ))}
                                    {assessment.aptitude_questions.length > 2 && (
                                        <p className="text-gray-500 text-center">... and {assessment.aptitude_questions.length - 2} more questions</p>
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Footer CTA */}
                <div className="mt-12 pt-8 border-t border-gray-800 text-center">
                    <button
                        onClick={handleTakeAssessment}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-lg font-medium text-lg flex items-center gap-3 mx-auto mb-4 transition-colors"
                    >
                        <Play className="w-5 h-5" />
                        Take Assessment
                    </button>
                    <p className="text-gray-500 text-sm">
                        Generated with AI by SensAI
                    </p>
                </div>
            </div>
        </div>
    );
}
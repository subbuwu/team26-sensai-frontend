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
    Check,
    Play,
    User,
    Users
} from "lucide-react";
import { AssessmentResult } from "@/types/assessment";

export default function AssessmentPreviewPage() {
    const params = useParams();
    const router = useRouter();
    const assessmentId = params?.id as string;
    
    const [assessment, setAssessment] = useState<AssessmentResult | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isStarting, setIsStarting] = useState(false);
    const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
        mcqs: true,
        saqs: false,
        case_study: false,
        aptitude: false,
    });

    // Add state for assessment start options
    const [selectedCohort, setSelectedCohort] = useState<number | null>(null);
    const [selectedCourse, setSelectedCourse] = useState<number | null>(null);
    const [availableCohorts, setAvailableCohorts] = useState<Array<{id: number, name: string}>>([]);
    const [availableCourses, setAvailableCourses] = useState<Array<{id: number, name: string}>>([]);

    useEffect(() => {
        if (assessmentId) {
            fetchAssessment();
            fetchUserOptions();
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

    const fetchUserOptions = async () => {
        try {
            // Fetch user's available cohorts and courses
            // This endpoint would need to be implemented in your backend
            const [cohortsResponse, coursesResponse] = await Promise.all([
                fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/user/cohorts`),
                fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/user/courses`)
            ]);

            if (cohortsResponse.ok) {
                const cohorts = await cohortsResponse.json();
                setAvailableCohorts(cohorts);
            }

            if (coursesResponse.ok) {
                const courses = await coursesResponse.json();
                setAvailableCourses(courses);
            }
        } catch (error) {
            console.error('Error fetching user options:', error);
        }
    };

    const handleStartAssessment = async () => {
        if (!assessment) return;

        try {
            setIsStarting(true);
            
            // Convert role assessment to assessment task format
            const taskId = assessment.assessment_id; // Assuming the role assessment ID can be used as task ID
            
            // Build the URL with query parameters
            const params = new URLSearchParams({
                taskId: taskId.toString(),
            });

            if (selectedCohort) {
                params.append('cohortId', selectedCohort.toString());
            }

            if (selectedCourse) {
                params.append('courseId', selectedCourse.toString());
            }

            // Navigate to the assessment taking page
            router.push(`/assessment/take?${params.toString()}`);

        } catch (error) {
            console.error('Error starting assessment:', error);
            setError('Failed to start assessment');
        } finally {
            setIsStarting(false);
        }
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
                    <div className="flex items-center gap-6 text-sm text-gray-400 mb-6">
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

                    {/* Start Assessment Section */}
                    <div className="bg-gray-900 border border-gray-800 rounded-lg p-6 mb-8">
                        <h2 className="text-lg font-medium text-white mb-4">Start Assessment</h2>
                        
                        {/* Optional selections */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                            {availableCohorts.length > 0 && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-400 mb-2">
                                        <Users className="w-4 h-4 inline mr-1" />
                                        Cohort (optional)
                                    </label>
                                    <select
                                        value={selectedCohort || ''}
                                        onChange={(e) => setSelectedCohort(e.target.value ? parseInt(e.target.value) : null)}
                                        className="w-full bg-gray-800 border border-gray-700 text-white rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value="">Select a cohort</option>
                                        {availableCohorts.map(cohort => (
                                            <option key={cohort.id} value={cohort.id}>
                                                {cohort.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            {availableCourses.length > 0 && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-400 mb-2">
                                        <BookOpen className="w-4 h-4 inline mr-1" />
                                        Course (optional)
                                    </label>
                                    <select
                                        value={selectedCourse || ''}
                                        onChange={(e) => setSelectedCourse(e.target.value ? parseInt(e.target.value) : null)}
                                        className="w-full bg-gray-800 border border-gray-700 text-white rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value="">Select a course</option>
                                        {availableCourses.map(course => (
                                            <option key={course.id} value={course.id}>
                                                {course.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            )}
                        </div>

                        <button
                            onClick={handleStartAssessment}
                            disabled={isStarting}
                            className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-3 rounded-md font-medium flex items-center gap-2 transition-colors"
                        >
                            <Play className="w-4 h-4" />
                            {isStarting ? 'Starting...' : 'Start Assessment'}
                        </button>
                        
                        <p className="text-sm text-gray-500 mt-2">
                            Once started, you'll have {assessment.estimated_duration_minutes} minutes to complete the assessment.
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

                {/* Question Sections */}
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
                                    {assessment.mcqs.map((q, idx) => (
                                        <div key={q.id} className="pb-4 border-b border-gray-800 last:border-0">
                                            <p className="text-white mb-3 text-lg">
                                                {idx + 1}. {q.question}
                                            </p>
                                            <div className="space-y-2 ml-4">
                                                {q.options.map((option, optIdx) => (
                                                    <div
                                                        key={optIdx}
                                                        className={`flex items-start gap-3 ${
                                                            optIdx === q.correct_answer ? 'text-green-400' : 'text-gray-400'
                                                        }`}
                                                    >
                                                        <span className="font-medium">{String.fromCharCode(65 + optIdx)}.</span>
                                                        <span className="flex-1">{option}</span>
                                                        {optIdx === q.correct_answer && (
                                                            <Check className="w-4 h-4 mt-0.5" />
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                            {q.explanation && (
                                                <div className="mt-3 ml-4 p-3 bg-gray-900 border-l-2 border-gray-700 rounded">
                                                    <p className="text-sm text-gray-400">{q.explanation}</p>
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
                                    {assessment.saqs.map((q, idx) => (
                                        <div key={q.id} className="pb-4 border-b border-gray-800 last:border-0">
                                            <p className="text-white mb-3 text-lg">
                                                {idx + 1}. {q.question}
                                            </p>
                                            <div className="ml-4 p-3 bg-gray-900 border-l-2 border-gray-700 rounded">
                                                <p className="text-sm text-gray-400 font-medium mb-1">Sample Answer:</p>
                                                <p className="text-gray-300">{q.sample_answer}</p>
                                            </div>
                                        </div>
                                    ))}
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
                                        {assessment.case_study.scenario}
                                    </p>
                                    <div className="space-y-2">
                                        <p className="text-sm font-medium text-gray-400 mb-2">Questions:</p>
                                        {assessment.case_study.questions.map((question, index) => (
                                            <div key={index} className="ml-4 flex items-start gap-3 text-gray-300">
                                                <span className="font-medium">{index + 1}.</span>
                                                <span>{question}</span>
                                            </div>
                                        ))}
                                    </div>
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
                                    {assessment.aptitude_questions.map((q, idx) => (
                                        <div key={q.id} className="pb-4 border-b border-gray-800 last:border-0">
                                            <p className="text-white mb-3 text-lg">
                                                {idx + 1}. {q.question}
                                            </p>
                                            <div className="ml-4">
                                                <p className="text-green-400 mb-2">
                                                    Answer: {q.correct_answer}
                                                </p>
                                                {q.explanation && (
                                                    <div className="p-3 bg-gray-900 border-l-2 border-gray-700 rounded">
                                                        <p className="text-sm text-gray-400">{q.explanation}</p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="mt-12 pt-8 border-t border-gray-800 text-center">
                    <p className="text-gray-500 text-sm">
                        Generated with AI by SensAI
                    </p>
                </div>
            </div>
        </div>
    );
}
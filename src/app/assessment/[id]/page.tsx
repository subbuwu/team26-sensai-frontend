"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import {
    Clock,
    ChevronLeft,
    ChevronRight,
    CheckCircle,
    AlertCircle,
    Trophy,
    Target,
    BookOpen
} from "lucide-react";
import { AssessmentResult, MCQuestion, SAQuestion, CaseStudy, AptitudeQuestion } from "@/types/assessment";

interface Answer {
    questionId: string;
    answer: string | number | string[];
    type: 'mcq' | 'saq' | 'case_study' | 'aptitude';
}

interface AssessmentTakeResult {
    score: number;
    totalQuestions: number;
    percentage: number;
    passThreshold: number;
    passed: boolean;
    timeSpent: number;
    correctAnswers: number;
    skillBreakdown: Record<string, { correct: number; total: number }>;
}

export default function AssessmentTakePage() {
    const params = useParams();
    const assessmentId = params?.id as string;
    
    const [assessment, setAssessment] = useState<AssessmentResult | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    
    // Assessment state
    const [currentSection, setCurrentSection] = useState<'mcq' | 'saq' | 'case_study' | 'aptitude'>('mcq');
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [answers, setAnswers] = useState<Record<string, Answer>>({});
    const [timeElapsed, setTimeElapsed] = useState(0);
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [result, setResult] = useState<AssessmentTakeResult | null>(null);

    // Timer
    useEffect(() => {
        if (assessment && !isSubmitted) {
            const timer = setInterval(() => {
                setTimeElapsed(prev => prev + 1);
            }, 1000);
            return () => clearInterval(timer);
        }
    }, [assessment, isSubmitted]);

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
            } else {
                setError("Assessment not found");
            }
        } catch (error) {
            console.error('Error fetching assessment:', error);
            setError("Failed to load assessment");
        } finally {
            setIsLoading(false);
        }
    };

    const getCurrentQuestions = (): (MCQuestion | SAQuestion | CaseStudy | AptitudeQuestion)[] => {
        if (!assessment) return [];
        
        switch (currentSection) {
            case 'mcq':
                return assessment.mcqs || [];
            case 'saq':
                return assessment.saqs || [];
            case 'case_study':
                return assessment.case_study ? [assessment.case_study] : [];
            case 'aptitude':
                return assessment.aptitude_questions || [];
            default:
                return [];
        }
    };

    const getCurrentQuestion = (): MCQuestion | SAQuestion | CaseStudy | AptitudeQuestion | undefined => {
        const questions = getCurrentQuestions();
        return questions[currentQuestionIndex];
    };

    const handleAnswer = (answer: string | number | string[]) => {
        const currentQuestion = getCurrentQuestion();
        if (!currentQuestion) return;

        const answerId = `${currentSection}_${currentQuestion.id}_${currentQuestionIndex}`;
        setAnswers(prev => ({
            ...prev,
            [answerId]: {
                questionId: answerId,
                answer,
                type: currentSection
            }
        }));
    };

    const navigateQuestion = (direction: 'prev' | 'next') => {
        const questions = getCurrentQuestions();
        if (direction === 'next' && currentQuestionIndex < questions.length - 1) {
            setCurrentQuestionIndex(prev => prev + 1);
        } else if (direction === 'prev' && currentQuestionIndex > 0) {
            setCurrentQuestionIndex(prev => prev - 1);
        } else if (direction === 'next' && currentQuestionIndex === questions.length - 1) {
            // Move to next section
            const sections: Array<'mcq' | 'saq' | 'case_study' | 'aptitude'> = ['mcq', 'saq', 'case_study', 'aptitude'];
            const currentIndex = sections.indexOf(currentSection);
            if (currentIndex < sections.length - 1) {
                // Find next section with questions
                for (let i = currentIndex + 1; i < sections.length; i++) {
                    const nextSection = sections[i];
                    const nextQuestions = getQuestionsForSection(nextSection);
                    if (nextQuestions.length > 0) {
                        setCurrentSection(nextSection);
                        setCurrentQuestionIndex(0);
                        break;
                    }
                }
            }
        }
    };

    const getQuestionsForSection = (section: string): (MCQuestion | SAQuestion | CaseStudy | AptitudeQuestion)[] => {
        if (!assessment) return [];
        
        switch (section) {
            case 'mcq':
                return assessment.mcqs || [];
            case 'saq':
                return assessment.saqs || [];
            case 'case_study':
                return assessment.case_study ? [assessment.case_study] : [];
            case 'aptitude':
                return assessment.aptitude_questions || [];
            default:
                return [];
        }
    };

    const calculateResult = (): AssessmentTakeResult => {
        if (!assessment) {
            return {
                score: 0,
                totalQuestions: 0,
                percentage: 0,
                passThreshold: 70,
                passed: false,
                timeSpent: timeElapsed,
                correctAnswers: 0,
                skillBreakdown: {}
            };
        }

        let correctAnswers = 0;
        let totalQuestions = 0;

        // Calculate MCQ scores
        assessment.mcqs?.forEach((q) => {
            totalQuestions++;
            const answerId = `mcq_${q.id}_${assessment.mcqs?.indexOf(q)}`;
            const userAnswer = answers[answerId]?.answer;
            if (userAnswer === q.correct_answer) {
                correctAnswers++;
            }
        });

        // Calculate Aptitude scores
        assessment.aptitude_questions?.forEach((q) => {
            totalQuestions++;
            const answerId = `aptitude_${q.id}_${assessment.aptitude_questions?.indexOf(q)}`;
            const userAnswer = answers[answerId]?.answer;
            if (typeof userAnswer === 'string' && userAnswer.toLowerCase().trim() === q.correct_answer.toLowerCase().trim()) {
                correctAnswers++;
            }
        });

        // For SAQs and case study - assume 70% correct for demo (in real app, these would be manually graded)
        const subjectiveQuestions = (assessment.saqs?.length || 0) + 
                                   (assessment.case_study ? 1 : 0);
        
        totalQuestions += subjectiveQuestions;
        correctAnswers += Math.floor(subjectiveQuestions * 0.7);

        const percentage = totalQuestions > 0 ? (correctAnswers / totalQuestions) * 100 : 0;
        const passThreshold = 70;

        return {
            score: correctAnswers,
            totalQuestions,
            percentage: Math.round(percentage),
            passThreshold,
            passed: percentage >= passThreshold,
            timeSpent: timeElapsed,
            correctAnswers,
            skillBreakdown: {}
        };
    };

    const handleSubmit = () => {
        const assessmentResult = calculateResult();
        setResult(assessmentResult);
        setIsSubmitted(true);
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const isLastQuestion = () => {
        const sections: Array<'mcq' | 'saq' | 'case_study' | 'aptitude'> = ['mcq', 'saq', 'case_study', 'aptitude'];
        const currentIndex = sections.indexOf(currentSection);
        const questions = getCurrentQuestions();
        
        // Check if we're in the last section with questions
        let isLastSection = true;
        for (let i = currentIndex + 1; i < sections.length; i++) {
            if (getQuestionsForSection(sections[i]).length > 0) {
                isLastSection = false;
                break;
            }
        }
        
        return isLastSection && currentQuestionIndex === questions.length - 1;
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
                    <p className="text-gray-400">{error}</p>
                </div>
            </div>
        );
    }

    if (isSubmitted && result) {
        return (
            <div className="min-h-screen bg-black text-white">
                {/* Header */}
                <header className="border-b border-gray-800">
                    <div className="container mx-auto px-4 py-4">
                        <Image
                            src="/images/sensai-logo.svg"
                            alt="SensAI Logo"
                            width={100}
                            height={40}
                            className="w-[100px] h-auto"
                            priority
                        />
                    </div>
                </header>

                {/* Results */}
                <div className="container mx-auto px-4 py-8 max-w-2xl">
                    <div className="text-center mb-8">
                        {result.passed ? (
                            <Trophy className="w-16 h-16 text-green-500 mx-auto mb-4" />
                        ) : (
                            <Target className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
                        )}
                        
                        <h1 className="text-3xl font-bold text-white mb-2">
                            {result.passed ? 'Congratulations!' : 'Assessment Complete'}
                        </h1>
                        <p className="text-gray-400">
                            {assessment.role_name} Assessment Results
                        </p>
                    </div>

                    <div className="bg-gray-900 border border-gray-800 rounded-lg p-6 mb-6">
                        <div className="grid grid-cols-2 gap-4 text-center">
                            <div>
                                <div className="text-3xl font-bold text-white mb-1">
                                    {result.percentage}%
                                </div>
                                <div className="text-gray-400 text-sm">Score</div>
                            </div>
                            <div>
                                <div className="text-3xl font-bold text-white mb-1">
                                    {result.score}/{result.totalQuestions}
                                </div>
                                <div className="text-gray-400 text-sm">Correct</div>
                            </div>
                        </div>
                        
                        <div className="mt-4 pt-4 border-t border-gray-800">
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-400">Time Spent:</span>
                                <span className="text-white">{formatTime(result.timeSpent)}</span>
                            </div>
                            <div className="flex justify-between text-sm mt-1">
                                <span className="text-gray-400">Pass Threshold:</span>
                                <span className="text-white">{result.passThreshold}%</span>
                            </div>
                        </div>
                    </div>

                    <div className={`p-4 rounded-lg border ${
                        result.passed 
                            ? 'bg-green-900/20 border-green-800 text-green-400' 
                            : 'bg-yellow-900/20 border-yellow-800 text-yellow-400'
                    }`}>
                        <div className="flex items-center gap-2">
                            {result.passed ? (
                                <CheckCircle className="w-5 h-5" />
                            ) : (
                                <AlertCircle className="w-5 h-5" />
                            )}
                            <span className="font-medium">
                                {result.passed 
                                    ? `You passed the ${assessment.role_name} assessment!`
                                    : `You scored ${result.percentage}%, minimum required is ${result.passThreshold}%`
                                }
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    const currentQuestion = getCurrentQuestion();
    const currentAnswer = currentQuestion ? answers[`${currentSection}_${currentQuestion.id}_${currentQuestionIndex}`]?.answer : undefined;

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
                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2 text-gray-400">
                                <Clock className="w-4 h-4" />
                                <span>{formatTime(timeElapsed)}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            <div className="container mx-auto px-4 py-8 max-w-4xl">
                {/* Progress */}
                <div className="mb-6">
                    <div className="flex items-center justify-between mb-2">
                        <h2 className="text-xl font-medium text-white capitalize">
                            {currentSection.replace('_', ' ')} Questions
                        </h2>
                        <span className="text-gray-400 text-sm">
                            {currentQuestionIndex + 1} of {getCurrentQuestions().length}
                        </span>
                    </div>
                    <div className="w-full bg-gray-800 rounded-full h-2">
                        <div 
                            className="bg-blue-600 h-2 rounded-full transition-all"
                            style={{ 
                                width: `${((currentQuestionIndex + 1) / getCurrentQuestions().length) * 100}%` 
                            }}
                        ></div>
                    </div>
                </div>

                {/* Question */}
                <div className="bg-gray-900 border border-gray-800 rounded-lg p-6 mb-6">
                    {currentSection === 'mcq' && currentQuestion && 'options' in currentQuestion && (
                        <div>
                            <h3 className="text-xl text-white mb-6">
                                {currentQuestion.question}
                            </h3>
                            <div className="space-y-3">
                                {currentQuestion.options.map((option: string, idx: number) => (
                                    <button
                                        key={idx}
                                        onClick={() => handleAnswer(idx)}
                                        className={`w-full text-left p-4 border rounded-lg transition-colors ${
                                            currentAnswer === idx 
                                                ? 'border-blue-600 bg-blue-900/30 text-blue-400' 
                                                : 'border-gray-700 hover:border-gray-600 text-white hover:bg-gray-800'
                                        }`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <span className="font-medium">
                                                {String.fromCharCode(65 + idx)}.
                                            </span>
                                            <span>{option}</span>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {currentSection === 'saq' && currentQuestion && 'sample_answer' in currentQuestion && (
                        <div>
                            <h3 className="text-xl text-white mb-6">
                                {currentQuestion.question}
                            </h3>
                            <textarea
                                value={currentAnswer as string || ''}
                                onChange={(e) => handleAnswer(e.target.value)}
                                placeholder="Type your answer here..."
                                className="w-full h-32 bg-gray-800 border border-gray-700 text-white rounded-md px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                            />
                        </div>
                    )}

                    {currentSection === 'case_study' && currentQuestion && 'scenario' in currentQuestion && (
                        <div>
                            <h3 className="text-2xl font-semibold text-white mb-4">
                                {currentQuestion.title}
                            </h3>
                            <div className="bg-gray-800 border-l-4 border-blue-600 p-4 mb-6">
                                <p className="text-gray-300 leading-relaxed">
                                    {currentQuestion.scenario}
                                </p>
                            </div>
                            <div className="space-y-4">
                                <h4 className="text-lg font-medium text-white">Questions:</h4>
                                {currentQuestion.questions.map((question: string, idx: number) => (
                                    <div key={idx} className="space-y-2">
                                        <p className="text-white">
                                            {idx + 1}. {question}
                                        </p>
                                        <textarea
                                            value={(currentAnswer as string[])?.[idx] || ''}
                                            onChange={(e) => {
                                                const newAnswers = [...((currentAnswer as string[]) || new Array(currentQuestion.questions.length).fill(''))];
                                                newAnswers[idx] = e.target.value;
                                                handleAnswer(newAnswers);
                                            }}
                                            placeholder="Type your answer here..."
                                            className="w-full h-24 bg-gray-800 border border-gray-700 text-white rounded-md px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {currentSection === 'aptitude' && currentQuestion && 'correct_answer' in currentQuestion && (
                        <div>
                            <h3 className="text-xl text-white mb-6">
                                {currentQuestion.question}
                            </h3>
                            <input
                                type="text"
                                value={currentAnswer as string || ''}
                                onChange={(e) => handleAnswer(e.target.value)}
                                placeholder="Enter your answer"
                                className="w-full bg-gray-800 border border-gray-700 text-white rounded-md px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                    )}
                </div>

                {/* Navigation */}
                <div className="flex items-center justify-between">
                    <button
                        onClick={() => navigateQuestion('prev')}
                        disabled={currentSection === 'mcq' && currentQuestionIndex === 0}
                        className="flex items-center gap-2 px-4 py-2 bg-gray-800 border border-gray-700 text-white rounded-md hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        <ChevronLeft className="w-4 h-4" />
                        Previous
                    </button>

                    {isLastQuestion() ? (
                        <button
                            onClick={handleSubmit}
                            className="flex items-center gap-2 px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md font-medium transition-colors"
                        >
                            <CheckCircle className="w-4 h-4" />
                            Submit Assessment
                        </button>
                    ) : (
                        <button
                            onClick={() => navigateQuestion('next')}
                            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors"
                        >
                            Next
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    )}
                </div>

                {/* Section Navigation */}
                <div className="mt-8 pt-8 border-t border-gray-800">
                    <h3 className="text-lg font-medium text-white mb-4">Sections</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {(['mcq', 'saq', 'case_study', 'aptitude'] as const).map((section) => {
                            const questions = getQuestionsForSection(section);
                            if (questions.length === 0) return null;

                            const sectionAnswers = Object.keys(answers).filter(key => key.startsWith(section)).length;
                            const isCompleted = sectionAnswers === questions.length;
                            const isCurrent = currentSection === section;

                            return (
                                <button
                                    key={section}
                                    onClick={() => {
                                        setCurrentSection(section);
                                        setCurrentQuestionIndex(0);
                                    }}
                                    className={`p-3 border rounded-lg text-left transition-colors ${
                                        isCurrent
                                            ? 'border-blue-600 bg-blue-900/30 text-blue-400'
                                            : isCompleted
                                            ? 'border-green-600 bg-green-900/30 text-green-400'
                                            : 'border-gray-700 hover:border-gray-600 text-gray-400 hover:text-white'
                                    }`}
                                >
                                    <div className="flex items-center justify-between">
                                        <span className="font-medium capitalize text-sm">
                                            {section.replace('_', ' ')}
                                        </span>
                                        {isCompleted && <CheckCircle className="w-4 h-4" />}
                                    </div>
                                    <div className="text-xs mt-1">
                                        {sectionAnswers}/{questions.length} answered
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
}
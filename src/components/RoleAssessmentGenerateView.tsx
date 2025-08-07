"use client";

import { useRef, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import Link from "next/link";
import Image from "next/image";
import { signOut, useSession } from "next-auth/react";
import { 
    X, 
    Check, 
    AlertCircle, 
    Clock, 
    Users, 
    BookOpen, 
    Target, 
    Zap,
    ChevronDown,
    ChevronUp,
    Play,
    Download,
    Share2,
    Copy,
    Eye,
    BarChart3,
    Settings,
    Rocket,
    Edit2,
    ArrowLeft
} from "lucide-react";
import { 
    AssessmentResult, 
    AssessmentStatus, 
    GenerateAssessmentRequest,
    MCQuestion,
    SAQuestion,
    CaseStudy,
    AptitudeQuestion
} from "@/types/assessment";
// import DeployToCourseDialog from "@/components/DeployToCourseDialog";
import Toast from "@/components/Toast";


export default function RoleAssessmentGenerateView({ slug }: { slug: string }) {
    const router = useRouter();
    const { data: session } = useSession();
    const profileMenuRef = useRef<HTMLDivElement>(null);
    const [profileMenuOpen, setProfileMenuOpen] = useState(false);
    
    const { user, isAuthenticated, isLoading: authLoading } = useAuth();
    const [isAdminOrOwner, setIsAdminOrOwner] = useState<boolean>(false);

    // Form state
    const [selectedRole, setSelectedRole] = useState<string>('');
    const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
    const [selectedDifficulty, setSelectedDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
    const [newSkillInput, setNewSkillInput] = useState<string>('');

    const [isGenerating, setIsGenerating] = useState(false);
    
    // Generation state
    const [currentAssessmentId, setCurrentAssessmentId] = useState<string | null>(null);
    const [generationStatus, setGenerationStatus] = useState<AssessmentStatus | null>(null);
    const [assessmentResult, setAssessmentResult] = useState<AssessmentResult | null>(null);
    const [error, setError] = useState<string | null>(null);
     const [showDeployDialog, setShowDeployDialog] = useState(false);
    const [toast, setToast] = useState<{ show: boolean; message: string; type: 'success' | 'error' }>({
        show: false,
        message: "",
        type: 'success'
    });


    // UI Enhancement states
     const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
        mcqs: true,
        saqs: false,
        case_study: false,
        aptitude: false
    });
    const [copied, setCopied] = useState<string | null>(null);

    // Poll for status updates when generating
    useEffect(() => {
        if (isGenerating && currentAssessmentId) {
            const interval = setInterval(() => {
                checkAssessmentStatus();
            }, 2000);
            return () => clearInterval(interval);
        }
    }, [isGenerating, currentAssessmentId]);

    const generateAssessment = async () => {
        if (!selectedRole || selectedSkills.length === 0) {
            setError('Please select a role and at least one skill');
            return;
        }

        setIsGenerating(true);
        setError(null);
        setAssessmentResult(null);

        try {
            const requestData: GenerateAssessmentRequest = {
                role: selectedRole,
                skills: selectedSkills,
                difficulty: selectedDifficulty,
            };

            const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/role_assessment/generate`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestData),
            });

            if (response.ok) {
                const data: AssessmentResult = await response.json();
                setCurrentAssessmentId(data.assessment_id);
                setGenerationStatus({
                    assessment_id: data.assessment_id,
                    status: 'generating' as const,
                    progress_percentage: 0,
                    current_step: 'Starting generation...',
                    estimated_completion_seconds: data.estimated_duration_minutes || 180
                });
                setAssessmentResult(data);
                // Cache the result
            } else {
                throw new Error('Failed to start assessment generation');
            }
        } catch (error) {
            console.error('Generation error:', error);
            setError('Failed to generate assessment. Please try again.');
            setIsGenerating(false);
        }
    };

    const copyShareLink = async () => {
        const shareUrl = `${window.location.origin}/role-assessment/preview/${currentAssessmentId}`;
        try {
            await navigator.clipboard.writeText(shareUrl);
            setToast({
                show: true,
                message: "Preview link copied to clipboard!",
                type: 'success'
            });
        } catch (error) {
            console.error('Failed to copy:', error);
        }
    };

    const handleEditAssessment = () => {
        if (currentAssessmentId) {
            router.push(`/role-assessment/${currentAssessmentId}`);
        }
    };

    const checkAssessmentStatus = async () => {
        if (!currentAssessmentId) return;

        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/role_assessment/status/${currentAssessmentId}`);
            if (response.ok) {
                const status: AssessmentStatus = await response.json();
                setGenerationStatus(status);

                if (status.status === 'completed') {
                    setIsGenerating(false);
                } else if (status.status === 'failed') {
                    setIsGenerating(false);
                    setError(status.error_message || 'Assessment generation failed');
                }
            }
        } catch (error) {
            console.error('Status check error:', error);
        }
    };

    const toggleSkillSelection = (skill: string) => {
        setSelectedSkills(prev => 
            prev.includes(skill) 
                ? prev.filter(s => s !== skill)
                : [...prev, skill]
        );
    };

    const resetForm = () => {
        setSelectedRole('');
        setSelectedSkills([]);
        setSelectedDifficulty('medium');
        setCurrentAssessmentId(null);
        setGenerationStatus(null);
        setAssessmentResult(null);
        setError(null);
        setIsGenerating(false);

    };

    const toggleSection = (section: string) => {
        setExpandedSections(prev => ({
            ...prev,
            [section]: !prev[section]
        }));
    };

    const handleBackClick = () => {
        router.push('/');
    };

    const addSkill = () => {
        const trimmedSkill = newSkillInput.trim();
        if (trimmedSkill && !selectedSkills.includes(trimmedSkill)) {
            setSelectedSkills(prev => [...prev, trimmedSkill]);
            setNewSkillInput('');
        }
    };

    const removeSkill = (skillToRemove: string) => {
        setSelectedSkills(prev => prev.filter(skill => skill !== skillToRemove));
    };

    const handleSkillInputKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            addSkill();
        }
    };
    const copyToClipboard = (text: string, message: string) => {
        navigator.clipboard.writeText(text);
        setToast({
            show: true,
            message: message,
            type: 'success'
        });
    }
    // Loading state
    if (authLoading) {
        return (
            <div className="min-h-screen bg-black text-white">
                <div className="hidden sm:block">
                    <header className="w-full px-3 py-4 bg-black text-white border-b border-gray-800">
                        <div className="max-w-full mx-auto flex justify-between items-center">
                            <Link href="/">
                                <div className="cursor-pointer">
                                    <Image
                                        src="/images/sensai-logo.svg"
                                        alt="SensAI Logo"
                                        width={120}
                                        height={40}
                                        className="w-[100px] h-auto sm:w-[120px]"
                                        priority
                                    />
                                </div>
                            </Link>
                        </div>
                    </header>
                </div>
                <div className="flex justify-center items-center py-12">
                    <div className="w-12 h-12 border-t-2 border-b-2 border-white rounded-full animate-spin"></div>
                </div>
            </div>
        );
    }

    // Redirect if not authenticated
    if (!isAuthenticated && !authLoading) {
        router.push('/login');
        return null;
    }

    const toggleProfileMenu = () => {
        setProfileMenuOpen(!profileMenuOpen);
    };

    const getInitials = () => {
        if (session?.user?.name) {
            return session.user.name.charAt(0).toUpperCase();
        }
        return "U";
    };

    const handleLogout = () => {
        signOut({ callbackUrl: "/login" });
        setProfileMenuOpen(false);
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

    const getCoverageQualityIcon = (quality: string) => {
        switch (quality) {
            case 'excellent': return '🎯';
            case 'good': return '✅';
            case 'adequate': return '⚠️';
            case 'insufficient': return '❌';
            default: return '⚪';
        }
    };

    const renderQuestionCard = (
        question: MCQuestion | SAQuestion | AptitudeQuestion,
        index: number,
        type: 'mcq' | 'saq' | 'aptitude'
    ) => {
        return (
            <div key={`${type}-${question.id}`} className="bg-gray-800/50 border border-gray-700 rounded-xl p-5 hover:border-gray-600 transition-all duration-200">
                <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center space-x-2">
                        <span className="bg-purple-600/20 text-purple-400 px-2 py-1 rounded-lg text-xs font-medium">
                            Q{index + 1}
                        </span>
                        {'skill' in question && (
                            <span className="bg-blue-600/20 text-blue-400 px-2 py-1 rounded-lg text-xs">
                                {question.skill}
                            </span>
                        )}
                        {'difficulty' in question && (
                            <span className={`px-2 py-1 rounded-lg text-xs font-medium ${
                                question.difficulty === 'easy' ? 'bg-green-600/20 text-green-400' :
                                question.difficulty === 'medium' ? 'bg-yellow-600/20 text-yellow-400' :
                                'bg-red-600/20 text-red-400'
                            }`}>
                                {question.difficulty}
                            </span>
                        )}
                    </div>
                    <button
                        onClick={() => copyToClipboard(question.question, `${type}-${question.id}`)}
                        className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
                        title="Copy question"
                    >
                        {copied === `${type}-${question.id}` ? (
                            <Check className="w-4 h-4 text-green-400" />
                        ) : (
                            <Copy className="w-4 h-4" />
                        )}
                    </button>
                </div>
                
                <p className="text-white font-medium mb-3 leading-relaxed">{question.question}</p>
                
                {type === 'mcq' && 'options' in question && (
                    <div className="space-y-2 mb-3">
                        {question.options.map((option, optIndex) => (
                            <div
                                key={optIndex}
                                className={`p-3 rounded-lg text-sm border ${
                                    optIndex === question.correct_answer
                                        ? 'bg-green-600/10 border-green-600/30 text-green-300'
                                        : 'bg-gray-700/30 border-gray-600 text-gray-300'
                                }`}
                            >
                                <span className="font-medium mr-2">{String.fromCharCode(65 + optIndex)}.</span>
                                {option}
                                {optIndex === question.correct_answer && (
                                    <Check className="w-4 h-4 text-green-400 float-right mt-0.5" />
                                )}
                            </div>
                        ))}
                    </div>
                )}
                
                {'explanation' in question && question.explanation && (
                    <div className="mt-3 p-3 bg-blue-600/10 border border-blue-600/20 rounded-lg">
                        <div className="flex items-start space-x-2">
                            <div className="w-5 h-5 bg-blue-600/20 rounded-full flex items-center justify-center mt-0.5">
                                <span className="text-blue-400 text-xs">💡</span>
                            </div>
                            <div>
                                <p className="text-xs text-blue-400 font-medium mb-1">Explanation</p>
                                <p className="text-blue-300 text-sm">{question.explanation}</p>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        );
    };

    const renderCaseStudy = (caseStudy: CaseStudy) => {
        return (
            <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6 hover:border-gray-600 transition-all duration-200">
                <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-2">
                        <span className="bg-green-600/20 text-green-400 px-3 py-1 rounded-lg text-sm font-medium">
                            Case Study
                        </span>
                        <span className={`px-2 py-1 rounded-lg text-xs font-medium ${
                            caseStudy.difficulty === 'easy' ? 'bg-green-600/20 text-green-400' :
                            caseStudy.difficulty === 'medium' ? 'bg-yellow-600/20 text-yellow-400' :
                            'bg-red-600/20 text-red-400'
                        }`}>
                            {caseStudy.difficulty}
                        </span>
                    </div>
                    <button
                        onClick={() => copyToClipboard(`${caseStudy.title}\n\n${caseStudy.scenario}`, `case-${caseStudy.id}`)}
                        className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
                        title="Copy case study"
                    >
                        {copied === `case-${caseStudy.id}` ? (
                            <Check className="w-4 h-4 text-green-400" />
                        ) : (
                            <Copy className="w-4 h-4" />
                        )}
                    </button>
                </div>
                
                <h4 className="text-xl font-semibold text-white mb-3">{caseStudy.title}</h4>
                
                <div className="mb-4">
                    <p className="text-gray-300 leading-relaxed">{caseStudy.scenario}</p>
                </div>
                
                <div className="space-y-3">
                    <h5 className="text-sm font-medium text-gray-400 uppercase tracking-wider">Questions</h5>
                    {caseStudy.questions.map((question, index) => (
                        <div key={index} className="bg-gray-700/30 border border-gray-600 rounded-lg p-4">
                            <div className="flex items-start space-x-3">
                                <span className="bg-purple-600/20 text-purple-400 px-2 py-1 rounded-lg text-xs font-medium min-w-[2rem] text-center">
                                    {index + 1}
                                </span>
                                <p className="text-white font-medium">{question}</p>
                            </div>
                        </div>
                    ))}
                </div>
                
                <div className="mt-4 flex flex-wrap gap-2">
                    {caseStudy.skills.map((skill, index) => (
                        <span key={index} className="bg-blue-600/20 text-blue-400 px-2 py-1 rounded-lg text-xs">
                            {skill}
                        </span>
                    ))}
                </div>
            </div>
        );
    };
 return (
        <div className="min-h-screen bg-black text-white">
            {/* Simple Header */}
            <header className="border-b border-gray-800">
                <div className="container mx-auto px-4 py-4">
                    <div className="flex items-center justify-between">
                        <Link href="/">
                            <Image
                                src="/images/sensai-logo.svg"
                                alt="SensAI Logo"
                                width={120}
                                height={40}
                                className="w-[100px] h-auto"
                                priority
                            />
                        </Link>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <div className="container mx-auto px-4 py-8 max-w-5xl">
                {/* Page Header */}
                <div className="mb-8">
                    <button
                        onClick={() => router.push('/role-assessment')}
                        className="mb-4 text-gray-400 hover:text-white transition-colors flex items-center"
                    >
                        <ArrowLeft className="w-5 h-5 mr-2" />
                        Back to Assessments
                    </button>
                    <h1 className="text-3xl font-semibold text-white mb-2">
                        Generate Role Assessment
                    </h1>
                    <p className="text-gray-400">
                        Create AI-powered assessments for any role
                    </p>
                </div>

                {/* Error Message */}
                {error && (
                    <div className="mb-6 bg-red-900/20 border border-red-800 rounded-lg p-4">
                        <div className="flex items-center">
                            <AlertCircle className="w-5 h-5 text-red-400 mr-3" />
                            <span className="text-red-400">{error}</span>
                        </div>
                    </div>
                )}

                {/* Generation Form or Results */}
                {!assessmentResult ? (
                    <div className="bg-gray-900 rounded-lg border border-gray-800 p-6">
                        <h2 className="text-xl font-medium mb-6">Configuration</h2>

                        <div className="space-y-6">
                            {/* Role Input */}
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    Target Role
                                </label>
                                <input
                                    type="text"
                                    value={selectedRole}
                                    onChange={(e) => setSelectedRole(e.target.value)}
                                    disabled={isGenerating}
                                    placeholder="e.g., Product Analyst, Software Engineer"
                                    className="w-full bg-black border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-gray-600 disabled:opacity-50"
                                />
                            </div>

                            {/* Difficulty Selection */}
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    Difficulty Level
                                </label>
                                <div className="flex gap-2">
                                    {(['easy', 'medium', 'hard'] as const).map((level) => (
                                        <button
                                            key={level}
                                            onClick={() => setSelectedDifficulty(level)}
                                            disabled={isGenerating}
                                            className={`flex-1 px-4 py-2.5 rounded-lg border transition-colors ${
                                                selectedDifficulty === level
                                                    ? 'bg-white text-black border-white'
                                                    : 'bg-transparent border-gray-700 text-gray-300 hover:border-gray-600'
                                            }`}
                                        >
                                            {level.charAt(0).toUpperCase() + level.slice(1)}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Skills Management */}
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    Skills to Assess ({selectedSkills.length})
                                </label>
                                
                                <div className="flex gap-2 mb-3">
                                    <input
                                        type="text"
                                        value={newSkillInput}
                                        onChange={(e) => setNewSkillInput(e.target.value)}
                                        onKeyPress={handleSkillInputKeyPress}
                                        disabled={isGenerating}
                                        placeholder="Add a skill"
                                        className="flex-1 bg-black border border-gray-700 rounded-lg px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-gray-600 disabled:opacity-50"
                                    />
                                    <button
                                        onClick={addSkill}
                                        disabled={!newSkillInput.trim() || isGenerating}
                                        className="px-6 py-2.5 bg-white text-black rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50 font-medium"
                                    >
                                        Add
                                    </button>
                                </div>

                                {selectedSkills.length > 0 && (
                                    <div className="flex flex-wrap gap-2">
                                        {selectedSkills.map((skill, index) => (
                                            <span
                                                key={index}
                                                className="inline-flex items-center px-3 py-1.5 rounded-lg bg-gray-800 text-white text-sm"
                                            >
                                                {skill}
                                                <button
                                                    onClick={() => removeSkill(skill)}
                                                    disabled={isGenerating}
                                                    className="ml-2 hover:text-gray-400 transition-colors"
                                                >
                                                    <X className="w-3 h-3" />
                                                </button>
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Generate Button */}
                        <div className="mt-8 flex justify-end gap-3">
                            {(selectedRole || selectedSkills.length > 0) && (
                                <button
                                    onClick={resetForm}
                                    disabled={isGenerating}
                                    className="px-6 py-2.5 bg-transparent border border-gray-700 text-gray-300 rounded-lg hover:border-gray-600 transition-colors disabled:opacity-50"
                                >
                                    Reset
                                </button>
                            )}
                            <button
                                onClick={generateAssessment}
                                disabled={!selectedRole || selectedSkills.length === 0 || isGenerating}
                                className="px-6 py-2.5 bg-white text-black rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50 flex items-center font-medium"
                            >
                                {isGenerating ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin mr-2"></div>
                                        Generating...
                                    </>
                                ) : (
                                    <>
                                        <Zap className="w-4 h-4 mr-2" />
                                        Generate
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {/* Success Message */}
                        <div className="bg-green-900/20 border border-green-800 rounded-lg p-4">
                            <div className="flex items-center">
                                <Check className="w-5 h-5 text-green-400 mr-3" />
                                <span className="text-green-400">
                                    Assessment generated successfully for {assessmentResult.role_name}
                                </span>
                            </div>
                        </div>

                        {/* Action Buttons - Only shown after generation */}
                        <div className="flex items-center justify-center gap-3 p-6 bg-gray-900 rounded-lg border border-gray-800">
                            <button
                                onClick={handleEditAssessment}
                                className="px-6 py-2.5 bg-white text-black rounded-lg hover:bg-gray-200 transition-colors flex items-center font-medium"
                            >
                                <Edit2 className="w-4 h-4 mr-2" />
                                Edit Assessment
                            </button>
                            <button
                                onClick={() => setShowDeployDialog(true)}
                                className="px-6 py-2.5 bg-transparent border border-gray-700 text-white rounded-lg hover:border-gray-600 transition-colors flex items-center"
                            >
                                <Rocket className="w-4 h-4 mr-2" />
                                Deploy to Course
                            </button>
                            <button
                                onClick={copyShareLink}
                                className="px-6 py-2.5 bg-transparent border border-gray-700 text-white rounded-lg hover:border-gray-600 transition-colors flex items-center"
                            >
                                <Share2 className="w-4 h-4 mr-2" />
                                Share
                            </button>
                        </div>

                        {/* Assessment Overview */}
                        <div className="bg-gray-900 rounded-lg border border-gray-800 p-6">
                            <h3 className="text-xl font-medium mb-4">Overview</h3>
                            
                            <div className="grid grid-cols-4 gap-4 mb-6">
                                <div className="text-center">
                                    <div className="text-3xl font-semibold text-white">{assessmentResult.total_questions}</div>
                                    <div className="text-sm text-gray-400">Questions</div>
                                </div>
                                <div className="text-center">
                                    <div className="text-3xl font-semibold text-white">{assessmentResult.estimated_duration_minutes}</div>
                                    <div className="text-sm text-gray-400">Minutes</div>
                                </div>
                                <div className="text-center">
                                    <div className="text-3xl font-semibold text-white">{assessmentResult.target_skills.length}</div>
                                    <div className="text-sm text-gray-400">Skills</div>
                                </div>
                                <div className="text-center">
                                    <div className="text-3xl font-semibold text-white capitalize">{assessmentResult.difficulty_level}</div>
                                    <div className="text-sm text-gray-400">Difficulty</div>
                                </div>
                            </div>

                            <div className="flex flex-wrap gap-2">
                                {assessmentResult.target_skills.map((skill, index) => (
                                    <span key={index} className="px-3 py-1.5 bg-gray-800 text-white rounded-lg text-sm">
                                        {skill}
                                    </span>
                                ))}
                            </div>
                        </div>

                        {/* Questions Preview */}
                        <div className="space-y-4">
                            {/* MCQs */}
                            {assessmentResult.mcqs && assessmentResult.mcqs.length > 0 && (
                                <div className="bg-gray-900 rounded-lg border border-gray-800">
                                    <button
                                        onClick={() => toggleSection('mcqs')}
                                        className="w-full p-4 flex items-center justify-between hover:bg-gray-800/50 transition-colors"
                                    >
                                        <h3 className="text-lg font-medium">
                                            Multiple Choice Questions ({assessmentResult.mcqs.length})
                                        </h3>
                                        {expandedSections.mcqs ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                                    </button>
                                    
                                    {expandedSections.mcqs && (
                                        <div className="p-4 pt-0 space-y-3">
                                            {assessmentResult.mcqs.slice(0, 3).map((q, idx) => (
                                                <div key={q.id} className="bg-gray-800 rounded-lg p-4">
                                                    <p className="text-white font-medium mb-2">
                                                        {idx + 1}. {q.question}
                                                    </p>
                                                    <div className="space-y-1 text-sm text-gray-400">
                                                        {q.options.map((option, optIdx) => (
                                                            <div key={optIdx} className={optIdx === q.correct_answer ? 'text-green-400' : ''}>
                                                                {String.fromCharCode(65 + optIdx)}. {option}
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            ))}
                                            {assessmentResult.mcqs.length > 3 && (
                                                <p className="text-center text-gray-500 text-sm">
                                                    +{assessmentResult.mcqs.length - 3} more questions
                                                </p>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Similar sections for SAQs, Case Study, and Aptitude Questions */}
                            {/* (Keep minimal styling similar to MCQs section above) */}
                        </div>

                        {/* Generate Another Button */}
                        <div className="text-center">
                            <button
                                onClick={resetForm}
                                className="text-gray-400 hover:text-white transition-colors"
                            >
                                Generate another assessment
                            </button>
                        </div>
                    </div>
                )}
            </div>
{/* 

            {showDeployDialog && (
                <DeployToCourseDialog
                    assessmentId={currentAssessmentId!}
                    onClose={() => setShowDeployDialog(false)}
                    onSuccess={() => {
                        setShowDeployDialog(false);
                        setToast({
                            show: true,
                            message: "Assessment deployed successfully",
                            type: 'success'
                        });
                    }}
                />
            )} */}

            {/* Toast */}
            {toast.show && (
                <Toast
                    title={toast.message}
                    show={toast.show}
                    description=""
                    emoji=""
                    onClose={() => setToast({ ...toast, show: false })}
                />
            )}
        </div>
    );
}
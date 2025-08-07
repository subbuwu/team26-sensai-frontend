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
    Settings
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
import { PulsatingButton } from "./magicui/pulsating-button";

// Session storage key
const ASSESSMENT_STORAGE_KEY = 'cached_assessment_result';

interface StoredAssessmentData {
    result: AssessmentResult;
    timestamp: number;
    expiresIn: number; // milliseconds
}

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

    // UI Enhancement states
    const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
        mcqs: true,
        saqs: true,
        case_study: true,
        aptitude: true
    });
    const [copied, setCopied] = useState<string | null>(null);

  

    // Cache assessment result
    const cacheAssessmentResult = (result: AssessmentResult) => {
        try {
            const data: StoredAssessmentData = {
                result,
                timestamp: Date.now(),
                expiresIn: 24 * 60 * 60 * 1000 // 24 hours
            };
            sessionStorage.setItem(ASSESSMENT_STORAGE_KEY, JSON.stringify(data));
        } catch (error) {
            console.error('Failed to cache assessment result:', error);
        }
    };

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
        // Clear cached data when generating new assessment
        sessionStorage.removeItem(ASSESSMENT_STORAGE_KEY);

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
                cacheAssessmentResult(data);
            } else {
                throw new Error('Failed to start assessment generation');
            }
        } catch (error) {
            console.error('Generation error:', error);
            setError('Failed to generate assessment. Please try again.');
            setIsGenerating(false);
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
        // Clear cached data
        sessionStorage.removeItem(ASSESSMENT_STORAGE_KEY);
    };

    const toggleSection = (section: string) => {
        setExpandedSections(prev => ({
            ...prev,
            [section]: !prev[section]
        }));
    };

    const copyToClipboard = async (text: string, type: string) => {
        try {
            await navigator.clipboard.writeText(text);
            setCopied(type);
            setTimeout(() => setCopied(null), 2000);
        } catch (error) {
            console.error('Failed to copy:', error);
        }
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
        <>
            {/* Admin/Owner Banner */}
            {isAdminOrOwner && (
                <div className="bg-[#111111] border-b border-gray-800 text-white py-3 px-4 text-center shadow-sm">
                    <p className="font-light text-sm">
                        You are viewing the role assessment generator as an admin.
                    </p>
                </div>
            )}

            {/* Header */}
            <div className="hidden sm:block">
                <header className="w-full px-3 py-4 bg-black text-white border-b border-gray-800">
                    <div className="max-w-full mx-auto flex justify-between items-center">
                        {/* Logo */}
                        <Link href="/">
                            <div className="cursor-pointer">
                                <Image
                                    src="/images/sensai-logo.svg"
                                    alt="SensAI Logo"
                                    width={120}
                                    height={40}
                                    className="w-[100px] h-auto sm:w-[120px]"
                                    style={{
                                        maxWidth: '100%',
                                        height: 'auto'
                                    }}
                                    priority
                                />
                            </div>
                        </Link>

                        {/* Right side actions */}
                        <div className="flex items-center space-x-4 pr-1">
                            {/* Profile dropdown */}
                            <div className="relative" ref={profileMenuRef}>
                                <button
                                    className="w-10 h-10 rounded-full bg-purple-700 flex items-center justify-center hover:bg-purple-600 transition-colors focus:outline-none focus:ring-0 focus:border-0 cursor-pointer"
                                    onClick={toggleProfileMenu}
                                >
                                    <span className="text-white font-medium">{getInitials()}</span>
                                </button>

                                {/* Profile dropdown menu */}
                                {profileMenuOpen && (
                                    <div className="absolute right-0 mt-2 w-64 bg-[#111111] rounded-md shadow-lg py-1 z-10 border border-gray-800">
                                        <div className="px-4 py-3 border-b border-gray-800">
                                            <div className="flex items-center">
                                                <div className="w-10 h-10 rounded-full bg-purple-700 flex items-center justify-center mr-3">
                                                    <span className="text-white font-medium">{getInitials()}</span>
                                                </div>
                                                <div>
                                                    <div className="text-sm font-medium">{session?.user?.name || "User"}</div>
                                                    <div className="text-xs text-gray-400">{session?.user?.email || "user@example.com"}</div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="border-t border-gray-800 py-1">
                                            <button
                                                onClick={handleLogout}
                                                className="flex w-full items-center text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-800 cursor-pointer"
                                            >
                                                <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                                </svg>
                                                Logout
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </header>
            </div>

            {/* Main Content */}
            <div className="min-h-screen bg-black text-white relative ">
               <div className="bg-black/30 backdrop-blur-sm rounded-full p-6 fixed left-1/2 -bottom-6 -translate-x-1/2 -translate-y-1/2 flex items-center gap-4">
                             <button className=" bg-black cursor-pointer shadow-[inset_0_0_0_2px_#616467] hover:text-black px-6 py-2 rounded-full  font-bold hover:bg-gray-100 transition-all duration-150 dark:text-neutral-200 z-50">
  Save Changes
</button>
 <button className=" bg-black cursor-pointer shadow-[inset_0_0_0_2px_#616467] hover:text-black px-6 py-2 rounded-full  font-bold hover:bg-gray-100 transition-all duration-150 dark:text-neutral-200 z-50">
  Deploy To Courses
</button>
 <button className=" bg-black cursor-pointer shadow-[inset_0_0_0_2px_#616467] hover:text-black px-6 py-2 rounded-full  font-bold hover:bg-gray-100 transition-all duration-150 dark:text-neutral-200 z-50">
  Share 
</button>
               </div>
                <div className="container mx-auto px-4 py-8 max-w-6xl">
                    
                    {/* Page Header */}
                    <div className="mb-8">
                        <div className="flex items-center mb-4">
                            <button
                                onClick={handleBackClick}
                                className="mr-4 text-gray-400 hover:text-white transition-colors"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                </svg>
                            </button>
                            <div>
                                <h1 className="text-3xl font-bold text-white">Role Assessment Generator</h1>
                                <p className="text-gray-400 text-lg mt-1">
                                    Generate comprehensive role-based assessments with AI-powered questions and analytics.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Error Message */}
                    {error && (
                        <div className="mb-6 bg-red-900/20 border border-red-800 rounded-xl p-4">
                            <div className="flex items-center">
                                <AlertCircle className="w-5 h-5 text-red-400 mr-3" />
                                <span className="text-red-400">{error}</span>
                            </div>
                        </div>
                    )}

                    {/* Generation Form */}
                    {!assessmentResult && (
                        <div className="bg-[#111111] rounded-xl border border-gray-800 p-6 mb-8">
                            <h2 className="text-xl font-semibold mb-6 flex items-center">
                                <Target className="w-5 h-5 mr-2 text-purple-400" />
                                Assessment Configuration
                            </h2>

                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                {/* Role Input */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">
                                        Target Role *
                                    </label>
                                    <input
                                        type="text"
                                        value={selectedRole}
                                        onChange={(e) => setSelectedRole(e.target.value)}
                                        disabled={isGenerating}
                                        placeholder="e.g., Product Analyst, Software Engineer, Data Scientist..."
                                        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-400 hover:border-gray-600 focus:outline-none focus:border-purple-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                    />
                                </div>

                                {/* Difficulty Selection */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">
                                        Difficulty Level
                                    </label>
                                    <div className="flex space-x-2">
                                        {(['easy', 'medium', 'hard'] as const).map((level) => (
                                            <button
                                                key={level}
                                                onClick={() => setSelectedDifficulty(level)}
                                                disabled={isGenerating}
                                                className={`flex-1 px-4 py-3 cursor-pointer rounded-lg border font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${
                                                    selectedDifficulty === level
                                                        ? 'bg-purple-600 border-purple-500 text-white shadow-lg'
                                                        : 'bg-gray-800 border-gray-700 text-gray-300 hover:border-gray-600'
                                                }`}
                                            >
                                                {level.charAt(0).toUpperCase() + level.slice(1)}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Skills Management */}
                                <div className="lg:col-span-2">
                                    <label className="block text-sm font-medium text-gray-300 mb-2">
                                        Skills to Assess * ({selectedSkills.length} added)
                                    </label>
                                    
                                    {/* Add New Skill Input */}
                                    <div className="flex space-x-2 mb-4">
                                        <input
                                            type="text"
                                            value={newSkillInput}
                                            onChange={(e) => setNewSkillInput(e.target.value)}
                                            onKeyPress={handleSkillInputKeyPress}
                                            disabled={isGenerating}
                                            placeholder="Add a skill (e.g., SQL, Python, Data Analysis...)"
                                            className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-400 hover:border-gray-600 focus:outline-none focus:border-purple-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                        />
                                        <button
                                            onClick={addSkill}
                                            disabled={!newSkillInput.trim() || isGenerating}
                                            className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                                        >
                                            Add
                                        </button>
                                    </div>

                                    {/* Selected Skills Display */}
                                    {selectedSkills.length > 0 ? (
                                        <div className="flex flex-wrap gap-2">
                                            {selectedSkills.map((skill, index) => (
                                                <span
                                                    key={index}
                                                    className="inline-flex items-center px-3 py-2 rounded-lg bg-purple-600/20 border border-purple-600/30 text-purple-300 text-sm font-medium"
                                                >
                                                    {skill}
                                                    <button
                                                        onClick={() => removeSkill(skill)}
                                                        disabled={isGenerating}
                                                        className="ml-2 hover:text-purple-100 disabled:opacity-50 transition-colors"
                                                    >
                                                        <X className="w-4 h-4 cursor-pointer" />
                                                    </button>
                                                </span>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="text-gray-400 text-sm py-8 text-center border-2 border-dashed border-gray-700 rounded-lg">
                                            <Settings className="w-8 h-8 text-gray-500 mx-auto mb-2" />
                                            No skills added yet. Add skills above to get started.
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Generate Button */}
                            <div className="mt-8 flex items-center justify-between">
                                <div className="text-sm text-gray-400">
                                    * Required fields
                                </div>
                                <div className="flex space-x-3">
                                    {(selectedRole || selectedSkills.length > 0) && (
                                        <button
                                            onClick={resetForm}
                                            disabled={isGenerating}
                                            className="px-6 cursor-pointer py-3 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                                        >
                                            Reset
                                        </button>
                                    )}
                                    <button
                                        onClick={generateAssessment}
                                        disabled={!selectedRole || selectedSkills.length === 0 || isGenerating}
                                        className="px-8 py-3 cursor-pointer bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-lg hover:from-purple-700 hover:to-purple-800 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center font-medium shadow-lg"
                                    >
                                        {isGenerating ? (
                                            <>
                                                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                                                Generating...
                                            </>
                                        ) : (
                                            <>
                                                <Zap className="w-5 h-5 mr-2" />
                                                Generate Assessment
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Generation Progress */}
                    {isGenerating && generationStatus && (
                        <div className="bg-[#111111] rounded-xl border border-gray-800 p-6 mb-8">
                            <h3 className="text-lg font-semibold mb-4 flex items-center">
                                <Clock className="w-5 h-5 mr-2 text-blue-400 animate-pulse" />
                                Generating Assessment...
                            </h3>
                            
                            <div className="space-y-4">
                                {/* Progress Bar */}
                                <div>
                                    <div className="flex justify-between text-sm text-gray-400 mb-2">
                                        <span>{generationStatus.current_step}</span>
                                        <span>{generationStatus.progress_percentage}%</span>
                                    </div>
                                    <div className="w-full bg-gray-800 rounded-full h-3 overflow-hidden">
                                        <div 
                                            className="bg-gradient-to-r from-purple-600 to-blue-600 h-3 rounded-full transition-all duration-500 relative overflow-hidden"
                                            style={{ width: `${generationStatus.progress_percentage}%` }}
                                        >
                                            <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
                                        </div>
                                    </div>
                                </div>

                                {/* Status Info */}
                                <div className="flex items-center justify-between text-sm text-gray-400">
                                    <span className="flex items-center">
                                        <span className="w-2 h-2 bg-blue-400 rounded-full mr-2 animate-pulse"></span>
                                        Assessment ID: {generationStatus.assessment_id}
                                    </span>
                                    <span>~{Math.ceil(generationStatus.estimated_completion_seconds / 60)} minutes remaining</span>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Assessment Results Preview */}
                    {assessmentResult && (
                        <div className="space-y-8">
                            {/* Success Header */}
                            <div className="bg-gradient-to-r from-green-900/20 to-emerald-900/20 border border-green-800/50 rounded-xl p-6 mx-auto max-w-md">
                                <div className="flex items-center justify-center mx-auto">
                                    <div className="w-12 h-12 bg-green-600/20 rounded-full flex items-center justify-center mr-4">
                                        <Check className="w-6 h-6 text-green-400" />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-semibold text-green-400">Assessment Generated Successfully!</h3>
                                        <p className="text-green-300 text-sm">
                                            Created {assessmentResult.total_questions} questions for {assessmentResult.role_name} role
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Assessment Overview */}
                            <div className="bg-[#111111] rounded-xl border border-gray-800 p-6">
                                <h3 className="text-xl font-semibold mb-6 flex items-center">
                                    <BarChart3 className="w-5 h-5 mr-2 text-blue-400" />
                                    Assessment Overview
                                </h3>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                                    <div className="bg-gradient-to-br from-purple-600/10 to-purple-800/10 border border-purple-600/30 rounded-xl p-6 text-center">
                                        <div className="w-12 h-12 bg-purple-600/20 rounded-full flex items-center justify-center mx-auto mb-3">
                                            <BookOpen className="w-6 h-6 text-purple-400" />
                                        </div>
                                        <div className="text-3xl font-bold text-purple-400 mb-1">{assessmentResult.total_questions}</div>
                                        <div className="text-gray-400 text-sm">Total Questions</div>
                                    </div>
                                    <div className="bg-gradient-to-br from-blue-600/10 to-blue-800/10 border border-blue-600/30 rounded-xl p-6 text-center">
                                        <div className="w-12 h-12 bg-blue-600/20 rounded-full flex items-center justify-center mx-auto mb-3">
                                            <Clock className="w-6 h-6 text-blue-400" />
                                        </div>
                                        <div className="text-3xl font-bold text-blue-400 mb-1">{assessmentResult.estimated_duration_minutes}min</div>
                                        <div className="text-gray-400 text-sm">Estimated Time</div>
                                    </div>
                                    <div className="bg-gradient-to-br from-green-600/10 to-green-800/10 border border-green-600/30 rounded-xl p-6 text-center">
                                        <div className="w-12 h-12 bg-green-600/20 rounded-full flex items-center justify-center mx-auto mb-3">
                                            <Target className="w-6 h-6 text-green-400" />
                                        </div>
                                        <div className="text-3xl font-bold text-green-400 mb-1">{assessmentResult.target_skills.length}</div>
                                        <div className="text-gray-400 text-sm">Skills Covered</div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4 text-center">
                                        <div className="font-bold text-xl text-white mb-1">{assessmentResult.mcqs?.length || 0}</div>
                                        <div className="text-gray-400 text-xs">Multiple Choice</div>
                                    </div>
                                    <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4 text-center">
                                        <div className="font-bold text-xl text-white mb-1">{assessmentResult.saqs?.length || 0}</div>
                                        <div className="text-gray-400 text-xs">Short Answer</div>
                                    </div>
                                    <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4 text-center">
                                        <div className="font-bold text-xl text-white mb-1">{assessmentResult.case_study ? 1 : 0}</div>
                                        <div className="text-gray-400 text-xs">Case Study</div>
                                    </div>
                                    <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4 text-center">
                                        <div className="font-bold text-xl text-white mb-1">{assessmentResult.aptitude_questions?.length || 0}</div>
                                        <div className="text-gray-400 text-xs">Aptitude</div>
                                    </div>
                                </div>
                            </div>

                            {/* Skill Coverage Analysis */}
                            <div className="bg-[#111111] rounded-xl border border-gray-800 p-6">
                                <h3 className="text-xl font-semibold mb-6 flex items-center">
                                    <Users className="w-5 h-5 mr-2 text-purple-400" />
                                    Skill Coverage Analysis
                                </h3>

                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm">
                                        <thead>
                                            <tr className="border-b border-gray-800">
                                                <th className="text-left py-4 px-4 text-gray-400 font-medium uppercase tracking-wider">Skill</th>
                                                <th className="text-center py-4 px-4 text-gray-400 font-medium uppercase tracking-wider">Questions</th>
                                                <th className="text-center py-4 px-4 text-gray-400 font-medium uppercase tracking-wider">Coverage</th>
                                                {/* <th className="text-center py-4 px-4 text-gray-400 font-medium uppercase tracking-wider">Quality</th> */}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {assessmentResult.skill_coverage?.map((coverage, index) => (
                                                <tr key={index} className="border-b border-gray-800/50 last:border-b-0 hover:bg-gray-800/20 transition-colors">
                                                    <td className="py-4 px-4">
                                                        <div className="font-medium text-white">{coverage.skill_name}</div>
                                                    </td>
                                                    <td className="py-4 px-4 text-center">
                                                        <span className="bg-blue-600/20 text-blue-400 px-3 py-1 rounded-lg font-bold">
                                                            {coverage.question_count}
                                                        </span>
                                                    </td>
                                                    <td className="py-4 px-4 text-center">
                                                        <div className="flex items-center justify-center space-x-2">
                                                            {/* <div className="w-12 bg-gray-700 rounded-full h-2 overflow-hidden">
                                                                <div 
                                                                    className="bg-purple-600 h-2 rounded-full transition-all duration-300"
                                                                    style={{ width: `${coverage.coverage_percentage}%` }}
                                                                ></div>
                                                            </div> */}
                                                            <span className="text-purple-400 font-bold text-sm min-w-[3rem]">
                                                                {coverage.coverage_percentage}%
                                                            </span>
                                                        </div>
                                                    </td>
                                                    {/* <td className="py-4 px-4 text-center">
                                                        <span className={`inline-flex items-center px-3 py-1 rounded-lg text-xs font-medium border ${getCoverageQualityColor(coverage.quality)}`}>
                                                            <span className="mr-1">{getCoverageQualityIcon(coverage.quality)}</span>
                                                            {coverage.quality}
                                                        </span>
                                                    </td> */}
                                                    
                                                </tr>
                                            ))}
                                              <tr className="border-t border-b border-gray-800/50 last:border-b-0 hover:bg-gray-800/20 transition-colors">
                                                    <td className="py-4 px-4 font-semibold text-base">Total</td>
                                                    <td className="py-4 px-4 text-center font-semibold text-base">{assessmentResult.mcqs.length + assessmentResult.saqs.length } </td>
                                                    <td className="py-4 px-4 text-center font-semibold text-base">{assessmentResult.skill_coverage.reduce((coverage,val) => coverage + val.coverage_percentage,0).toFixed(2)}%</td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            {/* Assessment Questions Preview */}
                            <div className="bg-[#111111] rounded-xl border border-gray-800 p-6">
                                <h3 className="text-xl font-semibold mb-6 flex items-center">
                                    <Eye className="w-5 h-5 mr-2 text-yellow-400" />
                                    Assessment Questions Preview
                                </h3>

                                <div className="space-y-8">
                                    {/* MCQs */}
                                    {assessmentResult.mcqs && assessmentResult.mcqs.length > 0 && (
                                        <div>
                                            <div 
                                                className="flex items-center justify-between mb-4 cursor-pointer"
                                                onClick={() => toggleSection('mcqs')}
                                            >
                                                <h4 className="text-lg font-semibold text-purple-400 flex items-center">
                                                    <div className="w-8 h-8 bg-purple-600/20 rounded-lg flex items-center justify-center mr-3">
                                                        <span className="text-purple-400 font-bold text-sm">{assessmentResult.mcqs.length}</span>
                                                    </div>
                                                    Multiple Choice Questions
                                                </h4>
                                                {expandedSections.mcqs ? 
                                                    <ChevronUp className="w-5 h-5 text-gray-400" /> : 
                                                    <ChevronDown className="w-5 h-5 text-gray-400" />
                                                }
                                            </div>
                                            
                                            {expandedSections.mcqs && (
                                                <div className="space-y-4">
                                                    {assessmentResult.mcqs.slice(0, 3).map((q, idx) => 
                                                        renderQuestionCard(q, idx, 'mcq')
                                                    )}
                                                    {assessmentResult.mcqs.length > 3 && (
                                                        <div className="text-center py-4">
                                                            <span className="text-gray-400 text-sm bg-gray-800 px-4 py-2 rounded-lg">
                                                                + {assessmentResult.mcqs.length - 3} more questions
                                                            </span>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* SAQs */}
                                    {assessmentResult.saqs && assessmentResult.saqs.length > 0 && (
                                        <div>
                                            <div 
                                                className="flex items-center justify-between mb-4 cursor-pointer"
                                                onClick={() => toggleSection('saqs')}
                                            >
                                                <h4 className="text-lg font-semibold text-blue-400 flex items-center">
                                                    <div className="w-8 h-8 bg-blue-600/20 rounded-lg flex items-center justify-center mr-3">
                                                        <span className="text-blue-400 font-bold text-sm">{assessmentResult.saqs.length}</span>
                                                    </div>
                                                    Short Answer Questions
                                                </h4>
                                                {expandedSections.saqs ? 
                                                    <ChevronUp className="w-5 h-5 text-gray-400" /> : 
                                                    <ChevronDown className="w-5 h-5 text-gray-400" />
                                                }
                                            </div>
                                            
                                            {expandedSections.saqs && (
                                                <div className="space-y-4">
                                                    {assessmentResult.saqs.slice(0, 2).map((q, idx) => 
                                                        renderQuestionCard(q, idx, 'saq')
                                                    )}
                                                    {assessmentResult.saqs.length > 2 && (
                                                        <div className="text-center py-4">
                                                            <span className="text-gray-400 text-sm bg-gray-800 px-4 py-2 rounded-lg">
                                                                + {assessmentResult.saqs.length - 2} more questions
                                                            </span>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* Case Study */}
                                    {assessmentResult.case_study && (
                                        <div>
                                            <div 
                                                className="flex items-center justify-between mb-4 cursor-pointer"
                                                onClick={() => toggleSection('case_study')}
                                            >
                                                <h4 className="text-lg font-semibold text-green-400 flex items-center">
                                                    <div className="w-8 h-8 bg-green-600/20 rounded-lg flex items-center justify-center mr-3">
                                                        <span className="text-green-400 font-bold text-sm">1</span>
                                                    </div>
                                                    Case Study
                                                </h4>
                                                {expandedSections.case_study ? 
                                                    <ChevronUp className="w-5 h-5 text-gray-400" /> : 
                                                    <ChevronDown className="w-5 h-5 text-gray-400" />
                                                }
                                            </div>
                                            
                                            {expandedSections.case_study && renderCaseStudy(assessmentResult.case_study)}
                                        </div>
                                    )}

                                    {/* Aptitude Questions */}
                                    {assessmentResult.aptitude_questions && assessmentResult.aptitude_questions.length > 0 && (
                                        <div>
                                            <div 
                                                className="flex items-center justify-between mb-4 cursor-pointer"
                                                onClick={() => toggleSection('aptitude')}
                                            >
                                                <h4 className="text-lg font-semibold text-yellow-400 flex items-center">
                                                    <div className="w-8 h-8 bg-yellow-600/20 rounded-lg flex items-center justify-center mr-3">
                                                        <span className="text-yellow-400 font-bold text-sm">{assessmentResult.aptitude_questions.length}</span>
                                                    </div>
                                                    Aptitude Questions
                                                </h4>
                                                {expandedSections.aptitude ? 
                                                    <ChevronUp className="w-5 h-5 text-gray-400" /> : 
                                                    <ChevronDown className="w-5 h-5 text-gray-400" />
                                                }
                                            </div>
                                            
                                            {expandedSections.aptitude && (
                                                <div className="space-y-4">
                                                    {assessmentResult.aptitude_questions.slice(0, 2).map((q, idx) => 
                                                        renderQuestionCard(q, idx, 'aptitude')
                                                    )}
                                                    {assessmentResult.aptitude_questions.length > 2 && (
                                                        <div className="text-center py-4">
                                                            <span className="text-gray-400 text-sm bg-gray-800 px-4 py-2 rounded-lg">
                                                                + {assessmentResult.aptitude_questions.length - 2} more questions
                                                            </span>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Action Buttons */}
                            {/* <div className="flex flex-wrap gap-4 justify-center">
                                <button
                                    onClick={() => {
                                        router.push(`/assessments/${assessmentResult.assessment_id}`);
                                    }}
                                    className="px-6 py-3 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-lg hover:from-purple-700 hover:to-purple-800 transition-all duration-200 flex items-center font-medium shadow-lg"
                                >
                                    <Play className="w-4 h-4 mr-2" />
                                    Take Assessment
                                </button>
                                
                                <button
                                    onClick={() => {
                                        router.push(`/assessments/${assessmentResult.assessment_id}/preview`);
                                    }}
                                    className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-200 flex items-center font-medium shadow-lg"
                                >
                                    <Eye className="w-4 h-4 mr-2" />
                                    Full Preview
                                </button>
                                
                                <button
                                    onClick={() => {
                                        console.log('Deploy to course');
                                    }}
                                    className="px-6 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg hover:from-green-700 hover:to-green-800 transition-all duration-200 flex items-center font-medium shadow-lg"
                                >
                                    <Target className="w-4 h-4 mr-2" />
                                    Deploy to Course
                                </button>
                                
                                <button
                                    onClick={() => {
                                        const dataStr = JSON.stringify(assessmentResult, null, 2);
                                        const dataBlob = new Blob([dataStr], { type: 'application/json' });
                                        const url = URL.createObjectURL(dataBlob);
                                        const link = document.createElement('a');
                                        link.href = url;
                                        link.download = `${assessmentResult.role_name}_assessment.json`;
                                        document.body.appendChild(link);
                                        link.click();
                                        document.body.removeChild(link);
                                        URL.revokeObjectURL(url);
                                    }}
                                    className="px-6 py-3 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 transition-colors flex items-center font-medium"
                                >
                                    <Download className="w-4 h-4 mr-2" />
                                    Export JSON
                                </button>
                                
                                <button
                                    onClick={() => {
                                        copyToClipboard(window.location.href, 'share-link');
                                    }}
                                    className="px-6 py-3 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 transition-colors flex items-center font-medium"
                                >
                                    {copied === 'share-link' ? (
                                        <Check className="w-4 h-4 mr-2 text-green-400" />
                                    ) : (
                                        <Share2 className="w-4 h-4 mr-2" />
                                    )}
                                    {copied === 'share-link' ? 'Copied!' : 'Share'}
                                </button>
                                
                                <button
                                    onClick={resetForm}
                                    className="px-6 py-3 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 transition-colors font-medium"
                                >
                                    Generate Another
                                </button>
                            </div> */}
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}
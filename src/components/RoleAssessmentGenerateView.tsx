// src/components/RoleAssessmentGenerateView.tsx (Optimized)
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
    BookOpen, 
    Target, 
    Zap,
    ChevronDown,
    ChevronUp,
    Share2,
    Settings,
    Rocket,
    Edit2,
    ArrowLeft,
    Loader2
} from "lucide-react";
import { 
    AssessmentResult, 
    GenerateAssessmentRequest,
} from "@/types/assessment";
import Toast from "@/components/Toast";
import DeployToCourseDialog from "@/components/DeployToCourseDialog";

// Debounce hook for optimized input handling
function useDebounce<T>(value: T, delay: number): T {
    const [debouncedValue, setDebouncedValue] = useState<T>(value);

    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);

        return () => {
            clearTimeout(handler);
        };
    }, [value, delay]);

    return debouncedValue;
}

export default function RoleAssessmentGenerateView({ slug }: { slug: string }) {
    const router = useRouter();
    const { data: session } = useSession();
    const { user, isAuthenticated, isLoading: authLoading } = useAuth();

    // Form state
    const [selectedRole, setSelectedRole] = useState<string>('');
    const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
    const [selectedDifficulty, setSelectedDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
    const [newSkillInput, setNewSkillInput] = useState<string>('');

    const [isGenerating, setIsGenerating] = useState(false);
    const [generationStartTime, setGenerationStartTime] = useState<number>(0);
    const [estimatedTime, setEstimatedTime] = useState<number>(10); // seconds
    
    // Generation state
    const [currentAssessmentId, setCurrentAssessmentId] = useState<string | null>(null);
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

    // Suggested roles and skills for better UX
    const suggestedRoles = [
        "Software Engineer",
        "Product Manager",
        "Data Analyst",
        "Marketing Manager",
        "UX Designer",
        "Sales Executive"
    ];

    const suggestedSkills = [
        "Python", "JavaScript", "SQL", "Data Analysis",
        "Communication", "Problem Solving", "Leadership",
        "Project Management", "Machine Learning", "Cloud Computing"
    ];

    // Debounced role input for better performance
    const debouncedRole = useDebounce(selectedRole, 300);

    // Timer for showing generation progress
    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (isGenerating) {
            interval = setInterval(() => {
                const elapsed = (Date.now() - generationStartTime) / 1000;
                if (elapsed >= estimatedTime) {
                    // Show that it's taking longer than expected
                    setEstimatedTime(prev => prev + 5);
                }
            }, 100);
        }
        return () => clearInterval(interval);
    }, [isGenerating, generationStartTime, estimatedTime]);

    const generateAssessment = async () => {
        if (!selectedRole || selectedSkills.length === 0) {
            setError('Please select a role and at least one skill');
            return;
        }

        setIsGenerating(true);
        setError(null);
        setAssessmentResult(null);
        setGenerationStartTime(Date.now());
        setEstimatedTime(10); // Reset estimated time

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
                setAssessmentResult(data);
                
                // Show generation time
                const generationTime = ((Date.now() - generationStartTime) / 1000).toFixed(1);
                setToast({
                    show: true,
                    message: `Assessment generated in ${generationTime} seconds!`,
                    type: 'success'
                });
            } else {
                throw new Error('Failed to generate assessment');
            }
        } catch (error) {
            console.error('Generation error:', error);
            setError('Failed to generate assessment. Please try again.');
        } finally {
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

    const toggleSection = (section: string) => {
        setExpandedSections(prev => ({
            ...prev,
            [section]: !prev[section]
        }));
    };

    const resetForm = () => {
        setSelectedRole('');
        setSelectedSkills([]);
        setSelectedDifficulty('medium');
        setCurrentAssessmentId(null);
        setAssessmentResult(null);
        setError(null);
        setIsGenerating(false);
    };

    const addSkill = (skill?: string) => {
        const skillToAdd = skill || newSkillInput.trim();
        if (skillToAdd && !selectedSkills.includes(skillToAdd)) {
            setSelectedSkills(prev => [...prev, skillToAdd]);
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

    const handleRoleSelect = (role: string) => {
        setSelectedRole(role);
    };

    // Loading state
    if (authLoading) {
        return (
            <div className="min-h-screen bg-black text-white flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
            </div>
        );
    }

    // Redirect if not authenticated
    if (!isAuthenticated && !authLoading) {
        router.push('/login');
        return null;
    }

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
                        Create AI-powered assessments in seconds
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
                            {/* Role Input with Suggestions */}
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
                                {!selectedRole && (
                                    <div className="mt-2 flex flex-wrap gap-2">
                                        {suggestedRoles.map((role) => (
                                            <button
                                                key={role}
                                                onClick={() => handleRoleSelect(role)}
                                                className="px-3 py-1 bg-gray-800 text-gray-300 rounded-lg hover:bg-gray-700 text-sm transition-colors"
                                            >
                                                {role}
                                            </button>
                                        ))}
                                    </div>
                                )}
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

                            {/* Skills Management with Suggestions */}
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
                                        onClick={() => addSkill()}
                                        disabled={!newSkillInput.trim() || isGenerating}
                                        className="px-6 py-2.5 bg-white text-black rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50 font-medium"
                                    >
                                        Add
                                    </button>
                                </div>

                                {/* Suggested Skills */}
                                <div className="mb-3">
                                    <p className="text-xs text-gray-500 mb-2">Suggested skills:</p>
                                    <div className="flex flex-wrap gap-2">
                                        {suggestedSkills
                                            .filter(skill => !selectedSkills.includes(skill))
                                            .slice(0, 6)
                                            .map((skill) => (
                                                <button
                                                    key={skill}
                                                    onClick={() => addSkill(skill)}
                                                    disabled={isGenerating}
                                                    className="px-3 py-1 bg-gray-800 text-gray-300 rounded-lg hover:bg-gray-700 text-sm transition-colors"
                                                >
                                                    + {skill}
                                                </button>
                                            ))}
                                    </div>
                                </div>

                                {selectedSkills.length > 0 && (
                                    
                                    <div className="flex flex-wrap gap-2">
                                        <p>Selected Skills : </p>
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
                                className="px-6 py-2.5 bg-white text-black rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50 flex items-center font-medium min-w-[140px]"
                            >
                                {isGenerating ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
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

                        {/* Generation Progress Indicator */}
                        {isGenerating && (
                            <div className="mt-4 p-3 bg-gray-800 rounded-lg">
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-gray-400">Generating your assessment...</span>
                                    <span className="text-gray-400">
                                        {Math.floor((Date.now() - generationStartTime) / 1000)}s
                                    </span>
                                </div>
                                <div className="mt-2 w-full bg-gray-700 rounded-full h-1.5 overflow-hidden">
                                    <div className="bg-white h-1.5 rounded-full animate-pulse" style={{ width: '100%' }}></div>
                                </div>
                            </div>
                        )}
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

                        {/* Quick Actions */}
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

            {/* Deploy Dialog */}
            {showDeployDialog && (
                <DeployToCourseDialog
                    open={showDeployDialog}
                    userId={session?.user.id as string}
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
            )}

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
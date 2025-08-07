"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { useSession } from "next-auth/react";
import {
    Plus,
    Eye,
    Edit,
    Target,
    BookOpen,
    Loader2,
    Search,
    Filter,
    BarChart3,
    Layers,

    Award,
    Zap,
    Share2,

} from "lucide-react";
import { AssessmentListItem } from "@/types/assessment";
import { Header } from "@/components/layout/header";
import Toast from "@/components/Toast";

export default function AssessmentsPage() {
    const router = useRouter();
    const { data: session } = useSession();
    const { user, isAuthenticated, isLoading: authLoading } = useAuth();
    const [assessments, setAssessments] = useState<AssessmentListItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isNotViewable,setIsNotViewable] = useState<boolean>(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [filterDifficulty, setFilterDifficulty] = useState<string>("all");
    const [sortBy, setSortBy] = useState<"recent" | "name" | "questions">("recent");
    const [toast, setToast] = useState<{ show: boolean; message: string; type: 'success' | 'error' }>({
        show: false,
        message: "",
        type: 'success'
    });

    useEffect(() => {
        if (isAuthenticated && !authLoading) {
            fetchAssessments();
        }
    }, [isAuthenticated, authLoading]);

    const fetchAssessments = async () => {
        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/role_assessment/list/${session?.user.id}`, {
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            if (response.ok) {
                const data = await response.json();
                setAssessments(data);
            } else if (response.status == 403) {
                setIsNotViewable(true);
                setToast({
                    show: true,
                    message: "You do not have permission to view assessments",
                    type: 'error'
                });
                // router.push('/');
                return;
            } else {
                throw new Error('Failed to fetch assessments');
            }
        } catch (error) {
            
            console.error('Error fetching assessments:', error);
            setToast({
                show: true,
                message: "Failed to load assessments",
                type: 'error'
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleCreateNew = () => {
        router.push('/role-assessment/generate');
    };

    const handleAssessmentClick = (assessmentId: string) => {
        router.push(`/role-assessment/${assessmentId}`);
    };

    const copyShareLink = async (assessmentId: string) => {
        const shareUrl = `${window.location.origin}/role-assessment/preview/${assessmentId}`;
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

    // Filter and sort assessments
    const filteredAssessments = assessments
        .filter(assessment => {
            const matchesSearch = assessment.role_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                 assessment.target_skills.some(skill => 
                                     skill.toLowerCase().includes(searchQuery.toLowerCase())
                                 );
            const matchesDifficulty = filterDifficulty === "all" || 
                                     assessment.difficulty_level === filterDifficulty;
            return matchesSearch && matchesDifficulty;
        })
        .sort((a, b) => {
            switch (sortBy) {
                case 'name':
                    return a.role_name.localeCompare(b.role_name);
                case 'questions':
                    return b.total_questions - a.total_questions;
                case 'recent':
                default:
                    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
            }
        });

    const getDifficultyColor = (difficulty: string) => {
        switch (difficulty) {
            case 'easy': return 'bg-green-600/20 text-green-400 border-green-600/30';
            case 'medium': return 'bg-yellow-600/20 text-yellow-400 border-yellow-600/30';
            case 'hard': return 'bg-red-600/20 text-red-400 border-red-600/30';
            default: return 'bg-gray-600/20 text-gray-400 border-gray-600/30';
        }
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffTime = Math.abs(now.getTime() - date.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays === 0) return 'Today';
        if (diffDays === 1) return 'Yesterday';
        if (diffDays < 7) return `${diffDays} days ago`;
        if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
        if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
        return date.toLocaleDateString();
    };

    if (authLoading || isLoading) {
        return (
            <div className="min-h-screen bg-black text-white">
                <Header />
                <div className="flex justify-center items-center py-20">
                    <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
                </div>
            </div>
        );
    }

    if (!isAuthenticated) {
        router.push('/login');
        return null;
    }

    return (
        <div className="min-h-screen bg-black text-white relative">
            {
              !isNotViewable && (
                <Header />
              )
            }
            {
              isNotViewable && (
                <div className="absolute w-full h-full backdrop-blur-lg z-50"/>
              )
            }
            
            <div className="container mx-auto px-4 py-8 max-w-7xl">
                {/* Page Header */}
                <div className="mb-8">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <h1 className="text-3xl font-bold text-white mb-2">Role Assessments</h1>
                            <p className="text-gray-400 text-lg">
                                Create and manage AI-powered assessments for different roles
                            </p>
                        </div>
                        <button
                            onClick={handleCreateNew}
                            className="px-6 py-3 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-lg hover:from-purple-700 hover:to-purple-800 transition-all duration-200 flex items-center font-medium shadow-lg"
                        >
                            <Plus className="w-5 h-5 mr-2" />
                            Create Assessment
                        </button>
                    </div>
                </div>

                {/* Search and Filters */}
                <div className="bg-[#111111] rounded-xl border border-gray-800 p-4 mb-6">
                    <div className="flex flex-col lg:flex-row gap-4">
                        {/* Search */}
                        <div className="flex-1 relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 " />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search by role or skills..."
                                className="w-full pl-10 pr-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-500"
                            />
                        </div>

                        {/* Difficulty Filter */}
                        <div className="flex items-center gap-2">
                            <Filter className="w-5 h-5 text-gray-400" />
                            <select
                                value={filterDifficulty}
                                onChange={(e) => setFilterDifficulty(e.target.value)}
                                className="px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-purple-500"
                            >
                                <option value="all">All Levels</option>
                                <option value="easy">Easy</option>
                                <option value="medium">Medium</option>
                                <option value="hard">Hard</option>
                            </select>
                        </div>

                        {/* Sort */}
                        <div className="flex items-center gap-2">
                            <BarChart3 className="w-5 h-5 text-gray-400" />
                            <select
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value as any)}
                                className="px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-purple-500"
                            >
                                <option value="recent">Most Recent</option>
                                <option value="name">Name (A-Z)</option>
                                <option value="questions">Question Count</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Statistics Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                    <div className="bg-gradient-to-br from-purple-600/10 to-purple-800/10 border border-purple-600/30 rounded-xl p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-gray-400 text-sm">Total Assessments</p>
                                <p className="text-2xl font-bold text-purple-400">{assessments.length}</p>
                            </div>
                            <Layers className="w-8 h-8 text-purple-400/50" />
                        </div>
                    </div>
                    
                    <div className="bg-gradient-to-br from-blue-600/10 to-blue-800/10 border border-blue-600/30 rounded-xl p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-gray-400 text-sm">Published</p>
                                <p className="text-2xl font-bold text-blue-400">
                                    {assessments.filter(a => a.is_published).length}
                                </p>
                            </div>
                            <Award className="w-8 h-8 text-blue-400/50" />
                        </div>
                    </div>
                    
                    <div className="bg-gradient-to-br from-green-600/10 to-green-800/10 border border-green-600/30 rounded-xl p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-gray-400 text-sm">Total Questions</p>
                                <p className="text-2xl font-bold text-green-400">
                                    {assessments.reduce((sum, a) => sum + a.total_questions, 0)}
                                </p>
                            </div>
                            <BookOpen className="w-8 h-8 text-green-400/50" />
                        </div>
                    </div>
                    
                    <div className="bg-gradient-to-br from-yellow-600/10 to-yellow-800/10 border border-yellow-600/30 rounded-xl p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-gray-400 text-sm">Deployed</p>
                                <p className="text-2xl font-bold text-yellow-400">
                                    {assessments.filter(a => a.deployed_courses_count > 0).length}
                                </p>
                            </div>
                            <Target className="w-8 h-8 text-yellow-400/50" />
                        </div>
                    </div>
                </div>

                {/* Assessments Grid */}
                {filteredAssessments.length === 0 ? (
                    <div className="bg-[#111111] rounded-xl border border-gray-800 p-12 text-center">
                        <div className="max-w-md mx-auto">
                            <Zap className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                            <h3 className="text-xl font-semibold text-gray-300 mb-2">
                                {searchQuery || filterDifficulty !== "all" 
                                    ? "No assessments found" 
                                    : "No assessments yet"}
                            </h3>
                            <p className="text-gray-400 mb-6">
                                {searchQuery || filterDifficulty !== "all"
                                    ? "Try adjusting your search or filters"
                                    : "Create your first AI-powered role assessment to get started"}
                            </p>
                            {!searchQuery && filterDifficulty === "all" && (
                                <button
                                    onClick={handleCreateNew}
                                    className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                                >
                                    Create Your First Assessment
                                </button>
                            )}
                        </div>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredAssessments.map((assessment) => (
                            <div
                                key={assessment.assessment_id}
                                className="bg-[#111111] border border-gray-800 rounded-xl p-6 hover:border-gray-700 transition-all duration-200 cursor-pointer group"
                                onClick={() => handleAssessmentClick(assessment.assessment_id)}
                            >
                                {/* Header */}
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex-1">
                                        <h3 className="text-xl font-semibold text-white mb-1 group-hover:text-purple-400 transition-colors">
                                            {assessment.role_name}
                                        </h3>
                                        <p className="text-sm text-gray-400">
                                            {formatDate(assessment.created_at)}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {assessment.is_published && (
                                            <span className="bg-green-600/20 text-green-400 px-2 py-1 rounded-lg text-xs">
                                                Published
                                            </span>
                                        )}
                                        {assessment.deployed_courses_count > 0 && (
                                            <span className="bg-blue-600/20 text-blue-400 px-2 py-1 rounded-lg text-xs">
                                                {assessment.deployed_courses_count} courses
                                            </span>
                                        )}
                                    </div>
                                </div>

                                {/* Skills */}
                                <div className="flex flex-wrap gap-1.5 mb-4">
                                    {assessment.target_skills.slice(0, 3).map((skill, index) => (
                                        <span
                                            key={index}
                                            className="bg-gray-800 text-gray-300 px-2 py-1 rounded-lg text-xs"
                                        >
                                            {skill}
                                        </span>
                                    ))}
                                    {assessment.target_skills.length > 3 && (
                                        <span className="text-gray-400 text-xs px-2 py-1">
                                            +{assessment.target_skills.length - 3} more
                                        </span>
                                    )}
                                </div>

                                {/* Stats */}
                                <div className="grid grid-cols-3 gap-3 mb-4">
                                    <div className="text-center">
                                        <p className="text-2xl font-bold text-white">
                                            {assessment.total_questions}
                                        </p>
                                        <p className="text-xs text-gray-400">Questions</p>
                                    </div>
                                    <div className="text-center">
                                        <p className="text-2xl font-bold text-white">
                                            {assessment.estimated_duration_minutes}
                                        </p>
                                        <p className="text-xs text-gray-400">Minutes</p>
                                    </div>
                                    <div className="text-center">
                                        <span className={`inline-block px-2 py-1 rounded-lg text-xs font-medium border ${getDifficultyColor(assessment.difficulty_level)}`}>
                                            {assessment.difficulty_level}
                                        </span>
                                    </div>
                                </div>

                                {/* Action Buttons */}
                                <div className="flex gap-2 pt-4 border-t border-gray-800">
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleAssessmentClick(assessment.assessment_id);
                                        }}
                                        className="flex-1 px-3 py-2 bg-purple-600/20 text-purple-400 rounded-lg hover:bg-purple-600/30 transition-colors flex items-center justify-center text-sm font-medium"
                                    >
                                        <Edit className="w-4 h-4 mr-1.5" />
                                        Edit
                                    </button>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            router.push(`/role-assessment/preview/${assessment.assessment_id}`);
                                        }}
                                        className="flex-1 px-3 py-2 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 transition-colors flex items-center justify-center text-sm font-medium"
                                    >
                                        <Eye className="w-4 h-4 mr-1.5" />
                                        Preview
                                    </button>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            copyShareLink(assessment.assessment_id);
                                        }}
                                        className="px-3 py-2 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 transition-colors"
                                    >
                                        <Share2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

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
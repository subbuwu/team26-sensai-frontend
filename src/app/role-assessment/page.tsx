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
            const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/role_assessment/list/${session?.user.id}`);
            
            if (response.ok) {
                const data = await response.json();
                setAssessments(data);
            } else if (response.status === 403) {
                setToast({
                    show: true,
                    message: "You do not have permission to view assessments",
                    type: 'error'
                });
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
                    <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
                </div>
            </div>
        );
    }

    if (!isAuthenticated) {
        router.push('/login');
        return null;
    }

    return (
        <div className="min-h-screen bg-black text-white">
            <Header />
            
            <div className="container mx-auto px-4 py-8 max-w-6xl">
                {/* Page Header */}
                <div className="mb-8">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-semibold text-white mb-2">Role Assessments</h1>
                            <p className="text-gray-400">
                                Create and manage AI-powered assessments
                            </p>
                        </div>
                        <button
                            onClick={handleCreateNew}
                            className="px-6 py-2.5 bg-white text-black rounded-lg hover:bg-gray-200 transition-colors flex items-center font-medium"
                        >
                            <Plus className="w-5 h-5 mr-2" />
                            Create Assessment
                        </button>
                    </div>
                </div>

                {/* Search and Filters */}
                <div className="bg-gray-900 rounded-lg border border-gray-800 p-4 mb-6">
                    <div className="flex flex-col lg:flex-row gap-4">
                        <div className="flex-1 relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search by role or skills..."
                                className="w-full pl-10 pr-4 py-2.5 bg-black border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-gray-600"
                            />
                        </div>

                        <select
                            value={filterDifficulty}
                            onChange={(e) => setFilterDifficulty(e.target.value)}
                            className="px-4 py-2.5 bg-black border border-gray-700 rounded-lg text-white focus:outline-none"
                        >
                            <option value="all">All Levels</option>
                            <option value="easy">Easy</option>
                            <option value="medium">Medium</option>
                            <option value="hard">Hard</option>
                        </select>

                        <select
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value as any)}
                            className="px-4 py-2.5 bg-black border border-gray-700 rounded-lg text-white focus:outline-none"
                        >
                            <option value="recent">Most Recent</option>
                            <option value="name">Name (A-Z)</option>
                            <option value="questions">Question Count</option>
                        </select>
                    </div>
                </div>

                {/* Assessments Grid */}
                {filteredAssessments.length === 0 ? (
                    <div className="bg-gray-900 rounded-lg border border-gray-800 p-12 text-center">
                        <Zap className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                        <h3 className="text-xl font-medium text-white mb-2">
                            {searchQuery || filterDifficulty !== "all" 
                                ? "No assessments found" 
                                : "No assessments yet"}
                        </h3>
                        <p className="text-gray-400 mb-6">
                            {searchQuery || filterDifficulty !== "all"
                                ? "Try adjusting your search or filters"
                                : "Create your first assessment to get started"}
                        </p>
                        {!searchQuery && filterDifficulty === "all" && (
                            <button
                                onClick={handleCreateNew}
                                className="px-6 py-2.5 bg-white text-black rounded-lg hover:bg-gray-200 transition-colors"
                            >
                                Create Your First Assessment
                            </button>
                        )}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {filteredAssessments.map((assessment) => (
                            <div
                                key={assessment.assessment_id}
                                className="bg-gray-900 border border-gray-800 rounded-lg p-5 hover:border-gray-700 transition-colors cursor-pointer"
                                onClick={() => handleAssessmentClick(assessment.assessment_id)}
                            >
                                <div className="mb-3">
                                    <h3 className="text-lg font-medium text-white mb-1">
                                        {assessment.role_name}
                                    </h3>
                                    <p className="text-sm text-gray-400">
                                        {formatDate(assessment.created_at)}
                                    </p>
                                </div>

                                <div className="flex flex-wrap gap-1.5 mb-3">
                                    {assessment.target_skills.slice(0, 3).map((skill, index) => (
                                        <span
                                            key={index}
                                            className="bg-gray-800 text-gray-300 px-2 py-1 rounded text-xs"
                                        >
                                            {skill}
                                        </span>
                                    ))}
                                    {assessment.target_skills.length > 3 && (
                                        <span className="text-gray-500 text-xs px-2 py-1">
                                            +{assessment.target_skills.length - 3}
                                        </span>
                                    )}
                                </div>

                                <div className="flex items-center justify-between text-sm text-gray-400 mb-3">
                                    <span>{assessment.total_questions} questions</span>
                                    <span>{assessment.estimated_duration_minutes} min</span>
                                    <span className="capitalize">{assessment.difficulty_level}</span>
                                </div>

                                <div className="flex gap-2">
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleAssessmentClick(assessment.assessment_id);
                                        }}
                                        className="flex-1 px-3 py-1.5 bg-gray-800 text-white rounded hover:bg-gray-700 transition-colors flex items-center justify-center text-sm"
                                    >
                                        <Edit className="w-3 h-3 mr-1.5" />
                                        Edit
                                    </button>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            router.push(`/role-assessment/preview/${assessment.assessment_id}`);
                                        }}
                                        className="flex-1 px-3 py-1.5 bg-gray-800 text-white rounded hover:bg-gray-700 transition-colors flex items-center justify-center text-sm"
                                    >
                                        <Eye className="w-3 h-3 mr-1.5" />
                                        Preview
                                    </button>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            copyShareLink(assessment.assessment_id);
                                        }}
                                        className="px-3 py-1.5 bg-gray-800 text-white rounded hover:bg-gray-700 transition-colors"
                                    >
                                        <Share2 className="w-3 h-3" />
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
// src/app/role-assessment/[id]/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Header } from "@/components/layout/header";
import {
    ArrowLeft,
    Edit2,
    Save,
    X,
    Check,
    ChevronDown,
    ChevronUp,
    Share2,
    Rocket,
    Loader2,
    Plus,
    Trash2,
    Copy,
} from "lucide-react";
import {
    AssessmentResult,
    MCQuestion,
    SAQuestion,
    CaseStudy,
    AptitudeQuestion,
    UpdateAssessmentRequest,
} from "@/types/assessment";
import Toast from "@/components/Toast";
import DeployToCourseDialog from "@/components/DeployToCourseDialog";

interface EditableQuestion {
    type: 'mcq' | 'saq' | 'case_study' | 'aptitude';
    index: number;
    data: any;
}

export default function EditAssessmentPage() {
    const params = useParams();
    const router = useRouter();
    const { data: session } = useSession();
    const assessmentId = params?.id as string;
    const [deployedCourses, setDeployedCourses] = useState<any[]>([]);
    const [isLoadingDeployedCourses, setIsLoadingDeployedCourses] = useState(false);
    const [assessment, setAssessment] = useState<AssessmentResult | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [editingQuestion, setEditingQuestion] = useState<EditableQuestion | null>(null);
    const [hasChanges, setHasChanges] = useState(false);
    const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
        mcqs: true,
        saqs: false,
        case_study: false,
        aptitude: false,
    });
    const [showDeployDialog, setShowDeployDialog] = useState(false);
    const [toast, setToast] = useState<{ show: boolean; message: string; type: 'success' | 'error' }>({
        show: false,
        message: "",
        type: 'success'
    });

    useEffect(() => {
        if (assessmentId) {
            fetchAssessment();
        }
    }, [assessmentId]);

        useEffect(() => {
        if (assessmentId) {
            fetchDeployedCourses();
        }
    }, [assessmentId]);
    

const fetchDeployedCourses = async () => {
    try {
        setIsLoadingDeployedCourses(true);
        const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/role_assessment/${assessmentId}/courses`);
        if (response.ok) {
            const data = await response.json();
            setDeployedCourses(data);
        } else {
            console.error('Failed to fetch deployed courses');
        }
    } catch (error) {
        console.error('Error fetching deployed courses:', error);
    } finally {
        setIsLoadingDeployedCourses(false);
    }
};
    const fetchAssessment = async () => {
        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/role_assessment/${assessmentId}`);
            if (response.ok) {
                const data = await response.json();
                setAssessment(data);
            } else {
                throw new Error('Failed to fetch assessment');
            }
        } catch (error) {
            console.error('Error fetching assessment:', error);
            setToast({
                show: true,
                message: "Failed to load assessment",
                type: 'error'
            });
        } finally {
            setIsLoading(false);
        }
    };

    const saveAssessment = async () => {
        if (!assessment) return;

        setIsSaving(true);
        try {
            const updateRequest: UpdateAssessmentRequest = {
                assessment_id: assessment.assessment_id,
                role_name: assessment.role_name,
                target_skills: assessment.target_skills,
                difficulty_level: assessment.difficulty_level,
                mcqs: assessment.mcqs,
                saqs: assessment.saqs,
                case_study: assessment.case_study,
                aptitude_questions: assessment.aptitude_questions,
                skill_coverage: assessment.skill_coverage,
                total_questions: assessment.total_questions,
                estimated_duration_minutes: assessment.estimated_duration_minutes,
            };

            const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/role_assessment/update`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(updateRequest),
            });

            if (response.ok) {
                const updatedData = await response.json();
                setAssessment(updatedData);
                setHasChanges(false);
                setToast({
                    show: true,
                    message: "Assessment saved successfully",
                    type: 'success'
                });
            } else {
                throw new Error('Failed to save assessment');
            }
        } catch (error) {
            console.error('Error saving assessment:', error);
            setToast({
                show: true,
                message: "Failed to save assessment",
                type: 'error'
            });
        } finally {
            setIsSaving(false);
        }
    };

    const handleQuestionEdit = (type: EditableQuestion['type'], index: number, data: any) => {
        setEditingQuestion({ type, index, data });
    };

    const saveQuestionEdit = () => {
        if (!editingQuestion || !assessment) return;

        const updatedAssessment = { ...assessment };
        
        switch (editingQuestion.type) {
            case 'mcq':
                updatedAssessment.mcqs[editingQuestion.index] = editingQuestion.data;
                break;
            case 'saq':
                updatedAssessment.saqs[editingQuestion.index] = editingQuestion.data;
                break;
            case 'case_study':
                updatedAssessment.case_study = editingQuestion.data;
                break;
            case 'aptitude':
                updatedAssessment.aptitude_questions[editingQuestion.index] = editingQuestion.data;
                break;
        }

        setAssessment(updatedAssessment);
        setEditingQuestion(null);
        setHasChanges(true);
    };

    const deleteQuestion = (type: 'mcq' | 'saq' | 'aptitude', index: number) => {
        if (!assessment) return;

        const updatedAssessment = { ...assessment };
        
        switch (type) {
            case 'mcq':
                updatedAssessment.mcqs = updatedAssessment.mcqs.filter((_, i) => i !== index);
                break;
            case 'saq':
                updatedAssessment.saqs = updatedAssessment.saqs.filter((_, i) => i !== index);
                break;
            case 'aptitude':
                updatedAssessment.aptitude_questions = updatedAssessment.aptitude_questions.filter((_, i) => i !== index);
                break;
        }

        // Update total questions count
        updatedAssessment.total_questions = 
            updatedAssessment.mcqs.length + 
            updatedAssessment.saqs.length + 
            (updatedAssessment.case_study ? updatedAssessment.case_study.questions.length : 0) + 
            updatedAssessment.aptitude_questions.length;

        setAssessment(updatedAssessment);
        setHasChanges(true);
    };

    const copyShareLink = async () => {
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

    const toggleSection = (section: string) => {
        setExpandedSections(prev => ({
            ...prev,
            [section]: !prev[section]
        }));
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-black text-white">
                <Header />
                <div className="flex justify-center items-center py-20">
                    <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
                </div>
            </div>
        );
    }

    if (!assessment) {
        return (
            <div className="min-h-screen bg-black text-white">
                <Header />
                <div className="text-center py-20">
                    <p className="text-gray-400">Assessment not found</p>
                </div>
            </div>
        );
    }

    const handleUndeploy = async (courseId: number) => {
    try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/role_assessment/undeploy`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                assessment_id: assessmentId,
                course_id: courseId,
                user_id: parseInt(session?.user.id as string)
            }),
        });

        if (response.ok) {
            setToast({
                show: true,
                message: "Assessment undeployed successfully",
                type: 'success'
            });
            // Refresh the deployed courses list
            fetchDeployedCourses();
        } else {
            throw new Error('Failed to undeploy assessment');
        }
    } catch (error) {
        console.error('Error undeploying assessment:', error);
        setToast({
            show: true,
            message: "Failed to undeploy assessment",
            type: 'error'
        });
    }
};

    return (
        <div className="min-h-screen bg-black text-white relative">
              {/* Action Buttons */}
                   <div className="fixed bg-black/40 p-12 py-6 rounded-full backdrop-blur-sm left-1/2 bottom-0 -translate-x-1/2 -translate-y-1/2 flex items-center gap-3 z-50 border border-gray-500">
    {hasChanges && (
        <button
            onClick={saveAssessment}
            disabled={isSaving}
            className="px-4 py-2 bg-gray-800 border border-gray-700 text-white rounded-lg hover:bg-gray-700 transition-colors flex items-center disabled:opacity-50"
        >
           
            Save Changes
        </button>
    )}
    <button
        onClick={() => setShowDeployDialog(true)}
        className="px-4 py-2 bg-gray-800 border border-gray-700 text-white rounded-lg hover:bg-gray-700 transition-colors flex items-center"
    >
        <Rocket className="w-4 h-4 mr-2" />
        Deploy to Course
    </button>
    <button
        onClick={copyShareLink}
        className="px-4 py-2 bg-gray-800 border border-gray-700 text-white rounded-lg hover:bg-gray-700 transition-colors flex items-center"
    >
        <Share2 className="w-4 h-4 mr-2" />
        Share
    </button>
</div>

            <Header />
            <>
    {/* Deployed Courses Section */}
    <div className="mb-6 bg-gray-900 rounded-lg border border-gray-800 max-w-md mx-auto">
        <div className="p-4">
            <h3 className="text-lg font-medium text-white mb-4 flex items-center">
                <Rocket className="w-5 h-5 mr-2" />
                Deployed Courses
            </h3>
            
            {isLoadingDeployedCourses ? (
                <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
                    <span className="ml-2 text-gray-400">Loading deployed courses...</span>
                </div>
            ) : deployedCourses.length === 0 ? (
                <div className="text-center py-8">
                    <p className="text-gray-400">This assessment hasn't been deployed to any courses yet.</p>
                    <button
                        onClick={() => setShowDeployDialog(true)}
                        className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                    >
                        Deploy to Course
                    </button>
                </div>
            ) : (
                <div className="space-y-3">
                    {deployedCourses.map((course) => (
                        <div key={course.course_id} className="flex items-center justify-between bg-gray-800/50 rounded-lg p-4">
                            <div className="flex-1">
                                <h4 className="text-white font-medium">{course.course_name}</h4>
                                <div className="flex items-center gap-4 mt-1">
                                    <p className="text-gray-400 text-sm">
                                        Position: {course.position}
                                    </p>
                                    <p className="text-gray-400 text-sm">
                                        Deployed: {new Date(course.deployed_at).toLocaleDateString()}
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => handleUndeploy(course.course_id)}
                                className="px-3 py-1.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm flex items-center"
                            >
                                <X className="w-4 h-4 mr-1" />
                                Undeploy
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    </div>
</>
            <div className="container mx-auto px-4 py-8 max-w-6xl">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center">
                        <button
                            onClick={() => router.push('/role-assessment')}
                            className="mr-4 text-gray-400 hover:text-white transition-colors"
                        >
                            <ArrowLeft className="w-6 h-6" />
                        </button>
                        <div>
                            <h1 className="text-2xl font-semibold text-white">
                                {assessment.role_name} Assessment
                            </h1>
                            <p className="text-gray-400 text-sm mt-1">
                                {assessment.total_questions} questions • {assessment.estimated_duration_minutes} minutes
                            </p>
                        </div>
                    </div>

                  
                </div>

                {/* Question Sections */}
                <div className="space-y-6">
                    {/* MCQs Section */}
                    {assessment.mcqs && assessment.mcqs.length > 0 && (
                        <div className="bg-gray-900 rounded-lg border border-gray-800">
                            <button
                                onClick={() => toggleSection('mcqs')}
                                className="w-full p-4 flex items-center justify-between hover:bg-gray-800/50 transition-colors"
                            >
                                <h3 className="text-lg font-medium text-white">
                                    Multiple Choice Questions ({assessment.mcqs.length})
                                </h3>
                                {expandedSections.mcqs ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                            </button>
                            
                            {expandedSections.mcqs && (
                                <div className="p-4 pt-0 space-y-4">
                                    {assessment.mcqs.map((question, index) => (
                                        <QuestionEditCard
                                            key={`mcq-${index}`}
                                            question={question}
                                            type="mcq"
                                            index={index}
                                            isEditing={editingQuestion?.type === 'mcq' && editingQuestion?.index === index}
                                            onEdit={() => handleQuestionEdit('mcq', index, question)}
                                            onSave={saveQuestionEdit}
                                            onCancel={() => setEditingQuestion(null)}
                                            onDelete={() => deleteQuestion('mcq', index)}
                                            onChange={(data : MCQuestion) => setEditingQuestion({ type: 'mcq', index, data })}
                                        />
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* SAQs Section */}
                    {assessment.saqs && assessment.saqs.length > 0 && (
                        <div className="bg-gray-900 rounded-lg border border-gray-800">
                            <button
                                onClick={() => toggleSection('saqs')}
                                className="w-full p-4 flex items-center justify-between hover:bg-gray-800/50 transition-colors"
                            >
                                <h3 className="text-lg font-medium text-white">
                                    Short Answer Questions ({assessment.saqs.length})
                                </h3>
                                {expandedSections.saqs ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                            </button>
                            
                            {expandedSections.saqs && (
                                <div className="p-4 pt-0 space-y-4">
                                    {assessment.saqs.map((question, index) => (
                                        <QuestionEditCard
                                            key={`saq-${index}`}
                                            question={question}
                                            type="saq"
                                            index={index}
                                            isEditing={editingQuestion?.type === 'saq' && editingQuestion?.index === index}
                                            onEdit={() => handleQuestionEdit('saq', index, question)}
                                            onSave={saveQuestionEdit}
                                            onCancel={() => setEditingQuestion(null)}
                                            onDelete={() => deleteQuestion('saq', index)}
                                            onChange={(data : SAQuestion) => setEditingQuestion({ type: 'saq', index, data })}
                                        />
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Case Study Section */}
                    {assessment.case_study && (
                        <div className="bg-gray-900 rounded-lg border border-gray-800">
                            <button
                                onClick={() => toggleSection('case_study')}
                                className="w-full p-4 flex items-center justify-between hover:bg-gray-800/50 transition-colors"
                            >
                                <h3 className="text-lg font-medium text-white">
                                    Case Study
                                </h3>
                                {expandedSections.case_study ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                            </button>
                            
                            {expandedSections.case_study && (
                                <div className="p-4 pt-0">
                                    <CaseStudyEditCard
                                        caseStudy={assessment.case_study}
                                        isEditing={editingQuestion?.type === 'case_study'}
                                        onEdit={() => handleQuestionEdit('case_study', 0, assessment.case_study)}
                                        onSave={saveQuestionEdit}
                                        onCancel={() => setEditingQuestion(null)}
                                        onChange={(data : CaseStudy) => setEditingQuestion({ type: 'case_study', index: 0, data })}
                                    />
                                </div>
                            )}
                        </div>
                    )}

                    {/* Aptitude Questions Section */}
                    {assessment.aptitude_questions && assessment.aptitude_questions.length > 0 && (
                        <div className="bg-gray-900 rounded-lg border border-gray-800">
                            <button
                                onClick={() => toggleSection('aptitude')}
                                className="w-full p-4 flex items-center justify-between hover:bg-gray-800/50 transition-colors"
                            >
                                <h3 className="text-lg font-medium text-white">
                                    Aptitude Questions ({assessment.aptitude_questions.length})
                                </h3>
                                {expandedSections.aptitude ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                            </button>
                            
                            {expandedSections.aptitude && (
                                <div className="p-4 pt-0 space-y-4">
                                    {assessment.aptitude_questions.map((question, index) => (
                                        <QuestionEditCard
                                            key={`apt-${index}`}
                                            question={question}
                                            type="aptitude"
                                            index={index}
                                            isEditing={editingQuestion?.type === 'aptitude' && editingQuestion?.index === index}
                                            onEdit={() => handleQuestionEdit('aptitude', index, question)}
                                            onSave={saveQuestionEdit}
                                            onCancel={() => setEditingQuestion(null)}
                                            onDelete={() => deleteQuestion('aptitude', index)}
                                            onChange={(data : AptitudeQuestion) => setEditingQuestion({ type: 'aptitude', index, data })}
                                        />
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>


            {showDeployDialog && (
    <DeployToCourseDialog
        open={showDeployDialog}
        assessmentId={assessmentId}
        onClose={() => setShowDeployDialog(false)}
        onSuccess={() => {
            setShowDeployDialog(false);
            setToast({
                show: true,
                message: "Assessment deployed to course successfully",
                type: 'success'
            });
            // Refresh the deployed courses list after successful deployment
            fetchDeployedCourses();
        }}
        userId={session?.user.id as string}
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

// Question Edit Card Component
function QuestionEditCard({ 
    question, 
    type, 
    index, 
    isEditing, 
    onEdit, 
    onSave, 
    onCancel, 
    onDelete, 
    onChange 
}: any) {
    const [editData, setEditData] = useState(question);

    useEffect(() => {
        setEditData(question);
    }, [question]);

    const handleChange = (field: string, value: any) => {
        const updated = { ...editData, [field]: value };
        setEditData(updated);
        onChange(updated);
    };

    const handleOptionChange = (optIndex: number, value: string) => {
        const updatedOptions = [...editData.options];
        updatedOptions[optIndex] = value;
        handleChange('options', updatedOptions);
    };

    if (isEditing) {
        return (
            <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                <div className="space-y-3">
                    <textarea
                        value={editData.question}
                        onChange={(e) => handleChange('question', e.target.value)}
                        className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-white resize-none"
                        rows={3}
                        placeholder="Question"
                    />
                    
                    {type === 'mcq' && editData.options && (
                        <>
                            {editData.options.map((option: string, idx: number) => (
                                <div key={idx} className="flex items-center gap-2">
                                    <input
                                        type="radio"
                                        checked={editData.correct_answer === idx}
                                        onChange={() => handleChange('correct_answer', idx)}
                                        className="text-purple-600"
                                    />
                                    <input
                                        type="text"
                                        value={option}
                                        onChange={(e) => handleOptionChange(idx, e.target.value)}
                                        className="flex-1 bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-white"
                                        placeholder={`Option ${String.fromCharCode(65 + idx)}`}
                                    />
                                </div>
                            ))}
                            <textarea
                                value={editData.explanation || ''}
                                onChange={(e) => handleChange('explanation', e.target.value)}
                                className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-white resize-none"
                                rows={2}
                                placeholder="Explanation"
                            />
                        </>
                    )}
                    
                    {type === 'saq' && (
                        <textarea
                            value={editData.sample_answer}
                            onChange={(e) => handleChange('sample_answer', e.target.value)}
                            className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-white resize-none"
                            rows={4}
                            placeholder="Sample Answer"
                        />
                    )}
                    
                    {type === 'aptitude' && (
                        <>
                            <textarea
                                value={editData.correct_answer}
                                onChange={(e) => handleChange('correct_answer', e.target.value)}
                                className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-white resize-none"
                                rows={2}
                                placeholder="Correct Answer"
                            />
                            <textarea
                                value={editData.explanation || ''}
                                onChange={(e) => handleChange('explanation', e.target.value)}
                                className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-white resize-none"
                                rows={2}
                                placeholder="Explanation"
                            />
                        </>
                    )}
                </div>
                
                <div className="flex justify-end gap-2 mt-4">
                    <button
                        onClick={onCancel}
                        className="px-3 py-1.5 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors flex items-center text-sm"
                    >
                        <X className="w-4 h-4 mr-1" />
                        Cancel
                    </button>
                    <button
                        onClick={onSave}
                        className="px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center text-sm"
                    >
                        <Check className="w-4 h-4 mr-1" />
                        Save
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-gray-800/50 rounded-lg p-4 hover:bg-gray-800/70 transition-colors">
            <div className="flex items-start justify-between">
                <div className="flex-1">
                    <p className="text-white font-medium mb-2">Q{index + 1}. {question.question}</p>
                    
                    {type === 'mcq' && question.options && (
                        <div className="space-y-1 mb-2">
                            {question.options.map((option: string, idx: number) => (
                                <div key={idx} className={`text-sm ${idx === question.correct_answer ? 'text-green-400' : 'text-gray-400'}`}>
                                    {String.fromCharCode(65 + idx)}. {option}
                                    {idx === question.correct_answer && <Check className="w-3 h-3 inline ml-2" />}
                                </div>
                            ))}
                        </div>
                    )}
                    
                    {type === 'saq' && (
                        <p className="text-sm text-gray-400">Sample: {question.sample_answer}</p>
                    )}
                    
                    {type === 'aptitude' && (
                        <p className="text-sm text-gray-400">Answer: {question.correct_answer}</p>
                    )}
                </div>
                
                <div className="flex items-center gap-2">
                    <button
                        onClick={onEdit}
                        className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
                    >
                        <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                        onClick={onDelete}
                        className="p-2 text-gray-400 hover:text-red-400 hover:bg-gray-700 rounded-lg transition-colors"
                    >
                        <Trash2 className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </div>
    );
}

// Case Study Edit Card Component
function CaseStudyEditCard({ caseStudy, isEditing, onEdit, onSave, onCancel, onChange }: any) {
    const [editData, setEditData] = useState(caseStudy);

    const handleChange = (field: string, value: any) => {
        const updated = { ...editData, [field]: value };
        setEditData(updated);
        onChange(updated);
    };

    const handleQuestionChange = (index: number, value: string) => {
        const updatedQuestions = [...editData.questions];
        updatedQuestions[index] = value;
        handleChange('questions', updatedQuestions);
    };

    if (isEditing) {
        return (
            <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                <div className="space-y-3">
                    <input
                        type="text"
                        value={editData.title}
                        onChange={(e) => handleChange('title', e.target.value)}
                        className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-white"
                        placeholder="Case Study Title"
                    />
                    <textarea
                        value={editData.scenario}
                        onChange={(e) => handleChange('scenario', e.target.value)}
                        className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-white resize-none"
                        rows={6}
                        placeholder="Scenario"
                    />
                    {editData.questions.map((q: string, idx: number) => (
                        <input
                            key={idx}
                            type="text"
                            value={q}
                            onChange={(e) => handleQuestionChange(idx, e.target.value)}
                            className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-white"
                            placeholder={`Question ${idx + 1}`}
                        />
                    ))}
                </div>
                
                <div className="flex justify-end gap-2 mt-4">
                    <button
                        onClick={onCancel}
                        className="px-3 py-1.5 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors flex items-center text-sm"
                    >
                        <X className="w-4 h-4 mr-1" />
                        Cancel
                    </button>
                    <button
                        onClick={onSave}
                        className="px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center text-sm"
                    >
                        <Check className="w-4 h-4 mr-1" />
                        Save
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-gray-800/50 rounded-lg p-4 hover:bg-gray-800/70 transition-colors">
            <div className="flex items-start justify-between">
                <div className="flex-1">
                    <h4 className="text-white font-medium mb-2">{caseStudy.title}</h4>
                    <p className="text-gray-400 text-sm mb-2">{caseStudy.scenario}</p>
                    <div className="space-y-1">
                        {caseStudy.questions.map((q: string, idx: number) => (
                            <p key={idx} className="text-sm text-gray-400">
                                {idx + 1}. {q}
                            </p>
                        ))}
                    </div>
                </div>
                <button
                    onClick={onEdit}
                    className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
                >
                    <Edit2 className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
}
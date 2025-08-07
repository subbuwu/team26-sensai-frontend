"use client";

import React, { useState, useEffect } from 'react';
import { X, ChevronDown } from 'lucide-react';

interface Course {
    id: number;
    name: string;
}

interface DeployAssessmentDialogProps {
    open: boolean;
    onClose: () => void;
    onSuccess?: (data: { assessmentId: string; courseId: number }) => void;
    assessmentId: string;
    userId: string;
}

export default function DeployAssessmentDialog({
    open,
    onClose,
    onSuccess,
    assessmentId,
    userId
}: DeployAssessmentDialogProps) {
    const [courses, setCourses] = useState<Course[]>([]);
    const [selectedCourseId, setSelectedCourseId] = useState<number | null>(null);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isLoadingCourses, setIsLoadingCourses] = useState(false);

    // Reset form state when dialog is opened
    useEffect(() => {
        if (open) {
            setSelectedCourseId(null);
            setError('');
            setIsLoading(false);
            setIsDropdownOpen(false);
            fetchCourses();
        }
    }, [open]);

    const fetchCourses = async () => {
        try {
            setIsLoadingCourses(true);
            
            const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/role_assessment/mentor/${userId}/courses`);
            
            if (!response.ok) {
                throw new Error('Failed to fetch courses');
            }
            
            const coursesData = await response.json();
            setCourses(coursesData);
        } catch (err) {
            console.error("Error fetching courses:", err);
            setError('Failed to load courses. Please try again.');
        } finally {
            setIsLoadingCourses(false);
        }
    };

    const handleDeploy = async () => {
        // Validate course selection
        if (!selectedCourseId) {
            setError('Please select a course');
            return;
        }

        try {
            setIsLoading(true);

            // Make API request to deploy assessment
            const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/role_assessment/deploy/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    assessment_id: assessmentId,
                    course_id: selectedCourseId,
                    user_id: userId
                }),
            });

            if (!response.ok) {
                throw new Error('Failed to deploy assessment');
            }

            const data = await response.json();

            // Reset form
            setSelectedCourseId(null);
            setError('');

            // Call the success callback
            if (onSuccess) {
                onSuccess({
                    assessmentId,
                    courseId: selectedCourseId
                });
            }

            onClose();

        } catch (err) {
            console.error("Error deploying assessment:", err);
            setError('Failed to deploy assessment. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const selectedCourse = courses.find(course => course.id === selectedCourseId);

    if (!open) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div
                className="w-full max-w-md bg-[#1A1A1A] rounded-lg shadow-2xl"
                onClick={e => e.stopPropagation()}
            >
                {/* Dialog Content */}
                <div className="p-6 mt-4">
                    <div className="space-y-4">
                        <div>
                            <h3 className="text-xl font-medium text-white mb-4">Deploy Assessment to Course</h3>
                            
                            {isLoadingCourses ? (
                                <div className="flex items-center justify-center py-8">
                                    <svg className="animate-spin h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    <span className="ml-2 text-gray-400">Loading courses...</span>
                                </div>
                            ) : (
                                <div className="relative">
                                    <button
                                        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                                        className={`w-full px-4 py-3 bg-[#0D0D0D] text-white text-lg rounded-lg font-light outline-none flex items-center justify-between ${error ? 'border border-red-500' : 'border-none'} ${isLoading ? 'opacity-70 cursor-not-allowed' : 'cursor-pointer hover:bg-[#262626]'}`}
                                        disabled={isLoading}
                                    >
                                        <span className={selectedCourse ? 'text-white' : 'text-gray-500'}>
                                            {selectedCourse ? selectedCourse.name : 'Select a course'}
                                        </span>
                                        <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
                                    </button>
                                    
                                    {isDropdownOpen && (
                                        <div className="absolute top-full left-0 right-0 mt-1 bg-[#0D0D0D] border border-gray-700 rounded-lg shadow-lg z-10 max-h-60 overflow-y-auto">
                                            {courses.length === 0 ? (
                                                <div className="px-4 py-3 text-gray-500">No courses available</div>
                                            ) : (
                                                courses.map((course) => (
                                                    <button
                                                        key={course.id}
                                                        onClick={() => {
                                                            setSelectedCourseId(course.id);
                                                            setIsDropdownOpen(false);
                                                            if (error) setError('');
                                                        }}
                                                        className="w-full px-4 py-3 text-left text-white hover:bg-[#262626] transition-colors"
                                                    >
                                                        {course.name}
                                                    </button>
                                                ))
                                            )}
                                        </div>
                                    )}
                                </div>
                            )}
                            
                            {error && (
                                <p className="mt-2 text-sm text-red-500">{error}</p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Dialog Footer */}
                <div className="flex justify-end gap-4 p-6">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-gray-400 hover:text-white transition-colors focus:outline-none cursor-pointer"
                        disabled={isLoading}
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleDeploy}
                        className={`px-6 py-2 bg-white text-black text-sm font-medium rounded-full hover:opacity-90 transition-opacity focus:outline-none cursor-pointer ${isLoading || isLoadingCourses ? 'opacity-70' : ''}`}
                        disabled={isLoading || isLoadingCourses}
                    >
                        {isLoading ? (
                            <span className="flex items-center justify-center">
                                <svg className="animate-spin h-5 w-5 text-black" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                            </span>
                        ) : 'Deploy Assessment'}
                    </button>
                </div>
            </div>
        </div>
    );
}
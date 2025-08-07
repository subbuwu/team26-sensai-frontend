"use client";

import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';

interface CreateCourseDialogProps {
    open: boolean;
    onClose: () => void;
    onSuccess?: (courseData: { id: string; name: string }) => void;
    schoolId?: string | number;
}

export default function CreateCourseDialog({
    open,
    onClose,
    onSuccess,
    schoolId
}: CreateCourseDialogProps) {
    const [courseName, setCourseName] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    // Reset form state when dialog is opened
    useEffect(() => {
        if (open) {
            setCourseName('');
            setError('');
            setIsLoading(false);
        }
    }, [open]);

    const handleSubmit = async () => {
        // Validate course name
        if (!courseName.trim()) {
            setError('Course name is required');
            return;
        }

        try {
            setIsLoading(true);

            // Make API request to create course
            const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/courses/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    name: courseName,
                    org_id: Number(schoolId)
                }),
            });

            if (!response.ok) {
                throw new Error('Failed to create course');
            }

            const data = await response.json();

            // Reset form
            setCourseName('');
            setError('');

            // Call the success callback with the created course data
            if (onSuccess) {
                onSuccess({
                    id: data.id,
                    name: courseName
                });
            }

        } catch (err) {
            console.error("Error creating course:", err);
            setError('Failed to create course. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

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
                            <input
                                id="courseName"
                                type="text"
                                value={courseName}
                                onChange={(e) => {
                                    setCourseName(e.target.value);
                                    if (error) setError('');
                                }}
                                placeholder="What will you name your course?"
                                className={`w-full px-4 py-3 bg-[#0D0D0D] text-white text-lg rounded-lg font-light placeholder-gray-500 outline-none ${error ? 'border border-red-500' : 'border-none'}`}
                                disabled={isLoading}
                            />
                            {error && (
                                <p className="mt-1 text-sm text-red-500">{error}</p>
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
                        onClick={handleSubmit}
                        className={`px-6 py-2 bg-white text-black text-sm font-medium rounded-full hover:opacity-90 transition-opacity focus:outline-none cursor-pointer ${isLoading ? 'opacity-70' : ''}`}
                        disabled={isLoading}
                    >
                        {isLoading ? (
                            <span className="flex items-center justify-center">
                                <svg className="animate-spin h-5 w-5 text-black" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                            </span>
                        ) : 'Create course'}
                    </button>
                </div>
            </div>
        </div>
    );
} 
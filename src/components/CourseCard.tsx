import Link from "next/link";
import { useParams } from "next/navigation";
import { Trash2 } from "lucide-react";
import { useState } from "react";
import ConfirmationDialog from "./ConfirmationDialog";

interface CourseCardProps {
    course: {
        id: string | number;
        title: string;
        role?: string;
        org_id?: number;
        cohort_id?: number;
        org?: {
            slug: string;
        };
    };
    onDelete?: (courseId: string | number) => void;
}

export default function CourseCard({ course, onDelete }: CourseCardProps) {
    const params = useParams();
    const schoolId = params?.id;
    const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [deleteError, setDeleteError] = useState<string | null>(null);

    // Generate a unique border color based on the course id
    const getBorderColor = () => {
        const colors = [
            'border-purple-500',
            'border-green-500',
            'border-pink-500',
            'border-yellow-500',
            'border-blue-500',
            'border-red-500',
            'border-indigo-500',
            'border-orange-500'
        ];

        // Handle string IDs by converting to a number
        let idNumber: number;
        if (typeof course.id === 'string') {
            // Use string hash code
            idNumber = Array.from(course.id).reduce(
                (hash, char) => ((hash << 5) - hash) + char.charCodeAt(0), 0
            );
            // Ensure positive number
            idNumber = Math.abs(idNumber);
        } else {
            idNumber = course.id;
        }

        return colors[idNumber % colors.length];
    };

    // Determine the correct link path
    const getLinkPath = () => {
        // If this is being viewed by a learner, use the school slug path
        if (course.role && course.role !== 'admin' && course.org?.slug) {
            // Include course_id and cohort_id as query parameters to help with selection on the school page
            return `/school/${course.org.slug}?course_id=${course.id}&cohort_id=${course.cohort_id}`;
        }
        // If we have an org_id from the API, use that for the school-specific course path
        else if (course.org_id) {
            return `/school/admin/${course.org_id}/courses/${course.id}`;
        }
        // If we're in a school context, use the school-specific course path
        else if (schoolId) {
            return `/school/admin/${schoolId}/courses/${course.id}`;
        }
        // Otherwise use the general course path
        return `/courses/${course.id}`;
    };

    // Check if this is an admin view
    const isAdminView = schoolId;

    const handleDeleteClick = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDeleteConfirmOpen(true);
    };

    const handleDeleteConfirm = async () => {
        setIsDeleting(true);
        setDeleteError(null);

        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/courses/${course.id}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                }
            });

            if (!response.ok) {
                throw new Error('Failed to delete course');
            }

            // Close the dialog after successful deletion
            setIsDeleteConfirmOpen(false);

            // Call the onDelete callback if provided
            if (onDelete) {
                onDelete(course.id);
            }

        } catch (error) {
            console.error('Error deleting course:', error);
            setDeleteError('An error occurred while deleting the course. Please try again.');
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <div className="group relative">
            <Link href={getLinkPath()} className="block h-full">
                <div className={`bg-[#1A1A1A] text-gray-300 rounded-lg p-6 h-full transition-all hover:opacity-90 cursor-pointer border-b-2 ${getBorderColor()} border-opacity-70`}>
                    <h2 className="text-xl font-light mb-2">{course.title}</h2>
                </div>
            </Link>
            {isAdminView && (
                <button
                    className="absolute top-3 right-3 p-2 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity focus:outline-none cursor-pointer rounded-full hover:bg-gray-800"
                    aria-label="Delete course"
                    onClick={handleDeleteClick}
                >
                    <Trash2 size={18} />
                </button>
            )}

            {/* Confirmation Dialog */}
            <ConfirmationDialog
                show={isDeleteConfirmOpen}
                title="Delete course"
                message={`Are you sure you want to delete this course? All the modules and tasks will be permanently deleted, any learner with access will lose all their progress and this action is irreversible`}
                confirmButtonText="Delete"
                onConfirm={handleDeleteConfirm}
                onCancel={() => setIsDeleteConfirmOpen(false)}
                type="delete"
                isLoading={isDeleting}
                errorMessage={deleteError}
            />
        </div>
    );
} 
"use client";

import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { CheckCircle, AlertCircle } from "lucide-react";
import Toast from "@/components/Toast";

export default function JoinCohortPage() {
    const router = useRouter();
    const params = useParams();
    const searchParams = useSearchParams();
    const { user, isAuthenticated, isLoading } = useAuth();

    const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
    const [errorMessage, setErrorMessage] = useState<string>("");

    // Toast state
    const [showToast, setShowToast] = useState<boolean>(false);
    const [toastTitle, setToastTitle] = useState<string>("");
    const [toastDescription, setToastDescription] = useState<string>("");
    const [toastEmoji, setToastEmoji] = useState<string>("");

    const slug = params?.id as string;
    const cohortId = searchParams.get("cohortId");

    useEffect(() => {
        // Wait for auth to be ready
        if (isLoading) return;

        // Make sure user is authenticated
        if (!isAuthenticated || !user?.email) {
            setStatus("error");
            setErrorMessage("You must be logged in to join a cohort");
            return;
        }

        // Make sure cohortId is present
        if (!cohortId) {
            setStatus("error");
            setErrorMessage("No cohort specified");
            return;
        }

        const joinCohort = async () => {
            try {
                const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/cohorts/${cohortId}/members`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        emails: [user.email],
                        roles: ["learner"],
                        org_slug: slug
                    }),
                });

                if (!response.ok) {
                    // Check for 400 status code (already in cohort)
                    if (response.status === 400) {
                        // Show toast for already being in the cohort
                        setToastTitle("Already enrolled");
                        setToastDescription("You are already part of this cohort");
                        setToastEmoji("👍");
                        setShowToast(true);

                        // Redirect to school page after a short delay
                        setTimeout(() => {
                            router.push(`/school/${slug}?cohort_id=${cohortId}`);
                        }, 1500);
                        return;
                    }

                    if (response.status === 401) {
                        // Show toast for being an admin
                        setToastTitle("Admin detected");
                        setToastDescription("You are an admin of this school and cannot be added as a learner");
                        setToastEmoji("🔑");
                        setShowToast(true);

                        // Redirect to school page after a short delay
                        setTimeout(() => {
                            router.push(`/school/${slug}?cohort_id=${cohortId}`);
                        }, 1500);
                        return;
                    }

                    // Handle other errors
                    const errorData = await response.json().catch(() => ({}));
                    throw new Error(`Failed to join cohort`);
                }

                // Successfully joined the cohort
                setStatus("success");

                // Redirect to the school page after a short delay
                setTimeout(() => {
                    router.push(`/school/${slug}?cohort_id=${cohortId}`);
                }, 1500);
            } catch (error) {
                console.error("Error joining cohort:", error);
                setStatus("error");
                setErrorMessage(error instanceof Error ? error.message : "Failed to join cohort");
            }
        };

        joinCohort();
    }, [cohortId, isAuthenticated, isLoading, router, slug, user?.email]);

    return (
        <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center px-4">
            <div className="flex flex-col items-center justify-center max-w-md text-center">
                {status === "loading" && (
                    <>
                        <div className="w-12 h-12 border-t-2 border-b-2 border-white rounded-full animate-spin mb-6"></div>
                        <h1 className="text-3xl font-light mb-4">Adding you to the cohort</h1>
                        <p className="text-gray-400 mb-8">
                            Just a moment while we get everything set up for you
                        </p>
                    </>
                )}

                {status === "success" && (
                    <>
                        <div className="flex items-center justify-center w-16 h-16 bg-green-600/20 rounded-full mb-6">
                            <CheckCircle size={32} className="text-green-400" />
                        </div>
                        <h1 className="text-3xl font-light mb-4">Welcome aboard!</h1>
                        <p className="text-gray-400 mb-8">
                            You have been successfully added to the cohort
                        </p>
                        <div className="flex items-center justify-center gap-3 text-gray-400 mb-8">
                            <span>Taking you to the school</span>
                            <div className="w-4 h-4 border-t-2 border-b-2 border-gray-400 rounded-full animate-spin"></div>
                        </div>
                    </>
                )}

                {status === "error" && (
                    <>
                        <div className="flex items-center justify-center w-16 h-16 bg-red-600/20 rounded-full mb-6">
                            <AlertCircle size={32} className="text-red-400" />
                        </div>
                        <h1 className="text-3xl font-light mb-4">Something went wrong</h1>
                        <p className="text-gray-400 mb-8">
                            {errorMessage}
                        </p>
                        <button
                            onClick={() => router.push(`/school/${slug}?cohort_id=${cohortId}`)}
                            className="px-6 py-3 bg-white text-black text-sm font-medium rounded-full hover:opacity-90 transition-opacity inline-block cursor-pointer"
                        >
                            Back to School
                        </button>
                    </>
                )}
            </div>

            {/* Toast notification */}
            <Toast
                show={showToast}
                title={toastTitle}
                description={toastDescription}
                emoji={toastEmoji}
                onClose={() => setShowToast(false)}
            />
        </div>
    );
} 
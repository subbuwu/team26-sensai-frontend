"use client";
import RoleAsssessmentGenerateView from '@/components/RoleAssessmentGenerateView';
import { useParams } from 'next/navigation';
import React from 'react'

const RoleAssessmentGeneratePage = () => {
   const params = useParams();
    const id = params?.id as string;

    return <RoleAsssessmentGenerateView slug={id} />;
}

export default RoleAssessmentGeneratePage
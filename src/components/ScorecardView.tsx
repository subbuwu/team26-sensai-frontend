import React, { useState } from 'react';
import { ChevronLeft, ChevronDown, ChevronUp } from 'lucide-react';
import { ChatMessage, ScorecardItem } from '../types/quiz';
import LearnerScorecard from './LearnerScorecard';

interface ScorecardViewProps {
    activeScorecard: ScorecardItem[];
    handleBackToChat: () => void;
    lastUserMessage: ChatMessage | null;
}

const ScorecardView: React.FC<ScorecardViewProps> = ({
    activeScorecard,
    handleBackToChat,
    lastUserMessage
}) => {
    const [isTextExpanded, setIsTextExpanded] = useState(false);

    const toggleTextExpansion = () => {
        setIsTextExpanded(!isTextExpanded);
    };

    return (
        <div className="flex flex-col h-full px-6 py-6 overflow-auto relative">
            <button
                onClick={handleBackToChat}
                className="inline-flex cursor-pointer justify-center items-center rounded-full w-10 h-10 bg-[#1D1D1D] text-white hover:bg-[#2A2A2A] focus:outline-none mb-4"
            >
                <ChevronLeft size={24} />
            </button>

            <div className="overflow-y-auto hide-scrollbar h-full pt-2">
                <div className="flex flex-col mb-6">
                    <div className="text-center">
                        {lastUserMessage ? (
                            lastUserMessage.messageType === 'audio' && lastUserMessage.audioData ? (
                                <div className="flex flex-col items-center">
                                    <audio
                                        controls
                                        className="w-full sm:w-3/4 mt-2"
                                        src={`data:audio/wav;base64,${lastUserMessage.audioData}`}
                                    />
                                </div>
                            ) : (
                                <div className="relative">
                                    <div className="max-w-lg mx-auto">
                                        <p className={`text-gray-300 text-sm text-left ${!isTextExpanded ? 'line-clamp-2' : ''}`}>
                                            {lastUserMessage.content}
                                        </p>
                                        {lastUserMessage.content && lastUserMessage.content.length > 80 && (
                                            <button
                                                onClick={toggleTextExpansion}
                                                className="mt-4 px-3 py-1.5 bg-[#222222] text-sm text-white rounded-full hover:bg-[#333333] transition-colors flex items-center cursor-pointer mx-auto"
                                            >
                                                {isTextExpanded ? (
                                                    <>
                                                        <ChevronUp size={14} className="mr-1" />
                                                        View less
                                                    </>
                                                ) : (
                                                    <>
                                                        <ChevronDown size={14} className="mr-1" />
                                                        View more
                                                    </>
                                                )}
                                            </button>
                                        )}
                                    </div>
                                </div>
                            )
                        ) : (
                            <h2 className="text-xl font-light text-white">Detailed Report</h2>
                        )}
                    </div>
                </div>

                <LearnerScorecard scorecard={activeScorecard} className="mt-0" />
            </div>
        </div>
    );
};

export default ScorecardView; 
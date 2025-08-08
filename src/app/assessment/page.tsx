'use client'
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ChevronLeft, ChevronRight, Clock, CheckCircle, Circle, Flag, Send, Save, AlertTriangle } from 'lucide-react';

interface QuestionBlock {
  id: string;
  type: string;
  props: any;
  content: any[];
  children: any[];
}

interface AssessmentQuestion {
  id: number;
  title: string;
  blocks: QuestionBlock[];
  type: 'objective' | 'subjective';
  input_type: 'text' | 'code' | 'audio';
  response_type: 'chat' | 'exam';
  coding_languages?: string[];
  max_attempts?: number;
  is_feedback_shown?: boolean;
  position: number;
}

interface AssessmentSubmission {
  id: number;
  user_id: number;
  task_id: number;
  cohort_id?: number;
  course_id?: number;
  started_at: string;
  submitted_at?: string;
  time_spent_seconds: number;
  total_score: number;
  max_possible_score: number;
  percentage_score: number;
  status: 'in_progress' | 'submitted' | 'graded';
  attempt_number: number;
  is_final_submission: boolean;
}

interface AssessmentTask {
  id: number;
  title: string;
  type: string;
  questions: AssessmentQuestion[];
  total_questions: number;
  estimated_time_minutes?: number;
  instructions?: string;
  is_timed: boolean;
  time_limit_minutes?: number;
}

interface AssessmentSession {
  submission: AssessmentSubmission;
  task: AssessmentTask;
  current_question_index: number;
  progress_percentage: number;
  can_navigate_freely: boolean;
  saved_responses: Record<number, string>;
}

const AssessmentTakingPage: React.FC = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const taskId = searchParams.get('taskId');
  const cohortId = searchParams.get('cohortId');
  const courseId = searchParams.get('courseId');
  // Core state
  const [session, setSession] = useState<AssessmentSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Question navigation state
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [questionResponses, setQuestionResponses] = useState<Record<number, string>>({});
  const [questionStatus, setQuestionStatus] = useState<Record<number, 'answered' | 'flagged' | 'unanswered'>>({});
  
  // Timer state
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
const timerRef = useRef<NodeJS.Timeout | undefined>(undefined);
  
  // Answer input state
  const [currentAnswer, setCurrentAnswer] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [autoSaving, setAutoSaving] = useState(false);
  
  // UI state
  const [showSubmitConfirmation, setShowSubmitConfirmation] = useState(false);
  const [showQuestionNavigation, setShowQuestionNavigation] = useState(false);

  // Initialize assessment session
  useEffect(() => {
    if (!taskId) {
      setError('Task ID is required');
      setLoading(false);
      return;
    }

    initializeAssessment();
  }, [taskId, cohortId, courseId]);

  const initializeAssessment = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/assessment/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          task_id: parseInt(taskId!),
          cohort_id: cohortId ? parseInt(cohortId) : undefined,
          course_id: courseId ? parseInt(courseId) : undefined
        })
      });

      if (!response.ok) {
        throw new Error('Failed to start assessment');
      }

      const sessionData: AssessmentSession = await response.json();
      setSession(sessionData);
      
      // Initialize question status
      const status: Record<number, 'answered' | 'flagged' | 'unanswered'> = {};
      sessionData.task.questions.forEach(q => {
        status[q.id] = 'unanswered';
      });
      setQuestionStatus(status);

      // Set up timer
      if (sessionData.task.is_timed && sessionData.task.time_limit_minutes) {
        const timeSpent = sessionData.submission.time_spent_seconds;
        const timeLimit = sessionData.task.time_limit_minutes * 60;
        setTimeRemaining(Math.max(0, timeLimit - timeSpent));
      }

      setTimeElapsed(sessionData.submission.time_spent_seconds);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to initialize assessment');
    } finally {
      setLoading(false);
    }
  };

  // Timer effect
  useEffect(() => {
    if (!session || session.submission.status !== 'in_progress') return;

    timerRef.current = setInterval(() => {
      setTimeElapsed(prev => prev + 1);
      
      if (timeRemaining !== null) {
        setTimeRemaining(prev => {
          if (prev !== null && prev <= 1) {
            // Time's up - auto submit
            handleTimeUp();
            return 0;
          }
          return prev !== null ? prev - 1 : null;
        });
      }
    }, 1000);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [session, timeRemaining]);

  // Auto-save effect
  useEffect(() => {
    if (!session || !currentAnswer.trim()) return;

    const autoSaveTimer = setTimeout(async () => {
      await saveAnswer(false);
    }, 3000); // Auto-save after 3 seconds of inactivity

    return () => clearTimeout(autoSaveTimer);
  }, [currentAnswer, session]);

  const handleTimeUp = async () => {
    if (!session) return;
    
    try {
      await finalizeAssessment();
    } catch (error) {
      console.error('Error auto-submitting assessment:', error);
    }
  };

  const getCurrentQuestion = (): AssessmentQuestion | null => {
    if (!session || currentQuestionIndex >= session.task.questions.length) {
      return null;
    }
    return session.task.questions[currentQuestionIndex];
  };

  const saveAnswer = async (updateStatus = true) => {
    if (!session || !currentAnswer.trim()) return;

    const currentQuestion = getCurrentQuestion();
    if (!currentQuestion) return;

    try {
      setAutoSaving(true);

      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/assessment/question/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          submission_id: session.submission.id,
          question_id: currentQuestion.id,
          user_response: currentAnswer,
          response_type: currentQuestion.input_type,
          time_spent_seconds: 30 // Approximate time spent on this question
        })
      });

      if (!response.ok) {
        throw new Error('Failed to save answer');
      }

      // Update local state
      setQuestionResponses(prev => ({
        ...prev,
        [currentQuestion.id]: currentAnswer
      }));

      if (updateStatus) {
        setQuestionStatus(prev => ({
          ...prev,
          [currentQuestion.id]: 'answered'
        }));
      }

    } catch (error) {
      console.error('Error saving answer:', error);
    } finally {
      setAutoSaving(false);
    }
  };

  const navigateToQuestion = async (index: number) => {
    if (!session || index < 0 || index >= session.task.questions.length) return;

    // Save current answer before navigating
    if (currentAnswer.trim()) {
      await saveAnswer();
    }

    setCurrentQuestionIndex(index);
    
    // Load saved answer for new question
    const newQuestion = session.task.questions[index];
    const savedAnswer = questionResponses[newQuestion.id] || '';
    setCurrentAnswer(savedAnswer);
    
    setShowQuestionNavigation(false);
  };

  const handleNextQuestion = async () => {
    if (currentAnswer.trim()) {
      await saveAnswer();
    }
    navigateToQuestion(currentQuestionIndex + 1);
  };

  const handlePreviousQuestion = async () => {
    if (currentAnswer.trim()) {
      await saveAnswer();
    }
    navigateToQuestion(currentQuestionIndex - 1);
  };

  const toggleQuestionFlag = () => {
    const currentQuestion = getCurrentQuestion();
    if (!currentQuestion) return;

    setQuestionStatus(prev => ({
      ...prev,
      [currentQuestion.id]: prev[currentQuestion.id] === 'flagged' ? 'unanswered' : 'flagged'
    }));
  };

  const finalizeAssessment = async () => {
    if (!session) return;

    try {
      setSubmitting(true);

      // Save current answer if any
      if (currentAnswer.trim()) {
        await saveAnswer();
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/assessment/${session.submission.id}/finalize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          submission_id: session.submission.id,
          confirm_submission: true
        })
      });

      if (!response.ok) {
        throw new Error('Failed to submit assessment');
      }

      const results = await response.json();
      
      // Redirect to results page
      router.push(`/assessment/results/${session.submission.id}`);

    } catch (error) {
      console.error('Error submitting assessment:', error);
      setError('Failed to submit assessment. Please try again.');
    } finally {
      setSubmitting(false);
      setShowSubmitConfirmation(false);
    }
  };

  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const renderQuestionContent = (blocks: QuestionBlock[]) => {
    return blocks.map((block, index) => {
      switch (block.type) {
        case 'paragraph':
          return (
            <p key={index} className="mb-4 text-gray-200 leading-relaxed">
              {block.content?.map((content, i) => 
                typeof content === 'string' ? content : content.text || ''
              ).join('')}
            </p>
          );
        case 'heading':
          return (
            <h3 key={index} className="text-xl font-semibold mb-3 text-white">
              {block.content?.map((content, i) => 
                typeof content === 'string' ? content : content.text || ''
              ).join('')}
            </h3>
          );
        case 'bulletListItem':
          return (
            <li key={index} className="mb-2 text-gray-200 ml-4">
              {block.content?.map((content, i) => 
                typeof content === 'string' ? content : content.text || ''
              ).join('')}
            </li>
          );
        case 'codeBlock':
          return (
            <pre key={index} className="bg-gray-800 p-4 rounded-md mb-4 overflow-x-auto">
              <code className="text-green-400 text-sm">
                {block.content?.map((content, i) => 
                  typeof content === 'string' ? content : content.text || ''
                ).join('')}
              </code>
            </pre>
          );
        default:
          return (
            <div key={index} className="mb-4 text-gray-200">
              {block.content?.map((content, i) => 
                typeof content === 'string' ? content : content.text || ''
              ).join('')}
            </div>
          );
      }
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-300">Loading assessment...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center max-w-md">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-white mb-2">Error Loading Assessment</h2>
          <p className="text-gray-300 mb-4">{error}</p>
          <button 
            onClick={() => router.back()} 
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  const currentQuestion = getCurrentQuestion();
  const progress = ((currentQuestionIndex + 1) / session.task.questions.length) * 100;
  const answeredCount = Object.values(questionStatus).filter(s => s === 'answered').length;
  const flaggedCount = Object.values(questionStatus).filter(s => s === 'flagged').length;

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-white">{session.task.title}</h1>
            <p className="text-sm text-gray-400">
              Question {currentQuestionIndex + 1} of {session.task.questions.length}
            </p>
          </div>
          
          <div className="flex items-center space-x-6">
            {/* Timer */}
            <div className="flex items-center space-x-2 text-gray-300">
              <Clock className="h-4 w-4" />
              <span className="text-sm">
                {timeRemaining !== null 
                  ? `${formatTime(timeRemaining)} remaining`
                  : `${formatTime(timeElapsed)} elapsed`
                }
              </span>
            </div>

            {/* Progress */}
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-400">Progress:</span>
              <div className="w-32 bg-gray-700 rounded-full h-2">
                <div 
                  className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
              <span className="text-sm text-gray-400">{Math.round(progress)}%</span>
            </div>

            {/* Question Navigation Toggle */}
            <button
              onClick={() => setShowQuestionNavigation(!showQuestionNavigation)}
              className="bg-gray-700 hover:bg-gray-600 text-white px-3 py-2 rounded-md text-sm"
            >
              Questions ({answeredCount}/{session.task.questions.length})
            </button>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mt-3 w-full bg-gray-700 rounded-full h-1">
          <div 
            className="bg-blue-500 h-1 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          ></div>
        </div>
      </div>

      <div className="flex">
        {/* Question Navigation Sidebar */}
        {showQuestionNavigation && (
          <div className="w-80 bg-gray-800 border-r border-gray-700 p-4">
            <h3 className="text-lg font-semibold text-white mb-4">Question Navigation</h3>
            
            <div className="grid grid-cols-5 gap-2 mb-4">
              {session.task.questions.map((question, index) => {
                const status = questionStatus[question.id];
                const isCurrentQuestion = index === currentQuestionIndex;
                
                return (
                  <button
                    key={question.id}
                    onClick={() => navigateToQuestion(index)}
                    className={`
                      w-10 h-10 rounded-md text-sm font-medium border-2 transition-all
                      ${isCurrentQuestion 
                        ? 'border-blue-500 bg-blue-600 text-white' 
                        : 'border-gray-600 hover:border-gray-500'
                      }
                      ${status === 'answered' && !isCurrentQuestion
                        ? 'bg-green-600 text-white'
                        : status === 'flagged' && !isCurrentQuestion
                        ? 'bg-yellow-600 text-white'
                        : !isCurrentQuestion
                        ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                        : ''
                      }
                    `}
                  >
                    {index + 1}
                  </button>
                );
              })}
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-green-600 rounded"></div>
                <span className="text-gray-300">Answered ({answeredCount})</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-yellow-600 rounded"></div>
                <span className="text-gray-300">Flagged ({flaggedCount})</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-gray-700 border border-gray-600 rounded"></div>
                <span className="text-gray-300">Not answered</span>
              </div>
            </div>
          </div>
        )}

        {/* Main Content */}
        <div className="flex-1 p-6">
          {currentQuestion && (
            <div className="max-w-4xl mx-auto">
              {/* Question Header */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <h2 className="text-2xl font-semibold text-white">
                    Question {currentQuestionIndex + 1}
                  </h2>
                  <button
                    onClick={toggleQuestionFlag}
                    className={`
                      flex items-center space-x-1 px-3 py-1 rounded-md text-sm
                      ${questionStatus[currentQuestion.id] === 'flagged'
                        ? 'bg-yellow-600 text-white'
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                      }
                    `}
                  >
                    <Flag className="h-4 w-4" />
                    <span>{questionStatus[currentQuestion.id] === 'flagged' ? 'Unflag' : 'Flag'}</span>
                  </button>
                </div>
                
                {currentQuestion.title && (
                  <h3 className="text-lg text-gray-300 mb-4">{currentQuestion.title}</h3>
                )}
              </div>

              {/* Question Content */}
              <div className="bg-gray-800 rounded-lg p-6 mb-6">
                {renderQuestionContent(currentQuestion.blocks)}
              </div>

              {/* Answer Input */}
              <div className="bg-gray-800 rounded-lg p-6 mb-6">
                <label className="block text-sm font-medium text-gray-300 mb-3">
                  Your Answer:
                </label>
                
                {currentQuestion.input_type === 'code' ? (
                  <div>
                    {currentQuestion.coding_languages && (
                      <div className="mb-3">
                        <span className="text-sm text-gray-400">
                          Languages: {currentQuestion.coding_languages.join(', ')}
                        </span>
                      </div>
                    )}
                    <textarea
                      value={currentAnswer}
                      onChange={(e) => setCurrentAnswer(e.target.value)}
                      placeholder="Enter your code here..."
                      className="w-full h-64 bg-gray-900 border border-gray-600 rounded-md px-3 py-2 text-gray-200 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                ) : (
                  <textarea
                    value={currentAnswer}
                    onChange={(e) => setCurrentAnswer(e.target.value)}
                    placeholder="Enter your answer here..."
                    className="w-full h-32 bg-gray-900 border border-gray-600 rounded-md px-3 py-2 text-gray-200 resize-vertical focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                )}

                {autoSaving && (
                  <div className="mt-2 flex items-center space-x-2 text-sm text-gray-400">
                    <div className="animate-spin rounded-full h-3 w-3 border-b border-gray-400"></div>
                    <span>Saving...</span>
                  </div>
                )}
              </div>

              {/* Navigation */}
              <div className="flex items-center justify-between">
                <button
                  onClick={handlePreviousQuestion}
                  disabled={currentQuestionIndex === 0}
                  className="flex items-center space-x-2 bg-gray-700 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-2 rounded-md"
                >
                  <ChevronLeft className="h-4 w-4" />
                  <span>Previous</span>
                </button>

                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => saveAnswer()}
                    disabled={!currentAnswer.trim() || autoSaving}
                    className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-2 rounded-md"
                  >
                    <Save className="h-4 w-4" />
                    <span>Save Answer</span>
                  </button>

                  {currentQuestionIndex === session.task.questions.length - 1 ? (
                    <button
                      onClick={() => setShowSubmitConfirmation(true)}
                      className="flex items-center space-x-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md"
                    >
                      <Send className="h-4 w-4" />
                      <span>Submit Assessment</span>
                    </button>
                  ) : (
                    <button
                      onClick={handleNextQuestion}
                      className="flex items-center space-x-2 bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-md"
                    >
                      <span>Next</span>
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Submit Confirmation Modal */}
      {showSubmitConfirmation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-white mb-4">Submit Assessment</h3>
            <p className="text-gray-300 mb-6">
              Are you sure you want to submit your assessment? You won't be able to make changes after submission.
            </p>
            
            <div className="mb-4 text-sm text-gray-400">
              <p>Answered: {answeredCount} of {session.task.questions.length} questions</p>
              <p>Flagged: {flaggedCount} questions</p>
            </div>

            <div className="flex space-x-3">
              <button
                onClick={() => setShowSubmitConfirmation(false)}
                className="flex-1 bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-md"
              >
                Cancel
              </button>
              <button
                onClick={finalizeAssessment}
                disabled={submitting}
                className="flex-1 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white px-4 py-2 rounded-md"
              >
                {submitting ? 'Submitting...' : 'Submit'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AssessmentTakingPage;
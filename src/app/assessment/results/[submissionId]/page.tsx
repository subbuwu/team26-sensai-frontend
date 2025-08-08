import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { 
  Trophy, Clock, Target, TrendingUp, CheckCircle, XCircle, 
  Award, BarChart3, ArrowLeft, Download, Share2, RefreshCw 
} from 'lucide-react';

interface StudentQuestionResult {
  question_id: number;
  question_title: string;
  user_response: string;
  correct_answer?: string;
  ai_feedback: string;
  score: number;
  max_score: number;
  percentage: number;
  is_correct?: boolean;
  time_spent_seconds: number;
  scorecard_breakdown?: any;
}

interface StudentAssessmentResult {
  submission_id: number;
  task_title: string;
  total_score: number;
  max_possible_score: number;
  percentage_score: number;
  grade_letter: string;
  rank_in_cohort?: number;
  total_cohort_participants?: number;
  time_spent_minutes: number;
  submitted_at: string;
  question_results: StudentQuestionResult[];
  overall_feedback: string;
  areas_for_improvement: string[];
  strengths: string[];
}

const AssessmentResultsPage: React.FC = () => {
  const router = useRouter();
  const params = useParams();
  const submissionId = params.submissionId as string;

  const [results, setResults] = useState<StudentAssessmentResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'questions' | 'feedback'>('overview');

  useEffect(() => {
    if (submissionId) {
      fetchResults();
    }
  }, [submissionId]);

  const fetchResults = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/assessment/${submissionId}/results`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch results');
      }

      const data: StudentAssessmentResult = await response.json();
      setResults(data);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load results');
    } finally {
      setLoading(false);
    }
  };

  const getGradeColor = (grade: string) => {
    switch (grade) {
      case 'A': return 'text-green-500';
      case 'B': return 'text-blue-500';
      case 'C': return 'text-yellow-500';
      case 'D': return 'text-orange-500';
      case 'F': return 'text-red-500';
      default: return 'text-gray-500';
    }
  };

  const getPerformanceLevel = (percentage: number) => {
    if (percentage >= 90) return { label: 'Excellent', color: 'text-green-500' };
    if (percentage >= 80) return { label: 'Good', color: 'text-blue-500' };
    if (percentage >= 70) return { label: 'Satisfactory', color: 'text-yellow-500' };
    if (percentage >= 60) return { label: 'Needs Improvement', color: 'text-orange-500' };
    return { label: 'Unsatisfactory', color: 'text-red-500' };
  };

  const formatTime = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60);
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  const downloadResults = () => {
    if (!results) return;
    
    // Create a simple text summary
    const summary = `
Assessment Results: ${results.task_title}
Score: ${results.total_score}/${results.max_possible_score} (${results.percentage_score.toFixed(1)}%)
Grade: ${results.grade_letter}
Time Spent: ${formatTime(results.time_spent_minutes)}
Submitted: ${new Date(results.submitted_at).toLocaleString()}

Question Breakdown:
${results.question_results.map((q, i) => 
  `${i + 1}. ${q.question_title}: ${q.score}/${q.max_score} (${q.percentage.toFixed(1)}%)`
).join('\n')}
    `.trim();

    const blob = new Blob([summary], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `assessment-results-${submissionId}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-300">Loading your results...</p>
        </div>
      </div>
    );
  }

  if (error || !results) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center max-w-md">
          <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-white mb-2">Error Loading Results</h2>
          <p className="text-gray-300 mb-4">{error || 'Results not found'}</p>
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

  const performance = getPerformanceLevel(results.percentage_score);

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button 
                onClick={() => router.back()}
                className="text-gray-400 hover:text-white"
              >
                <ArrowLeft className="h-6 w-6" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-white">{results.task_title}</h1>
                <p className="text-gray-400">Assessment Results</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <button
                onClick={downloadResults}
                className="flex items-center space-x-2 bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-md"
              >
                <Download className="h-4 w-4" />
                <span>Download</span>
              </button>
              
              <button
                onClick={() => {/* TODO: Implement sharing */}}
                className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md"
              >
                <Share2 className="h-4 w-4" />
                <span>Share</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Score Banner */}
      <div className="bg-gradient-to-r from-blue-900 to-purple-900 border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="text-center">
            <div className="mb-4">
              <div className={`text-6xl font-bold ${getGradeColor(results.grade_letter)} mb-2`}>
                {results.grade_letter}
              </div>
              <div className="text-3xl text-white font-semibold">
                {results.percentage_score.toFixed(1)}%
              </div>
              <div className="text-lg text-gray-300">
                {results.total_score} out of {results.max_possible_score} points
              </div>
            </div>
            
            <div className={`text-lg font-medium ${performance.color} mb-4`}>
              {performance.label}
            </div>
            
            {results.rank_in_cohort && results.total_cohort_participants && (
              <div className="flex items-center justify-center space-x-2 text-gray-300">
                <Trophy className="h-5 w-5" />
                <span>
                  Ranked #{results.rank_in_cohort} out of {results.total_cohort_participants} students
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="max-w-7xl mx-auto px-6">
        <div className="border-b border-gray-700">
          <nav className="-mb-px flex space-x-8">
            {[
              { id: 'overview', label: 'Overview', icon: BarChart3 },
              { id: 'questions', label: 'Question Breakdown', icon: Target },
              { id: 'feedback', label: 'Feedback', icon: TrendingUp }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`
                  flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm
                  ${activeTab === tab.id
                    ? 'border-blue-500 text-blue-400'
                    : 'border-transparent text-gray-500 hover:text-gray-300 hover:border-gray-300'
                  }
                `}
              >
                <tab.icon className="h-4 w-4" />
                <span>{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Tab Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-gray-800 rounded-lg p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <Trophy className="h-8 w-8 text-yellow-500" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-400">Final Score</p>
                    <p className="text-2xl font-semibold text-white">
                      {results.percentage_score.toFixed(1)}%
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-gray-800 rounded-lg p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <Clock className="h-8 w-8 text-blue-500" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-400">Time Spent</p>
                    <p className="text-2xl font-semibold text-white">
                      {formatTime(results.time_spent_minutes)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-gray-800 rounded-lg p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <Target className="h-8 w-8 text-green-500" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-400">Questions Correct</p>
                    <p className="text-2xl font-semibold text-white">
                      {results.question_results.filter(q => q.is_correct).length} / {results.question_results.length}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-gray-800 rounded-lg p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <Award className="h-8 w-8 text-purple-500" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-400">Grade</p>
                    <p className={`text-2xl font-semibold ${getGradeColor(results.grade_letter)}`}>
                      {results.grade_letter}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Question Performance Overview */}
            <div className="bg-gray-800 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Question Performance</h3>
              <div className="space-y-3">
                {results.question_results.map((question, index) => (
                  <div key={question.question_id} className="flex items-center space-x-4">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center text-sm font-medium text-white">
                      {index + 1}
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-gray-300 truncate">
                          {question.question_title || `Question ${index + 1}`}
                        </span>
                        <div className="flex items-center space-x-2">
                          {question.is_correct ? (
                            <CheckCircle className="h-4 w-4 text-green-500" />
                          ) : (
                            <XCircle className="h-4 w-4 text-red-500" />
                          )}
                          <span className="text-sm text-gray-400">
                            {question.score}/{question.max_score}
                          </span>
                        </div>
                      </div>
                      
                      <div className="w-full bg-gray-700 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full ${
                            question.percentage >= 80 ? 'bg-green-500' :
                            question.percentage >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                          }`}
                          style={{ width: `${question.percentage}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Submission Details */}
            <div className="bg-gray-800 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Submission Details</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-400">Submitted:</span>
                  <span className="text-white ml-2">
                    {new Date(results.submitted_at).toLocaleString()}
                  </span>
                </div>
                <div>
                  <span className="text-gray-400">Submission ID:</span>
                  <span className="text-white ml-2">{results.submission_id}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'questions' && (
          <div className="space-y-6">
            {results.question_results.map((question, index) => (
              <div key={question.question_id} className="bg-gray-800 rounded-lg p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-white">
                      Question {index + 1}
                    </h3>
                    {question.question_title && (
                      <p className="text-gray-400 mt-1">{question.question_title}</p>
                    )}
                  </div>
                  
                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <div className="text-lg font-semibold text-white">
                        {question.score}/{question.max_score}
                      </div>
                      <div className="text-sm text-gray-400">
                        {question.percentage.toFixed(1)}%
                      </div>
                    </div>
                    {question.is_correct ? (
                      <CheckCircle className="h-6 w-6 text-green-500" />
                    ) : (
                      <XCircle className="h-6 w-6 text-red-500" />
                    )}
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <h4 className="text-sm font-medium text-gray-400 mb-2">Your Answer:</h4>
                    <div className="bg-gray-900 rounded-md p-3">
                      <pre className="text-gray-200 whitespace-pre-wrap text-sm">
                        {question.user_response}
                      </pre>
                    </div>
                  </div>

                  {question.ai_feedback && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-400 mb-2">Feedback:</h4>
                      <div className="bg-blue-900/20 border border-blue-700/30 rounded-md p-3">
                        <p className="text-gray-200 text-sm">{question.ai_feedback}</p>
                      </div>
                    </div>
                  )}

                  {question.correct_answer && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-400 mb-2">Correct Answer:</h4>
                      <div className="bg-green-900/20 border border-green-700/30 rounded-md p-3">
                        <pre className="text-gray-200 whitespace-pre-wrap text-sm">
                          {question.correct_answer}
                        </pre>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center space-x-4 text-sm text-gray-400">
                    <span>Time spent: {formatTime(question.time_spent_seconds / 60)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'feedback' && (
          <div className="space-y-6">
            {/* Overall Feedback */}
            <div className="bg-gray-800 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Overall Feedback</h3>
              <p className="text-gray-200 leading-relaxed">{results.overall_feedback}</p>
            </div>

            {/* Strengths */}
            {results.strengths.length > 0 && (
              <div className="bg-gray-800 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                  <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                  Strengths
                </h3>
                <ul className="space-y-2">
                  {results.strengths.map((strength, index) => (
                    <li key={index} className="flex items-start space-x-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                      <span className="text-gray-200">{strength}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Areas for Improvement */}
            {results.areas_for_improvement.length > 0 && (
              <div className="bg-gray-800 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                  <TrendingUp className="h-5 w-5 text-yellow-500 mr-2" />
                  Areas for Improvement
                </h3>
                <ul className="space-y-2">
                  {results.areas_for_improvement.map((area, index) => (
                    <li key={index} className="flex items-start space-x-2">
                      <div className="w-2 h-2 bg-yellow-500 rounded-full mt-2 flex-shrink-0"></div>
                      <span className="text-gray-200">{area}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Next Steps */}
            <div className="bg-gray-800 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Recommended Next Steps</h3>
              <div className="space-y-3">
                <div className="flex items-start space-x-3">
                  <RefreshCw className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-gray-200 font-medium">Review Incorrect Answers</p>
                    <p className="text-gray-400 text-sm">
                      Go through the questions you got wrong and understand the correct approach.
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <Trophy className="h-5 w-5 text-purple-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-gray-200 font-medium">Practice Similar Questions</p>
                    <p className="text-gray-400 text-sm">
                      Look for additional practice materials on topics where you scored lower.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AssessmentResultsPage;
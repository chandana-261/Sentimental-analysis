import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageSquare, BarChart3, Users, TrendingUp, Upload, ArrowLeft } from 'lucide-react';
import { Header } from '../components/Header';
import { StatsCard } from '../components/StatsCard';
import { SentimentChart } from '../components/SentimentChart';
import { WordCloudCanvas } from '../components/WordCloudCanvas';
import { DataTable } from '../components/DataTable';
import { LoadingSpinner } from '../components/LoadingSpinner';

interface Statistics {
  total: number;
  processed: number;
  positive: number;
  negative: number;
  neutral: number;
}

interface WordCloudData {
  text: string;
  value: number;
}

const API_BASE_URL = 'http://localhost:5000/api';

export function ResultsPage() {
  const navigate = useNavigate();
  const [uploadSession, setUploadSession] = useState<string>('');
  const [statistics, setStatistics] = useState<Statistics>({
    total: 0,
    processed: 0,
    positive: 0,
    negative: 0,
    neutral: 0,
  });
  const [wordCloudData, setWordCloudData] = useState<WordCloudData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    const sessionId = localStorage.getItem('currentUploadSession');
    if (!sessionId) {
      navigate('/');
      return;
    }
    
    setUploadSession(sessionId);
    fetchStatistics(sessionId);
    fetchWordCloudData(sessionId);
  }, [navigate]);

  const fetchStatistics = async (sessionId: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/statistics/${sessionId}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch statistics');
      }

      setStatistics(data.statistics);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load statistics');
    }
  };

  const fetchWordCloudData = async (sessionId: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/wordcloud/${sessionId}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch word cloud data');
      }

      setWordCloudData(data.wordCloudData);
    } catch (err) {
      console.error('Error fetching word cloud data:', err);
      // Don't set error for word cloud as it's not critical
    } finally {
      setLoading(false);
    }
  };

  const handleNewUpload = () => {
    localStorage.removeItem('currentUploadSession');
    navigate('/');
  };

  const chartData = {
    labels: ['Positive', 'Negative', 'Neutral'],
    datasets: [
      {
        data: [statistics.positive, statistics.negative, statistics.neutral],
        backgroundColor: [
          'rgba(34, 197, 94, 0.8)',
          'rgba(239, 68, 68, 0.8)',
          'rgba(107, 114, 128, 0.8)',
        ],
        borderColor: [
          'rgba(34, 197, 94, 1)',
          'rgba(239, 68, 68, 1)',
          'rgba(107, 114, 128, 1)',
        ],
        borderWidth: 2,
      },
    ],
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header 
          title="Loading Results..." 
          subtitle="Please wait while we fetch your analysis"
        />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <LoadingSpinner message="Loading analysis results..." />
        </main>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header 
          title="Error Loading Results" 
          subtitle="There was a problem loading your analysis"
        />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <div className="text-red-600 mb-4">
              <p className="text-lg font-medium">Failed to load results</p>
              <p className="text-sm mt-2">{error}</p>
            </div>
            <div className="space-x-4">
              <button
                onClick={() => window.location.reload()}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
              >
                Retry
              </button>
              <button
                onClick={handleNewUpload}
                className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                New Upload
              </button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header 
        title="eConsultation Analysis Dashboard" 
        subtitle="AI-powered sentiment analysis and summarization results"
      />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header with navigation */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex items-center space-x-2 mb-2">
                <button
                  onClick={handleNewUpload}
                  className="inline-flex items-center text-blue-600 hover:text-blue-800"
                >
                  <ArrowLeft className="w-4 h-4 mr-1" />
                  Back to Upload
                </button>
              </div>
              <h2 className="text-3xl font-bold text-gray-900">Analysis Results</h2>
              <p className="text-gray-600 mt-1">
                AI-powered insights from {statistics.total} comments
                {statistics.processed < statistics.total && (
                  <span className="text-blue-600 ml-2">
                    (Processing: {statistics.processed}/{statistics.total})
                  </span>
                )}
              </p>
            </div>
            <div className="mt-4 sm:mt-0 space-x-3">
              <button
                onClick={handleNewUpload}
                className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                <Upload className="w-4 h-4 mr-2" />
                New Upload
              </button>
            </div>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatsCard
            title="Total Comments"
            value={statistics.total.toString()}
            icon={MessageSquare}
            color="blue"
          />
          <StatsCard
            title="Positive Sentiment"
            value={`${statistics.positive} (${statistics.total > 0 ? Math.round((statistics.positive / statistics.total) * 100) : 0}%)`}
            icon={TrendingUp}
            color="green"
          />
          <StatsCard
            title="Negative Sentiment"
            value={`${statistics.negative} (${statistics.total > 0 ? Math.round((statistics.negative / statistics.total) * 100) : 0}%)`}
            icon={Users}
            color="red"
          />
          <StatsCard
            title="Neutral Sentiment"
            value={`${statistics.neutral} (${statistics.total > 0 ? Math.round((statistics.neutral / statistics.total) * 100) : 0}%)`}
            icon={BarChart3}
            color="gray"
          />
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Sentiment Distribution</h3>
            {statistics.processed > 0 ? (
              <SentimentChart stats={statistics} />
            ) : (
              <div className="flex items-center justify-center h-64 text-gray-500">
                <div className="text-center">
                  <BarChart3 className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p>No processed comments yet</p>
                  <p className="text-sm">Chart will appear once AI processing is complete</p>
                </div>
              </div>
            )}
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Key Words Cloud</h3>
            {wordCloudData.length > 0 ? (
              <WordCloudCanvas data={wordCloudData} />
            ) : (
              <div className="flex items-center justify-center h-64 text-gray-500">
                <div className="text-center">
                  <MessageSquare className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p>No word cloud data available</p>
                  <p className="text-sm">Word cloud will appear once processing is complete</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Processing Status */}
        {statistics.processed < statistics.total && statistics.total > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-medium text-blue-900">
                  AI Processing in Progress
                </h4>
                <p className="text-sm text-blue-700">
                  {statistics.processed} of {statistics.total} comments processed
                </p>
              </div>
              <div className="text-right">
                <div className="text-sm font-medium text-blue-900">
                  {Math.round((statistics.processed / statistics.total) * 100)}%
                </div>
                <div className="w-32 bg-blue-200 rounded-full h-2 mt-1">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${(statistics.processed / statistics.total) * 100}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Comments Table */}
        {uploadSession && (
          <div className="mb-8">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Detailed Comments Analysis</h3>
            <DataTable uploadSession={uploadSession} />
          </div>
        )}

        {/* No Data State */}
        {statistics.total === 0 && (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <MessageSquare className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Comments Found</h3>
            <p className="text-gray-600 mb-6">
              It looks like there are no comments in this session. Please upload a CSV file to get started.
            </p>
            <button
              onClick={handleNewUpload}
              className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
            >
              <Upload className="w-5 h-5 mr-2" />
              Upload CSV File
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
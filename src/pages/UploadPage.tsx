import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, File, AlertCircle, CheckCircle, BarChart3 } from 'lucide-react';
import { LoadingSpinner } from '../components/LoadingSpinner';

const API_BASE_URL = 'http://localhost:5000/api';

export function UploadPage() {
  const navigate = useNavigate();
  const [dragOver, setDragOver] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');
  const [uploadSession, setUploadSession] = useState<string>('');
  const [processingStatus, setProcessingStatus] = useState<{
    total: number;
    processed: number;
    isComplete: boolean;
    progress: number;
  } | null>(null);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    const csvFile = files.find((file: File) => file.type === 'text/csv' || file.name.endsWith('.csv'));
    
    if (csvFile) {
      setSelectedFile(csvFile);
      handleFileUpload(csvFile);
    } else {
      setError('Please select a valid CSV file');
    }
  }, []);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      handleFileUpload(file);
    }
  }, []);

  const handleFileUpload = async (file: File) => {
    setIsProcessing(true);
    setError('');
    setSuccess('');
    setProcessingStatus(null);

    try {
      const formData = new FormData();
      formData.append('csvFile', file);

      const response = await fetch(`${API_BASE_URL}/upload`, {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Upload failed');
      }

      setUploadSession(data.uploadSession);
      setSuccess(`Successfully uploaded ${data.totalComments} comments. Processing with AI...`);
      
      // Start polling for processing status
      pollProcessingStatus(data.uploadSession);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred while uploading the file');
      setIsProcessing(false);
    }
  };

  const pollProcessingStatus = async (sessionId: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/status/${sessionId}`);
      const data = await response.json();

      if (data.success) {
        setProcessingStatus(data.status);

        if (data.status.isComplete) {
          setIsProcessing(false);
          setSuccess(`Processing complete! Analyzed ${data.status.total} comments successfully.`);
        } else {
          // Continue polling every 2 seconds
          setTimeout(() => pollProcessingStatus(sessionId), 2000);
        }
      }
    } catch (error) {
      console.error('Error polling status:', error);
      // Continue polling despite errors
      setTimeout(() => pollProcessingStatus(sessionId), 3000);
    }
  };

  const handleViewResults = () => {
    if (uploadSession) {
      localStorage.setItem('currentUploadSession', uploadSession);
      navigate('/results');
    }
  };

  const handleReset = () => {
    setSelectedFile(null);
    setIsProcessing(false);
    setError('');
    setSuccess('');
    setUploadSession('');
    setProcessingStatus(null);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            eConsultation Analysis Dashboard
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Upload your stakeholder comments CSV file to get AI-powered sentiment analysis, 
            summaries, and insights to support your consultation process.
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              dragOver
                ? 'border-blue-400 bg-blue-50'
                : 'border-gray-300 hover:border-gray-400'
            } ${isProcessing ? 'opacity-50 pointer-events-none' : ''}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Upload CSV File
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              Drag and drop your CSV file here, or click to browse
            </p>
            
            <input
              type="file"
              accept=".csv"
              onChange={handleFileSelect}
              className="hidden"
              id="file-upload"
              disabled={isProcessing}
            />
            
            <label
              htmlFor="file-upload"
              className="inline-flex items-center px-6 py-3 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 cursor-pointer disabled:opacity-50"
            >
              Select CSV File
            </label>

            {selectedFile && (
              <div className="mt-4 flex items-center justify-center space-x-2 text-sm text-gray-600">
                <File className="w-4 h-4" />
                <span>{selectedFile.name}</span>
                <span>({Math.round(selectedFile.size / 1024)} KB)</span>
              </div>
            )}

            <div className="mt-4 text-xs text-gray-500">
              <p className="mb-1">Expected CSV format:</p>
              <div className="bg-gray-100 p-2 rounded text-left max-w-md mx-auto">
                <code>comment_id,comment_text</code><br />
                <code>1,"This is a sample comment..."</code><br />
                <code>2,"Another stakeholder feedback..."</code>
              </div>
            </div>
          </div>

          {error && (
            <div className="mt-6 flex items-center space-x-2 text-red-600 bg-red-50 p-4 rounded-md">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <span className="text-sm">{error}</span>
            </div>
          )}

          {success && (
            <div className="mt-6 flex items-center space-x-2 text-green-600 bg-green-50 p-4 rounded-md">
              <CheckCircle className="w-5 h-5 flex-shrink-0" />
              <span className="text-sm">{success}</span>
            </div>
          )}

          {isProcessing && (
            <div className="mt-6">
              <LoadingSpinner message="Processing comments with AI..." />
              
              {processingStatus && (
                <div className="mt-4 bg-blue-50 p-4 rounded-md">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-blue-900">
                      Processing Progress
                    </span>
                    <span className="text-sm text-blue-700">
                      {processingStatus.processed} / {processingStatus.total} comments
                    </span>
                  </div>
                  <div className="w-full bg-blue-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${processingStatus.progress}%` }}
                    ></div>
                  </div>
                  <p className="text-xs text-blue-600 mt-2">
                    {processingStatus.progress}% complete
                  </p>
                </div>
              )}
            </div>
          )}

          {uploadSession && !isProcessing && (
            <div className="mt-6 flex justify-center space-x-4">
              <button
                onClick={handleViewResults}
                className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
              >
                <BarChart3 className="w-5 h-5 mr-2" />
                View Analysis Results
              </button>
              <button
                onClick={handleReset}
                className="inline-flex items-center px-6 py-3 border border-gray-300 text-base font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Upload Another File
              </button>
            </div>
          )}
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">What happens after upload?</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                <Upload className="w-6 h-6 text-blue-600" />
              </div>
              <h4 className="font-medium text-gray-900 mb-2">1. Upload & Parse</h4>
              <p className="text-sm text-gray-600">Your CSV file is uploaded and parsed to extract individual comments</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                <span className="text-green-600 font-bold text-lg">AI</span>
              </div>
              <h4 className="font-medium text-gray-900 mb-2">2. AI Processing</h4>
              <p className="text-sm text-gray-600">Each comment is analyzed for sentiment and summarized using Hugging Face AI</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                <BarChart3 className="w-6 h-6 text-purple-600" />
              </div>
              <h4 className="font-medium text-gray-900 mb-2">3. Analytics</h4>
              <p className="text-sm text-gray-600">View comprehensive analytics, word clouds, and searchable results</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
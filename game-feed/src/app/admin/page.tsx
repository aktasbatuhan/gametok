'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

interface GameSubmission {
  _id: string;
  name: string;
  email: string;
  gameTitle: string;
  gameDescription: string;
  gameRepoUrl: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
}

export default function AdminPage() {
  const [submissions, setSubmissions] = useState<GameSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'pending' | 'approved' | 'rejected'>('pending');
  const [isUpdating, setIsUpdating] = useState<string | null>(null);

  useEffect(() => {
    fetchSubmissions();
  }, []);

  const fetchSubmissions = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/submissions');
      const data = await response.json();

      if (data.success) {
        setSubmissions(data.submissions);
      } else {
        setError(data.message || 'Failed to fetch submissions');
      }
    } catch (err) {
      console.error('Error fetching submissions:', err);
      setError('An unexpected error occurred. Please try again later.');
    } finally {
      setLoading(false);
    }
  };
  
  const updateSubmissionStatus = async (id: string, status: 'approved' | 'rejected') => {
    try {
      setIsUpdating(id);
      const response = await fetch(`/api/submissions/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        // Update the submission in the local state
        setSubmissions(prevSubmissions =>
          prevSubmissions.map(submission =>
            submission._id === id ? { ...submission, status } : submission
          )
        );
      } else {
        setError(data.message || `Failed to update submission status to ${status}`);
      }
    } catch (err) {
      console.error(`Error updating submission status to ${status}:`, err);
      setError('An unexpected error occurred. Please try again later.');
    } finally {
      setIsUpdating(null);
    }
  };

  const filteredSubmissions = submissions.filter(
    submission => submission.status === activeTab
  );

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-black text-white p-4 shadow-md">
        <div className="container mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold">GameTok Admin</h1>
          <a 
            href="/" 
            className="px-4 py-2 bg-blue-600 rounded hover:bg-blue-700 transition-colors"
          >
            Back to Game Feed
          </a>
        </div>
      </header>

      <main className="container mx-auto p-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-bold mb-6">Game Submissions</h2>
          
          {/* Status Tabs */}
          <div className="flex border-b border-gray-200 mb-6">
            <button
              className={`px-4 py-2 font-medium ${
                activeTab === 'pending' 
                  ? 'text-blue-600 border-b-2 border-blue-600' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
              onClick={() => setActiveTab('pending')}
            >
              Pending
            </button>
            <button
              className={`px-4 py-2 font-medium ${
                activeTab === 'approved' 
                  ? 'text-blue-600 border-b-2 border-blue-600' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
              onClick={() => setActiveTab('approved')}
            >
              Approved
            </button>
            <button
              className={`px-4 py-2 font-medium ${
                activeTab === 'rejected' 
                  ? 'text-blue-600 border-b-2 border-blue-600' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
              onClick={() => setActiveTab('rejected')}
            >
              Rejected
            </button>
          </div>

          {loading ? (
            <div className="flex justify-center items-center h-64">
              <svg className="animate-spin h-10 w-10 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            </div>
          ) : error ? (
            <div className="bg-red-100 text-red-700 p-4 rounded-md">
              {error}
            </div>
          ) : filteredSubmissions.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              No {activeTab} submissions found.
            </div>
          ) : (
            <div className="space-y-6">
              {filteredSubmissions.map((submission) => (
                <motion.div
                  key={submission._id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="border rounded-lg p-6 bg-gray-50"
                >
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="text-xl font-bold text-gray-800">{submission.gameTitle}</h3>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      submission.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 
                      submission.status === 'approved' ? 'bg-green-100 text-green-800' : 
                      'bg-red-100 text-red-800'
                    }`}>
                      {submission.status.charAt(0).toUpperCase() + submission.status.slice(1)}
                    </span>
                  </div>
                  
                  <div className="mb-4">
                    <p className="text-gray-600 mb-2">{submission.gameDescription}</p>
                    <div className="text-sm text-gray-500">
                      <p>By: {submission.name} ({submission.email})</p>
                      <p>Submitted: {new Date(submission.createdAt).toLocaleString()}</p>
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap gap-2">
                    <a 
                      href={submission.gameRepoUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 transition-colors"
                    >
                      View Repository
                    </a>
                    
                    {submission.status === 'pending' && (
                      <>
                        <button 
                          className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors relative"
                          onClick={() => updateSubmissionStatus(submission._id, 'approved')}
                          disabled={isUpdating === submission._id}
                        >
                          {isUpdating === submission._id ? (
                            <>
                              <span className="opacity-0">Approve</span>
                              <span className="absolute inset-0 flex items-center justify-center">
                                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                              </span>
                            </>
                          ) : "Approve"}
                        </button>
                        <button 
                          className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors relative"
                          onClick={() => updateSubmissionStatus(submission._id, 'rejected')}
                          disabled={isUpdating === submission._id}
                        >
                          {isUpdating === submission._id ? (
                            <>
                              <span className="opacity-0">Reject</span>
                              <span className="absolute inset-0 flex items-center justify-center">
                                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                              </span>
                            </>
                          ) : "Reject"}
                        </button>
                      </>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
import React, { useState, useMemo } from 'react';
import { Search, ChevronDown, ChevronUp, Eye, EyeOff } from 'lucide-react';
import { Comment } from '../types';

interface CommentsTableProps {
  comments: Comment[];
}

export function CommentsTable({ comments }: CommentsTableProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [sentimentFilter, setSentimentFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const itemsPerPage = 10;

  const filteredComments = useMemo(() => {
    return comments.filter(comment => {
      const matchesSearch = comment.original_text.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           comment.comment_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           (comment.summary && comment.summary.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesSentiment = sentimentFilter === 'all' || comment.sentiment === sentimentFilter;
      return matchesSearch && matchesSentiment;
    });
  }, [comments, searchTerm, sentimentFilter]);

  const paginatedComments = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredComments.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredComments, currentPage]);

  const totalPages = Math.ceil(filteredComments.length / itemsPerPage);

  const toggleExpanded = (commentId: string) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(commentId)) {
      newExpanded.delete(commentId);
    } else {
      newExpanded.add(commentId);
    }
    setExpandedRows(newExpanded);
  };

  const getSentimentColor = (sentiment?: string) => {
    switch (sentiment) {
      case 'positive':
        return 'text-green-600 bg-green-100';
      case 'negative':
        return 'text-red-600 bg-red-100';
      case 'neutral':
        return 'text-gray-600 bg-gray-100';
      default:
        return 'text-gray-400 bg-gray-50';
    }
  };

  const truncateText = (text: string, maxLength: number = 100) => {
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border">
      <div className="p-6 border-b">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Comments Analysis</h3>
        
        <div className="flex flex-col sm:flex-row gap-4 mb-4">
          <div className="flex-1 relative">
            <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search comments..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          
          <select
            value={sentimentFilter}
            onChange={(e) => setSentimentFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">All Sentiments</option>
            <option value="positive">Positive</option>
            <option value="negative">Negative</option>
            <option value="neutral">Neutral</option>
          </select>
        </div>
        
        <p className="text-sm text-gray-600">
          Showing {paginatedComments.length} of {filteredComments.length} comments
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Comment ID
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Comment Text
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Summary
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Sentiment
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {paginatedComments.map((comment) => {
              const isExpanded = expandedRows.has(comment.id);
              return (
                <tr key={comment.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {comment.comment_id}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    <div className="max-w-md">
                      {isExpanded ? (
                        <p className="whitespace-pre-wrap">{comment.original_text}</p>
                      ) : (
                        <p>{truncateText(comment.original_text, 150)}</p>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    <div className="max-w-md">
                      {comment.summary ? (
                        isExpanded ? (
                          <p className="whitespace-pre-wrap">{comment.summary}</p>
                        ) : (
                          <p>{truncateText(comment.summary, 100)}</p>
                        )
                      ) : (
                        <span className="text-gray-400 italic">Processing...</span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {comment.sentiment ? (
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getSentimentColor(comment.sentiment)}`}>
                        {comment.sentiment}
                      </span>
                    ) : (
                      <span className="text-gray-400 text-xs italic">Processing...</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() => toggleExpanded(comment.id)}
                      className="text-blue-600 hover:text-blue-900 flex items-center space-x-1"
                    >
                      {isExpanded ? (
                        <>
                          <EyeOff className="w-4 h-4" />
                          <span>Collapse</span>
                        </>
                      ) : (
                        <>
                          <Eye className="w-4 h-4" />
                          <span>Expand</span>
                        </>
                      )}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="px-6 py-4 border-t flex items-center justify-between">
          <div className="text-sm text-gray-700">
            Page {currentPage} of {totalPages}
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <button
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
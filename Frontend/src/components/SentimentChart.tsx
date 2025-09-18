import React from 'react';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
} from 'chart.js';
import { Pie, Bar } from 'react-chartjs-2';
import { UploadStats } from '../types';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement);

interface SentimentChartProps {
  stats: UploadStats;
  type?: 'pie' | 'bar';
}

export function SentimentChart({ stats, type = 'pie' }: SentimentChartProps) {
  const data = {
    labels: ['Positive', 'Negative', 'Neutral'],
    datasets: [
      {
        data: [stats.positive, stats.negative, stats.neutral],
        backgroundColor: [
          '#10B981',
          '#EF4444',
          '#6B7280',
        ],
        borderColor: [
          '#059669',
          '#DC2626',
          '#4B5563',
        ],
        borderWidth: 1,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          padding: 20,
          usePointStyle: true,
        },
      },
      tooltip: {
        callbacks: {
          label: function(context: any) {
            const label = context.label || '';
            const value = context.raw || 0;
            const percentage = stats.total > 0 ? ((value / stats.total) * 100).toFixed(1) : 0;
            return `${label}: ${value} (${percentage}%)`;
          },
        },
      },
    },
  };

  const barOptions = {
    ...options,
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          precision: 0,
        },
      },
    },
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Sentiment Distribution</h3>
      <div className="h-64">
        {type === 'pie' ? (
          <Pie data={data} options={options} />
        ) : (
          <Bar data={data} options={barOptions} />
        )}
      </div>
    </div>
  );
}
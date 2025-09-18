import React, { useEffect, useRef } from 'react';
import { WordCloudData } from '../types';

interface WordCloudCanvasProps {
  data: WordCloudData[];
}

export function WordCloudCanvas({ data }: WordCloudCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || data.length === 0) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Sort data by frequency
    const sortedData = [...data].sort((a, b) => b.value - a.value);
    
    // Color palette
    const colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4'];
    
    // Simple word cloud layout
    let x = 50;
    let y = 50;
    let maxRowHeight = 0;

    sortedData.forEach((item, index) => {
      const fontSize = Math.max(12, Math.min(48, (item.value / sortedData[0].value) * 40 + 12));
      ctx.font = `${fontSize}px Inter, sans-serif`;
      ctx.fillStyle = colors[index % colors.length];
      
      const textWidth = ctx.measureText(item.text).width;
      
      // Move to next row if text doesn't fit
      if (x + textWidth > canvas.width - 50) {
        x = 50;
        y += maxRowHeight + 10;
        maxRowHeight = 0;
      }
      
      // Don't draw if we're too close to the bottom
      if (y > canvas.height - 50) return;
      
      ctx.fillText(item.text, x, y);
      x += textWidth + 20;
      maxRowHeight = Math.max(maxRowHeight, fontSize);
    });
  }, [data]);

  if (data.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Word Cloud</h3>
        <div className="h-64 flex items-center justify-center text-gray-500">
          No data available for word cloud
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Word Cloud</h3>
      <canvas
        ref={canvasRef}
        className="w-full h-64 border border-gray-200 rounded-md"
        style={{ fontFamily: 'Inter, sans-serif' }}
      />
    </div>
  );
}
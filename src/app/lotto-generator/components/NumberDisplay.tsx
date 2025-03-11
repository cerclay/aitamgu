'use client';

import { motion } from 'framer-motion';
import { Copy, RefreshCw } from 'lucide-react';

interface NumberDisplayProps {
  numbers: number[];
  label: string;
}

export default function NumberDisplay({ numbers, label }: NumberDisplayProps) {
  const getNumberColor = (number: number) => {
    if (number <= 10) return 'bg-yellow-500';
    if (number <= 20) return 'bg-blue-500';
    if (number <= 30) return 'bg-red-500';
    if (number <= 40) return 'bg-gray-500';
    return 'bg-green-500';
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow-sm">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-gray-600">{label}</span>
      </div>
      <div className="flex gap-2">
        {numbers.map((number, index) => (
          <div
            key={index}
            className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center"
          >
            <span className="text-sm font-semibold text-indigo-700">
              {number}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
} 
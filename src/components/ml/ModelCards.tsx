'use client';

import React from 'react';

interface ModelStatus {
  name: string;
  available: boolean;
  description: string;
  accuracy?: number;
  trainedAt?: string;
}

interface ModelCardsProps {
  models: ModelStatus[];
  loading?: boolean;
}

export function ModelCards({ models, loading }: ModelCardsProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="rounded-xl border border-gray-200 dark:border-gray-700 p-4 animate-pulse">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2" />
            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-full mb-1" />
            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-2/3" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {models.map((model) => (
        <div
          key={model.name}
          className={`rounded-xl border p-4 flex flex-col gap-2 ${
            model.available
              ? 'border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20'
              : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/40'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="font-semibold text-sm text-gray-900 dark:text-gray-100">
              {model.name}
            </span>
            <span
              className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                model.available
                  ? 'bg-green-100 dark:bg-green-800 text-green-700 dark:text-green-300'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
              }`}
            >
              {model.available ? 'Ready' : 'Unavailable'}
            </span>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400">{model.description}</p>
          {model.accuracy !== undefined && (
            <div className="mt-auto">
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-gray-500 dark:text-gray-400">Accuracy</span>
                <span className="font-medium text-gray-700 dark:text-gray-300">
                  {(model.accuracy * 100).toFixed(1)}%
                </span>
              </div>
              <div className="h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-500 rounded-full"
                  style={{ width: `${model.accuracy * 100}%` }}
                />
              </div>
            </div>
          )}
          {model.trainedAt && (
            <p className="text-xs text-gray-400 dark:text-gray-500">
              Trained: {new Date(model.trainedAt).toLocaleDateString()}
            </p>
          )}
        </div>
      ))}
    </div>
  );
}

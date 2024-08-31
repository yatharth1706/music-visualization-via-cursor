'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface SavedVisualization {
  name: string;
  fileName: string;
  date: string;
  audioSrc: string;
}

export default function Home() {
  const [savedVisualizations, setSavedVisualizations] = useState<SavedVisualization[]>([]);

  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem('savedVisualizations') || '[]');
    setSavedVisualizations(saved);
  }, []);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24 bg-slate-100">
      <h1 className="text-4xl font-bold mb-8 text-slate-800">Music Visualization</h1>
      <Link href="/visualizer" className="mb-8 text-blue-500 hover:text-blue-700 text-lg">
        Create New Visualization
      </Link>
      <div className="w-full max-w-3xl">
        {savedVisualizations.length === 0 ? (
          <p className="text-center text-slate-600">No saved visualizations yet.</p>
        ) : (
          savedVisualizations.map((viz, index) => (
            <div key={index} className="mb-4 p-4 bg-white rounded-lg shadow">
              <h2 className="text-xl font-semibold">{viz.name}</h2>
              <p className="text-sm text-gray-500">File: {viz.fileName}</p>
              <p className="text-sm text-gray-500">Date: {new Date(viz.date).toLocaleString()}</p>
              <Link
                href={`/visualizer?audioSrc=${encodeURIComponent(viz.audioSrc)}&name=${encodeURIComponent(viz.name)}`}
                className="mt-2 inline-block text-blue-500 hover:text-blue-700"
              >
                Load Visualization
              </Link>
            </div>
          ))
        )}
      </div>
    </main>
  );
}

"use client";

import { useState } from "react";
import DiagramPanel from "@/components/DiagramPanel";

export default function TestDiagramsPage() {
  const [testQuery, setTestQuery] = useState("heart diagram");

  const sampleQueries = [
    "heart diagram",
    "brain anatomy",
    "cell structure",
    "quadratic equation",
    "triangle geometry",
    "atom model",
    "plant cell",
    "human skeleton"
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          Wikimedia Commons Diagram Test
        </h1>
        
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Test Diagram Search</h2>
          
          <div className="flex gap-4 mb-6">
            <input
              type="text"
              value={testQuery}
              onChange={(e) => setTestQuery(e.target.value)}
              placeholder="Enter search query..."
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <button
              onClick={() => setTestQuery(testQuery)}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Search
            </button>
          </div>

          <div className="mb-6">
            <h3 className="text-lg font-medium mb-3">Sample Queries:</h3>
            <div className="flex flex-wrap gap-2">
              {sampleQueries.map((query) => (
                <button
                  key={query}
                  onClick={() => setTestQuery(query)}
                  className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full hover:bg-gray-200 transition-colors text-sm"
                >
                  {query}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-lg">
          <DiagramPanel query={testQuery} />
        </div>
      </div>
    </div>
  );
} 
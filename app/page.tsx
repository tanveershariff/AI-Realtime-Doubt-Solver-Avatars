"use client";

import Link from "next/link";
import { useState, useEffect } from "react";

export default function LandingPage() {
  const [isHovered, setIsHovered] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setIsLoaded(true);
  }, []);

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="flex justify-between items-center px-8 py-8 border-b border-gray-100">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg">
            <span className="text-white font-bold text-xl">D</span>
          </div>
          <span className="text-2xl font-bold text-gray-900">
            DoubtSolver AI
          </span>
        </div>
        <Link 
          href="/solver"
          className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all duration-300 shadow-md hover:shadow-lg"
        >
          Try Now
        </Link>
      </nav>

      {/* Hero Section */}
      <div className="max-w-6xl mx-auto px-8 py-24">
        <div className={`text-center transition-all duration-1000 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <h1 className="text-5xl md:text-7xl font-bold mb-12 leading-tight">
            <span className="text-blue-600">
              Ask Any Doubt,
            </span>
            <br />
            <span className="text-gray-900">
              Get Instant AI Help
            </span>
            <br />
            <span className="text-gray-700">
              From Your Favorite Teacher
            </span>
          </h1>
          
          <p className="text-xl text-gray-600 mb-16 max-w-3xl mx-auto leading-relaxed">
            Struggling with math, physics, or any subject? Our AI-powered interactive avatar 
            provides step-by-step explanations with clear, formatted solutions. 
            Just ask your doubt and watch the magic happen!
          </p>

          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center mb-20">
            <Link 
              href="/solver"
              onMouseEnter={() => setIsHovered(true)}
              onMouseLeave={() => setIsHovered(false)}
              className="px-10 py-4 bg-blue-600 text-white rounded-xl text-lg font-semibold hover:bg-blue-700 transition-all duration-300 shadow-lg hover:shadow-xl flex items-center space-x-3"
            >
              <span>🚀 Start Learning Now</span>
              <svg 
                className={`w-5 h-5 transition-transform duration-300 ${isHovered ? 'translate-x-1' : ''}`} 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </Link>
            
            <button className="px-10 py-4 border-2 border-gray-300 text-gray-700 rounded-xl text-lg font-semibold hover:border-gray-400 hover:bg-gray-50 transition-all duration-300">
              📚 Watch Demo
            </button>
          </div>
        </div>

        {/* Features Grid */}
        <div className={`grid md:grid-cols-3 gap-12 mt-32 transition-all duration-1000 delay-300 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <div className="text-center p-8 rounded-2xl bg-white shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100">
            <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="text-3xl">🎤</span>
            </div>
            <h3 className="text-xl font-semibold mb-4 text-gray-900">Voice & Text Input</h3>
            <p className="text-gray-600 leading-relaxed">Ask your doubts naturally through voice or type them out. Our AI understands both perfectly.</p>
          </div>
          
          <div className="text-center p-8 rounded-2xl bg-white shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="text-3xl">👨‍🏫</span>
            </div>
            <h3 className="text-xl font-semibold mb-4 text-gray-900">Interactive Avatar</h3>
            <p className="text-gray-600 leading-relaxed">Learn from a friendly AI teacher who explains concepts with clear, engaging responses.</p>
          </div>
          
          <div className="text-center p-8 rounded-2xl bg-white shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100">
            <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="text-3xl">📝</span>
            </div>
            <h3 className="text-xl font-semibold mb-4 text-gray-900">Step-by-Step Solutions</h3>
            <p className="text-gray-600 leading-relaxed">Get detailed explanations with proper math formatting, LaTeX equations, and clear steps.</p>
          </div>
        </div>

        {/* Testimonial Section */}
        <div className={`mt-32 transition-all duration-1000 delay-500 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <div className="bg-white rounded-3xl shadow-lg p-12 max-w-4xl mx-auto border border-gray-100">
            <div className="flex items-center justify-center mb-8">
              <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold text-xl shadow-lg">
                S
              </div>
              <div className="ml-6 text-left">
                <h4 className="font-semibold text-lg text-gray-900">Sarah, Grade 12 Student</h4>
                <p className="text-gray-600">Physics Student</p>
              </div>
            </div>
            <blockquote className="text-xl text-gray-700 italic leading-relaxed">
              "DoubtSolver AI helped me understand complex physics concepts in minutes! 
              The interactive avatar makes learning so much more engaging than reading textbooks."
            </blockquote>
          </div>
        </div>
      </div>
    </div>
  );
}

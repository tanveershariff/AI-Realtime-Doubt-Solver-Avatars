"use client";

import { useState, useEffect } from "react";

type Diagram = {
  title: string;
  thumbUrl: string;
  fullUrl: string;
  mime: string;
  author: string;
  license: string;
  licenseUrl: string;
};

export default function DiagramPanel({ query, className = "" }: { query?: string; className?: string }) {
  const [items, setItems] = useState<Diagram[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<Diagram | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    if (!query || !query.trim()) {
      setItems([]);
      setError(null);
      return;
    }

    const run = async () => {
      setLoading(true);
      setError(null);
      try {
        console.log("Fetching diagrams for query:", query);
        const res = await fetch(`/api/commons-search?query=${encodeURIComponent(query)}`);
        const data = await res.json().catch(() => ({}));
        console.log("Wikimedia API response:", data);
        
        if (!res.ok) throw new Error(data?.message || data?.error || "Failed to fetch diagrams");
        
        const images = (data?.images as Diagram[]) || [];
        console.log("Processed images:", images);
        setItems(images);
      } catch (e) {
        console.error("Error fetching diagrams:", e);
        setError(e instanceof Error ? e.message : "Failed to load diagrams");
      } finally {
        setLoading(false);
      }
    };

    const t = setTimeout(run, 350);
    return () => clearTimeout(t);
  }, [query]);

  if (!query || !query.trim()) return null;

  return (
    <div className={`bg-white border-t border-gray-200 flex flex-col ${className}`}>
      <div className="p-6 flex-shrink-0">
        <div className={`flex items-center space-x-3 mb-6 transition-all duration-700 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg">
            <span className="text-white text-lg">📊</span>
          </div>
          <div>
            <h3 className="text-xl font-semibold text-gray-900">Visual Diagrams</h3>
            <p className="text-gray-600 text-sm">Relevant visual aids for your question</p>
          </div>
        </div>

        {loading && (
          <div className="flex items-center justify-center py-8">
            <div className="flex items-center space-x-3 text-gray-600">
              <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              <span className="font-medium">Loading diagrams...</span>
            </div>
          </div>
        )}
        
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700 text-sm">
            <div className="flex items-center space-x-2">
              <span className="text-red-500">⚠️</span>
              <span>{error}</span>
            </div>
          </div>
        )}
        
        {!loading && !error && items.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <span className="text-2xl">🔍</span>
            </div>
            <p className="font-medium">No diagrams found</p>
            <p className="text-sm">Try rephrasing your question</p>
            <div className="mt-4 p-4 bg-gray-100 rounded-lg text-left text-xs">
              <p className="font-medium mb-2">Debug Info:</p>
              <p>Query: {query}</p>
              <p>Items count: {items.length}</p>
              <p>Loading: {loading.toString()}</p>
              <p>Error: {error || 'None'}</p>
            </div>
          </div>
        )}

        {!loading && !error && items.length > 0 && (
          <>
            {/* Debug Info */}
            <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg text-left text-xs">
              <p className="font-medium mb-2 text-blue-800">Debug Info:</p>
              <p className="text-blue-700">Query: {query}</p>
              <p className="text-blue-700">Found {items.length} images</p>
              <p className="text-blue-700">First image URL: {items[0]?.thumbUrl}</p>
            </div>
            
            <div className={`grid grid-cols-1 sm:grid-cols-2 gap-6 flex-1 overflow-y-auto transition-all duration-700 delay-300 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
            {items.map((img, i) => (
              <div key={i} className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-md hover:shadow-lg transition-all duration-300 hover:border-blue-200">
                <div className="aspect-video bg-gray-50 relative overflow-hidden">
                  <img
                    src={img.thumbUrl}
                    alt={img.title}
                    className="w-full h-full object-contain bg-white"
                    onLoad={() => console.log(`Image ${i} loaded successfully:`, img.title, img.thumbUrl)}
                    onError={(e) => {
                      console.error(`Image ${i} failed to load:`, img.title, img.thumbUrl, e);
                      const el = e.currentTarget as HTMLImageElement;
                      if (el.src !== img.fullUrl) {
                        console.log(`Trying full URL as fallback:`, img.fullUrl);
                        el.src = img.fullUrl;
                      }
                    }}
                  />
                </div>
                <div className="p-4">
                  <h4 className="font-medium text-gray-900 text-sm mb-3 line-clamp-2 leading-tight">
                    {img.title}
                  </h4>
                  <div className="flex items-center justify-between text-xs text-gray-600 mb-3">
                    <span className="truncate">By: {img.author}</span>
                    <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium">
                      {img.license}
                    </span>
                  </div>
                  <button
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium py-2 px-4 rounded-lg transition-colors duration-200"
                    onClick={() => setSelected(img)}
                  >
                    View Full
                  </button>
                </div>
              </div>
            ))}
                      </div>
          </>
        )}
      </div>

      {/* Full-size Image Modal */}
      {selected && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={() => setSelected(null)}>
          <div className="bg-white rounded-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 text-lg">{selected.title}</h3>
                <p className="text-gray-600 text-sm mt-1">By: {selected.author}</p>
              </div>
              <button 
                className="w-8 h-8 bg-gray-100 hover:bg-gray-200 rounded-lg flex items-center justify-center text-gray-600 hover:text-gray-800 transition-colors duration-200"
                onClick={() => setSelected(null)}
              >
                ✕
              </button>
            </div>
            <div className="p-6">
              <img 
                src={selected.fullUrl} 
                alt={selected.title} 
                className="w-full h-auto rounded-lg border border-gray-200 shadow-lg" 
              />
              <div className="mt-4 flex items-center justify-between text-sm text-gray-600">
                <span>License: {selected.license}</span>
                {selected.licenseUrl && (
                  <a 
                    className="text-blue-600 hover:text-blue-700 font-medium hover:underline" 
                    target="_blank" 
                    rel="noreferrer" 
                    href={selected.licenseUrl}
                  >
                    License details
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
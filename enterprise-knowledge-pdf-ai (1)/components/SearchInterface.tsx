import React, { useState, useEffect } from 'react';
import { DocumentKnowledge, SearchResult, SearchHistoryItem } from '../types';
import { semanticSearch } from '../services/geminiService';
import { fetchHistory, saveHistory, clearHistoryData } from '../services/apiService';

interface SearchInterfaceProps {
  knowledgeBase: DocumentKnowledge[];
  onSelectResult: (docId: string, page: number) => void;
}

const SearchInterface: React.FC<SearchInterfaceProps> = ({ knowledgeBase, onSelectResult }) => {
  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [history, setHistory] = useState<SearchHistoryItem[]>([]);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    const data = await fetchHistory();
    setHistory(data);
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setIsSearching(true);
    try {
      const searchResults = await semanticSearch(query, knowledgeBase);
      setResults(searchResults);
      await saveHistory(query, searchResults);
      loadHistory(); // Refresh history
    } catch (err) {
      console.error("Search failed", err);
    } finally {
      setIsSearching(false);
    }
  };

  const handleClearHistory = async () => {
    await clearHistoryData();
    setHistory([]);
  };

  return (
    <div className="space-y-6 h-full flex flex-col">
      <form onSubmit={handleSearch} className="relative group">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Ask a question about your documents... (e.g., 'What are the safety protocols?')"
          className="w-full px-12 py-4 rounded-2xl bg-white border-2 border-slate-100 focus:border-blue-500 shadow-sm focus:shadow-blue-100 outline-none transition-all"
        />
        <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-6 h-6 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <button
          disabled={isSearching}
          type="submit"
          className="absolute right-3 top-1/2 -translate-y-1/2 px-4 py-1.5 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:bg-slate-300 transition-colors"
        >
          {isSearching ? 'Analyzing...' : 'Search'}
        </button>
      </form>

      <div className="flex-1 overflow-y-auto space-y-4 pb-6 custom-scrollbar">
        {results.length > 0 ? (
          <>
            <div className="flex justify-between items-center px-1">
              <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400">Current Results</h3>
              <button onClick={() => { setResults([]); setQuery(''); }} className="text-xs font-bold text-slate-400 hover:text-blue-600">Clear</button>
            </div>
            {results.map((result, idx) => (
              <div
                key={idx}
                onClick={() => onSelectResult(result.docId, result.pageNumber)}
                className="p-5 bg-white border border-slate-100 rounded-2xl hover:shadow-md hover:border-blue-200 transition-all cursor-pointer group"
              >
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center space-x-2">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-tighter ${result.type === 'table' ? 'bg-amber-100 text-amber-700' :
                        result.type === 'image' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
                      }`}>
                      {result.type}
                    </span>
                    <h4 className="text-sm font-bold text-slate-400">{result.fileName}</h4>
                  </div>
                  <div className="flex items-center space-x-1">
                    <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-green-500" style={{ width: `${result.score * 100}%` }}></div>
                    </div>
                    <span className="text-[10px] font-bold text-slate-400">Match</span>
                  </div>
                </div>
                <h3 className="text-lg font-bold text-slate-800 group-hover:text-blue-600 transition-colors mb-2">{result.title}</h3>
                <p className="text-sm text-slate-600 line-clamp-2 leading-relaxed italic border-l-2 border-slate-200 pl-3">
                  "{result.snippet}"
                </p>
                <div className="mt-4 flex items-center text-xs text-blue-600 font-bold group-hover:translate-x-1 transition-transform">
                  View Source &rarr;
                </div>
              </div>
            ))}
          </>
        ) : isSearching ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-4">
            <div className="w-12 h-12 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin"></div>
            <p className="text-slate-500 font-medium animate-pulse">Scanning knowledge base with AI reasoning...</p>
          </div>
        ) : (
          <div className="space-y-6">
            {history.length > 0 && (
              <div>
                <div className="flex justify-between items-center px-1 mb-4">
                  <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400">Recent Searches</h3>
                  <button onClick={handleClearHistory} className="text-xs font-bold text-red-400 hover:text-red-600">Clear History</button>
                </div>
                <div className="space-y-3">
                  {history.map((item) => (
                    <div key={item.id} onClick={() => { setQuery(item.query); setResults(item.results); }} className="p-4 bg-slate-50 rounded-xl hover:bg-white hover:shadow-md transition-all cursor-pointer border border-transparent hover:border-slate-100 group">
                      <div className="flex justify-between items-center mb-1">
                        <span className="font-bold text-slate-700 group-hover:text-blue-600">{item.query}</span>
                        <span className="text-[10px] text-slate-400">{new Date(item.timestamp).toLocaleDateString()}</span>
                      </div>
                      <p className="text-xs text-slate-500">{item.results.length} found</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex flex-col items-center justify-center py-10 opacity-40">
              <svg className="w-16 h-16 text-slate-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.641.32a4 4 0 01-2.56.344l-1.464-.293a2 2 0 01-1.353-2.618l2.257-6.208a2 2 0 012.618-1.353l3.522 1.28a2 2 0 011.353 2.618l-1.353 3.522a2 2 0 01-2.618 1.353l-3.522-1.28a2 2 0 01-1.353-2.618z" />
              </svg>
              <p className="text-slate-500 font-medium">Ready to search.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchInterface;

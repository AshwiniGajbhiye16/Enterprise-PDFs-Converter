
import React, { useState } from 'react';
import { DocumentKnowledge, SectionData, TableData, ImageData } from '../types';

interface KnowledgeViewProps {
  document: DocumentKnowledge;
  onBack: () => void;
}

const KnowledgeView: React.FC<KnowledgeViewProps> = ({ document, onBack }) => {
  const [activeTab, setActiveTab] = useState<'summary' | 'sections' | 'tables' | 'images'>('summary');

  return (
    <div className="flex flex-col h-full bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="p-6 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
        <div>
          <button onClick={onBack} className="text-blue-600 hover:text-blue-800 text-sm font-medium mb-1 block">
            &larr; Back to Dashboard
          </button>
          <h2 className="text-xl font-bold text-slate-800 leading-tight">{document.metadata.title || document.fileName}</h2>
          <div className="flex items-center space-x-3 mt-1">
            <span className="text-xs font-bold px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full">{document.metadata.category}</span>
            <p className="text-sm text-slate-500">Processed on {new Date(document.processedAt).toLocaleDateString()}</p>
          </div>
        </div>
        <div className="flex space-x-1 bg-white p-1 rounded-xl border border-slate-200">
          <button 
            onClick={() => setActiveTab('summary')}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'summary' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-600 hover:bg-slate-50'}`}
          >
            Executive Summary
          </button>
          <button 
            onClick={() => setActiveTab('sections')}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'sections' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-600 hover:bg-slate-50'}`}
          >
            Sections ({document.sections.length})
          </button>
          <button 
            onClick={() => setActiveTab('tables')}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'tables' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-600 hover:bg-slate-50'}`}
          >
            Tables ({document.tables.length})
          </button>
          <button 
            onClick={() => setActiveTab('images')}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'images' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-600 hover:bg-slate-50'}`}
          >
            Visuals ({document.images.length})
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        {activeTab === 'summary' && (
          <div className="max-w-4xl space-y-8 animate-in fade-in duration-500">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="col-span-2 space-y-6">
                <section>
                  <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">The Context</h3>
                  <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100">
                    <p className="text-lg text-slate-700 leading-relaxed font-medium">
                      {document.metadata.summary}
                    </p>
                  </div>
                </section>

                <section>
                  <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Key Takeaways</h3>
                  <div className="grid grid-cols-1 gap-4">
                    {document.metadata.keyPoints.map((point, i) => (
                      <div key={i} className="flex items-start space-x-4 p-4 bg-white border border-slate-100 rounded-xl shadow-sm">
                        <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                           <svg className="w-3.5 h-3.5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                             <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                           </svg>
                        </div>
                        <p className="text-slate-700 font-medium">{point}</p>
                      </div>
                    ))}
                  </div>
                </section>
              </div>

              <div className="space-y-6">
                 <section>
                    <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Document Details</h3>
                    <div className="p-5 bg-white border border-slate-200 rounded-2xl space-y-4 shadow-sm">
                       <div>
                         <p className="text-[10px] font-bold text-slate-400 uppercase">Author / Organization</p>
                         <p className="text-slate-800 font-bold">{document.metadata.author || 'Not specified'}</p>
                       </div>
                       <div>
                         <p className="text-[10px] font-bold text-slate-400 uppercase">Publish Date</p>
                         <p className="text-slate-800 font-bold">{document.metadata.date || 'Not specified'}</p>
                       </div>
                       <div>
                         <p className="text-[10px] font-bold text-slate-400 uppercase">Category</p>
                         <p className="text-slate-800 font-bold">{document.metadata.category}</p>
                       </div>
                       <div className="pt-4 border-t border-slate-100">
                         <p className="text-[10px] font-bold text-slate-400 uppercase">File Info</p>
                         <p className="text-slate-600 text-xs mt-1 font-medium">{document.fileName}</p>
                         <p className="text-slate-400 text-[10px]">{(document.fileSize / 1024 / 1024).toFixed(2)} MB</p>
                       </div>
                    </div>
                 </section>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'sections' && (
          <div className="space-y-6 max-w-4xl">
            {document.sections.map((section) => (
              <div key={section.id} className="group p-6 rounded-2xl border border-slate-100 hover:border-blue-200 hover:bg-blue-50/30 transition-all">
                <div className="flex justify-between items-start mb-3">
                  <h3 className="text-xl font-bold text-slate-800 group-hover:text-blue-700 transition-colors">{section.title}</h3>
                  <span className="text-[10px] font-black px-2 py-1 bg-slate-100 rounded-md text-slate-500 uppercase tracking-tighter">Page {section.pageNumber}</span>
                </div>
                {section.chapter && <p className="text-xs text-blue-500 font-bold mb-3 uppercase tracking-widest">{section.chapter}</p>}
                <p className="text-slate-600 leading-relaxed whitespace-pre-wrap text-lg">{section.content}</p>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'tables' && (
          <div className="space-y-12">
            {document.tables.map((table) => (
              <div key={table.id} className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-bold text-slate-800">Extracted Table</h3>
                  <span className="text-[10px] font-black px-2 py-1 bg-slate-100 rounded-md text-slate-500 uppercase tracking-tighter">Page {table.pageNumber}</span>
                </div>
                <div className="p-4 bg-blue-50/50 border border-blue-100 rounded-2xl">
                  <p className="text-sm font-bold text-blue-900">Description: <span className="font-medium text-blue-700">{table.summary}</span></p>
                </div>
                <div className="overflow-x-auto border border-slate-200 rounded-2xl shadow-sm bg-white">
                  <table className="min-w-full divide-y divide-slate-200">
                    <thead className="bg-slate-50">
                      <tr>
                        {table.headers.map((header, i) => (
                          <th key={i} className="px-6 py-4 text-left text-xs font-black text-slate-500 uppercase tracking-wider">{header}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-slate-100">
                      {table.rows.map((row, i) => (
                        <tr key={i} className="hover:bg-slate-50 transition-colors">
                          {row.map((cell, j) => (
                            <td key={j} className="px-6 py-4 text-sm text-slate-600 font-medium whitespace-nowrap">{cell}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'images' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {document.images.map((image) => (
              <div key={image.id} className="p-6 rounded-2xl border border-slate-100 bg-white shadow-sm flex flex-col hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-4">
                   <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${image.type === 'chart' ? 'bg-amber-100 text-amber-600' : 'bg-indigo-100 text-indigo-600'}`}>
                      {image.type === 'chart' ? (
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                      ) : (
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      )}
                   </div>
                   <span className="text-[10px] font-black px-2 py-1 bg-slate-100 rounded text-slate-500 uppercase">Page {image.pageNumber}</span>
                </div>
                <p className="text-slate-800 font-bold text-sm mb-2 uppercase tracking-widest">{image.type} Extraction</p>
                <p className="text-slate-600 font-medium leading-relaxed italic border-l-2 border-slate-100 pl-3">"{image.description}"</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default KnowledgeView;

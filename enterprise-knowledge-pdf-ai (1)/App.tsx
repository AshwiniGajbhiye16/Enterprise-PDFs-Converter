
import React, { useState, useRef, useEffect } from 'react';
import { DocumentKnowledge, AppState } from './types';
import { getPageCount, convertPageToImage } from './services/pdfService';
import { extractKnowledgeFromPage, extractDocumentMetadata } from './services/geminiService';
import { downloadAsPDF, downloadAsWord } from './services/downloadService';
import { fetchDocuments, saveDocument } from './services/apiService';
import KnowledgeView from './components/KnowledgeView';
import SearchInterface from './components/SearchInterface';

const MAX_CONCURRENCY = 15; // Parallel workers for ultra-fast processing

const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>(AppState.IDLE);
  const [knowledgeBase, setKnowledgeBase] = useState<DocumentKnowledge[]>([]);
  const [selectedDocId, setSelectedDocId] = useState<string | null>(null);
  const [processingProgress, setProcessingProgress] = useState({ current: 0, total: 0 });
  const [statusMessage, setStatusMessage] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const isAborted = useRef<boolean>(false);

  const processParallel = async (arrayBuffer: ArrayBuffer, pageCount: number, docId: string) => {
    const pages = Array.from({ length: pageCount }, (_, i) => i + 1);
    let completed = 0;

    const processBatch = async (pageNumbers: number[]) => {
      await Promise.all(pageNumbers.map(async (pageNum) => {
        if (isAborted.current) return;

        try {
          const base64 = await convertPageToImage(arrayBuffer, pageNum);
          const data = await extractKnowledgeFromPage(base64, pageNum);

          setKnowledgeBase(prev => prev.map(doc => {
            if (doc.id === docId) {
              return {
                ...doc,
                sections: [...doc.sections, ...data.sections.map((s: any) => ({ ...s, id: crypto.randomUUID(), pageNumber: pageNum }))],
                tables: [...doc.tables, ...data.tables.map((t: any) => ({ ...t, id: crypto.randomUUID(), pageNumber: pageNum }))],
                images: [...doc.images, ...data.images.map((img: any) => ({ ...img, id: crypto.randomUUID(), pageNumber: pageNum }))],
                toc: data.toc ? Array.from(new Set([...doc.toc, ...data.toc])) : doc.toc
              };
            }
            return doc;
          }));
        } catch (err) {
          console.warn(`Page ${pageNum} failed but continuing...`, err);
        } finally {
          completed++;
          setProcessingProgress(prev => ({ ...prev, current: completed }));
        }
      }));
    };

    for (let i = 0; i < pages.length; i += MAX_CONCURRENCY) {
      if (isAborted.current) break;
      const batch = pages.slice(i, i + MAX_CONCURRENCY);
      await processBatch(batch);
    }
  };

  useEffect(() => {
    // Load documents from backend on mount
    fetchDocuments().then(docs => {
      setKnowledgeBase(docs);
    });
  }, []);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setAppState(AppState.PROCESSING);
    setStatusMessage(`Turbo-indexing ${file.name}...`);
    isAborted.current = false;

    try {
      const arrayBuffer = await file.arrayBuffer();
      const pageCount = await getPageCount(arrayBuffer);

      const firstPageBase64 = await convertPageToImage(arrayBuffer, 1);
      const metadata = await extractDocumentMetadata(firstPageBase64);

      const newDocId = crypto.randomUUID();
      const newDoc: DocumentKnowledge = {
        id: newDocId,
        fileName: file.name,
        fileSize: file.size,
        metadata: metadata,
        sections: [],
        tables: [],
        images: [],
        toc: [],
        processedAt: new Date().toISOString(),
      };

      setKnowledgeBase(prev => [...prev, newDoc]);
      setProcessingProgress({ current: 0, total: pageCount });

      await processParallel(arrayBuffer, pageCount, newDocId);

      // Save to backend after processing is complete
      // We need to get the latest state of the document from the knowledgeBase
      // However, state updates are async. A safer way is to construct the final object or assume the state is eventually consistent.
      // But since processParallel updates state incrementally, we can't easily get the 'final' doc immediately after await processParallel.
      // Actually, processParallel awaits all batches. So after it returns, the state updates *should* be queued.
      // But we can't access the updated state variable immediately here due to closure.
      // The reliable way is to use a functional update and save inside it, OR save in a separate effect that watches for completion?
      // No, let's just use the fact that we can reconstruct the doc if we had the parts, but we don't.

      // Let's refactor the save logic to happen when we persist.
      // Wait, `processParallel` is async and waits for everything.
      // But React state `knowledgeBase` inside this function is the OLD snapshot.

      // We'll trust the user to reload for persistence OR we pass a "onComplete" callback to processParallel that receives the full chunks?
      // Or we can just re-fetch the document from state... no that's hard in a closure.

      // ALTERNATIVE: processParallel creates the data, we accumulate it in a local variable AND set state.
      // Accessing state in the loop is fine for rendering, but for saving we want the aggregate.

      // Let's modify processParallel to Return the accumulated data or just accept that we save "what we have"?
      // Actually, looking at processParallel, it updates state.
      // For simplicity in this `handleFileUpload`, I will do a trick:
      // I will wrap the save call in a setTimeout to allow state to settle? No, that's flaky.

      // Better approach: fetch the latest state inside a setState callback? 
      // setKnowledgeBase(prev => { 
      //    const doc = prev.find(d => d.id === newDocId);
      //    if(doc) saveDocument(doc);
      //    return prev;
      // })
      // This is a valid side-effect in a setState updater? A bit anti-pattern but works for this specific action.
      // Or just make processParallel accumulate data in a local object `finalDoc` as well.

      // Let's go with the local accumulation since `processParallel` logic is right there (in the original file).
      // Wait, `processParallel` is defined outside `handleFileUpload`.
      // I need to change `processParallel` to also return the collected data OR update a local ref.

      // Actually, I can just not change `processParallel` and do the save in the `setKnowledgeBase` at the end?
      // No, `processParallel` is complex.

      // Let's look at `processParallel` again.
      // It iterates and calls `setKnowledgeBase`.

      // I will add a `useEffect` that listens to `appState`. When it goes from PROCESSING to IDLE, we save the `knowledgeBase`?
      // But `handleFileUpload` sets IDLE at the end.

      // Simplest fix: Just add the logic to save *all* documents or just the new one *inside* the state setter that finalizes it?
      // No, `processParallel` finishes, then we set IDLE.

      // Let's try:
      // setKnowledgeBase(prev => {
      //    const completedDoc = prev.find(d => d.id === newDocId);
      //    if (completedDoc) {
      //       saveDocument(completedDoc).then(() => console.log('Saved to backend'));
      //    }
      //    return prev;
      // });

      if (!isAborted.current) {
        setStatusMessage('Corpus successfully vectorized. Saving...');

        // Trigger a save using the state updater pattern to access latest state
        setKnowledgeBase(prev => {
          const doc = prev.find(d => d.id === newDocId);
          if (doc) {
            saveDocument(doc).catch(err => console.error("Save failed", err));
          }
          return prev;
        });

        setTimeout(() => setAppState(AppState.IDLE), 1000);
      }
    } catch (err) {
      console.error("Critical Failure", err);
      setStatusMessage('Indexing failed. API or Memory limit exceeded.');
      setTimeout(() => setAppState(AppState.IDLE), 3000);
    }
  };

  const selectedDoc = knowledgeBase.find(d => d.id === selectedDocId);

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans text-slate-900">
      <aside className="w-72 bg-white border-r border-slate-200 flex flex-col">
        <div className="p-6 border-b border-slate-100">
          <div className="flex items-center space-x-3 mb-2">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-black text-xl shadow-lg shadow-indigo-100">K</div>
            <div>
              <h1 className="font-bold text-slate-800 leading-none">Enterprise</h1>
              <span className="text-indigo-600 font-bold text-xs uppercase tracking-widest">Rapid AI</span>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto custom-scrollbar">
          <div className="flex justify-between items-center px-3 mb-4">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Assets</p>
            <span className="text-[10px] bg-slate-100 px-1.5 py-0.5 rounded-md font-bold text-slate-500">{knowledgeBase.length}</span>
          </div>

          {knowledgeBase.length === 0 ? (
            <div className="px-3 py-6 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
              <p className="text-xs text-slate-400">Ready for ingestion.</p>
            </div>
          ) : (
            knowledgeBase.map(doc => (
              <button
                key={doc.id}
                onClick={() => { setSelectedDocId(doc.id); setAppState(AppState.VIEWING_DOC); }}
                className={`w-full text-left px-3 py-3 rounded-xl text-sm transition-all flex items-start space-x-3 group ${selectedDocId === doc.id ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-600 hover:bg-slate-50'
                  }`}
              >
                <div className="flex flex-col truncate">
                  <span className="truncate leading-tight font-bold">{doc.metadata.title || doc.fileName}</span>
                  <span className={`text-[9px] font-black uppercase mt-1 ${selectedDocId === doc.id ? 'text-white/70' : 'text-slate-400'}`}>
                    {doc.metadata.category} • {doc.sections.length} units
                  </span>
                </div>
              </button>
            ))
          )}
        </nav>

        <div className="p-4 border-t border-slate-100">
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={appState === AppState.PROCESSING}
            className="w-full py-3.5 bg-slate-900 text-white rounded-2xl font-bold hover:bg-slate-800 disabled:opacity-50 transition-all flex items-center justify-center space-x-2"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" /></svg>
            <span>Fast Ingest</span>
          </button>
          <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept=".pdf" className="hidden" />
        </div>
      </aside>

      <main className="flex-1 flex flex-col relative overflow-hidden bg-white">
        <header className="h-16 border-b border-slate-100 bg-white px-8 flex items-center justify-between z-10">
          <div className="flex items-center space-x-4">
            <button onClick={() => { setSelectedDocId(null); setAppState(AppState.IDLE); }} className="text-xs font-black uppercase tracking-widest text-indigo-600">Discovery</button>
            {selectedDocId && <span className="text-slate-200">/</span>}
            {selectedDocId && <span className="text-xs font-black uppercase tracking-widest text-slate-400">Analysis</span>}
          </div>

          <div className="flex items-center space-x-4">
            {selectedDoc && appState === AppState.VIEWING_DOC && (
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => downloadAsPDF(selectedDoc)}
                  className="p-2 hover:bg-slate-100 rounded-lg text-slate-600 transition-colors flex items-center space-x-1"
                  title="Download as PDF"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  <span className="text-[10px] font-black uppercase">PDF</span>
                </button>
                <button
                  onClick={() => downloadAsWord(selectedDoc)}
                  className="p-2 hover:bg-slate-100 rounded-lg text-slate-600 transition-colors flex items-center space-x-1"
                  title="Download as Word"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <span className="text-[10px] font-black uppercase">DOCX</span>
                </button>
              </div>
            )}
            <div className="flex items-center space-x-2 px-3 py-1 bg-green-50 rounded-full border border-green-100">
              <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-[10px] font-black text-green-700 uppercase tracking-widest">High Speed Pipeline Active</span>
            </div>
          </div>
        </header>

        <div className="flex-1 p-8 overflow-hidden relative bg-slate-50/50">
          {appState === AppState.PROCESSING && (
            <div className="absolute inset-0 z-50 bg-slate-900/40 backdrop-blur-md flex items-center justify-center p-8">
              <div className="bg-white rounded-[3rem] p-10 shadow-2xl max-w-lg w-full transform animate-in zoom-in duration-300">
                <div className="flex flex-col items-center text-center space-y-6">
                  <div className="relative">
                    <div className="w-24 h-24 border-[8px] border-slate-50 rounded-full"></div>
                    <div className="absolute inset-0 border-[8px] border-t-indigo-600 border-r-indigo-600/30 border-b-transparent border-l-transparent rounded-full animate-spin"></div>
                    <div className="absolute inset-0 flex items-center justify-center font-black text-slate-800">
                      {Math.round((processingProgress.current / processingProgress.total) * 100 || 0)}%
                    </div>
                  </div>
                  <div className="space-y-2">
                    <h2 className="text-2xl font-black text-slate-800">Vectorizing Corpus</h2>
                    <p className="text-slate-500 text-sm font-medium">{statusMessage}</p>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div className="h-full bg-indigo-600 transition-all duration-300" style={{ width: `${(processingProgress.current / processingProgress.total) * 100}%` }} />
                  </div>
                  <div className="text-[10px] font-black text-indigo-600 uppercase">Processing 15 Pages Concurrent</div>
                </div>
              </div>
            </div>
          )}

          {appState === AppState.VIEWING_DOC && selectedDoc ? (
            <KnowledgeView document={selectedDoc} onBack={() => { setSelectedDocId(null); setAppState(AppState.IDLE); }} />
          ) : (
            <div className="h-full max-w-6xl mx-auto overflow-y-auto pr-2 custom-scrollbar">
              <div className="mb-10">
                <h1 className="text-3xl font-black text-slate-800 tracking-tight">Rapid Knowledge Dashboard</h1>
                <p className="text-slate-500 font-medium">Vector-indexed search across unstructured data.</p>
              </div>

              {knowledgeBase.length > 0 ? (
                <div className="space-y-12 pb-20">
                  <SearchInterface knowledgeBase={knowledgeBase} onSelectResult={(id) => { setSelectedDocId(id); setAppState(AppState.VIEWING_DOC); }} />
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {knowledgeBase.map(doc => (
                      <div key={doc.id} onClick={() => { setSelectedDocId(doc.id); setAppState(AppState.VIEWING_DOC); }} className="bg-white p-6 rounded-[2rem] border border-slate-100 hover:shadow-xl transition-all cursor-pointer">
                        <div className="flex items-center justify-between mb-4">
                          <span className="px-2 py-0.5 bg-indigo-50 text-indigo-600 rounded-lg text-[10px] font-black uppercase">{doc.metadata.category}</span>
                          <span className="text-[10px] text-slate-400 font-bold">{doc.sections.length} Units</span>
                        </div>
                        <h3 className="text-lg font-bold text-slate-800 mb-2 line-clamp-2">{doc.metadata.title}</h3>
                        <p className="text-xs text-slate-500 line-clamp-3 mb-4">{doc.metadata.briefSummary}</p>
                        <div className="w-full py-2 bg-slate-50 rounded-xl text-center text-[10px] font-black uppercase text-slate-400">View Insights</div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="h-[400px] border-2 border-dashed border-slate-200 rounded-[3rem] flex flex-col items-center justify-center p-12 bg-white/50">
                  <div className="w-20 h-20 bg-indigo-50 rounded-3xl flex items-center justify-center mb-6">
                    <svg className="w-10 h-10 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                  </div>
                  <h3 className="text-xl font-bold text-slate-800 mb-2">No documents indexed</h3>
                  <p className="text-slate-400 text-sm max-w-sm text-center mb-8">Drop any PDF up to 550 pages for ultra-fast vector indexing and AI reasoning.</p>
                  <button onClick={() => fileInputRef.current?.click()} className="px-8 py-4 bg-slate-900 text-white rounded-2xl font-bold uppercase tracking-widest text-xs hover:bg-indigo-600 transition-all">Begin Ingestion</button>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default App;

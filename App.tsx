import React, { useState, useEffect, useMemo, useCallback } from 'react';

import { Poem, Tab } from './types';
import PoemCard from './components/PoemCard';
import PoemPreviewModal from './components/PoemPreviewModal';
import AIScholar from './components/AIScholar';
import FunGames from './components/FunGames';
import { Library as LibraryIcon, Sparkles, Feather, Menu, X, CloudFog, Gamepad2 } from 'lucide-react';
import { loadAllPoems } from './utils/dataAdapter';
import { searchExternalPoems } from './utils/externalSearch';

import Library, { CATEGORIES, Category } from './components/Library';

const App: React.FC = () => {
    const [poems, setPoems] = useState<Poem[]>([]);

    useEffect(() => {
        const fetchPoems = async () => {
            const loadedPoems = await loadAllPoems();
            setPoems([...loadedPoems]);
        };
        fetchPoems();
    }, []);

    const [activeTab, setActiveTab] = useState<Tab>(Tab.HOME);
    const [libraryCategory, setLibraryCategory] = useState<Category>('tang-300');
    const [scholarMode, setScholarMode] = useState<'chat' | 'search'>('chat');
    const [selectedPoemForAnalysis, setSelectedPoemForAnalysis] = useState<Poem | null>(null);
    const [analysisResult, setAnalysisResult] = useState<string | null>(null);
    const [filter, setFilter] = useState('');
    const [sidebarOpen, setSidebarOpen] = useState(false);

    // External Search State
    const [externalResults, setExternalResults] = useState<Poem[]>([]);
    const [isSearchingExternal, setIsSearchingExternal] = useState(false);

    // Preview Modal State
    const [previewPoem, setPreviewPoem] = useState<Poem | null>(null);
    const [previewIndex, setPreviewIndex] = useState<number>(0);
    const [isPreviewOpen, setIsPreviewOpen] = useState(false);
    const [previewContext, setPreviewContext] = useState<Poem[]>([]);
    const [hideAnalyzeButton, setHideAnalyzeButton] = useState(false);

    const handlePreviewPoem = useCallback((poem: Poem, context: Poem[] = poems, hideAnalyze: boolean = false) => {
        setPreviewPoem(poem);
        setPreviewContext(context);
        setHideAnalyzeButton(hideAnalyze);
        const idx = context.findIndex(p => p.id === poem.id);
        setPreviewIndex(idx >= 0 ? idx : 0);
        setIsPreviewOpen(true);
    }, [poems]);

    const handleNextPoem = () => {
        if (previewIndex < previewContext.length - 1) {
            const nextIdx = previewIndex + 1;
            setPreviewIndex(nextIdx);
            setPreviewPoem(previewContext[nextIdx]);
        }
    };

    const handlePrevPoem = () => {
        if (previewIndex > 0) {
            const prevIdx = previewIndex - 1;
            setPreviewIndex(prevIdx);
            setPreviewPoem(previewContext[prevIdx]);
        }
    };

    const handleGoToPoem = useCallback((poemId: string) => {
        const poem = poems.find(p => p.id === poemId);
        if (poem) {
            setActiveTab(Tab.LIBRARY);

            // Determine category based on ID prefix
            if (poemId.startsWith('tang-')) setLibraryCategory('tang-300');
            else if (poemId.startsWith('song-')) setLibraryCategory('song-300');
            else if (poemId.startsWith('shuimo-')) setLibraryCategory('shuimotangshi');
            else if (poemId.startsWith('nalan-')) setLibraryCategory('nalan');
            else if (poemId.startsWith('nantang-') || poemId.startsWith('huajian-')) setLibraryCategory('wudai');
            else if (poemId.startsWith('shijing-')) setLibraryCategory('shijing');

            handlePreviewPoem(poem);
        }
    }, [poems, handlePreviewPoem]);

    const handleAnalyzePoem = useCallback((poem: Poem) => {
        setSelectedPoemForAnalysis(poem);
        setActiveTab(Tab.SCHOLAR);
        setScholarMode('chat');
        setIsPreviewOpen(false);
    }, []);

    const handleExternalSearch = async () => {
        if (!filter) return;
        setIsSearchingExternal(true);
        const results = await searchExternalPoems(filter);
        setExternalResults(results);
        setIsSearchingExternal(false);
    };

    const [toast, setToast] = useState<{ message: string; visible: boolean }>({ message: '', visible: false });

    const showToast = (message: string) => {
        setToast({ message, visible: true });
        setTimeout(() => setToast(prev => ({ ...prev, visible: false })), 3000);
    };

    const [customPoems, setCustomPoems] = useState<Poem[]>([]);

    const addToLibrary = useCallback((poem: Poem) => {
        if (!customPoems.find(p => p.id === poem.id)) {
            setCustomPoems(prev => [poem, ...prev]);
            setExternalResults(prev => prev.filter(p => p.id !== poem.id));
            showToast(`已将《${poem.title}》收入个性化藏书`);
        } else {
            showToast('此作已在您的藏书阁中');
        }
    }, [customPoems]);

    const removeFromLibrary = useCallback((poemId: string) => {
        setCustomPoems(prev => prev.filter(p => p.id !== poemId));
        showToast('已从个性化藏书中移除');
    }, []);

    const filteredPoems = poems.filter(p =>
        p.title.includes(filter) ||
        p.author.includes(filter) ||
        p.content.some(l => l.includes(filter))
    );

    return (
        <div className="flex h-screen bg-[#fdfbf7] text-stone-800 font-sans overflow-hidden selection:bg-amber-100 selection:text-amber-900">

            {/* Sidebar Navigation (Reverted Style) */}
            <aside className={`fixed lg:static inset-y-0 left-0 z-50 w-64 bg-white/80 backdrop-blur-xl border-r border-stone-200 transform transition-transform duration-300 ease-in-out ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
                <div className="h-full flex flex-col">
                    {/* Logo */}
                    <div className="p-6 pb-2 flex items-center gap-3">
                        <div className="w-10 h-10 bg-amber-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-amber-600/20">
                            <Feather size={24} />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold font-serif text-stone-800 tracking-wider" style={{ fontFamily: '"Ma Shan Zheng", cursive' }}>锦秋诗词</h1>
                            <p className="text-xs text-stone-400 uppercase tracking-widest mt-0.5">Jinqiu Poetry</p>
                        </div>
                    </div>

                    {/* Nav Links */}
                    <nav className="p-4 space-y-2 flex-1 overflow-y-auto custom-scrollbar">
                        {/* HOME TAB */}
                        <button
                            onClick={() => { setActiveTab(Tab.HOME); setSidebarOpen(false); }}
                            className={`w-full flex items-center gap-4 px-6 py-4 rounded-xl transition-all duration-300 group relative overflow-hidden ${activeTab === Tab.HOME
                                ? 'bg-gradient-to-r from-stone-800 to-stone-700 text-white shadow-lg scale-105'
                                : 'hover:bg-stone-100 text-stone-600 hover:scale-105'
                                }`}
                        >
                            <CloudFog size={20} className={activeTab === Tab.HOME ? 'animate-pulse' : ''} />
                            <span className="font-bold tracking-wide z-10">首页</span>
                        </button>

                        <button
                            onClick={() => { setActiveTab(Tab.LIBRARY); setSidebarOpen(false); }}
                            className={`w-full flex items-center gap-4 px-6 py-4 rounded-xl transition-all duration-300 group relative overflow-hidden ${activeTab === Tab.LIBRARY
                                ? 'bg-gradient-to-r from-stone-800 to-stone-700 text-white shadow-lg scale-105'
                                : 'hover:bg-stone-100 text-stone-600 hover:scale-105'
                                }`}
                        >
                            <LibraryIcon size={20} className={activeTab === Tab.LIBRARY ? 'animate-pulse' : ''} />
                            <span className="font-bold tracking-wide z-10">藏书阁</span>
                        </button>

                        {/* Sub-menu for Library Categories */}
                        {activeTab === Tab.LIBRARY && (
                            <div className="pl-4 space-y-1 animate-slide-in-top">
                                {CATEGORIES.map((cat, idx) => (
                                    <button
                                        key={cat.id}
                                        onClick={() => setLibraryCategory(cat.id)}
                                        style={{ animationDelay: `${idx * 50}ms`, opacity: 0, animationFillMode: 'forwards' }}
                                        className={`w-full text-left px-4 py-2 rounded-lg text-xs font-serif transition-colors animate-slide-in-left ${libraryCategory === cat.id
                                            ? 'text-amber-700 font-bold bg-amber-50'
                                            : 'text-stone-500 hover:text-stone-800 hover:bg-stone-50'
                                            }`}
                                    >
                                        {cat.name}
                                    </button>
                                ))}
                            </div>
                        )}

                        <button
                            onClick={() => { setActiveTab(Tab.SCHOLAR); setSidebarOpen(false); }}
                            className={`w-full flex items-center gap-4 px-6 py-4 rounded-xl transition-all duration-300 group relative overflow-hidden ${activeTab === Tab.SCHOLAR
                                ? 'bg-gradient-to-r from-amber-700 to-amber-600 text-white shadow-lg scale-105'
                                : 'hover:bg-amber-50 text-stone-600 hover:text-amber-700 hover:scale-105'
                                }`}
                        >
                            <Sparkles size={20} className={activeTab === Tab.SCHOLAR ? 'animate-spin-slow' : ''} />
                            <span className="font-bold tracking-wide z-10">侍读</span>
                        </button>

                        {/* Sub-menu for Scholar Modes */}
                        {activeTab === Tab.SCHOLAR && (
                            <div className="pl-4 space-y-1 animate-slide-in-top">
                                <button
                                    onClick={() => setScholarMode('chat')}
                                    className={`w-full text-left px-4 py-2 rounded-lg text-xs font-serif transition-colors animate-slide-in-left ${scholarMode === 'chat'
                                        ? 'text-amber-700 font-bold bg-amber-50'
                                        : 'text-stone-500 hover:text-stone-800 hover:bg-stone-50'
                                        }`}
                                >
                                    对谈
                                </button>
                                <button
                                    onClick={() => setScholarMode('search')}
                                    style={{ animationDelay: '50ms', opacity: 0, animationFillMode: 'forwards' }}
                                    className={`w-full text-left px-4 py-2 rounded-lg text-xs font-serif transition-colors animate-slide-in-left ${scholarMode === 'search'
                                        ? 'text-amber-700 font-bold bg-amber-50'
                                        : 'text-stone-500 hover:text-stone-800 hover:bg-stone-50'
                                        }`}
                                >
                                    采撷
                                </button>
                            </div>
                        )}

                        <button
                            onClick={() => { setActiveTab(Tab.GAMES); setSidebarOpen(false); }}
                            className={`w-full flex items-center gap-4 px-6 py-4 rounded-xl transition-all duration-300 group relative overflow-hidden ${activeTab === Tab.GAMES
                                ? 'bg-gradient-to-r from-emerald-700 to-emerald-600 text-white shadow-lg scale-105'
                                : 'hover:bg-emerald-50 text-stone-600 hover:text-emerald-700 hover:scale-105'
                                }`}
                        >
                            <Gamepad2 size={20} className={activeTab === Tab.GAMES ? 'animate-bounce' : ''} />
                            <span className="font-bold tracking-wide z-10">趣游</span>
                        </button>
                    </nav>

                    {/* Footer Info */}
                    <div className="p-6 text-center text-stone-400 text-xs border-t border-stone-200">
                        <p className="font-bold text-stone-300">唐诗 · 宋词 · 赏析</p>
                        <p className="mt-1 opacity-50">Edited by Gemini 3 Pro</p>
                        <p className="mt-1 opacity-50">Powered by Spark</p>
                    </div>
                </div>
            </aside>

            {/* Mobile Overlay */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 bg-stone-900/40 backdrop-blur-sm z-40 lg:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Main Content Area */}
            <main className="flex-1 h-screen overflow-y-auto relative scroll-smooth z-10">
                {/* Background Texture */}
                <div className="absolute inset-0 opacity-5 pointer-events-none z-0" style={{ backgroundImage: 'url("https://www.transparenttextures.com/patterns/rice-paper.png")' }}></div>

                {/* Mobile Header Toggle */}
                <div className="lg:hidden p-4 flex items-center justify-between sticky top-0 bg-white/80 backdrop-blur-md z-30 border-b border-stone-200 shadow-sm">
                    <span className="font-serif font-bold text-xl text-stone-800" style={{ fontFamily: '"Ma Shan Zheng", cursive' }}>锦秋诗词</span>
                    <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 text-stone-600 hover:bg-stone-100 rounded-full">
                        {sidebarOpen ? <X /> : <Menu />}
                    </button>
                </div>

                {/* View: HOME */}
                <div className={`h-full flex flex-col items-center justify-center animate-fade-in ${activeTab === Tab.HOME ? '' : 'hidden'}`}>
                    <div className="relative w-full h-full flex items-center justify-center overflow-hidden">
                        {/* Wallpaper Background */}
                        <div className="absolute inset-0 z-0">
                            <img
                                src="/wallpaper/7.jpg"
                                alt="Background"
                                className="w-full h-full object-cover opacity-90"
                            />
                            <div className="absolute inset-0 bg-black/20"></div>
                        </div>

                        {/* Centered Logo Content */}
                        <div className="relative z-10 flex flex-col items-center animate-zoom-in">
                            <div className="flex items-center gap-6 mb-6">
                                <div className="w-24 h-24 bg-amber-600 rounded-3xl flex items-center justify-center text-white shadow-2xl shadow-amber-600/40 transform -rotate-6">
                                    <Feather size={64} strokeWidth={1.5} />
                                </div>
                                <div className="text-white drop-shadow-lg">
                                    <h1 className="text-7xl font-bold font-serif tracking-widest mb-2" style={{ fontFamily: '"Ma Shan Zheng", cursive' }}>锦秋诗词</h1>
                                    <p className="text-xl uppercase tracking-[0.5em] font-light text-amber-100/90">Jinqiu Poetry</p>
                                </div>
                            </div>
                            <div className="mt-12">
                                <button
                                    onClick={() => setActiveTab(Tab.LIBRARY)}
                                    className="px-10 py-3 bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/30 rounded-full text-white font-serif text-lg tracking-widest transition-all hover:scale-105 hover:shadow-lg active:scale-95"
                                >
                                    开启诗词之旅
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* View: LIBRARY */}
                <div className={`h-full flex flex-col animate-fade-in ${activeTab === Tab.LIBRARY ? '' : 'hidden'}`}>
                    <Library
                        activeCategory={libraryCategory}
                        onPreview={handlePreviewPoem}
                        onAnalyze={handleAnalyzePoem}
                        addToLibrary={addToLibrary}
                        customPoems={customPoems}
                        onRemoveFromLibrary={removeFromLibrary}
                    />
                </div>

                {/* View: AI SCHOLAR */}
                <div className={`h-full p-6 animate-fade-in ${activeTab === Tab.SCHOLAR ? '' : 'hidden'}`}>
                    <AIScholar
                        onAddPoem={addToLibrary}
                        initialAnalysis={analysisResult}
                        analyzedPoem={selectedPoemForAnalysis}
                        onPoemClick={handlePreviewPoem}
                        onAnalyze={handleAnalyzePoem}
                        mode={scholarMode}
                    />
                </div>

                {/* View: FUN GAMES */}
                <div className={`h-full animate-fade-in ${activeTab === Tab.GAMES ? '' : 'hidden'}`}>
                    <FunGames poems={[...poems, ...customPoems]} onGoToPoem={handleGoToPoem} onPoemClick={handlePreviewPoem} customPoems={customPoems} />
                </div>

            </main>

            {/* Global Modals */}
            <PoemPreviewModal
                poem={previewPoem}
                isOpen={isPreviewOpen}
                onClose={() => setIsPreviewOpen(false)}
                index={previewIndex}
                onNext={handleNextPoem}
                onPrev={handlePrevPoem}
                hasNext={previewIndex < previewContext.length - 1}
                hasPrev={previewIndex > 0}
                onAnalyze={handleAnalyzePoem}
                hideAnalyzeButton={hideAnalyzeButton}
                isCustom={!!previewPoem && customPoems.some(p => p.id === previewPoem.id)}
                onAddToLibrary={addToLibrary}
                onRemoveFromLibrary={removeFromLibrary}
            />

            {/* Toast Notification */}
            {toast.visible && (
                <div className="fixed top-6 left-1/2 transform -translate-x-1/2 z-[60] animate-fade-in-down">
                    <div className="bg-stone-800 text-amber-50 px-6 py-3 rounded-full shadow-xl flex items-center gap-3 border border-stone-700">
                        <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                        <span className="font-serif tracking-wide">{toast.message}</span>
                    </div>
                </div>
            )}

        </div>
    );
};

export default App;

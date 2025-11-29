import React, { useState, useEffect, useRef } from 'react';
import { Bot, Send, User, Sparkles, Loader2, StopCircle, X } from 'lucide-react';
import { chatWithSpark } from '../services/sparkService';
import { Poem } from '../types';
import PoemCard from './PoemCard';
import { searchExternalPoems } from '../utils/externalSearch';

interface AIScholarProps {
    onAddPoem?: (poem: Poem) => void;
    initialAnalysis?: string | null;
    analyzedPoem?: Poem | null;
    onPoemClick?: (poem: Poem, context?: Poem[], hideAnalyze?: boolean) => void;
    onAnalyze?: (poem: Poem) => void;
    mode: 'chat' | 'search';
}

interface Message {
    role: 'user' | 'assistant';
    content: string;
    poem?: Poem;
}

const AIScholar: React.FC<AIScholarProps> = ({ onAddPoem, initialAnalysis, analyzedPoem, onPoemClick, onAnalyze, mode }) => {

    // Chat State
    const [messages, setMessages] = useState<Message[]>([
        { role: 'assistant', content: '阁下好，我是您的诗词侍读。您可以问我关于诗词的任何问题，或者让我为您赏析诗词。' }
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const requestId = useRef(0);

    // Search State
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<Poem[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [displayCount, setDisplayCount] = useState(200);

    // Auto-resize textarea
    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
        }
    }, [input]);

    useEffect(() => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages]);

    useEffect(() => {
        if (analyzedPoem) {
            // Prevent duplicate analysis for the same poem (e.g. StrictMode)
            const lastMsg = messages[messages.length - 1];
            if (lastMsg?.poem?.id === analyzedPoem.id) {
                return;
            }

            // Mode switch handled by parent now
            // setMode('chat'); 
            const currentId = ++requestId.current;
            const prompt = `请赏析《${analyzedPoem.title}》\n作者：${analyzedPoem.author}\n内容：\n${analyzedPoem.content.join('\n')}`;

            setMessages(prev => [...prev, {
                role: 'user',
                content: `请赏析《${analyzedPoem.title}》`,
                poem: analyzedPoem
            }]);

            setIsLoading(true);
            setMessages(prev => [...prev, { role: 'assistant', content: '' }]);

            chatWithSpark(prompt, (token) => {
                if (requestId.current === currentId) {
                    setMessages(prev => {
                        const newMessages = [...prev];
                        const lastMsg = newMessages[newMessages.length - 1];
                        if (lastMsg.role === 'assistant') {
                            lastMsg.content += token;
                        }
                        return newMessages;
                    });
                }
            })
                .catch(() => {
                    if (requestId.current === currentId) {
                        setMessages(prev => [...prev, { role: 'assistant', content: '抱歉，侍读今日略感疲乏，请稍后再试。' }]);
                    }
                })
                .finally(() => {
                    if (requestId.current === currentId) {
                        setIsLoading(false);
                    }
                });
        }

        return () => {
            // Cleanup
        };
    }, [analyzedPoem]);

    const handleSend = async () => {
        if (!input.trim() || isLoading) return;

        const userMessage = input.trim();
        setInput('');
        setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
        setIsLoading(true);
        setMessages(prev => [...prev, { role: 'assistant', content: '' }]);

        const currentId = ++requestId.current;

        try {
            await chatWithSpark(userMessage, (token) => {
                if (requestId.current === currentId) {
                    setMessages(prev => {
                        const newMessages = [...prev];
                        const lastMsg = newMessages[newMessages.length - 1];
                        if (lastMsg.role === 'assistant') {
                            lastMsg.content += token;
                        }
                        return newMessages;
                    });
                }
            });
        } catch (error: any) {
            if (requestId.current === currentId) {
                console.error("Chat Error:", error);
                const errorMessage = error.message || '抱歉，侍读今日略感疲乏，请稍后再试。';
                setMessages(prev => [...prev, { role: 'assistant', content: `(连接错误: ${errorMessage}) 抱歉，侍读今日略感疲乏，请稍后再试。` }]);
            }
        } finally {
            if (requestId.current === currentId) {
                setIsLoading(false);
            }
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const handleSearch = async () => {
        if (!searchQuery.trim()) return;
        setIsSearching(true);
        setSearchResults([]); // Clear previous results
        setDisplayCount(200);

        try {
            await searchExternalPoems(searchQuery, (partialResults) => {
                setSearchResults(partialResults);
            });
        } catch (error) {
            console.error("Search failed:", error);
        } finally {
            setIsSearching(false);
        }
    };

    return (
        <div className="flex flex-col h-full relative font-sans">
            {/* Header - Toggle */}
            {/* Header - Toggle Removed (Moved to Sidebar) */}

            {/* CHAT MODE */}
            <div className={`flex-1 flex flex-col h-full overflow-hidden transition-opacity duration-300 ${mode === 'chat' ? 'opacity-100 z-0' : 'opacity-0 hidden'}`}>
                {/* Chat Area - Gemini Style */}
                <div className="flex-1 overflow-y-auto px-4 py-20 md:px-20 lg:px-40 space-y-8 custom-scrollbar">
                    {messages.map((msg, idx) => (
                        <div key={idx} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'} animate-fade-in`}>
                            {/* User Message: Bubble */}
                            {msg.role === 'user' && (
                                <div className="max-w-[80%] md:max-w-[70%]">
                                    <div className="bg-stone-100 text-stone-800 px-5 py-3 rounded-2xl rounded-tr-sm shadow-sm text-base leading-relaxed whitespace-pre-wrap">
                                        {msg.poem ? (
                                            <div className="w-64">
                                                <PoemCard
                                                    poem={msg.poem}
                                                    index={0}
                                                    variant="vertical"
                                                    onClick={() => onPoemClick?.(msg.poem!, [msg.poem!], true)}
                                                />
                                            </div>
                                        ) : (
                                            msg.content
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Assistant Message: Clean Text with Icon */}
                            {msg.role === 'assistant' && (
                                <div className="flex gap-4 max-w-full md:max-w-[85%]">
                                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-400 to-orange-600 flex items-center justify-center flex-shrink-0 shadow-md mt-1">
                                        <Sparkles size={16} className="text-white" />
                                    </div>
                                    <div className="flex-1 space-y-2">
                                        <div className="text-stone-800 text-base leading-loose whitespace-pre-wrap font-serif">
                                            {msg.content || (isLoading && idx === messages.length - 1 ? <span className="animate-pulse text-stone-400">侍读正在思考...</span> : '')}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                    <div ref={messagesEndRef} />
                </div>

                {/* Input Area - Floating Bottom */}
                <div className="p-6 pb-8 flex justify-center">
                    <div className="w-full max-w-3xl relative bg-stone-50 rounded-3xl border border-stone-200 shadow-lg focus-within:shadow-xl focus-within:border-amber-300 transition-all duration-300">
                        <textarea
                            ref={textareaRef}
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="问点什么..."
                            rows={1}
                            className="w-full pl-6 pr-14 py-4 bg-transparent border-none focus:ring-0 outline-none resize-none text-stone-700 placeholder-stone-400 max-h-48 custom-scrollbar"
                            style={{ minHeight: '56px' }}
                        />
                        <button
                            onClick={handleSend}
                            disabled={!input.trim() || isLoading}
                            className={`absolute right-3 bottom-3 p-2 rounded-full transition-all duration-300 ${input.trim() && !isLoading
                                ? 'bg-amber-600 text-white hover:bg-amber-700 shadow-md'
                                : 'bg-stone-200 text-stone-400 cursor-not-allowed'
                                }`}
                        >
                            {isLoading ? <Loader2 size={20} className="animate-spin" /> : <Send size={20} />}
                        </button>
                    </div>
                </div>
            </div>

            {/* SEARCH MODE */}
            <div className={`flex-1 flex flex-col h-full overflow-hidden transition-opacity duration-300 ${mode === 'search' ? 'opacity-100 z-0' : 'opacity-0 hidden'}`}>
                <div className="flex-1 overflow-y-auto custom-scrollbar p-8 pt-24">
                    <div className="w-full space-y-12">
                        {/* Search Box */}
                        <div className="text-center space-y-6 max-w-4xl mx-auto">
                            <h2 className="text-3xl font-serif font-bold text-stone-800">采撷遗珠</h2>
                            <div className="space-y-2">
                                <p className="text-stone-500">输入关键词，为您寻觅沧海遗珠</p>
                                <p className="text-xs text-stone-400">数据源：<a href="https://github.com/snowtraces/poetry-source" target="_blank" rel="noopener noreferrer" className="hover:text-amber-600 underline decoration-stone-300 underline-offset-4 transition-colors">poetry-source</a></p>
                            </div>
                            <div className="relative max-w-xl mx-auto">
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                                    placeholder="输入诗句、作者或意象..."
                                    className="w-full px-6 py-4 rounded-full bg-white border-2 border-stone-200 focus:border-amber-500 focus:outline-none shadow-sm text-lg pr-44"
                                />
                                {searchQuery && (
                                    <button
                                        onClick={() => setSearchQuery('')}
                                        className="absolute right-36 top-1/2 transform -translate-y-1/2 text-stone-400 hover:text-stone-600 p-2 rounded-full hover:bg-stone-100 transition-colors"
                                    >
                                        <X size={20} />
                                    </button>
                                )}
                                <button
                                    onClick={handleSearch}
                                    disabled={isSearching}
                                    className="absolute right-2 top-2 bottom-2 px-6 bg-stone-800 text-amber-50 rounded-full hover:bg-stone-700 transition-colors flex items-center gap-2"
                                >
                                    {isSearching ? <Loader2 className="animate-spin" /> : <Sparkles size={18} />}
                                    <span>寻觅</span>
                                </button>
                            </div>
                        </div>

                        {/* Results */}
                        {searchResults.length > 0 && (
                            <div className="space-y-8">
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 animate-fade-in">
                                    {searchResults.slice(0, displayCount).map((poem, idx) => (
                                        <div key={poem.id} className="flex flex-col gap-4">
                                            <PoemCard
                                                poem={poem}
                                                index={idx}
                                                variant="vertical"
                                                onClick={() => onPoemClick?.(poem, searchResults)}
                                                onAnalyze={onAnalyze}
                                                onAdd={onAddPoem}
                                            />
                                        </div>
                                    ))}
                                </div>

                                {/* Load More / Status */}
                                <div className="flex justify-center py-4">
                                    {displayCount < searchResults.length ? (
                                        <button
                                            onClick={() => setDisplayCount(prev => prev + 200)}
                                            className="px-6 py-2 bg-stone-200 hover:bg-stone-300 text-stone-700 rounded-full font-serif transition-colors"
                                        >
                                            加载更多
                                        </button>
                                    ) : (
                                        <p className="text-stone-400 text-sm font-serif">—— 已显示全部 ——</p>
                                    )}
                                </div>
                            </div>
                        )}

                        {!isSearching && searchResults.length === 0 && searchQuery && (
                            <div className="text-center text-stone-400 py-12">
                                <p>暂无发现，换个词试试？</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AIScholar;

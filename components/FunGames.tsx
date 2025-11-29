import React, { useState, useEffect, useMemo } from 'react';
import { Sparkles, Brain, Scroll, Trophy, ArrowRight, CheckCircle2, XCircle, ChevronLeft, ChevronRight, BookOpen, Image as ImageIcon, BarChart3, HelpCircle, PenTool } from 'lucide-react';
import { Poem } from '../types';
import PoemCard from './PoemCard';
import PaintingRealm from './PaintingRealm';
import CoupletGame from './CoupletGame';

interface FunGamesProps {
    poems: Poem[];
    onGoToPoem?: (poemId: string) => void;
    onPoemClick?: (poem: Poem, context?: Poem[]) => void;
    customPoems?: Poem[];
}

type GameMode = 'fill-blanks' | 'painting-realm' | 'data-viz' | 'menu' | 'fei-hua-ling' | 'word-select' | 'couplet';

interface Question {
    id: number;
    type: 'fill-blanks';
    poem: Poem;
    question: string;
    answer: string;
    options: string[];
    userAnswer?: string;
    isCorrect?: boolean;
}

const FunGames: React.FC<FunGamesProps> = ({ poems, onGoToPoem, onPoemClick, customPoems = [] }) => {
    const [mode, setMode] = useState<GameMode>('menu');
    const [score, setScore] = useState(0);

    // Session State
    const [questions, setQuestions] = useState<Question[]>([]);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [isSessionFinished, setIsSessionFinished] = useState(false);

    // Fei Hua Ling State
    const [fhlWord, setFhlWord] = useState('');
    const [fhlIndex, setFhlIndex] = useState(0);

    // --- Data Viz Helpers ---
    const dataStats = useMemo(() => {
        if (!poems.length) return null;

        // Top Authors by Dynasty
        const tangAuthors: Record<string, number> = {};
        const songAuthors: Record<string, number> = {};

        // High Frequency Words (Simplified naive approach)
        const wordFreq: Record<string, number> = {};
        const stopWords = new Set(['的', '了', '在', '是', '我', '有', '和', '就', '不', '人', '都', '一', '一个', '上', '也', '很', '到', '说', '要', '去', '你', '会', '着', '没有', '看', '好', '自己', '这', '，', '。', '？', '！', '、', '：', '；', '“', '”', '‘', '’', '（', '）', '《', '》']);

        // High Frequency Phrases (Word Segmentation)
        const phraseFreq: Record<string, number> = {};
        const segmenter = new Intl.Segmenter('zh-CN', { granularity: 'word' });

        poems.forEach(p => {
            // Authors
            if (p.dynasty === '唐') {
                tangAuthors[p.author] = (tangAuthors[p.author] || 0) + 1;
            } else if (p.dynasty === '宋') {
                songAuthors[p.author] = (songAuthors[p.author] || 0) + 1;
            }

            // Words (Characters)
            p.content.forEach(line => {
                for (let char of line) {
                    if (/[\u4e00-\u9fa5]/.test(char) && !stopWords.has(char)) {
                        wordFreq[char] = (wordFreq[char] || 0) + 1;
                    }
                }

                // Phrases (Words)
                const segments = segmenter.segment(line);
                for (const segment of segments) {
                    if (segment.isWordLike && segment.segment.length > 1 && !stopWords.has(segment.segment)) {
                        phraseFreq[segment.segment] = (phraseFreq[segment.segment] || 0) + 1;
                    }
                }
            });
        });

        const getTopK = (obj: Record<string, number>, k: number) => Object.entries(obj).sort((a, b) => b[1] - a[1]).slice(0, k);

        return {
            tangAuthors: getTopK(tangAuthors, 10),
            songAuthors: getTopK(songAuthors, 10),
            topWords: getTopK(wordFreq, 20),
            topPhrases: getTopK(phraseFreq, 20)
        };
    }, [poems]);

    // --- Game Logic Helpers ---
    // ... (generateOptions, startNewSession, handleAnswer, nextQuestion, prevQuestion remain same)
    const generateOptions = (correctChar: string, allPoems: Poem[]): string[] => {
        const options = new Set<string>([correctChar]);
        let attempts = 0;
        while (options.size < 4 && attempts < 100) {
            const randomPoem = allPoems[Math.floor(Math.random() * allPoems.length)];
            if (randomPoem && randomPoem.content && randomPoem.content.length > 0) {
                const randomLine = randomPoem.content[Math.floor(Math.random() * randomPoem.content.length)];
                if (randomLine) {
                    const randomChar = randomLine[Math.floor(Math.random() * randomLine.length)];
                    if (/[\u4e00-\u9fa5]/.test(randomChar)) {
                        options.add(randomChar);
                    }
                }
            }
            attempts++;
        }
        return Array.from(options).sort(() => Math.random() - 0.5);
    };

    const startNewSession = () => {
        if (!poems || poems.length === 0) return;

        const newQuestions: Question[] = [];
        let attempts = 0;

        while (newQuestions.length < 10 && attempts < 100) {
            const randomPoem = poems[Math.floor(Math.random() * poems.length)];
            const validLines = randomPoem.content.filter(l => l.length >= 5);

            if (validLines.length > 0) {
                const line = validLines[Math.floor(Math.random() * validLines.length)];

                // Find char to blank
                let charIndex = -1;
                let charAttempts = 0;
                while (charAttempts < 20) {
                    const idx = Math.floor(Math.random() * line.length);
                    if (/[\u4e00-\u9fa5]/.test(line[idx])) {
                        charIndex = idx;
                        break;
                    }
                    charAttempts++;
                }

                if (charIndex !== -1) {
                    const answer = line[charIndex];
                    const questionText = line.substring(0, charIndex) + "___" + line.substring(charIndex + 1);
                    const options = generateOptions(answer, poems);

                    newQuestions.push({
                        id: Date.now() + newQuestions.length,
                        type: 'fill-blanks',
                        poem: randomPoem,
                        question: questionText,
                        answer: answer,
                        options: options
                    });
                }
            }
            attempts++;
        }

        setQuestions(newQuestions);
        setCurrentQuestionIndex(0);
        setScore(0);
        setIsSessionFinished(false);
        setMode('fill-blanks');
    };

    const handleAnswer = (option: string) => {
        const currentQ = questions[currentQuestionIndex];
        if (currentQ.userAnswer) return; // Already answered

        const isCorrect = option === currentQ.answer;
        const updatedQuestions = [...questions];
        updatedQuestions[currentQuestionIndex] = {
            ...currentQ,
            userAnswer: option,
            isCorrect: isCorrect
        };

        setQuestions(updatedQuestions);
        if (isCorrect) {
            setScore(s => s + 10);
        }
    };

    const nextQuestion = () => {
        if (currentQuestionIndex < questions.length - 1) {
            setCurrentQuestionIndex(prev => prev + 1);
        } else {
            setIsSessionFinished(true);
        }
    };

    const prevQuestion = () => {
        if (currentQuestionIndex > 0) {
            setCurrentQuestionIndex(prev => prev - 1);
        }
    };

    // --- Renderers ---

    const renderMenu = () => (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {/* Fill Blanks */}
            <div
                onClick={startNewSession}
                className="group cursor-pointer bg-white/60 backdrop-blur-md border-2 border-stone-200 rounded-3xl p-8 hover:border-amber-500 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
            >
                <div className="w-16 h-16 bg-amber-100 rounded-2xl flex items-center justify-center text-amber-600 mb-6 group-hover:scale-110 transition-transform animate-bounce-small">
                    <Brain size={32} />
                </div>
                <h3 className="text-2xl font-bold text-stone-800 mb-3 font-serif">诗词填空</h3>
                <p className="text-stone-500 mb-6 leading-relaxed">
                    十道精选题目，挑战诗词记忆。<br />
                    答题赢取积分，重温经典名句。
                </p>
                <div className="flex items-center text-amber-600 font-bold group-hover:gap-2 transition-all">
                    <span>开始挑战</span>
                    <ArrowRight size={18} />
                </div>
            </div>

            {/* Couplets */}
            <div
                onClick={() => setMode('couplet')}
                className="group cursor-pointer bg-white/60 backdrop-blur-md border-2 border-stone-200 rounded-3xl p-8 hover:border-amber-500 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
            >
                <div className="w-16 h-16 bg-amber-100 rounded-2xl flex items-center justify-center text-amber-600 mb-6 group-hover:scale-110 transition-transform">
                    <PenTool size={32} />
                </div>
                <h3 className="text-2xl font-bold text-stone-800 mb-3 font-serif">对对子</h3>
                <p className="text-stone-500 mb-6 leading-relaxed">
                    平仄相对，对仗工整，<br />
                    体验传统对联之趣。
                </p>
                <div className="flex items-center text-amber-600 font-bold group-hover:gap-2 transition-all">
                    <span>开始挑战</span>
                    <ArrowRight size={18} />
                </div>
            </div>

            {/* Painting Realm */}
            <div
                onClick={() => setMode('painting-realm')}
                className="group cursor-pointer bg-white/60 backdrop-blur-md border-2 border-stone-200 rounded-3xl p-8 hover:border-emerald-500 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
            >
                <div className="w-16 h-16 bg-emerald-100 rounded-2xl flex items-center justify-center text-emerald-600 mb-6 group-hover:scale-110 transition-transform">
                    <ImageIcon size={32} />
                </div>
                <h3 className="text-2xl font-bold text-stone-800 mb-3 font-serif">画境创作</h3>
                <p className="text-stone-500 mb-6 leading-relaxed">
                    精选国风壁纸，题诗作画。<br />
                    定制专属诗词卡片，一键保存。
                </p>
                <div className="flex items-center text-emerald-600 font-bold group-hover:gap-2 transition-all">
                    <span>进入画境</span>
                    <ArrowRight size={18} />
                </div>
            </div>

            {/* Data Viz */}
            <div
                onClick={() => setMode('data-viz')}
                className="group cursor-pointer bg-white/60 backdrop-blur-md border-2 border-stone-200 rounded-3xl p-8 hover:border-blue-500 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
            >
                <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center text-blue-600 mb-6 group-hover:scale-110 transition-transform">
                    <BarChart3 size={32} />
                </div>
                <h3 className="text-2xl font-bold text-stone-800 mb-3 font-serif">诗词数据</h3>
                <p className="text-stone-500 mb-6 leading-relaxed">
                    唐宋诗人分布，高频意象统计。<br />
                    数据可视化，探索诗词奥秘。
                </p>
                <div className="flex items-center text-blue-600 font-bold group-hover:gap-2 transition-all">
                    <span>查看数据</span>
                    <ArrowRight size={18} />
                </div>
            </div>

            {/* Fei Hua Ling (Flying Flower Order) */}
            <div
                onClick={() => setMode('word-select')}
                className="group cursor-pointer bg-white/60 backdrop-blur-md border-2 border-stone-200 rounded-3xl p-8 hover:border-purple-500 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
            >
                <div className="w-16 h-16 bg-purple-100 rounded-2xl flex items-center justify-center text-purple-600 mb-6 group-hover:scale-110 transition-transform">
                    <Scroll size={32} />
                </div>
                <h3 className="text-2xl font-bold text-stone-800 mb-3 font-serif">飞花令</h3>
                <p className="text-stone-500 mb-6 leading-relaxed">
                    选字接龙，考验诗词储备。<br />
                    以字引诗，感受文字魅力。
                </p>
                <div className="flex items-center text-purple-600 font-bold group-hover:gap-2 transition-all">
                    <span>开始飞花</span>
                    <ArrowRight size={18} />
                </div>
            </div>

            {/* Guessing Game (Coming Soon) */}
            <div className="group relative bg-white/40 backdrop-blur-md border-2 border-stone-200 rounded-3xl p-8 opacity-80 hover:opacity-100 transition-all duration-300">
                <div className="absolute top-4 right-4 bg-stone-200 text-stone-500 text-xs font-bold px-2 py-1 rounded-full">
                    开发中
                </div>
                <div className="w-16 h-16 bg-stone-100 rounded-2xl flex items-center justify-center text-stone-400 mb-6">
                    <HelpCircle size={32} />
                </div>
                <h3 className="text-2xl font-bold text-stone-800 mb-3 font-serif">猜猜呗</h3>
                <p className="text-stone-500 mb-6 leading-relaxed">
                    根据描述猜诗名，<br />
                    考验你的诗词积累。
                </p>
                <div className="flex items-center text-stone-400 font-bold cursor-not-allowed">
                    <span>敬请期待</span>
                </div>
            </div>
        </div>
    );

    const renderDataViz = () => {
        if (!dataStats) return null;

        return (
            <div className="max-w-6xl mx-auto space-y-8 animate-fade-in pb-20">
                <div className="flex items-center gap-4 mb-4">
                    <button onClick={() => setMode('menu')} className="p-2 bg-white rounded-full shadow hover:bg-stone-50 transition-colors">
                        <ChevronLeft size={24} />
                    </button>
                    <h2 className="text-3xl font-bold font-serif text-stone-800">诗词数据洞察</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Tang Authors */}
                    <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-8 shadow-xl border border-stone-200">
                        <h3 className="text-xl font-bold font-serif mb-6 text-stone-800 border-l-4 border-amber-500 pl-3">唐诗三百首诗人收录 TOP 10</h3>
                        <div className="space-y-3">
                            {dataStats.tangAuthors.map(([author, count], idx) => (
                                <div key={author} className="flex items-center gap-4">
                                    <span className="w-6 text-stone-400 font-bold">{idx + 1}</span>
                                    <span className="w-16 font-serif font-bold text-stone-700">{author}</span>
                                    <div className="flex-1 h-3 bg-stone-100 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-amber-500 rounded-full transition-all duration-1000"
                                            style={{ width: `${(count / dataStats.tangAuthors[0][1]) * 100}%` }}
                                        />
                                    </div>
                                    <span className="text-sm text-stone-500 w-8 text-right">{count}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Song Authors */}
                    <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-8 shadow-xl border border-stone-200">
                        <h3 className="text-xl font-bold font-serif mb-6 text-stone-800 border-l-4 border-emerald-500 pl-3">宋词三百首词人收录 TOP 10</h3>
                        <div className="space-y-3">
                            {dataStats.songAuthors.map(([author, count], idx) => (
                                <div key={author} className="flex items-center gap-4">
                                    <span className="w-6 text-stone-400 font-bold">{idx + 1}</span>
                                    <span className="w-16 font-serif font-bold text-stone-700">{author}</span>
                                    <div className="flex-1 h-3 bg-stone-100 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-emerald-500 rounded-full transition-all duration-1000"
                                            style={{ width: `${(count / dataStats.songAuthors[0][1]) * 100}%` }}
                                        />
                                    </div>
                                    <span className="text-sm text-stone-500 w-8 text-right">{count}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Word Cloud (Simple Bar) */}
                <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-8 shadow-xl border border-stone-200">
                    <h3 className="text-xl font-bold font-serif mb-6 text-stone-800 border-l-4 border-blue-500 pl-3">诗词高频字 TOP 20</h3>
                    <div className="flex flex-wrap gap-4 justify-center">
                        {dataStats.topWords.map(([word, count], idx) => (
                            <button
                                key={word}
                                onClick={() => {
                                    setFhlWord(word);
                                    setFhlIndex(0);
                                    setMode('fei-hua-ling');
                                }}
                                className="flex flex-col items-center p-3 bg-stone-50 rounded-xl border border-stone-100 min-w-[80px] hover:bg-amber-50 hover:border-amber-300 hover:scale-105 transition-all cursor-pointer"
                            >
                                <span className="text-2xl font-serif font-bold text-stone-800 mb-1">{word}</span>
                                <span className="text-xs text-stone-500">{count}次</span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Phrase Cloud (High Frequency Words) */}
                <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-8 shadow-xl border border-stone-200">
                    <h3 className="text-xl font-bold font-serif mb-6 text-stone-800 border-l-4 border-purple-500 pl-3">诗词高频词 Top20</h3>
                    <div className="flex flex-wrap gap-4 justify-center">
                        {dataStats.topPhrases.map(([word, count], idx) => (
                            <button
                                key={word}
                                onClick={() => {
                                    setFhlWord(word);
                                    setFhlIndex(0);
                                    setMode('fei-hua-ling');
                                }}
                                className="flex flex-col items-center p-3 bg-stone-50 rounded-xl border border-stone-100 min-w-[80px] hover:bg-purple-50 hover:border-purple-300 hover:scale-105 transition-all cursor-pointer"
                            >
                                <span className="text-2xl font-serif font-bold text-stone-800 mb-1">{word}</span>
                                <span className="text-xs text-stone-500">{count}次</span>
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        );
    };

    const renderFillBlanks = () => {
        if (questions.length === 0) return null;

        if (isSessionFinished) {
            return (
                <div className="max-w-2xl mx-auto bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-stone-200 overflow-hidden animate-slide-up p-12 text-center">
                    <Trophy size={64} className="mx-auto text-amber-500 mb-6 animate-bounce" />
                    <h2 className="text-3xl font-bold text-stone-800 font-serif mb-4">挑战完成！</h2>
                    <p className="text-xl text-stone-600 mb-8">
                        最终得分：<span className="text-4xl font-bold text-amber-600">{score}</span> / 100
                    </p>

                    <div className="space-y-4 mb-8 text-left max-h-60 overflow-y-auto custom-scrollbar p-4 bg-stone-50 rounded-xl">
                        {questions.map((q, idx) => (
                            <div key={q.id} className="flex justify-between items-center border-b border-stone-200 pb-2 last:border-0">
                                <div>
                                    <span className="font-bold text-stone-400 mr-2">{idx + 1}.</span>
                                    <span className="font-serif text-stone-700">{q.poem.title}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    {q.isCorrect ? <CheckCircle2 size={16} className="text-green-500" /> : <XCircle size={16} className="text-red-500" />}
                                    {!q.isCorrect && (
                                        <button
                                            onClick={() => onGoToPoem?.(q.poem.id)}
                                            className="text-xs bg-stone-200 hover:bg-stone-300 px-2 py-1 rounded text-stone-600 flex items-center gap-1"
                                        >
                                            <BookOpen size={12} /> 复习
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="flex justify-center gap-4">
                        <button
                            onClick={() => setMode('menu')}
                            className="px-6 py-3 border border-stone-300 rounded-full text-stone-600 hover:bg-stone-100 transition-all"
                        >
                            返回菜单
                        </button>
                        <button
                            onClick={startNewSession}
                            className="px-6 py-3 bg-amber-600 text-white rounded-full hover:bg-amber-700 transition-all shadow-lg"
                        >
                            再来一局
                        </button>
                    </div>
                </div>
            );
        }

        const currentQ = questions[currentQuestionIndex];
        const isAnswered = !!currentQ.userAnswer;

        return (
            <div className="max-w-2xl mx-auto bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-stone-200 overflow-hidden animate-slide-up">
                {/* Header */}
                <div className="bg-stone-100 p-4 md:p-6 flex justify-between items-center border-b border-stone-200">
                    <button onClick={() => setMode('menu')} className="text-stone-500 hover:text-stone-800 font-bold flex items-center gap-2 text-sm md:text-base">
                        ← 退出
                    </button>
                    <div className="font-serif text-base md:text-lg text-stone-600">
                        第 {currentQuestionIndex + 1} / 10 题
                    </div>
                    <div className="flex items-center gap-2 text-amber-600 font-bold text-lg md:text-xl">
                        <Trophy size={20} />
                        <span>{score}</span>
                    </div>
                </div>

                {/* Question Area - Reduced Padding */}
                <div className="p-6 md:p-8 text-center">
                    <div className="mb-6">
                        <span className="inline-block px-3 py-1 rounded-full bg-stone-100 text-stone-500 text-sm font-serif mb-2">
                            {currentQ.poem.dynasty} · {currentQ.poem.author}
                        </span>
                        <h2 className="text-2xl md:text-3xl font-bold text-stone-800 font-serif">{currentQ.poem.title}</h2>
                    </div>

                    <div className="text-2xl md:text-3xl font-serif leading-loose text-stone-800 mb-8">
                        {currentQ.question.split('___').map((part: string, i: number) => (
                            <React.Fragment key={i}>
                                {part}
                                {i === 0 && (
                                    <span className={`inline-block w-12 md:w-16 border-b-4 text-center transition-colors ${isAnswered
                                        ? (currentQ.isCorrect ? 'border-green-500 text-green-600' : 'border-red-500 text-red-600')
                                        : 'border-amber-500 text-amber-600'
                                        }`}>
                                        {isAnswered ? currentQ.answer : '?'}
                                    </span>
                                )}
                            </React.Fragment>
                        ))}
                    </div>

                    {/* Options Grid */}
                    <div className="grid grid-cols-2 gap-4 mb-6">
                        {currentQ.options.map((option: string, idx: number) => (
                            <button
                                key={idx}
                                onClick={() => handleAnswer(option)}
                                disabled={isAnswered}
                                className={`
                  p-3 md:p-4 rounded-xl text-xl md:text-2xl font-serif font-bold transition-all transform 
                  ${isAnswered
                                        ? (option === currentQ.answer
                                            ? 'bg-green-100 text-green-700 border-2 border-green-500'
                                            : (option === currentQ.userAnswer ? 'bg-red-100 text-red-700 border-2 border-red-500' : 'bg-stone-100 text-stone-400'))
                                        : 'bg-white border-2 border-stone-200 hover:border-amber-500 hover:shadow-md text-stone-700 hover:scale-105 active:scale-95'}
                `}
                            >
                                {option}
                            </button>
                        ))}
                    </div>

                    {/* Navigation Controls */}
                    <div className="flex justify-between items-center pt-4 border-t border-stone-100">
                        <button
                            onClick={prevQuestion}
                            disabled={currentQuestionIndex === 0}
                            className="flex items-center gap-2 px-3 py-2 text-stone-500 hover:text-stone-800 disabled:opacity-30 disabled:cursor-not-allowed text-sm md:text-base"
                        >
                            <ChevronLeft size={18} /> 上一题
                        </button>

                        {isAnswered && (
                            <div className={`font-bold text-sm md:text-base ${currentQ.isCorrect ? 'text-green-600' : 'text-red-500'}`}>
                                {currentQ.isCorrect ? '回答正确！' : '回答错误'}
                            </div>
                        )}

                        <button
                            onClick={nextQuestion}
                            disabled={!isAnswered}
                            className="flex items-center gap-2 px-4 md:px-6 py-2 bg-stone-800 text-white rounded-full hover:bg-black disabled:opacity-30 disabled:cursor-not-allowed transition-all text-sm md:text-base"
                        >
                            {currentQuestionIndex === questions.length - 1 ? '查看结果' : '下一题'} <ChevronRight size={18} />
                        </button>
                    </div>
                </div>
            </div>
        );
    };

    const renderFeiHuaLing = () => {
        if (!fhlWord) return null;

        const matchingPoems = poems.filter(p =>
            p.content.some(line => line.includes(fhlWord))
        );

        const currentPoem = matchingPoems[fhlIndex];

        return (
            <div className="max-w-4xl mx-auto animate-fade-in pb-20">
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-4">
                        <button onClick={() => setMode('word-select')} className="p-2 bg-white rounded-full shadow hover:bg-stone-50 transition-colors">
                            <ChevronLeft size={24} />
                        </button>
                        <div>
                            <h2 className="text-3xl font-bold font-serif text-stone-800 flex items-center gap-2">
                                飞花令 <span className="text-amber-600 text-4xl">「{fhlWord}」</span>
                            </h2>
                            <p className="text-stone-500 text-sm mt-1">共找到 {matchingPoems.length} 首相关诗词</p>
                        </div>
                    </div>
                    <div className="text-xl font-serif font-bold text-stone-400">
                        {fhlIndex + 1} / {matchingPoems.length}
                    </div>
                </div>

                {currentPoem && (
                    <div className="flex flex-col items-center">
                        <div className="w-full max-w-md mb-8 transform transition-all duration-500">
                            <PoemCard
                                poem={currentPoem}
                                index={fhlIndex}
                                highlightWord={fhlWord}
                                variant="vertical"
                                onClick={() => onPoemClick?.(currentPoem, matchingPoems)}
                            />
                        </div>

                        <div className="flex items-center gap-6">
                            <button
                                onClick={() => setFhlIndex(prev => Math.max(0, prev - 1))}
                                disabled={fhlIndex === 0}
                                className="p-4 bg-white rounded-full shadow-lg hover:bg-stone-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                            >
                                <ChevronLeft size={24} />
                            </button>
                            <button
                                onClick={() => setFhlIndex(prev => Math.min(matchingPoems.length - 1, prev + 1))}
                                disabled={fhlIndex === matchingPoems.length - 1}
                                className="p-4 bg-stone-800 text-white rounded-full shadow-lg hover:bg-black disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                            >
                                <ChevronRight size={24} />
                            </button>
                        </div>
                    </div>
                )}
            </div>
        );
    };

    const renderWordSelection = () => {
        if (!dataStats) return null;

        return (
            <div className="max-w-4xl mx-auto animate-fade-in pb-20">
                <div className="flex items-center gap-4 mb-8">
                    <button onClick={() => setMode('menu')} className="p-2 bg-white rounded-full shadow hover:bg-stone-50 transition-colors">
                        <ChevronLeft size={24} />
                    </button>
                    <div>
                        <h2 className="text-3xl font-bold font-serif text-stone-800">飞花令</h2>
                        <p className="text-stone-500 text-sm mt-1">点击选择，开始诗词接龙</p>
                    </div>
                </div>

                <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-8 shadow-xl border border-stone-200 mb-8">
                    <h3 className="text-xl font-bold font-serif mb-6 text-stone-800 border-l-4 border-purple-500 pl-3">高频字</h3>
                    <div className="flex flex-wrap gap-4 justify-center">
                        {dataStats.topWords.map(([word, count], idx) => (
                            <button
                                key={word}
                                onClick={() => {
                                    setFhlWord(word);
                                    setFhlIndex(0);
                                    setMode('fei-hua-ling');
                                }}
                                className="flex flex-col items-center p-4 bg-stone-50 rounded-xl border border-stone-100 min-w-[100px] hover:bg-purple-50 hover:border-purple-300 hover:scale-105 transition-all cursor-pointer group"
                            >
                                <span className="text-3xl font-serif font-bold text-stone-800 mb-2 group-hover:text-purple-700">{word}</span>
                                <span className="text-xs text-stone-500 group-hover:text-purple-500">{count}次</span>
                            </button>
                        ))}
                    </div>
                </div>

                <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-8 shadow-xl border border-stone-200">
                    <h3 className="text-xl font-bold font-serif mb-6 text-stone-800 border-l-4 border-pink-500 pl-3">高频词</h3>
                    <div className="flex flex-wrap gap-4 justify-center">
                        {dataStats.topPhrases.map(([word, count], idx) => (
                            <button
                                key={word}
                                onClick={() => {
                                    setFhlWord(word);
                                    setFhlIndex(0);
                                    setMode('fei-hua-ling');
                                }}
                                className="flex flex-col items-center p-4 bg-stone-50 rounded-xl border border-stone-100 min-w-[100px] hover:bg-pink-50 hover:border-pink-300 hover:scale-105 transition-all cursor-pointer group"
                            >
                                <span className="text-2xl font-serif font-bold text-stone-800 mb-2 group-hover:text-pink-700">{word}</span>
                                <span className="text-xs text-stone-500 group-hover:text-pink-500">{count}次</span>
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="min-h-full p-8 animate-fade-in">
            <div className="text-center mb-6">
                <h2 className="text-4xl font-bold text-stone-800 mb-3 font-serif" style={{ fontFamily: '"Ma Shan Zheng", cursive' }}>
                    趣游雅集
                </h2>
                <p className="text-stone-500 font-serif">寓教于乐，在游戏中感悟诗词之美</p>
            </div>

            {mode === 'menu' && renderMenu()}
            {mode === 'fill-blanks' && renderFillBlanks()}
            {mode === 'painting-realm' && <PaintingRealm onExit={() => setMode('menu')} customPoems={customPoems} />}
            {mode === 'data-viz' && renderDataViz()}
            {mode === 'word-select' && renderWordSelection()}
            {mode === 'fei-hua-ling' && renderFeiHuaLing()}
            {mode === 'couplet' && <CoupletGame onExit={() => setMode('menu')} />}
        </div>
    );
};

export default FunGames;

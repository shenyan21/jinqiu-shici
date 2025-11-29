import React, { useState, useEffect, useMemo } from 'react';
import { ChevronLeft, Trophy, ArrowRight, RefreshCw, HelpCircle, CheckCircle2, XCircle } from 'lucide-react';

interface CoupletGameProps {
    onExit: () => void;
}

interface Question {
    id: number;
    originalText: string;
    questionText: string[]; // Array of chars, blanks are placeholders
    blanks: { index: number; char: string }[]; // Correct answers
    options: string[]; // 12 options
    userAnswers: (string | null)[]; // User's filled answers corresponding to blanks
    isCorrect?: boolean;
    isAnswered: boolean;
}

const CoupletGame: React.FC<CoupletGameProps> = ({ onExit }) => {
    const [loading, setLoading] = useState(true);
    const [couplets, setCouplets] = useState<string[]>([]);
    const [questions, setQuestions] = useState<Question[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [score, setScore] = useState(0);
    const [isSessionFinished, setIsSessionFinished] = useState(false);

    // Load and parse data
    useEffect(() => {
        fetch('/data/raw.txt')
            .then(res => res.text())
            .then(text => {
                // Parse text: split by punctuation, keep segments with "对"
                const segments = text.split(/[，。；\n\r]/)
                    .map(s => s.trim())
                    .filter(s => s.includes('对') && s.length >= 3); // Basic validation
                setCouplets(segments);
                setLoading(false);
                startNewSession(segments);
            })
            .catch(err => {
                console.error("Failed to load couplet data:", err);
                setLoading(false);
            });
    }, []);

    const startNewSession = (sourceCouplets: string[] = couplets) => {
        if (sourceCouplets.length === 0) return;

        const newQuestions: Question[] = [];
        const usedIndices = new Set<number>();

        while (newQuestions.length < 10 && usedIndices.size < sourceCouplets.length) {
            const idx = Math.floor(Math.random() * sourceCouplets.length);
            if (usedIndices.has(idx)) continue;
            usedIndices.add(idx);

            const originalText = sourceCouplets[idx];
            const duIndex = originalText.indexOf('对');

            if (duIndex === -1) continue; // Should be filtered already, but safe check

            // Identify valid indices
            const leftIndices = Array.from({ length: duIndex }, (_, i) => i);
            const rightIndices = Array.from({ length: originalText.length - 1 - duIndex }, (_, i) => i + duIndex + 1);
            const allValidIndices = [...leftIndices, ...rightIndices];

            // Identify valid pairs (contiguous)
            const pairs: number[][] = [];
            // Left pairs
            for (let i = 0; i < leftIndices.length - 1; i++) {
                pairs.push([leftIndices[i], leftIndices[i + 1]]);
            }
            // Right pairs
            for (let i = 0; i < rightIndices.length - 1; i++) {
                pairs.push([rightIndices[i], rightIndices[i + 1]]);
            }

            let chosenIndices: number[] = [];

            // Decide 1 or 2 blanks
            // If no pairs (e.g. "云对雨"), must be 1 blank
            if (pairs.length === 0) {
                const randIdx = allValidIndices[Math.floor(Math.random() * allValidIndices.length)];
                chosenIndices = [randIdx];
            } else {
                // 50% chance for 2 blanks if available
                if (Math.random() > 0.5) {
                    const randPair = pairs[Math.floor(Math.random() * pairs.length)];
                    chosenIndices = randPair;
                } else {
                    const randIdx = allValidIndices[Math.floor(Math.random() * allValidIndices.length)];
                    chosenIndices = [randIdx];
                }
            }

            chosenIndices.sort((a, b) => a - b);

            // Create question text array
            const questionText = originalText.split('');
            const blanks = chosenIndices.map(i => ({ index: i, char: originalText[i] }));

            // Generate options
            const correctChars = blanks.map(b => b.char);
            const optionsSet = new Set<string>(correctChars);

            // Add distractors
            let attempts = 0;
            while (optionsSet.size < 12 && attempts < 100) {
                const randomCouplet = sourceCouplets[Math.floor(Math.random() * sourceCouplets.length)];
                const randomChar = randomCouplet[Math.floor(Math.random() * randomCouplet.length)];
                if (randomChar !== '对' && /[\u4e00-\u9fa5]/.test(randomChar)) {
                    optionsSet.add(randomChar);
                }
                attempts++;
            }

            const options = Array.from(optionsSet).sort(() => Math.random() - 0.5);

            newQuestions.push({
                id: Date.now() + newQuestions.length,
                originalText,
                questionText,
                blanks,
                options,
                userAnswers: new Array(blanks.length).fill(null),
                isAnswered: false
            });
        }

        setQuestions(newQuestions);
        setCurrentIndex(0);
        setScore(0);
        setIsSessionFinished(false);
    };



    // Load and parse data

    const handleOptionClick = (char: string) => {
        const currentQ = questions[currentIndex];
        if (currentQ.isAnswered) return;

        // Find first empty blank
        const emptyIndex = currentQ.userAnswers.findIndex(a => a === null);
        if (emptyIndex === -1) return; // All filled

        const newAnswers = [...currentQ.userAnswers];
        newAnswers[emptyIndex] = char;

        const updatedQ = { ...currentQ, userAnswers: newAnswers };

        // Check if all filled
        if (newAnswers.every(a => a !== null)) {
            // Auto check answer
            const isCorrect = newAnswers.every((ans, i) => ans === currentQ.blanks[i].char);
            updatedQ.isAnswered = true;
            updatedQ.isCorrect = isCorrect;

            if (isCorrect) {
                setScore(s => s + 10);
            }
        }

        const newQuestions = [...questions];
        newQuestions[currentIndex] = updatedQ;
        setQuestions(newQuestions);
    };

    const handleBlankClick = (blankIndex: number) => {
        const currentQ = questions[currentIndex];
        if (currentQ.isAnswered) return;

        const newAnswers = [...currentQ.userAnswers];
        newAnswers[blankIndex] = null;

        const newQuestions = [...questions];
        newQuestions[currentIndex] = { ...currentQ, userAnswers: newAnswers };
        setQuestions(newQuestions);
    };

    const nextQuestion = () => {
        if (currentIndex < questions.length - 1) {
            setCurrentIndex(prev => prev + 1);
        } else {
            setIsSessionFinished(true);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600"></div>
            </div>
        );
    }

    if (isSessionFinished) {
        return (
            <div className="max-w-2xl mx-auto bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-stone-200 overflow-hidden animate-slide-up p-12 text-center mt-10">
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
                                <span className="font-serif text-stone-700">{q.originalText}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                {q.isCorrect ? <CheckCircle2 size={16} className="text-green-500" /> : <XCircle size={16} className="text-red-500" />}
                            </div>
                        </div>
                    ))}
                </div>

                <div className="flex justify-center gap-4">
                    <button
                        onClick={onExit}
                        className="px-6 py-3 border border-stone-300 rounded-full text-stone-600 hover:bg-stone-100 transition-all"
                    >
                        返回菜单
                    </button>
                    <button
                        onClick={() => startNewSession()}
                        className="px-6 py-3 bg-amber-600 text-white rounded-full hover:bg-amber-700 transition-all shadow-lg"
                    >
                        再来一局
                    </button>
                </div>
            </div>
        );
    }

    const currentQ = questions[currentIndex];
    return (
        <div className="max-w-2xl mx-auto bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-stone-200 overflow-hidden animate-slide-up mt-4">
            {/* Header */}
            <div className="bg-stone-100 p-4 md:p-6 flex justify-between items-center border-b border-stone-200">
                <button onClick={onExit} className="text-stone-500 hover:text-stone-800 font-bold flex items-center gap-2 text-sm md:text-base">
                    <ChevronLeft size={20} /> 退出
                </button>
                <div className="font-serif text-base md:text-lg text-stone-600">
                    第 {currentIndex + 1} / 10 题
                </div>
                <div className="flex items-center gap-2 text-amber-600 font-bold text-lg md:text-xl">
                    <Trophy size={20} />
                    <span>{score}</span>
                </div>
            </div>

            {/* Question Area */}
            <div className="p-8 md:p-12 text-center">
                <div className="mb-8">
                    <span className="inline-block px-3 py-1 rounded-full bg-stone-100 text-stone-500 text-sm font-serif mb-4">
                        来源《声律启蒙》
                    </span>
                    <h2 className="text-3xl md:text-4xl font-bold font-serif text-stone-800 tracking-widest leading-relaxed">
                        {currentQ.questionText.map((char, idx) => {
                            const blankIndex = currentQ.blanks.findIndex(b => b.index === idx);
                            if (blankIndex !== -1) {
                                // It's a blank
                                const userAnswer = currentQ.userAnswers[blankIndex];
                                return (
                                    <span
                                        key={idx}
                                        onClick={() => handleBlankClick(blankIndex)}
                                        className={`inline-flex items-center justify-center w-12 h-12 mx-1 border-b-4 text-2xl cursor-pointer transition-all
                                            ${currentQ.isAnswered
                                                ? (currentQ.isCorrect ? 'border-green-500 text-green-600' : 'border-red-500 text-red-600')
                                                : (userAnswer ? 'border-amber-500 text-stone-800' : 'border-stone-300 text-transparent')
                                            }
                                        `}
                                    >
                                        {userAnswer || (currentQ.isAnswered ? currentQ.blanks[blankIndex].char : '?')}
                                    </span>
                                );
                            }
                            return <span key={idx} className="mx-0.5">{char}</span>;
                        })}
                    </h2>
                </div>

                {/* Options Grid */}
                <div className="grid grid-cols-4 gap-3 md:gap-4 mb-8 max-w-md mx-auto">
                    {currentQ.options.map((option, idx) => {
                        // Check if this option is used in current answers
                        const isSelected = currentQ.userAnswers.includes(option) && !currentQ.isAnswered;

                        return (
                            <button
                                key={idx}
                                onClick={() => handleOptionClick(option)}
                                disabled={currentQ.isAnswered || isSelected}
                                className={`
                                    aspect-square rounded-xl text-xl md:text-2xl font-serif font-bold transition-all transform
                                    ${isSelected
                                        ? 'bg-stone-100 text-stone-300 scale-95'
                                        : 'bg-white border-2 border-stone-200 hover:border-amber-500 hover:shadow-md text-stone-700 hover:scale-105 active:scale-95'
                                    }
                                    ${currentQ.isAnswered ? 'opacity-50 cursor-not-allowed' : ''}
                                `}
                            >
                                {option}
                            </button>
                        );
                    })}
                </div>

                {/* Feedback & Next */}
                <div className="h-24 flex items-center justify-center">
                    {currentQ.isAnswered ? (
                        <div className="flex flex-col items-center gap-2 animate-fade-in">
                            <div className="flex items-center gap-4">
                                <div className={`font-bold text-lg ${currentQ.isCorrect ? 'text-green-600' : 'text-red-500'}`}>
                                    {currentQ.isCorrect ? '对仗工整！' : '还需推敲'}
                                </div>
                                <button
                                    onClick={nextQuestion}
                                    className="px-6 py-2 bg-stone-800 text-white rounded-full hover:bg-black transition-all flex items-center gap-2"
                                >
                                    {currentIndex === questions.length - 1 ? '查看结果' : '下一题'} <ArrowRight size={18} />
                                </button>
                            </div>
                            {!currentQ.isCorrect && (
                                <div className="text-stone-500 font-serif text-sm">
                                    正确答案：<span className="text-green-600 font-bold text-lg">{currentQ.originalText}</span>
                                </div>
                            )}
                        </div>
                    ) : (
                        <p className="text-stone-400 text-sm font-serif">请点击下方字块填空</p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default CoupletGame;

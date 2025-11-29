import React, { useMemo } from 'react';
import { X, Share2, BookOpen, ChevronLeft, ChevronRight, Check } from 'lucide-react';
import { Poem } from '../types';
import { CARD_THEMES, FIGURE_IMAGES } from '../constants';
import { generateAndSharePoemImage } from '../utils/shareHelper';

interface PoemPreviewModalProps {
    poem: Poem | null;
    isOpen: boolean;
    onClose: () => void;
    index: number;
    onNext?: () => void;
    onPrev?: () => void;
    hasNext?: boolean;
    hasPrev?: boolean;
    onAnalyze?: (poem: Poem) => void;
    hideAnalyzeButton?: boolean;
    isCustom?: boolean;
    onAddToLibrary?: (poem: Poem) => void;
    onRemoveFromLibrary?: (poemId: string) => void;
}

const PoemPreviewModal: React.FC<PoemPreviewModalProps> = ({
    poem,
    isOpen,
    onClose,
    index,
    onNext,
    onPrev,
    hasNext,
    hasPrev,
    onAnalyze,
    hideAnalyzeButton,
    isCustom,
    onAddToLibrary,
    onRemoveFromLibrary
}) => {
    const theme = useMemo(() => CARD_THEMES[index % CARD_THEMES.length], [index]);

    const figureImage = useMemo(() => {
        if (!poem) return '';
        let hash = 0;
        for (let i = 0; i < poem.id.length; i++) {
            hash = poem.id.charCodeAt(i) + ((hash << 5) - hash);
        }
        const idx = Math.abs(hash) % FIGURE_IMAGES.length;
        return `/figure/${FIGURE_IMAGES[idx]}`;
    }, [poem]);

    if (!isOpen || !poem) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-8">
            <div
                className="absolute inset-0 bg-stone-900/40 backdrop-blur-sm transition-opacity"
                onClick={onClose}
            />

            {/* Navigation Buttons - Outside Modal */}
            {hasPrev && (
                <button
                    onClick={(e) => { e.stopPropagation(); onPrev?.(); }}
                    className="absolute left-4 md:left-10 z-50 p-3 bg-white/20 hover:bg-white/40 backdrop-blur-md rounded-full text-white transition-all transform hover:scale-110"
                >
                    <ChevronLeft size={32} />
                </button>
            )}

            {hasNext && (
                <button
                    onClick={(e) => { e.stopPropagation(); onNext?.(); }}
                    className="absolute right-4 md:right-10 z-50 p-3 bg-white/20 hover:bg-white/40 backdrop-blur-md rounded-full text-white transition-all transform hover:scale-110"
                >
                    <ChevronRight size={32} />
                </button>
            )}

            <div className="relative w-full max-w-4xl h-[85vh] bg-[#fdfbf7] rounded-3xl shadow-2xl overflow-hidden flex flex-col md:flex-row animate-scale-in">

                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 z-20 p-2 bg-black/5 hover:bg-black/10 rounded-full transition-colors"
                >
                    <X size={20} className="text-stone-600" />
                </button>

                {/* Left Side - Visual */}
                <div className={`relative w-full md:w-2/5 h-48 md:h-full overflow-hidden ${theme.bg} transition-colors duration-500`}>
                    {/* Decorative Background Elements (Matching Card) */}
                    <div className={`absolute -top-20 -right-20 w-64 h-64 opacity-10 rounded-full bg-current ${theme.title} blur-3xl pointer-events-none`} />
                    <img
                        src={figureImage}
                        alt="Decorative Figure"
                        className="absolute -bottom-10 -right-10 w-48 h-48 object-contain opacity-20 mix-blend-multiply pointer-events-none z-0"
                    />

                    <div className="relative z-10 h-full flex flex-col justify-center items-center p-8 text-center">
                        <div className={`w-16 h-1 bg-current ${theme.title} mb-6 opacity-50`} />
                        <h2 className={`text-3xl md:text-4xl font-bold font-serif mb-4 ${theme.title} drop-shadow-sm`}>
                            {poem.title}
                        </h2>
                        <p className={`text-lg md:text-xl font-serif opacity-80 ${theme.text}`}>
                            [{poem.dynasty}] {poem.author}
                        </p>
                        <div className={`w-1 h-16 bg-current ${theme.title} mt-6 opacity-50`} />
                    </div>
                </div>

                {/* Right Side - Content */}
                <div className="flex-1 h-full flex flex-col bg-[#fdfbf7]">
                    {/* Scrollable Content */}
                    <div className="flex-1 overflow-y-auto custom-scrollbar p-8 md:p-12 space-y-8">
                        {/* Poem Content */}
                        <div className="space-y-4 text-center">
                            {poem.content.map((line, i) => (
                                <p key={i} className="text-xl md:text-2xl font-serif text-stone-800 leading-loose tracking-wider">
                                    {line}
                                </p>
                            ))}
                        </div>


                    </div>

                    {/* Fixed Footer Actions */}
                    <div className="p-6 border-t border-stone-100 bg-white/50 backdrop-blur-sm">
                        <div className="flex gap-4">
                            {!hideAnalyzeButton && (
                                <button
                                    onClick={() => onAnalyze?.(poem)}
                                    className="flex-1 flex items-center justify-center gap-2 py-3 border border-stone-200 rounded-xl hover:bg-stone-50 hover:border-stone-300 transition-all text-stone-600 font-serif"
                                >
                                    <BookOpen size={18} />
                                    <span>AI 赏析</span>
                                </button>
                            )}

                            {onAddToLibrary && (
                                <button
                                    onClick={() => isCustom ? onRemoveFromLibrary?.(poem.id) : onAddToLibrary(poem)}
                                    className={`flex-1 flex items-center justify-center gap-2 py-3 border rounded-xl transition-all font-serif
                                        ${isCustom
                                            ? 'border-amber-200 bg-amber-100 text-amber-800 hover:bg-amber-200'
                                            : 'border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100'
                                        }`}
                                >
                                    {isCustom ? <Check size={18} /> : <BookOpen size={18} className="rotate-0" />}
                                    <span>{isCustom ? '已加入个性化' : '加入个性化'}</span>
                                </button>
                            )}

                            <button
                                onClick={() => generateAndSharePoemImage(poem, index)}
                                className={`flex-1 flex items-center justify-center gap-2 py-3 bg-stone-800 text-amber-50 rounded-xl hover:bg-stone-700 transition-all shadow-md hover:shadow-lg font-serif`}
                            >
                                <Share2 size={18} />
                                <span>分享卡片</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div >
    );
};

export default PoemPreviewModal;

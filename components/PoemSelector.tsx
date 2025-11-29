import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { X, ChevronRight } from 'lucide-react';
import Library, { CATEGORIES, Category } from './Library';
import { Poem } from '../types';

interface PoemSelectorProps {
    onSelect: (poem: Poem) => void;
    onClose: () => void;
    customPoems: Poem[];
}

const PoemSelector: React.FC<PoemSelectorProps> = ({ onSelect, onClose, customPoems }) => {
    const [activeCategory, setActiveCategory] = useState<Category>('tang-300');

    return createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8 bg-stone-900/40 backdrop-blur-sm animate-fade-in">
            <div className="bg-[#fdfbf7] w-full max-w-6xl h-[85vh] rounded-3xl shadow-2xl overflow-hidden flex relative">
                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 z-50 p-2 bg-black/5 hover:bg-black/10 rounded-full transition-colors"
                >
                    <X size={20} className="text-stone-600" />
                </button>

                {/* Sidebar */}
                <div className="w-48 bg-stone-100 border-r border-stone-200 flex flex-col shrink-0">
                    <div className="p-6 border-b border-stone-200">
                        <h2 className="text-xl font-bold font-serif text-stone-800">选择诗词</h2>
                    </div>
                    <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar">
                        {CATEGORIES.map(cat => (
                            <button
                                key={cat.id}
                                onClick={() => setActiveCategory(cat.id)}
                                className={`w-full text-left px-4 py-3 rounded-xl transition-all flex items-center justify-between group
                                    ${activeCategory === cat.id
                                        ? 'bg-white text-amber-600 shadow-sm font-bold'
                                        : 'text-stone-500 hover:bg-stone-200 hover:text-stone-800'
                                    }`}
                            >
                                <span className="font-serif">{cat.name}</span>
                                {activeCategory === cat.id && <ChevronRight size={16} />}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Main Content */}
                <div className="flex-1 relative overflow-hidden">
                    <Library
                        activeCategory={activeCategory}
                        customPoems={customPoems}
                        onPreview={() => { }}
                        onAnalyze={() => { }}
                        addToLibrary={() => { }}
                        onRemoveFromLibrary={() => { }}
                        mode="selection"
                        onSelect={onSelect}

                    />
                </div>
            </div>
        </div>,
        document.body
    );
};

export default PoemSelector;

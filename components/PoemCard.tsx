import React, { useState, useMemo } from 'react';
import { Poem } from '../types';
import { BookOpen, Share2, X, Plus } from 'lucide-react';
import { CARD_THEMES, FIGURE_IMAGES } from '../constants';
import { generateAndSharePoemImage } from '../utils/shareHelper';

interface PoemCardProps {
  poem: Poem;
  onAnalyze?: (poem: Poem) => void;
  onClick?: (poem: Poem) => void;
  variant?: 'vertical' | 'horizontal';
  index: number; // For determining theme color
  highlightWord?: string;
  maxLines?: number;
  onRemove?: (poem: Poem) => void;
  onAdd?: (poem: Poem) => void;
  hideActions?: boolean;
}

const PoemCard: React.FC<PoemCardProps> = ({ poem, onAnalyze, onClick, variant = 'vertical', index, highlightWord, maxLines = 4, onRemove, onAdd, hideActions }) => {
  const [isHovered, setIsHovered] = useState(false);

  // Cycle through themes based on index
  const theme = CARD_THEMES[index % CARD_THEMES.length];

  // Deterministically select a figure image based on the poem ID
  // Uses the FIGURE_IMAGES list from constants
  const figureImage = useMemo(() => {
    let hash = 0;
    for (let i = 0; i < poem.id.length; i++) {
      hash = poem.id.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash) % FIGURE_IMAGES.length;
    return `/figure/${FIGURE_IMAGES[index]}`;
  }, [poem.id]);

  const displayContent = maxLines ? poem.content.slice(0, maxLines) : poem.content;

  return (
    <div
      className={`
        relative group overflow-hidden 
        ${theme.bg} backdrop-blur-md 
        border-l-4 ${theme.border} 
        rounded-r-lg shadow-lg 
        transition-all duration-500 ease-out
        hover:shadow-2xl hover:-translate-y-1 hover:scale-[1.01]
        flex flex-col cursor-pointer
        ${variant === 'vertical' ? 'min-h-[260px]' : 'h-auto'}
      `}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => onClick && onClick(poem)}
    >
      {/* Remove Button for Custom Poems */}
      {onRemove && (
        <button
          onClick={(e) => { e.stopPropagation(); onRemove(poem); }}
          className="absolute top-2 right-2 z-30 p-1.5 bg-black/5 hover:bg-red-500 hover:text-white rounded-full transition-all opacity-0 group-hover:opacity-100"
          title="从个性化藏书中移除"
        >
          <X size={14} />
        </button>
      )}

      {/* Decorative Background Elements */}
      <div className={`absolute -top-10 -right-10 w-32 h-32 opacity-10 rounded-full bg-current ${theme.title} blur-2xl pointer-events-none transition-transform duration-700 group-hover:scale-110`} />

      {/* Dynamic Figure Image (Bottom Right) */}
      <img
        src={figureImage}
        alt="Decorative Figure"
        className="absolute -bottom-2 -right-2 w-20 h-20 object-contain opacity-50 mix-blend-multiply pointer-events-none transition-transform duration-700 group-hover:scale-110 group-hover:-rotate-6 z-0"
        onError={(e) => {
          // Fallback if image fails to load, just hide it
          e.currentTarget.style.display = 'none';
        }}
      />

      {/* Card Content */}
      <div className="p-4 flex-1 flex flex-col items-center justify-between text-center z-10 relative">

        {/* Header - Compact */}
        <div className={`w-full border-b pb-2 mb-2 border-current/20 ${theme.text} flex flex-col items-center`}>
          <h3 className={`text-lg font-bold font-serif tracking-wide ${theme.title} drop-shadow-sm mb-1 truncate max-w-full`}>
            {poem.title}
          </h3>
          <div className={`text-xs opacity-80 font-serif tracking-wider`}>
            {poem.dynasty} · {poem.author}
          </div>
        </div>

        {/* Body - Vertical Layout - Compact */}
        <div className={`flex-1 w-full flex ${variant === 'vertical' ? 'justify-start' : 'justify-center'} py-1 overflow-x-auto custom-scrollbar`}>
          <div className={`text-sm leading-loose font-serif whitespace-pre-wrap ${theme.text}
              ${variant === 'vertical' ? 'writing-vertical-rl text-left h-[160px]' : 'text-center'}
           `}>
            {displayContent.map((line, idx) => (
              <p key={idx} className={`
                 ${variant === 'vertical' ? 'my-1 mx-1' : 'my-1'} 
                 transition-opacity duration-700
                 ${isHovered ? 'opacity-100' : 'opacity-85'}
               `}>
                {highlightWord ? (
                  line.split(new RegExp(`(${highlightWord})`, 'g')).map((part, i) =>
                    part === highlightWord ? <span key={i} className="text-amber-600 font-bold scale-110 inline-block">{part}</span> : part
                  )
                ) : line}
              </p>
            ))}
            {maxLines && poem.content.length > maxLines && (
              <p className="text-xs opacity-50 my-1">...</p>
            )}
          </div>
        </div>

        {/* Footer / Tags - Compact */}
        <div className={`w-full mt-2 pt-2 border-t border-current/20 flex justify-between items-center text-xs ${theme.text} relative z-20`}>
          <div />

          {/* Action Buttons - Compact */}
          {!hideActions && (
            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300 transform translate-y-1 group-hover:translate-y-0">
              {onAnalyze && (
                <button
                  onClick={(e) => { e.stopPropagation(); onAnalyze(poem); }}
                  className="p-1.5 bg-white/50 hover:bg-white/80 rounded-full transition-colors backdrop-blur-sm shadow-sm text-stone-700"
                  title="赏析 (Analyze)"
                >
                  <BookOpen size={14} />
                </button>
              )}
              {onAdd && (
                <button
                  onClick={(e) => { e.stopPropagation(); onAdd(poem); }}
                  className="p-1.5 bg-white/50 hover:bg-white/80 rounded-full transition-colors backdrop-blur-sm shadow-sm text-stone-700"
                  title="加入个性化 (Add to Library)"
                >
                  <Plus size={14} />
                </button>
              )}
              <button
                onClick={(e) => { e.stopPropagation(); generateAndSharePoemImage(poem, index); }}
                className="p-1.5 bg-white/50 hover:bg-white/80 rounded-full transition-colors backdrop-blur-sm shadow-sm text-stone-700"
                title="分享 (Share)"
              >
                <Share2 size={14} />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PoemCard;
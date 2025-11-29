import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkBreaks from 'remark-breaks';
import { X } from 'lucide-react';

interface ReadmeModalProps {
    isOpen: boolean;
    onClose: () => void;
    content: string;
    title: string;
}

const ReadmeModal: React.FC<ReadmeModalProps> = ({ isOpen, onClose, content, title }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
            <div
                className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col animate-scale-in"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-stone-100">
                    <h3 className="text-xl font-bold font-serif text-stone-800">{title} - 简介</h3>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-stone-100 rounded-full transition-colors text-stone-500"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                    <div className="prose prose-stone prose-lg max-w-none font-serif">
                        <ReactMarkdown remarkPlugins={[remarkBreaks]}>{content}</ReactMarkdown>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ReadmeModal;

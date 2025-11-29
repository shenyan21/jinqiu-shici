import React, { useState, useEffect, useMemo } from 'react';
import { Search, Loader2, Info, X } from 'lucide-react';
import { Poem } from '../types';
import PoemCard from './PoemCard';
import ReadmeModal from './ReadmeModal';

export type Category = 'tang-300' | 'song-300' | 'shijing' | 'wudai' | 'nalan' | 'shuimotangshi' | 'custom';

export const CATEGORIES: { id: Category; name: string; path?: string; prefix?: string; dynasty: string; readmePath?: string }[] = [
    { id: 'tang-300', name: '唐诗三百首', path: '/data/唐诗三百首/tang_poem.json', dynasty: '唐', readmePath: '/data/唐诗三百首/README.md' },
    { id: 'song-300', name: '宋词三百首', path: '/data/宋词三百首/song_poem.json', dynasty: '宋', readmePath: '/data/宋词三百首/README.md' },
    { id: 'shuimotangshi', name: '水墨唐诗', path: '/data/水墨唐诗/shuimotangshi.json', dynasty: '唐' },
    { id: 'shijing', name: '诗经', path: '/data/诗经', prefix: 'shijing', dynasty: '先秦', readmePath: '/data/诗经/README.md' },
    { id: 'wudai', name: '五代诗词', path: '/data/五代诗词/nantang/poetrys.json', dynasty: '五代', readmePath: '/data/五代诗词/README.md' },
    { id: 'nalan', name: '纳兰性德', path: '/data/纳兰性德/纳兰性德诗集.json', dynasty: '清', readmePath: '/data/纳兰性德/README.md' },
    { id: 'custom', name: '个性化', dynasty: '今' },
];

const HUAJIANJI_FILES = [
    'huajianji-1-juan.json',
    'huajianji-2-juan.json',
    'huajianji-3-juan.json',
    'huajianji-4-juan.json',
    'huajianji-5-juan.json',
    'huajianji-6-juan.json',
    'huajianji-7-juan.json',
    'huajianji-8-juan.json',
    'huajianji-9-juan.json',
    'huajianji-x-juan.json'
];

const PAGE_SIZE = 200;

interface LibraryProps {
    activeCategory: Category;
    onPreview: (poem: Poem, context: Poem[]) => void;
    onAnalyze: (poem: Poem) => void;
    addToLibrary: (poem: Poem) => void;
    customPoems?: Poem[];
    onRemoveFromLibrary?: (poemId: string) => void;
    mode?: 'default' | 'selection';
    onSelect?: (poem: Poem) => void;
}

const Library: React.FC<LibraryProps> = ({
    activeCategory,
    onPreview,
    onAnalyze,
    addToLibrary,
    customPoems = [],
    onRemoveFromLibrary,
    mode = 'default',
    onSelect
}) => {
    const [poems, setPoems] = useState<Poem[]>([]);
    const [displayCount, setDisplayCount] = useState(PAGE_SIZE);
    const [loading, setLoading] = useState(false);
    const [fileIndex, setFileIndex] = useState(0);
    const [hasMore, setHasMore] = useState(true);
    const [filter, setFilter] = useState('');
    const [readmeContent, setReadmeContent] = useState('');
    const [isReadmeOpen, setIsReadmeOpen] = useState(false);

    useEffect(() => {
        setPoems([]);
        setDisplayCount(PAGE_SIZE);
        setFileIndex(0);
        setHasMore(true);

        if (activeCategory !== 'custom') {
            fetchData(activeCategory, 0);
        }
    }, [activeCategory]);

    useEffect(() => {
        if (activeCategory === 'custom') {
            setPoems(customPoems);
            setLoading(false);
            setHasMore(false);
        }
    }, [activeCategory, customPoems]);

    const fetchData = async (category: Category, index: number) => {
        setLoading(true);
        const catConfig = CATEGORIES.find(c => c.id === category);
        if (!catConfig || !catConfig.path) return;

        try {
            // Special handling for Wudai (Nantang + Huajianji)
            if (category === 'wudai') {
                if (index > 0) {
                    setHasMore(false);
                    setLoading(false);
                    return;
                }

                // 1. Fetch Nantang
                const nantangRes = await fetch(catConfig.path!);
                const nantangData = await nantangRes.json();
                let allWudaiPoems = [...nantangData];

                // 2. Fetch Huajianji
                const huajianjiPromises = HUAJIANJI_FILES.map(file =>
                    fetch(`/data/五代诗词/huajianji/${file}`).then(res => res.json())
                );
                const huajianjiDataGroups = await Promise.all(huajianjiPromises);
                huajianjiDataGroups.forEach(group => {
                    allWudaiPoems = [...allWudaiPoems, ...group];
                });

                const newPoems: Poem[] = allWudaiPoems.map((item: any, idx: number) => ({
                    id: `${category}-${idx}`,
                    title: item.title || item.rhythmic || '无题',
                    dynasty: catConfig.dynasty,
                    author: item.author || '佚名',
                    content: item.paragraphs || item.content || item.para || (Array.isArray(item.contents) ? item.contents : (typeof item.contents === 'string' ? item.contents.split('\n') : [])),
                    tags: item.tags || []
                }));

                setPoems(newPoems);
                setHasMore(false);
                return;
            }

            let url = '';
            // Single specific file categories
            if (['tang-300', 'song-300', 'nalan', 'shuimotangshi'].includes(category)) {
                if (index > 0) {
                    setHasMore(false);
                    setLoading(false);
                    return;
                }
                url = catConfig.path!;
            } else if (category === 'shijing') {
                // Single file with prefix pattern
                if (index > 0) {
                    setHasMore(false);
                    setLoading(false);
                    return;
                }
                url = `${catConfig.path}/${catConfig.prefix}.json`;
            } else {
                // Split files (0, 1000, 2000...)
                url = `${catConfig.path}/${catConfig.prefix}.${index}.json`;
            }

            const response = await fetch(url);
            if (!response.ok) {
                setHasMore(false);
                setLoading(false);
                return;
            }

            const data = await response.json();
            const newPoems: Poem[] = data.map((item: any, idx: number) => ({
                id: `${category}-${index}-${idx}`,
                title: item.title || item.rhythmic || '无题',
                dynasty: catConfig.dynasty,
                author: item.author || '佚名',
                content: item.paragraphs || item.content || item.para || (Array.isArray(item.contents) ? item.contents : (typeof item.contents === 'string' ? item.contents.split('\n') : [])),
                tags: item.tags || []
            }));

            if (index === 0) {
                setPoems(newPoems);
            } else {
                setPoems(prev => [...prev, ...newPoems]);
            }

            // If single file, we are done
            if (['tang-300', 'song-300', 'shijing', 'nalan', 'shuimotangshi'].includes(category)) {
                setHasMore(false);
            }

        } catch (error) {
            console.error("Failed to fetch poems:", error);
            setHasMore(false);
        } finally {
            setLoading(false);
        }
    };

    const handleLoadMore = () => {
        const nextCount = displayCount + PAGE_SIZE;
        setDisplayCount(nextCount);

        // If we need more data and haven't finished fetching files
        if (nextCount > poems.length && hasMore) {
            const catConfig = CATEGORIES.find(c => c.id === activeCategory);
            // Only fetch more for split files
            if (catConfig && catConfig.path && !['tang-300', 'song-300', 'shijing', 'wudai', 'nalan', 'shuimotangshi'].includes(activeCategory)) {
                const nextIndex = fileIndex + 1000;
                setFileIndex(nextIndex);
                fetchData(activeCategory, nextIndex);
            }
        }
    };

    const filteredPoems = useMemo(() => {
        if (!filter) return poems;
        return poems.filter(p =>
            p.title.includes(filter) ||
            p.author.includes(filter) ||
            p.content.some(l => l.includes(filter))
        );
    }, [poems, filter]);

    const handleShowReadme = async () => {
        const catConfig = CATEGORIES.find(c => c.id === activeCategory);
        if (catConfig?.readmePath) {
            try {
                const res = await fetch(catConfig.readmePath);
                if (res.ok) {
                    const text = await res.text();
                    setReadmeContent(text);
                    setIsReadmeOpen(true);
                }
            } catch (e) {
                console.error("Failed to load README", e);
            }
        }
    };

    const visiblePoems = filteredPoems.slice(0, displayCount);

    return (
        <div className="flex h-full">
            {/* Main Content */}
            <div className="flex-1 flex flex-col h-full overflow-hidden">
                {/* Header */}
                <header className="px-8 py-6 flex flex-col md:flex-row justify-between items-end md:items-center gap-4 bg-white/60 backdrop-blur-md border-b border-stone-200 z-10">
                    <div>
                        <div className="flex items-center gap-3 mb-1">
                            <h2 className="text-3xl font-bold font-serif text-stone-800">
                                {CATEGORIES.find(c => c.id === activeCategory)?.name}
                            </h2>
                            {CATEGORIES.find(c => c.id === activeCategory)?.readmePath && (
                                <button
                                    onClick={handleShowReadme}
                                    className="p-1.5 text-stone-400 hover:text-amber-600 hover:bg-amber-50 rounded-full transition-all"
                                    title="查看详情"
                                >
                                    <Info size={20} />
                                </button>
                            )}
                        </div>
                        <p className="text-stone-500 text-sm font-serif">
                            {`已收录 ${poems.length} 首`}
                        </p>
                    </div>
                    <div className="relative group flex-1 md:max-w-xs">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-stone-400 group-focus-within:text-amber-600 transition-colors" size={18} />
                        <input
                            type="text"
                            placeholder="在此分类中搜索..."
                            value={filter}
                            onChange={(e) => setFilter(e.target.value)}
                            className="w-full bg-stone-100 border-2 border-transparent rounded-full pl-10 pr-10 py-2 text-sm focus:bg-white focus:border-amber-500 focus:outline-none transition-all shadow-inner"
                        />
                        {filter && (
                            <button
                                onClick={() => setFilter('')}
                                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-stone-400 hover:text-stone-600 p-1 rounded-full hover:bg-stone-200 transition-colors"
                            >
                                <X size={14} />
                            </button>
                        )}
                    </div>
                </header>

                {/* Grid */}
                <div className="flex-1 p-8 overflow-y-auto custom-scrollbar">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pb-10">
                        {visiblePoems.map((poem, idx) => (
                            <div key={poem.id}>
                                <PoemCard
                                    poem={poem}
                                    index={idx}
                                    onAnalyze={mode === 'selection' ? undefined : onAnalyze}
                                    onClick={mode === 'selection' ? onSelect : () => onPreview(poem, filteredPoems)}
                                    onRemove={mode === 'selection' ? undefined : (activeCategory === 'custom' && onRemoveFromLibrary ? () => onRemoveFromLibrary(poem.id) : undefined)}
                                    onAdd={mode === 'selection' ? undefined : (activeCategory !== 'custom' ? addToLibrary : undefined)}
                                    hideActions={mode === 'selection'}
                                />
                            </div>
                        ))}
                    </div>

                    {/* Load More / Loading State */}
                    <div className="py-8 flex justify-center">
                        {loading ? (
                            <div className="flex items-center gap-2 text-stone-500">
                                <Loader2 className="animate-spin" />
                                <span>正在加载...</span>
                            </div>
                        ) : (
                            (hasMore || visiblePoems.length < filteredPoems.length) && (
                                <button
                                    onClick={handleLoadMore}
                                    className="px-6 py-2 bg-stone-200 hover:bg-stone-300 text-stone-700 rounded-full font-serif transition-colors"
                                >
                                    加载更多
                                </button>
                            )
                        )}
                        {!hasMore && !loading && visiblePoems.length >= filteredPoems.length && poems.length > 0 && (
                            <p className="text-stone-400 text-sm font-serif">—— 已显示全部 ——</p>
                        )}
                    </div>
                </div>
            </div>

            <ReadmeModal
                isOpen={isReadmeOpen}
                onClose={() => setIsReadmeOpen(false)}
                content={readmeContent}
                title={CATEGORIES.find(c => c.id === activeCategory)?.name || ''}
            />
        </div>
    );
};

export default Library;

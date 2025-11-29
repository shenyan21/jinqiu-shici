import * as OpenCC from 'opencc-js';
import { Poem } from '../types';
import ALL_SEARCH_FILES from './allSearchFiles.json';

// Type definition for the external data format
interface ExternalPoem {
    author?: string;
    authorName?: string; // New field in source data
    title?: string;
    rhythmic?: string; // For Ci
    paragraphs?: string[];
    content?: string[]; // New field in source data
    prologue?: string;
    tags?: string[];
}

// Simple in-memory cache
const fileCache = new Map<string, ExternalPoem[]>();

// Converters
const converterS2T = OpenCC.Converter({ from: 'cn', to: 'hk' });
const converterT2S = OpenCC.Converter({ from: 'hk', to: 'cn' });

export const searchExternalPoems = async (
    query: string,
    onResult?: (poems: Poem[]) => void
): Promise<Poem[]> => {
    if (!query || query.trim().length < 1) return [];

    // Generate both variants of the query
    const querySimp = converterT2S(query);
    const queryTrad = converterS2T(query);
    const queries = [query, querySimp, queryTrad].filter((v, i, a) => a.indexOf(v) === i); // Unique queries

    const results: Poem[] = [];
    const seen = new Set<string>();

    const addResult = (p: Poem) => {
        if (!seen.has(p.id)) {
            results.push(p);
            seen.add(p.id);
            onResult?.([...results]);
        }
    };



    // 2. Search Medium Datasets (Tang 300, Song 300, Nalan, Five Dynasties)
    const MEDIUM_DATASETS = [
        { file: '/data/唐诗三百首/tang_poem.json', dynasty: '唐', source: '唐诗三百首' },
        { file: '/data/宋词三百首/song_poem.json', dynasty: '宋', source: '宋词三百首' },
        { file: '/data/纳兰性德/纳兰性德诗集.json', dynasty: '清', source: '纳兰性德' },
        { file: '/data/五代诗词/nantang/poetrys.json', dynasty: '五代', source: '五代诗词' },
        ...Array.from({ length: 10 }, (_, i) => ({ file: `/data/五代诗词/huajianji/huajianji-${i + 1}-juan.json`, dynasty: '五代', source: '花间集' }))
    ];

    for (const dataset of MEDIUM_DATASETS) {
        // Removed limit check

        try {
            let data: any[];
            if (fileCache.has(dataset.file)) {
                data = fileCache.get(dataset.file) as any[];
            } else {
                const response = await fetch(dataset.file);
                if (!response.ok) continue;
                data = await response.json();
                fileCache.set(dataset.file, data as any[]);
            }

            for (const p of data) {
                // Removed limit check
                // Normalize Nalan data fields if needed
                const normalizedP: ExternalPoem = {
                    author: p.author || 'Unknown',
                    title: p.title || p.rhythmic,
                    paragraphs: p.paragraphs || p.para || [], // Nalan uses 'para'
                    rhythmic: p.rhythmic,
                    tags: [] // Ensure no tags are passed
                };

                if (isMatch(normalizedP, queries)) {
                    addResult(convertToPoem(normalizedP, dataset.dynasty, dataset.source));
                }
            }
        } catch (e) {
            console.warn(`Failed to search ${dataset.source}`, e);
        }
    }

    // 2. Search Large Datasets (All files in data_base/source)
    // We import the generated file list
    // Note: In a real app, we might want to fetch this list from a static JSON file to avoid bundling it,
    // but for now importing it directly is fine if it's not too huge (1400 entries is fine).
    // However, since we can't easily import a JSON outside of src in Vite without config, 
    // let's assume we fetch it or it's imported.
    // For this environment, let's try to fetch the JSON list if we can't import it easily,
    // OR we can just import it if we configured it.
    // Let's try fetching it as a static asset if we move it to public, OR import it if it's in utils.
    // Since I generated it in utils, I can import it.

    // Dynamic import or require might be needed if strict TS, but let's try standard import at top.
    // Wait, I need to add the import at the top first. 
    // For this replacement, I'll assume the import is added.

    // Actually, let's just fetch the list to be safe and lazy load it.
    // But I generated it in utils, so it's part of source code now.

    const allFiles = ALL_SEARCH_FILES; // We will add this import

    for (const entry of allFiles) {
        // Removed limit check

        try {
            let data: ExternalPoem[];
            const fileUrl = entry.path;

            if (fileCache.has(fileUrl)) {
                data = fileCache.get(fileUrl)!;
            } else {
                const response = await fetch(fileUrl);
                if (!response.ok) continue;
                data = await response.json();
                fileCache.set(fileUrl, data);
            }

            for (const p of data) {
                // Removed limit check
                if (isMatch(p, queries)) {
                    addResult(convertToPoem(p, entry.dynasty, `${entry.category}·${entry.dynasty}`));
                }
            }

            // Yield to main thread
            await new Promise(resolve => setTimeout(resolve, 0));

        } catch (err) {
            console.warn(`Failed to search in ${entry.path}`, err);
        }
    }

    return results;
};

const isMatch = (p: ExternalPoem, queries: string[]): boolean => {
    const title = p.title || p.rhythmic || '';
    const author = p.author || p.authorName || '';
    const content = p.paragraphs || p.content || [];
    // Check if ANY of the query variants match
    return queries.some(q =>
        title.includes(q) ||
        author.includes(q) ||
        content.some(l => l.includes(q))
    );
};

const convertToPoem = (p: ExternalPoem, dynasty: string, sourceTag: string): Poem => {
    const title = p.title || p.rhythmic || '无题';
    const author = p.author || p.authorName || 'Unknown';
    const content = p.paragraphs || p.content || [];
    return {
        id: `ext-${sourceTag}-${author}-${title}-${Math.random().toString(36).substr(2, 9)}`,
        title: title,
        author: author,
        dynasty: dynasty,
        content: content,
        tags: [] // Tags removed per user request
    };
};

import { Poem } from '../types';

// Helper to clean and format content
const processContent = (content: string | string[]): string[] => {
    if (Array.isArray(content)) {
        return content;
    }
    return content ? content.split('\n').filter(line => line.trim() !== '') : [];
};

export const loadAllPoems = async (): Promise<Poem[]> => {
    const allPoems: Poem[] = [];
    let idCounter = 1000;

    const fetchTasks = [
        { url: '/data/唐诗三百首/tang_poem.json', type: 'tang', dynasty: '唐' },
        { url: '/data/宋词三百首/song_poem.json', type: 'song', dynasty: '宋' },
        { url: '/data/水墨唐诗/shuimotangshi.json', type: 'shuimo', dynasty: '唐' },
        { url: '/data/纳兰性德/纳兰性德诗集.json', type: 'nalan', dynasty: '清' },
        { url: '/data/五代诗词/nantang/poetrys.json', type: 'nantang', dynasty: '五代' },
        { url: '/data/诗经/shijing.json', type: 'shijing', dynasty: '先秦' },
        // Huajianji volumes 1-5
        ...Array.from({ length: 5 }, (_, i) => ({
            url: `/data/五代诗词/huajianji/huajianji-${i + 1}-juan.json`,
            type: `huajian-${i + 1}`,
            dynasty: '五代'
        }))
    ];

    try {
        const results = await Promise.allSettled(fetchTasks.map(task => fetch(task.url).then(res => {
            if (!res.ok) throw new Error(`Failed to fetch ${task.url}`);
            return res.json().then(data => ({ task, data }));
        })));

        results.forEach(result => {
            if (result.status === 'fulfilled') {
                const { task, data } = result.value;

                if (Array.isArray(data)) {
                    data.forEach((p: any) => {
                        let poem: Poem | null = null;

                        if (task.type === 'tang' || task.type === 'shuimo') {
                            poem = {
                                id: `${task.type}-${p.id || idCounter++}`,
                                title: p.title,
                                author: p.author,
                                dynasty: task.dynasty,
                                content: processContent(p.contents || p.paragraphs),
                                tags: []
                            };
                        } else if (task.type === 'song') {
                            poem = {
                                id: `song-${idCounter++}`,
                                title: p.rhythmic,
                                author: p.author,
                                dynasty: task.dynasty,
                                content: processContent(p.paragraphs),
                                tags: []
                            };
                        } else if (task.type === 'nalan') {
                            poem = {
                                id: `nalan-${idCounter++}`,
                                title: p.title || p.rhythmic || '无题',
                                author: p.author || '纳兰性德',
                                dynasty: task.dynasty,
                                content: processContent(p.para || p.paragraphs),
                                tags: []
                            };
                        } else if (task.type === 'nantang' || task.type.startsWith('huajian')) {
                            poem = {
                                id: `${task.type}-${idCounter++}`,
                                title: p.rhythmic || p.title,
                                author: p.author,
                                dynasty: task.dynasty,
                                content: processContent(p.paragraphs),
                                tags: []
                            };
                        } else if (task.type === 'shijing') {
                            poem = {
                                id: `shijing-${idCounter++}`,
                                title: p.title || (p.chapter + '·' + p.section),
                                author: '佚名',
                                dynasty: task.dynasty,
                                content: processContent(p.content || p.paragraphs),
                                tags: []
                            };
                        }

                        if (poem) allPoems.push(poem);
                    });
                }
            } else {
                console.warn(`Failed to load data:`, result.reason);
            }
        });

    } catch (error) {
        console.error("Failed to load initial poems:", error);
    }

    return allPoems;
};

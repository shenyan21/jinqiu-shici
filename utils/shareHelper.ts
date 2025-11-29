import html2canvas from 'html2canvas';
import { Poem } from '../types';
import { CARD_THEMES, FIGURE_IMAGES } from '../constants';

export const generateAndSharePoemImage = async (poem: Poem, index: number = 0) => {
    // 1. Determine Theme and Figure
    const theme = CARD_THEMES[index % CARD_THEMES.length];

    let hash = 0;
    for (let i = 0; i < poem.id.length; i++) {
        hash = poem.id.charCodeAt(i) + ((hash << 5) - hash);
    }
    const figureIndex = Math.abs(hash) % FIGURE_IMAGES.length;
    const figureImage = `/figure/${FIGURE_IMAGES[figureIndex]}`;

    // 2. Create a container for the capture
    const container = document.createElement('div');
    container.style.position = 'fixed';
    container.style.top = '-9999px';
    container.style.left = '-9999px';
    container.style.width = '600px';
    container.style.zIndex = '99999';

    // 3. Construct the HTML content using Tailwind classes (which will be computed)
    // We use a wrapper div to apply the theme background
    container.innerHTML = `
        <div class="relative overflow-hidden rounded-3xl p-12 ${theme.bg} border-8 ${theme.border} shadow-2xl" style="font-family: 'Noto Serif SC', serif;">
            
            <!-- Decorative Background Elements -->
            <div class="absolute -top-20 -right-20 w-64 h-64 opacity-10 rounded-full bg-current ${theme.title} blur-3xl pointer-events-none"></div>
            
            <!-- Figure Image -->
            <img src="${figureImage}" class="absolute -bottom-10 -right-10 w-48 h-48 object-contain opacity-30 mix-blend-multiply pointer-events-none z-0" crossorigin="anonymous" />

            <!-- Logo Header (Recreated Vector Style) -->
            <div class="flex items-center gap-4 mb-10 relative z-10">
                <div class="w-12 h-12 bg-amber-600 rounded-xl flex items-center justify-center text-white shadow-lg">
                    <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M20.24 12.24a6 6 0 0 0-8.49-8.49L5 10.5V19h8.5z"></path>
                        <line x1="16" y1="8" x2="2" y2="22"></line>
                        <line x1="17.5" y1="15" x2="9" y2="15"></line>
                    </svg>
                </div>
                <div>
                    <h1 class="text-2xl font-bold text-stone-800 tracking-wider" style="font-family: 'Ma Shan Zheng', cursive;">锦秋诗词</h1>
                    <p class="text-xs text-stone-500 uppercase tracking-widest mt-0.5">Jinqiu Poetry</p>
                </div>
            </div>

            <!-- Poem Content -->
            <div class="text-center relative z-10">
                <h1 class="text-4xl font-bold ${theme.title} mb-4 font-serif tracking-wide leading-tight">
                    ${poem.title}
                </h1>
                <div class="text-lg ${theme.text} opacity-80 mb-8 font-serif tracking-widest">
                    ${poem.dynasty} · ${poem.author}
                </div>
                <div class="text-2xl leading-loose ${theme.text} font-serif whitespace-pre-wrap">
                    ${poem.content.map(line => `<p class="mb-2">${line}</p>`).join('')}
                </div>
            </div>

            <!-- Footer -->
            <div class="mt-12 pt-6 border-t border-current opacity-30 flex justify-center items-center gap-2 text-xs ${theme.text}">
                <div class="w-16 h-16 bg-white p-1 rounded-lg shadow-sm">
                     <!-- QR Code Placeholder (Optional) -->
                     <div class="w-full h-full bg-stone-100 flex items-center justify-center text-[8px] text-stone-400 text-center leading-tight">
                        扫码<br>赏析
                     </div>
                </div>
                <div class="text-left">
                    <p class="font-bold">长按识别二维码</p>
                    <p>品读更多诗词</p>
                </div>
            </div>
        </div>
    `;

    document.body.appendChild(container);

    try {
        // Wait for images to load
        await new Promise(resolve => setTimeout(resolve, 500));

        const canvas = await html2canvas(container.firstElementChild as HTMLElement, {
            scale: 2, // High resolution
            useCORS: true,
            backgroundColor: null, // Transparent to let theme bg show
            logging: false,
            allowTaint: true
        });

        const image = canvas.toDataURL('image/png');
        const link = document.createElement('a');
        link.href = image;
        link.download = `锦秋诗词-${poem.title}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

    } catch (error) {
        console.error('Failed to generate image:', error);
        alert('生成图片失败，请重试');
    } finally {
        document.body.removeChild(container);
    }
};

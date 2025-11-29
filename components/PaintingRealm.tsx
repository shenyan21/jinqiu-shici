import React, { useState, useRef, useEffect } from 'react';
import { Download, Type, Palette, Image as ImageIcon, Upload, BookOpen, ChevronLeft } from 'lucide-react';
import { Poem } from '../types';
import PoemSelector from './PoemSelector';

const WALLPAPERS = [
    '0.jpg', '1.jpg', '2.jpg', '3.jpg', '4.jpg', '5.jpg', '6.jpg', '7.jpg', '8.jpg', '9.jpg',
    '11.jpg', '13.jpg', '15.jpg', '16.jpg', '17.jpg', '19.jpg',
    '20.jpg', '21.jpg', '22.jpg', '23.jpg', '25.jpg', '26.jpg', '27.jpg', '28.jpg', '29.jpg',
    '30.jpg', '31.jpg', '32.jpg', '33.jpg', '34.jpg', '35.jpg', '36.jpg', '37.jpg',
    '39.png', '40.jpg'
].map(file => `/wallpaper/${file}`);

interface PaintingRealmProps {
    onExit: () => void;
    customPoems?: Poem[];
}

const PaintingRealm: React.FC<PaintingRealmProps> = ({ onExit, customPoems = [] }) => {
    const [selectedWallpaper, setSelectedWallpaper] = useState(WALLPAPERS[0]);
    const [customWallpaper, setCustomWallpaper] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<'content' | 'style'>('content');
    const [text, setText] = useState('在此输入诗词...');
    const [fontSize, setFontSize] = useState(48);
    const [fontColor, setFontColor] = useState('#333333');
    const [isVertical, setIsVertical] = useState(true);

    // Text Position & Dragging
    const [textPos, setTextPos] = useState({ x: 0.5, y: 0.3 }); // Percentage of canvas width/height
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

    // Shadow Settings
    const [shadowEnabled, setShadowEnabled] = useState(false);
    const [shadow, setShadow] = useState({
        color: '#000000',
        opacity: 0.5,
        blur: 4,
        offsetX: 2,
        offsetY: 2,
        angle: 45,
        distance: 4
    });

    const [showPoemSelect, setShowPoemSelect] = useState(false);

    const canvasRef = useRef<HTMLCanvasElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        drawCanvas();
    }, [selectedWallpaper, customWallpaper, text, fontSize, fontColor, isVertical, textPos, shadow, shadowEnabled]);



    const drawCanvas = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const img = new Image();
        img.src = customWallpaper || selectedWallpaper;
        img.crossOrigin = "anonymous";
        img.onload = () => {
            canvas.width = img.width;
            canvas.height = img.height;

            ctx.drawImage(img, 0, 0);

            ctx.save();

            // Apply Shadow
            if (shadowEnabled) {
                const r = parseInt(shadow.color.slice(1, 3), 16);
                const g = parseInt(shadow.color.slice(3, 5), 16);
                const b = parseInt(shadow.color.slice(5, 7), 16);
                ctx.shadowColor = `rgba(${r}, ${g}, ${b}, ${shadow.opacity})`;
                ctx.shadowBlur = shadow.blur;

                // Calculate offset based on distance and angle
                const rad = (shadow.angle * Math.PI) / 180;
                ctx.shadowOffsetX = shadow.distance * Math.cos(rad);
                ctx.shadowOffsetY = shadow.distance * Math.sin(rad);
            }

            ctx.fillStyle = fontColor;
            ctx.font = `bold ${fontSize * 2}px "Ma Shan Zheng", "KaiTi", serif`;
            ctx.textBaseline = 'top';

            const x = canvas.width * textPos.x;
            const y = canvas.height * textPos.y;

            if (isVertical) {
                drawVerticalText(ctx, text, x, y);
            } else {
                ctx.textAlign = 'center';
                const lines = text.split('\n');
                lines.forEach((line, i) => {
                    ctx.fillText(line, x, y + (i * fontSize * 3));
                });
            }
            ctx.restore();
        };
    };

    const drawVerticalText = (ctx: CanvasRenderingContext2D, text: string, x: number, y: number) => {
        const lineHeight = fontSize * 2.5;
        const colWidth = fontSize * 2.5;
        const lines = text.split('\n').reverse();
        const totalWidth = lines.length * colWidth;
        let startX = x + totalWidth / 2 - colWidth / 2;

        lines.forEach((line) => {
            let currentY = y;
            for (let i = 0; i < line.length; i++) {
                const char = line[i];
                ctx.fillText(char, startX, currentY);
                currentY += lineHeight;
            }
            startX -= colWidth;
        });
    };

    const handleDownload = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const link = document.createElement('a');
        link.download = `painting-realm-${Date.now()}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                if (event.target?.result) {
                    setCustomWallpaper(event.target.result as string);
                }
            };
            reader.readAsDataURL(file);
        }
    };

    // Canvas Interaction for Dragging
    const getCanvasCoordinates = (e: React.MouseEvent | React.TouchEvent) => {
        const canvas = canvasRef.current;
        if (!canvas) return { x: 0, y: 0 };

        const rect = canvas.getBoundingClientRect();
        const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
        const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;

        // Scale coordinates to match canvas internal resolution
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;

        return {
            x: (clientX - rect.left) * scaleX,
            y: (clientY - rect.top) * scaleY
        };
    };

    const handleMouseDown = (e: React.MouseEvent | React.TouchEvent) => {
        setIsDragging(true);
        const coords = getCanvasCoordinates(e);
        setDragStart(coords);
    };

    const handleMouseMove = (e: React.MouseEvent | React.TouchEvent) => {
        if (!isDragging) return;
        const canvas = canvasRef.current;
        if (!canvas) return;

        const coords = getCanvasCoordinates(e);
        const dx = coords.x - dragStart.x;
        const dy = coords.y - dragStart.y;

        setTextPos(prev => ({
            x: prev.x + dx / canvas.width,
            y: prev.y + dy / canvas.height
        }));

        setDragStart(coords);
    };

    const handleMouseUp = () => {
        setIsDragging(false);
    };

    const handlePoemSelect = (poem: Poem) => {
        setText(`${poem.title}\n${poem.author}\n\n${poem.content.join('\n')}`);
        setShowPoemSelect(false);
    };

    return (
        <div className="max-w-6xl mx-auto h-[80vh] flex gap-6 animate-fade-in">

            {/* Sidebar Controls */}
            <div className="w-80 bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl border border-stone-200 flex flex-col overflow-hidden transition-all duration-300">
                {/* Header */}
                <div className="p-4 border-b border-stone-100 flex justify-between items-center bg-white/50">
                    <button
                        onClick={onExit}
                        className="text-stone-500 hover:text-stone-800 font-bold flex items-center gap-1 text-sm transition-colors"
                    >
                        <ChevronLeft size={18} /> 退出
                    </button>
                    <div className="font-serif font-bold text-stone-700">画境创作</div>
                    <div className="w-10"></div> {/* Spacer */}
                </div >

                {/* Tabs */}
                < div className="flex p-1 mx-4 mt-4 bg-stone-100 rounded-xl" >
                    <button
                        onClick={() => setActiveTab('content')}
                        className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'content' ? 'bg-white text-amber-600 shadow-sm' : 'text-stone-500 hover:text-stone-700'}`}
                    >
                        内容
                    </button>
                    <button
                        onClick={() => setActiveTab('style')}
                        className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'style' ? 'bg-white text-amber-600 shadow-sm' : 'text-stone-500 hover:text-stone-700'}`}
                    >
                        样式
                    </button>
                </div >

                {/* Scrollable Content */}
                < div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-6" >
                    {activeTab === 'content' ? (
                        <div className="space-y-6 animate-fade-in">
                            {/* Wallpaper Section */}
                            <div>
                                <h3 className="font-bold text-stone-800 mb-3 flex items-center gap-2 text-sm">
                                    <ImageIcon size={16} /> 选择壁纸
                                </h3>
                                <div className="grid grid-cols-3 gap-2">
                                    <button
                                        onClick={() => fileInputRef.current?.click()}
                                        className="aspect-square rounded-xl border-2 border-dashed border-stone-300 flex flex-col items-center justify-center text-stone-400 hover:border-amber-500 hover:text-amber-500 hover:bg-amber-50 transition-all"
                                    >
                                        <Upload size={20} />
                                        <span className="text-[10px] mt-1 font-bold">上传</span>
                                    </button>
                                    <input
                                        type="file"
                                        ref={fileInputRef}
                                        className="hidden"
                                        accept="image/*"
                                        onChange={handleFileUpload}
                                    />
                                    {WALLPAPERS.map((wp) => (
                                        <button
                                            key={wp}
                                            onClick={() => { setSelectedWallpaper(wp); setCustomWallpaper(null); }}
                                            className={`aspect-square rounded-xl overflow-hidden border-2 transition-all ${selectedWallpaper === wp && !customWallpaper ? 'border-amber-500 ring-2 ring-amber-200 scale-95' : 'border-transparent hover:border-stone-300 hover:scale-105'}`}
                                        >
                                            <img src={wp} alt="wallpaper" className="w-full h-full object-cover" />
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Text Section */}
                            <div>
                                <div className="flex justify-between items-center mb-3">
                                    <h3 className="font-bold text-stone-800 flex items-center gap-2 text-sm">
                                        <Type size={16} /> 题诗内容
                                    </h3>
                                    <button
                                        onClick={() => setShowPoemSelect(!showPoemSelect)}
                                        className="text-xs flex items-center gap-1 bg-amber-100 text-amber-700 px-2 py-1 rounded-full hover:bg-amber-200 font-bold transition-colors"
                                    >
                                        <BookOpen size={12} /> 选诗
                                    </button>
                                </div>



                                <textarea
                                    value={text}
                                    onChange={(e) => setText(e.target.value)}
                                    className="w-full h-40 p-4 bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-amber-500 outline-none font-serif resize-none text-stone-700 leading-relaxed shadow-inner"
                                    placeholder="在此输入诗词..."
                                />
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-6 animate-fade-in">
                            {/* Typography */}
                            <div>
                                <h3 className="font-bold text-stone-800 mb-4 flex items-center gap-2 text-sm">
                                    <Palette size={16} /> 文字样式
                                </h3>

                                <div className="bg-stone-50 rounded-xl p-4 space-y-4 border border-stone-100">
                                    <div>
                                        <div className="flex justify-between mb-2">
                                            <label className="text-xs font-bold text-stone-500">字号</label>
                                            <span className="text-xs text-stone-400">{fontSize}px</span>
                                        </div>
                                        <input
                                            type="range"
                                            min="24"
                                            max="120"
                                            value={fontSize}
                                            onChange={(e) => setFontSize(Number(e.target.value))}
                                            className="w-full accent-amber-600 h-1.5 bg-stone-200 rounded-lg appearance-none cursor-pointer"
                                        />
                                    </div>

                                    <div className="flex items-center justify-between">
                                        <label className="text-xs font-bold text-stone-500">排版方向</label>
                                        <div className="flex bg-stone-200 p-1 rounded-lg">
                                            <button
                                                onClick={() => setIsVertical(false)}
                                                className={`px-3 py-1 rounded-md text-xs font-bold transition-all ${!isVertical ? 'bg-white text-stone-800 shadow-sm' : 'text-stone-500'}`}
                                            >
                                                横排
                                            </button>
                                            <button
                                                onClick={() => setIsVertical(true)}
                                                className={`px-3 py-1 rounded-md text-xs font-bold transition-all ${isVertical ? 'bg-white text-stone-800 shadow-sm' : 'text-stone-500'}`}
                                            >
                                                竖排
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Colors */}
                            <div>
                                <h3 className="font-bold text-stone-800 mb-3 text-sm">文字颜色</h3>
                                <div className="flex flex-wrap gap-2">
                                    {['#333333', '#8B4513', '#1a365d', '#2f855a', '#c53030', '#ffffff', '#000000', '#F59E0B', '#10B981', '#3B82F6', '#6366F1', '#8B5CF6', '#EC4899'].map(c => (
                                        <button
                                            key={c}
                                            onClick={() => setFontColor(c)}
                                            className={`w-8 h-8 rounded-full border-2 transition-all transform hover:scale-110 ${fontColor === c ? 'border-amber-500 ring-2 ring-amber-200 ring-offset-1' : 'border-stone-200 hover:border-stone-300'}`}
                                            style={{ backgroundColor: c }}
                                        />
                                    ))}
                                </div>
                            </div>

                            {/* Shadow Controls */}
                            <div>
                                <h3 className="font-bold text-stone-800 mb-3 text-sm">阴影效果</h3>
                                <div className="bg-stone-50 rounded-xl p-4 space-y-3 border border-stone-100">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="checkbox"
                                                id="shadow-toggle"
                                                checked={shadowEnabled}
                                                onChange={(e) => setShadowEnabled(e.target.checked)}
                                                className="rounded text-amber-600 focus:ring-amber-500"
                                            />
                                            <label htmlFor="shadow-toggle" className="text-xs font-bold text-stone-500 cursor-pointer">启用阴影</label>
                                        </div>
                                        <input
                                            type="color"
                                            value={shadow.color}
                                            onChange={e => setShadow({ ...shadow, color: e.target.value })}
                                            className={`w-8 h-8 rounded cursor-pointer border border-stone-200 p-0.5 bg-white ${!shadowEnabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                                            disabled={!shadowEnabled}
                                        />
                                    </div>

                                    <div className={`space-y-3 transition-opacity ${shadowEnabled ? 'opacity-100' : 'opacity-40 pointer-events-none'}`}>
                                        {[
                                            { label: '透明度', key: 'opacity', min: 0, max: 1, step: 0.1 },
                                            { label: '模糊度', key: 'blur', min: 0, max: 20, step: 1 },
                                            { label: '距离', key: 'distance', min: 0, max: 50, step: 1 },
                                            { label: '角度', key: 'angle', min: 0, max: 360, step: 10 }
                                        ].map((control) => (
                                            <div key={control.key} className="flex items-center gap-3">
                                                <span className="text-xs text-stone-400 w-10">{control.label}</span>
                                                <input
                                                    type="range"
                                                    min={control.min}
                                                    max={control.max}
                                                    step={control.step}
                                                    value={shadow[control.key as keyof typeof shadow] as number}
                                                    onChange={e => setShadow({ ...shadow, [control.key]: Number(e.target.value) })}
                                                    className="flex-1 accent-stone-500 h-1 bg-stone-200 rounded-lg appearance-none cursor-pointer"
                                                />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div >

                {/* Footer */}
                < div className="p-4 bg-white border-t border-stone-100" >
                    <button
                        onClick={handleDownload}
                        className="w-full py-3 bg-stone-800 text-white rounded-xl hover:bg-black transition-all flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transform active:scale-95"
                    >
                        <Download size={20} /> 导出图片
                    </button>
                </div >
            </div >

            {/* Preview Area */}
            < div className="flex-1 bg-stone-100 rounded-3xl border border-stone-200 flex items-center justify-center p-8 overflow-hidden relative" >
                <div className="relative shadow-2xl max-h-full max-w-full">
                    <canvas
                        ref={canvasRef}
                        onMouseDown={handleMouseDown}
                        onMouseMove={handleMouseMove}
                        onMouseUp={handleMouseUp}
                        onMouseLeave={handleMouseUp}
                        onTouchStart={handleMouseDown}
                        onTouchMove={handleMouseMove}
                        onTouchEnd={handleMouseUp}
                        className={`max-h-[70vh] max-w-full object-contain rounded-lg shadow-lg ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
                    />
                </div>
            </div>

            {showPoemSelect && (
                <PoemSelector
                    onSelect={handlePoemSelect}
                    onClose={() => setShowPoemSelect(false)}
                    customPoems={customPoems}
                />
            )}
        </div>
    );
};

export default PaintingRealm;

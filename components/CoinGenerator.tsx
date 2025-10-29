import React, { useState, useRef } from 'react';
import { generateImage, editImage } from '../services/geminiService';
import { SparklesIcon, UploadIcon, DownloadIcon, ResetIcon } from './Icons';

type Mode = 'text_to_text' | 'image_to_text' | 'image_to_image';

interface CoinGeneratorProps {
    onCoinSave: (coin: { frontImage: string; backImage: string }) => void;
}

export const CoinGenerator: React.FC<CoinGeneratorProps> = ({ onCoinSave }) => {
    const [mode, setMode] = useState<Mode>('text_to_text');
    const [frontPrompt, setFrontPrompt] = useState('一只戴着王冠的雄狮');
    const [backPrompt, setBackPrompt] = useState('一棵刻有发光符文的古树');
    const [stylePrompt, setStylePrompt] = useState('复古奇幻风格');
    const [edgeColor, setEdgeColor] = useState('#FFD700');

    const [frontImageFile, setFrontImageFile] = useState<File | null>(null);
    const [backImageFile, setBackImageFile] = useState<File | null>(null);

    const [generatedFront, setGeneratedFront] = useState<string | null>(null);
    const [generatedBack, setGeneratedBack] = useState<string | null>(null);

    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isFlipped, setIsFlipped] = useState(false);
    
    const frontFileInputRef = useRef<HTMLInputElement>(null);
    const backFileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, side: 'front' | 'back') => {
        const file = e.target.files?.[0];
        if (file) {
            const setFile = side === 'front' ? setFrontImageFile : setBackImageFile;
            setFile(file);
        }
    };

    const resetState = () => {
        setMode('text_to_text');
        setFrontPrompt('一只戴着王冠的雄狮');
        setBackPrompt('一棵刻有发光符文的古树');
        setStylePrompt('复古奇幻风格');
        setEdgeColor('#FFD700');
        setFrontImageFile(null);
        setBackImageFile(null);
        setGeneratedFront(null);
        setGeneratedBack(null);
        setIsLoading(false);
        setError(null);
        setIsFlipped(false);
    };

    const generateSide = async (side: 'front' | 'back'): Promise<string> => {
        const isFront = side === 'front';
        const prompt = isFront ? frontPrompt : backPrompt;
        const file = isFront ? frontImageFile : backImageFile;
        const fullPrompt = `${prompt}, ${stylePrompt}`;
        
        // Use prompt for text-to-image
        if ((isFront && (mode === 'text_to_text' || mode === 'image_to_text')) || (!isFront && mode !== 'image_to_image')) {
             const base64Bytes = await generateImage(fullPrompt, '1:1');
             return `data:image/jpeg;base64,${base64Bytes}`;
        }
        
        // Use uploaded image directly
        if (file) {
             return new Promise((resolve) => {
                const reader = new FileReader();
                reader.onloadend = () => resolve(reader.result as string);
                reader.readAsDataURL(file);
             });
        }
        
        throw new Error(`${side} side has no valid input.`);
    };


    const handleGenerate = async () => {
        setIsLoading(true);
        setError(null);
        setGeneratedFront(null);
        setGeneratedBack(null);

        try {
            const frontImageUrl = await generateSide('front');
            setGeneratedFront(frontImageUrl);

            const backImageUrl = await generateSide('back');
            setGeneratedBack(backImageUrl);

        } catch (err) {
            console.error(err);
            setError('生成硬币失败，请重试。');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSave = () => {
        if (generatedFront && generatedBack) {
            onCoinSave({
                frontImage: generatedFront,
                backImage: generatedBack
            });
            alert("硬币已保存到“我的”历史记录！");
        }
    };

    const renderFileInput = (side: 'front' | 'back') => {
        const file = side === 'front' ? frontImageFile : backImageFile;
        const ref = side === 'front' ? frontFileInputRef : backFileInputRef;
        return (
            <div className="mt-2">
                <button onClick={() => ref.current?.click()} className="w-full bg-rose-200 text-pink-700 text-sm py-2 px-3 rounded-md hover:bg-rose-300 transition-colors flex items-center justify-center gap-2">
                    <UploadIcon className="w-4 h-4"/>
                    { file ? `已选择: ${file.name.substring(0, 20)}...` : `上传${side === 'front' ? '正面' : '背面'}图片`}
                </button>
                <input type="file" accept="image/*" ref={ref} onChange={(e) => handleFileChange(e, side)} className="hidden" />
            </div>
        );
    };
    
    const renderDownloadButton = (side: 'front' | 'back') => {
        const url = side === 'front' ? generatedFront : generatedBack;
        if (!url) return null;
        return (
            <a href={url} download={`coin_${side}.png`} className="bg-green-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-green-600 transition-colors flex items-center justify-center gap-2">
                <DownloadIcon className="w-5 h-5"/>
                下载{side === 'front' ? '正面' : '背面'}
            </a>
        );
    }

    return (
        <div className="flex flex-col items-center h-full p-2 md:p-4">
            <div className="w-full max-w-4xl bg-white/60 backdrop-blur-lg p-6 rounded-2xl shadow-lg">
                 <div className="flex justify-between items-center mb-4">
                    <h2 className="text-2xl font-bold text-pink-800">个性硬币生成器</h2>
                     <button onClick={resetState} className="p-2 rounded-full hover:bg-rose-200 transition-colors" title="重置">
                        <ResetIcon className="w-6 h-6 text-pink-600"/>
                    </button>
                </div>
                 <p className="text-center text-pink-700/80 mb-6 max-w-2xl mx-auto">选择模式，描述或上传图片，定义风格，打造独一无二的专属硬币！</p>

                {/* Controls */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    {/* Mode Selection */}
                    <div className="md:col-span-1 bg-rose-100/50 p-3 rounded-lg">
                        <label className="block text-sm font-medium text-pink-800 mb-2 text-center">生成模式</label>
                        <div className="space-y-2 text-sm">
                            <label className="flex items-center"><input type="radio" name="mode" value="text_to_text" checked={mode === 'text_to_text'} onChange={(e) => setMode(e.target.value as Mode)} className="mr-2 accent-pink-500"/> 双面提示词</label>
                            <label className="flex items-center"><input type="radio" name="mode" value="image_to_text" checked={mode === 'image_to_text'} onChange={(e) => setMode(e.target.value as Mode)} className="mr-2 accent-pink-500"/> 上传正面 + 提示词背面</label>
                            <label className="flex items-center"><input type="radio" name="mode" value="image_to_image" checked={mode === 'image_to_image'} onChange={(e) => setMode(e.target.value as Mode)} className="mr-2 accent-pink-500"/> 双面上传</label>
                        </div>
                    </div>
                     {/* Prompts / Uploads */}
                    <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                             <label className="block text-sm font-medium text-pink-800 mb-1">硬币正面</label>
                            {(mode === 'text_to_text' || mode === 'image_to_text') ? <textarea value={frontPrompt} onChange={(e) => setFrontPrompt(e.target.value)} className="w-full bg-white/70 border border-rose-200 rounded-md p-2 text-pink-900 focus:ring-2 focus:ring-pink-400" rows={2}></textarea> : null}
                            {mode === 'image_to_text' || mode === 'image_to_image' ? renderFileInput('front') : null}
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-pink-800 mb-1">硬币背面</label>
                            {mode !== 'image_to_image' ? <textarea value={backPrompt} onChange={(e) => setBackPrompt(e.target.value)} className="w-full bg-white/70 border border-rose-200 rounded-md p-2 text-pink-900 focus:ring-2 focus:ring-pink-400" rows={2}></textarea> : null}
                            {mode === 'image_to_image' ? renderFileInput('back') : null}
                        </div>
                    </div>
                </div>

                 <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-pink-800 mb-1">硬币风格 (例如：赛博朋克, 卡通, 水彩画)</label>
                        <input type="text" value={stylePrompt} onChange={(e) => setStylePrompt(e.target.value)} className="w-full bg-white/70 border border-rose-200 rounded-md p-2 text-pink-900 focus:ring-2 focus:ring-pink-400" />
                    </div>
                     <div>
                        <label className="block text-sm font-medium text-pink-800 mb-1">边缘颜色</label>
                        <input type="color" value={edgeColor} onChange={(e) => setEdgeColor(e.target.value)} className="w-full h-10 p-1 bg-white/70 border border-rose-200 rounded-md" />
                    </div>
                </div>

                <button onClick={handleGenerate} disabled={isLoading} className="w-full bg-pink-500 text-white font-bold py-3 px-4 rounded-lg hover:bg-pink-600 disabled:bg-pink-300 transition-all flex items-center justify-center gap-2 text-lg shadow-md">
                    {isLoading ? '正在生成中...' : '开始生成'}
                    {!isLoading && <SparklesIcon className="w-6 h-6"/>}
                </button>
            </div>
            
            {error && <p className="text-red-500 mt-4 text-center font-semibold">{error}</p>}
            
            <div className="mt-6 w-full max-w-4xl flex flex-col items-center">
                 {isLoading && (
                    <div className="text-center bg-white/50 p-6 rounded-2xl">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500 mx-auto"></div>
                        <p className="mt-4 text-lg font-semibold text-pink-600">AI 正在努力创作中...</p>
                    </div>
                )}
                
                {generatedFront && generatedBack && (
                     <div className="w-full flex flex-col items-center">
                        {/* 3D Coin View */}
                         <div className="w-48 h-48 sm:w-64 sm:h-64 [perspective:1000px] mb-4">
                            <div
                                className={`relative w-full h-full [transform-style:preserve-3d] transition-transform duration-700 ${isFlipped ? 'rotate-y-180' : ''}`}
                                onClick={() => setIsFlipped(!isFlipped)}
                                title="点击翻转"
                            >
                                {/* Front */}
                                <div className="absolute w-full h-full rounded-full bg-cover bg-center [backface-visibility:hidden]" style={{ backgroundImage: `url(${generatedFront})`, boxShadow: `0 0 20px 5px ${edgeColor}, inset 0 0 15px 2px rgba(255,255,255,0.5)` }}></div>
                                {/* Edge (approximated) */}
                                <div className="absolute w-full h-full rounded-full" style={{ background: edgeColor, transform: 'translateZ(-2px)' }}></div>
                                {/* Back */}
                                <div className="absolute w-full h-full rounded-full bg-cover bg-center [backface-visibility:hidden] [transform:rotateY(180deg)]" style={{ backgroundImage: `url(${generatedBack})`, boxShadow: `0 0 20px 5px ${edgeColor}, inset 0 0 15px 2px rgba(255,255,255,0.5)` }}></div>
                            </div>
                        </div>

                         <div className="flex flex-wrap justify-center gap-4 mb-4">
                           {renderDownloadButton('front')}
                           {renderDownloadButton('back')}
                        </div>

                        <button onClick={handleSave} className="bg-teal-500 text-white font-bold py-2 px-6 rounded-lg hover:bg-teal-600 transition-colors shadow-md">
                            保存到“我的”
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

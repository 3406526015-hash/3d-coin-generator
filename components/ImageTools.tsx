import React, { useState } from 'react';
import { generateImage, editImage, analyzeImage } from '../services/geminiService';
import { SparklesIcon, DownloadIcon, ResetIcon } from './Icons';

type ToolMode = 'generate' | 'edit' | 'analyze';

export const ImageTools: React.FC = () => {
    const [mode, setMode] = useState<ToolMode>('generate');
    const [prompt, setPrompt] = useState('一只戴着星冠的雄伟狮子');
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imageUrl, setImageUrl] = useState<string | null>(null);
    const [resultImageUrl, setResultImageUrl] = useState<string | null>(null);
    const [analysisResult, setAnalysisResult] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setImageFile(file);
            setImageUrl(URL.createObjectURL(file));
            setResultImageUrl(null);
            setAnalysisResult(null);
        }
    };

    const resetState = () => {
        setPrompt(mode === 'generate' ? '一只戴着星冠的雄伟狮子' : '');
        setImageFile(null);
        setImageUrl(null);
        setResultImageUrl(null);
        setAnalysisResult(null);
        setError(null);
        setIsLoading(false);
    };

    const handleSubmit = async () => {
        setIsLoading(true);
        setError(null);
        setResultImageUrl(null);
        setAnalysisResult(null);

        try {
            if (mode === 'generate') {
                if (!prompt) {
                    setError('请输入提示词。');
                    setIsLoading(false);
                    return;
                }
                const base64Bytes = await generateImage(prompt, '1:1');
                setResultImageUrl(`data:image/jpeg;base64,${base64Bytes}`);
            } else if (mode === 'edit') {
                if (!imageFile || !prompt) {
                    setError('请上传图片并输入提示词。');
                    setIsLoading(false);
                    return;
                }
                const base64Bytes = await editImage(imageFile, prompt);
                setResultImageUrl(`data:image/png;base64,${base64Bytes}`);
            } else if (mode === 'analyze') {
                if (!imageFile || !prompt) {
                    setError('请上传图片并输入问题。');
                    setIsLoading(false);
                    return;
                }
                const text = await analyzeImage(imageFile, prompt);
                setAnalysisResult(text);
            }
        } catch (err) {
            console.error(err);
            setError('发生错误，请重试。');
        } finally {
            setIsLoading(false);
        }
    };
    
    const switchMode = (newMode: ToolMode) => {
        setMode(newMode);
        resetState();
    }

    return (
        <div className="flex flex-col items-center h-full p-2 md:p-4">
             <div className="w-full max-w-2xl bg-white/60 backdrop-blur-lg p-6 rounded-2xl shadow-lg">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-2xl font-bold text-pink-800">Gemini 图像工具</h2>
                     <button onClick={resetState} className="p-2 rounded-full hover:bg-rose-200 transition-colors" title="重置">
                        <ResetIcon className="w-6 h-6 text-pink-600"/>
                    </button>
                </div>
                 <p className="text-center text-pink-700/80 mb-6 max-w-2xl mx-auto">利用 Gemini 的强大功能生成、编辑和理解图像。</p>

                <div className="flex justify-center bg-rose-100/50 rounded-lg p-1 mb-4">
                    <button onClick={() => switchMode('generate')} className={`px-4 py-2 text-sm font-medium capitalize transition-colors duration-300 rounded-md flex-1 ${mode === 'generate' ? 'bg-pink-400 text-white shadow' : 'text-pink-700 hover:bg-rose-200/70'}`}>生成</button>
                    <button onClick={() => switchMode('edit')} className={`px-4 py-2 text-sm font-medium capitalize transition-colors duration-300 rounded-md flex-1 ${mode === 'edit' ? 'bg-pink-400 text-white shadow' : 'text-pink-700 hover:bg-rose-200/70'}`}>编辑</button>
                    <button onClick={() => switchMode('analyze')} className={`px-4 py-2 text-sm font-medium capitalize transition-colors duration-300 rounded-md flex-1 ${mode === 'analyze' ? 'bg-pink-400 text-white shadow' : 'text-pink-700 hover:bg-rose-200/70'}`}>分析</button>
                </div>
                
                <div className="space-y-4">
                    { (mode === 'edit' || mode === 'analyze') && (
                        <div>
                             <label htmlFor="image-upload" className="block text-sm font-medium text-pink-800 mb-2">上传图片</label>
                             <input id="image-upload" type="file" accept="image/*" onChange={handleFileChange} className="block w-full text-sm text-pink-700 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-pink-400 file:text-white hover:file:bg-pink-500 transition-colors"/>
                             {imageUrl && <img src={imageUrl} alt="upload preview" className="mt-4 rounded-lg max-h-40 mx-auto shadow-md"/>}
                        </div>
                    )}

                    <textarea
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        className="w-full bg-white/70 border border-rose-200 rounded-md p-2 text-pink-900 focus:ring-2 focus:ring-pink-400"
                        placeholder={
                            mode === 'generate' ? '描述您想创建的图像...' :
                            mode === 'edit' ? '描述您想做的更改...' :
                            '针对图像提出问题...'
                        }
                        rows={3}
                    />

                    <button onClick={handleSubmit} disabled={isLoading} className="w-full bg-pink-500 text-white font-bold py-3 px-4 rounded-lg hover:bg-pink-600 disabled:bg-pink-300 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2">
                        {isLoading ? '处理中...' : '提交'}
                        {!isLoading && <SparklesIcon className="w-5 h-5"/>}
                    </button>
                </div>
            </div>

            {error && <p className="text-red-500 mt-4 text-center font-semibold">{error}</p>}

            <div className="mt-8 w-full max-w-2xl">
                {isLoading && (
                    <div className="text-center bg-white/50 p-6 rounded-lg">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500 mx-auto"></div>
                        <p className="mt-4 text-lg font-semibold text-pink-600">Gemini 正在思考中...</p>
                    </div>
                )}
                {resultImageUrl && (
                    <div className="bg-white/60 backdrop-blur-lg p-4 rounded-2xl shadow-lg">
                        <h3 className="text-xl font-bold text-center mb-4 text-pink-800">结果</h3>
                        <img src={resultImageUrl} alt="Generated result" className="w-full rounded-lg shadow-2xl mb-4" />
                        <a href={resultImageUrl} download="generated-image.png" className="w-full bg-green-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-green-600 transition-colors flex items-center justify-center gap-2">
                           <DownloadIcon className="w-5 h-5"/> 下载图片
                        </a>
                    </div>
                )}
                {analysisResult && (
                    <div>
                        <h3 className="text-xl font-bold text-center mb-4 text-pink-800">分析结果</h3>
                        <div className="bg-white/60 backdrop-blur-lg p-4 rounded-lg text-pink-900 whitespace-pre-wrap">{analysisResult}</div>
                    </div>
                )}
            </div>
        </div>
    );
};

import React, { useState, useEffect, useCallback } from 'react';
import { generateWithSearch, generateWithMaps } from '../services/geminiService';
import { ResetIcon, SearchIcon } from './Icons';
import ReactMarkdown from 'react-markdown';

type SearchMode = 'web' | 'maps';
type Location = { latitude: number, longitude: number };
type SourceChunk = { web?: { uri: string, title: string }, maps?: { uri: string, title: string, placeAnswerSources?: any } };

export const Research: React.FC = () => {
    const [mode, setMode] = useState<SearchMode>('web');
    const [query, setQuery] = useState('AI 赋能药物发现的最新进展');
    const [location, setLocation] = useState<Location | null>(null);
    const [locationError, setLocationError] = useState<string | null>(null);
    const [result, setResult] = useState<{ text: string, sources: SourceChunk[] } | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

     const resetState = () => {
        setQuery(mode === 'web' ? 'AI 赋能药物发现的最新进展' : '我附近的好咖啡店');
        setResult(null);
        setIsLoading(false);
        setError(null);
    };
    
    const switchMode = (newMode: SearchMode) => {
        setMode(newMode);
        setQuery(newMode === 'web' ? 'AI 赋能药物发现的最新进展' : '我附近的好咖啡店');
        setResult(null);
        setError(null);
    }

    useEffect(() => {
        if (mode === 'maps' && !location) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    setLocation({
                        latitude: position.coords.latitude,
                        longitude: position.coords.longitude
                    });
                    setLocationError(null);
                },
                (err) => {
                    console.error("地理位置错误:", err);
                    setLocationError("无法获取您的位置。请在浏览器设置中启用定位服务。正在使用默认位置。");
                    setLocation({ latitude: 37.422, longitude: -122.084 });
                }
            );
        }
    }, [mode, location]);

    const handleSearch = useCallback(async () => {
        if (!query) {
            setError('请输入搜索查询。');
            return;
        }
        setIsLoading(true);
        setError(null);
        setResult(null);

        try {
            let res;
            if (mode === 'web') {
                res = await generateWithSearch(query);
            } else {
                if (!location) {
                    setError('地图搜索需要您的位置信息。');
                    setIsLoading(false);
                    return;
                }
                res = await generateWithMaps(query, location);
            }
            setResult(res);
        } catch (err: any) {
            setError('搜索时发生错误，请重试。');
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    }, [query, mode, location]);

    return (
        <div className="flex flex-col items-center h-full p-2 md:p-4">
            <div className="w-full max-w-4xl bg-white/60 backdrop-blur-lg p-6 rounded-2xl shadow-lg">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-2xl font-bold text-pink-800">Grounded 研究助手</h2>
                     <button onClick={resetState} className="p-2 rounded-full hover:bg-rose-200 transition-colors" title="重置">
                        <ResetIcon className="w-6 h-6 text-pink-600"/>
                    </button>
                </div>
                 <p className="text-center text-pink-700/80 mb-6 max-w-2xl mx-auto">提出需要最新信息或基于位置的问题。Gemini 将使用谷歌搜索或地图来提供基于现实世界数据的答案。</p>
                
                <div className="flex justify-center bg-rose-100/50 rounded-lg p-1 mb-4">
                     <button onClick={() => switchMode('web')} className={`px-4 py-2 text-sm font-medium capitalize transition-colors duration-300 rounded-md flex-1 ${mode === 'web' ? 'bg-pink-400 text-white shadow' : 'text-pink-700 hover:bg-rose-200/70'}`}>
                        网页搜索
                    </button>
                    <button onClick={() => switchMode('maps')} className={`px-4 py-2 text-sm font-medium capitalize transition-colors duration-300 rounded-md flex-1 ${mode === 'maps' ? 'bg-pink-400 text-white shadow' : 'text-pink-700 hover:bg-rose-200/70'}`}>
                        地图搜索
                    </button>
                </div>
                
                <div className="flex items-center gap-2">
                    <textarea value={query} onChange={(e) => setQuery(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && !isLoading && handleSearch()} className="flex-grow bg-white/70 border border-rose-200 rounded-lg p-3 text-pink-900 focus:ring-2 focus:ring-pink-400 focus:outline-none" placeholder={mode === 'web' ? '例如，谁赢得了最新的 F1 比赛？' : '例如，我附近的好咖啡店'} rows={2}></textarea>
                    <button onClick={handleSearch} disabled={isLoading || (mode === 'maps' && !location)} className="h-full bg-pink-500 text-white font-bold py-3 px-5 rounded-lg hover:bg-pink-600 disabled:bg-pink-300 transition-all flex items-center justify-center gap-2 shadow-lg">
                        <SearchIcon className="w-5 h-5"/>
                    </button>
                </div>
                {mode === 'maps' && locationError && <p className="text-yellow-600 text-sm text-center mt-2">{locationError}</p>}
            </div>

             {error && <p className="text-red-500 mt-4 text-center font-semibold">{error}</p>}

            <div className="mt-6 w-full max-w-4xl">
                 {isLoading && (
                    <div className="text-center bg-white/50 p-6 rounded-2xl">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500 mx-auto"></div>
                        <p className="mt-4 text-lg font-semibold text-pink-600">Gemini 正在研究中...</p>
                    </div>
                )}
                {result && (
                    <div className="bg-white/60 backdrop-blur-lg p-6 rounded-2xl shadow-lg">
                        <div className="prose prose-pink max-w-none mb-6">
                            <ReactMarkdown>{result.text}</ReactMarkdown>
                        </div>
                        {result.sources && result.sources.length > 0 && (
                            <div>
                                <h4 className="font-bold text-lg text-pink-800 border-t border-rose-200 pt-4">来源:</h4>
                                <ul className="list-disc list-inside mt-2 space-y-1">
                                    {result.sources.map((source, index) => {
                                        const groundingChunk = source.web || source.maps;
                                        if (!groundingChunk || !groundingChunk.uri) return null;
                                        return (
                                            <li key={index} className="text-pink-600">
                                                <a href={groundingChunk.uri} target="_blank" rel="noopener noreferrer" className="hover:underline break-all">
                                                    {groundingChunk.title || groundingChunk.uri}
                                                </a>
                                            </li>
                                        )
                                    })}
                                </ul>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

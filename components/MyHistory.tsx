import React from 'react';
import { TrashIcon } from './Icons';

interface Message {
    sender: 'user' | 'bot';
    text: string;
}

export interface CoinHistoryItem {
    id: number;
    frontImage: string;
    backImage: string;
    timestamp: Date;
}

export interface ChatHistoryItem {
    id: number;
    messages: Message[];
    timestamp: Date;
}

interface MyHistoryProps {
    coinHistory: CoinHistoryItem[];
    chatHistory: ChatHistoryItem[];
    onDeleteCoin: (id: number) => void;
    onDeleteChat: (id: number) => void;
}

export const MyHistory: React.FC<MyHistoryProps> = ({ coinHistory, chatHistory, onDeleteCoin, onDeleteChat }) => {
    return (
        <div className="h-full p-2 md:p-4 overflow-y-auto">
            <h2 className="text-3xl font-bold text-pink-800 mb-6 text-center">我的历史记录</h2>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                {/* Coin History */}
                <div>
                    <h3 className="text-2xl font-semibold text-pink-700 mb-4 text-center xl:text-left">硬币收藏</h3>
                    {coinHistory.length === 0 ? (
                        <p className="text-pink-500 text-center p-6 bg-white/60 rounded-lg">还没有创作任何硬币。</p>
                    ) : (
                        <div className="space-y-4">
                            {coinHistory.map(item => (
                                <div key={item.id} className="bg-white/60 backdrop-blur-lg p-4 rounded-xl shadow-md flex items-center gap-4">
                                    <img src={item.frontImage} alt="硬币正面" className="w-16 h-16 rounded-full object-cover border-2 border-rose-200"/>
                                    <img src={item.backImage} alt="硬币背面" className="w-16 h-16 rounded-full object-cover border-2 border-rose-200"/>
                                    <div className="flex-grow">
                                        <p className="font-semibold text-pink-800">创作于</p>
                                        <p className="text-sm text-pink-600">{item.timestamp.toLocaleString()}</p>
                                    </div>
                                    <button onClick={() => onDeleteCoin(item.id)} className="p-2 rounded-full hover:bg-red-200 transition-colors">
                                        <TrashIcon className="w-5 h-5 text-red-500"/>
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Chat History */}
                <div>
                    <h3 className="text-2xl font-semibold text-pink-700 mb-4 text-center xl:text-left">聊天记录</h3>
                     {chatHistory.length === 0 ? (
                        <p className="text-pink-500 text-center p-6 bg-white/60 rounded-lg">还没有已保存的聊天记录。</p>
                    ) : (
                        <div className="space-y-4">
                            {chatHistory.map(item => (
                                <div key={item.id} className="bg-white/60 backdrop-blur-lg p-4 rounded-xl shadow-md">
                                    <div className="flex justify-between items-center mb-2">
                                        <p className="text-sm text-pink-600">保存于: {item.timestamp.toLocaleString()}</p>
                                        <button onClick={() => onDeleteChat(item.id)} className="p-2 rounded-full hover:bg-red-200 transition-colors">
                                            <TrashIcon className="w-5 h-5 text-red-500"/>
                                        </button>
                                    </div>
                                    <div className="max-h-48 overflow-y-auto space-y-2 p-2 bg-rose-50/50 rounded-lg">
                                        {item.messages.slice(1).map((msg, index) => ( // Slice to skip initial bot message
                                            <div key={index} className={`text-sm ${msg.sender === 'user' ? 'text-right' : 'text-left'}`}>
                                                <span className={`px-2 py-1 rounded-lg inline-block ${msg.sender === 'user' ? 'bg-pink-100 text-pink-800' : 'bg-gray-100 text-gray-700'}`}>
                                                    {msg.text}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

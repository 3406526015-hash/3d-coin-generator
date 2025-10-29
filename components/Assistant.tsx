import React, { useState, useEffect, useRef } from 'react';
import { getChatResponse, generateSpeech } from '../services/geminiService';
import { PaperAirplaneIcon, SpeakerWaveIcon } from './Icons';
import ReactMarkdown from 'react-markdown';

interface Message {
    sender: 'user' | 'bot';
    text: string;
}

interface AssistantProps {
    onChatSave: (chat: { messages: Message[] }) => void;
}

export const Assistant: React.FC<AssistantProps> = ({ onChatSave }) => {
    const [messages, setMessages] = useState<Message[]>([
        { sender: 'bot', text: '你好！我是您的 Gemini 助手。今天有什么可以帮您？' }
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<null | HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(scrollToBottom, [messages]);

    const handleSend = async () => {
        if (input.trim() === '' || isLoading) return;

        const userMessage: Message = { sender: 'user', text: input };
        setMessages(prev => [...prev, userMessage]);
        const currentInput = input;
        setInput('');
        setIsLoading(true);

        try {
            const botResponseText = await getChatResponse(currentInput);
            const botMessage: Message = { sender: 'bot', text: botResponseText };
            setMessages(prev => [...prev, botMessage]);
        } catch (error) {
            console.error("获取聊天响应失败:", error);
            const errorMessage: Message = { sender: 'bot', text: '抱歉，我遇到了一个错误。请重试。' };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleSaveAndClear = () => {
        if (messages.length > 1) { // Only save if there's a conversation
            onChatSave({ messages });
            alert("对话已保存到“我的”历史记录！");
        }
        setMessages([
            { sender: 'bot', text: '你好！我是您的 Gemini 助手。今天有什么可以帮您？' }
        ]);
        setInput('');
    };

    const handleSpeak = (text: string) => {
        generateSpeech(text).catch(err => console.error("语音生成失败:", err));
    };
    
    return (
        <div className="flex flex-col h-full max-w-3xl mx-auto bg-white/60 backdrop-blur-lg rounded-2xl shadow-xl overflow-hidden">
             <h2 className="text-2xl font-bold text-center text-pink-800 p-4 bg-white/30">聊天助手</h2>
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((msg, index) => (
                    <div key={index} className={`flex items-end gap-2 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                        {msg.sender === 'bot' && <div className="w-8 h-8 rounded-full bg-pink-300 flex items-center justify-center text-white font-bold flex-shrink-0">G</div>}
                        <div className={`max-w-lg p-3 rounded-2xl shadow-sm ${msg.sender === 'user' ? 'bg-pink-500 text-white rounded-br-none' : 'bg-white text-gray-800 rounded-bl-none'}`}>
                           <div className="prose prose-sm max-w-none prose-p:my-1 text-inherit">
                             <ReactMarkdown>{msg.text}</ReactMarkdown>
                           </div>
                           {msg.sender === 'bot' && (
                               <button onClick={() => handleSpeak(msg.text)} className="mt-2 text-gray-400 hover:text-pink-500 transition-colors">
                                   <SpeakerWaveIcon className="w-5 h-5"/>
                               </button>
                           )}
                        </div>
                         {msg.sender === 'user' && <div className="w-8 h-8 rounded-full bg-teal-300 flex items-center justify-center text-white font-bold flex-shrink-0">你</div>}
                    </div>
                ))}
                {isLoading && (
                    <div className="flex justify-start">
                         <div className="w-8 h-8 rounded-full bg-pink-300 flex items-center justify-center text-white font-bold flex-shrink-0">G</div>
                        <div className="max-w-lg p-3 rounded-lg bg-white ml-2">
                           <div className="flex items-center space-x-2">
                                <div className="w-2 h-2 bg-pink-400 rounded-full animate-pulse"></div>
                                <div className="w-2 h-2 bg-pink-400 rounded-full animate-pulse [animation-delay:0.2s]"></div>
                                <div className="w-2 h-2 bg-pink-400 rounded-full animate-pulse [animation-delay:0.4s]"></div>
                           </div>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>
            <div className="p-4 bg-white/30 border-t border-rose-100">
                <div className="flex items-center gap-2">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                        className="flex-1 bg-white/80 border border-rose-200 rounded-lg p-3 text-pink-900 placeholder-pink-300 focus:outline-none focus:ring-2 focus:ring-pink-400"
                        placeholder="输入您的消息..."
                        disabled={isLoading}
                    />
                    <button onClick={handleSend} disabled={isLoading} className="p-3 bg-pink-500 text-white rounded-lg disabled:bg-pink-300 hover:bg-pink-600 transition-colors shadow-md">
                        <PaperAirplaneIcon className="w-6 h-6"/>
                    </button>
                </div>
                 <button onClick={handleSaveAndClear} className="w-full mt-2 text-sm text-pink-600 hover:bg-rose-100 rounded-md py-1 transition-colors">
                    清除并保存对话
                </button>
            </div>
        </div>
    );
};
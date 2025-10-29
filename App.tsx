import React, { useState } from 'react';
import { ImageTools } from './components/ImageTools';
import { Assistant } from './components/Assistant';
import { Research } from './components/Research';
import { CoinGenerator } from './components/CoinGenerator';
import { MyHistory, CoinHistoryItem, ChatHistoryItem } from './components/MyHistory';
import { CoinIcon, ImageIcon, ChatIcon, SearchIcon, UserIcon } from './components/Icons';

type View = 'image' | 'chat' | 'research' | 'coin' | 'history';

const App: React.FC = () => {
    const [activeTab, setActiveTab] = useState<View>('coin');
    const [coinHistory, setCoinHistory] = useState<CoinHistoryItem[]>([]);
    const [chatHistory, setChatHistory] = useState<ChatHistoryItem[]>([]);

    const addCoinToHistory = (coin: { frontImage: string, backImage: string }) => {
        const newCoin: CoinHistoryItem = {
            id: Date.now(),
            ...coin,
            timestamp: new Date(),
        };
        setCoinHistory(prev => [newCoin, ...prev]);
    };
    
    const addChatToHistory = (chat: { messages: { sender: 'user' | 'bot'; text: string; }[] }) => {
        const newChat: ChatHistoryItem = {
            id: Date.now(),
            messages: chat.messages,
            timestamp: new Date(),
        };
        setChatHistory(prev => [newChat, ...prev]);
    };

    const deleteCoin = (id: number) => {
        setCoinHistory(prev => prev.filter(item => item.id !== id));
    };

    const deleteChat = (id: number) => {
        setChatHistory(prev => prev.filter(item => item.id !== id));
    };

    const renderView = () => {
        switch (activeTab) {
            case 'image':
                return <ImageTools />;
            case 'chat':
                return <Assistant onChatSave={addChatToHistory} />;
            case 'research':
                return <Research />;
            case 'coin':
                return <CoinGenerator onCoinSave={addCoinToHistory} />;
            case 'history':
                return <MyHistory coinHistory={coinHistory} chatHistory={chatHistory} onDeleteCoin={deleteCoin} onDeleteChat={deleteChat} />;
            default:
                return <CoinGenerator onCoinSave={addCoinToHistory} />;
        }
    };
    
    interface TabButtonProps {
        viewName: View;
        label: string;
        icon: React.ReactElement;
    }

    const TabButton: React.FC<TabButtonProps> = ({ viewName, label, icon }) => (
        <button
            onClick={() => setActiveTab(viewName)}
            className={`flex flex-col items-center justify-center w-full pt-2 pb-1 transition-all duration-300 ${
                activeTab === viewName
                ? 'text-pink-500 scale-110'
                : 'text-gray-500 hover:text-pink-400'
            }`}
        >
            {React.cloneElement(icon, { className: 'w-7 h-7 mb-1' })}
            <span className="text-xs font-medium">{label}</span>
        </button>
    );

    return (
        <div className="flex flex-col h-screen font-sans">
            <header className="text-center py-4 px-2 bg-white/50 backdrop-blur-sm shadow-sm flex-shrink-0">
                <h1 className="text-2xl font-bold text-pink-500 select-none">
                🌸(｡･ω･｡)/♡ 币镜幻创 ♡＼(｡･ω･｡)🌸
                </h1>
            </header>

            <main className="flex-grow overflow-y-auto p-4">
                {renderView()}
            </main>

            <footer className="flex-shrink-0 bg-white/80 backdrop-blur-md shadow-[0_-4px_12px_-1px_rgba(0,0,0,0.05)]">
                <nav className="flex justify-around items-center max-w-2xl mx-auto px-2">
                    <TabButton viewName="coin" label="个性硬币" icon={<CoinIcon />} />
                    <TabButton viewName="image" label="图像工具" icon={<ImageIcon />} />
                    <TabButton viewName="chat" label="AI 助手" icon={<ChatIcon />} />
                    <TabButton viewName="research" label="研究" icon={<SearchIcon />} />
                    <TabButton viewName="history" label="我的" icon={<UserIcon />} />
                </nav>
            </footer>
        </div>
    );
};

export default App;

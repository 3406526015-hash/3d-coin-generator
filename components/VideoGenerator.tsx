

import React, { useState, useEffect, useCallback } from 'react';
import { generateVideo } from '../services/geminiService';
// Fix: Corrected import path for Icons.
import { SparklesIcon, KeyIcon } from './Icons';

const loadingMessages = [
    "Warming up the digital director...",
    "Choreographing pixels into motion...",
    "Rendering the first few frames...",
    "This can take a few minutes, hang tight!",
    "Compositing scenes together...",
    "Applying final visual effects...",
    "Almost there, the masterpiece is nearly ready!"
];

export const VideoGenerator: React.FC = () => {
    const [apiKeySelected, setApiKeySelected] = useState<boolean | null>(null);
    const [prompt, setPrompt] = useState('A neon hologram of a cat driving at top speed');
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imageUrl, setImageUrl] = useState<string | null>(null);
    const [aspectRatio, setAspectRatio] = useState<'16:9' | '9:16'>('16:9');
    const [videoUrl, setVideoUrl] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [loadingMessage, setLoadingMessage] = useState(loadingMessages[0]);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const checkApiKey = async () => {
            if(window.aistudio) {
                const hasKey = await window.aistudio.hasSelectedApiKey();
                setApiKeySelected(hasKey);
            } else {
                 setApiKeySelected(true); // Fallback for environments without aistudio
            }
        };
        checkApiKey();
    }, []);

    useEffect(() => {
        let interval: number;
        if (isLoading) {
            interval = window.setInterval(() => {
                setLoadingMessage(prev => {
                    const currentIndex = loadingMessages.indexOf(prev);
                    const nextIndex = (currentIndex + 1) % loadingMessages.length;
                    return loadingMessages[nextIndex];
                });
            }, 3000);
        }
        return () => clearInterval(interval);
    }, [isLoading]);

    const handleSelectKey = async () => {
        if(window.aistudio) {
            await window.aistudio.openSelectKey();
            // Assume success and let the next API call verify.
            setApiKeySelected(true);
        }
    };
    
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setImageFile(file);
            setImageUrl(URL.createObjectURL(file));
        }
    };

    const handleGenerate = useCallback(async () => {
        if (!prompt && !imageFile) {
            setError('Please provide a prompt or an image.');
            return;
        }
        setIsLoading(true);
        setError(null);
        setVideoUrl(null);
        try {
            const url = await generateVideo(prompt, imageFile, aspectRatio);
            setVideoUrl(url);
        } catch (err: any) {
             if (err.message.includes("Requested entity was not found")) {
                setError("API Key validation failed. Please select your key again.");
                setApiKeySelected(false);
            } else {
                setError('Failed to generate video. Please try again.');
            }
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    }, [prompt, imageFile, aspectRatio]);

    if (apiKeySelected === null) {
        return <div className="text-center p-8">Checking API Key...</div>;
    }

    if (!apiKeySelected) {
        return (
            <div className="flex flex-col items-center justify-center h-full bg-gray-800 p-8 rounded-lg">
                <KeyIcon className="w-16 h-16 text-yellow-400 mb-4" />
                <h2 className="text-2xl font-bold mb-2">API Key Required for Veo</h2>
                <p className="text-gray-400 mb-4 text-center max-w-md">Video generation with Veo requires you to select your own Google AI Studio API key. This feature may incur costs.</p>
                <p className="text-sm text-gray-500 mb-6">For more details, see the <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">billing documentation</a>.</p>
                <button onClick={handleSelectKey} className="bg-blue-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-blue-700 transition-all flex items-center gap-2">
                    <KeyIcon className="w-5 h-5"/> Select API Key
                </button>
            </div>
        );
    }
    
    return (
        <div className="flex flex-col items-center h-full p-4">
             <h2 className="text-3xl font-bold text-center text-white mb-2">Veo Video Generator</h2>
             <p className="text-center text-gray-400 mb-6 max-w-2xl">Create stunning videos from text prompts or by animating an initial image. Let your imagination direct the show.</p>
            
            <div className="w-full max-w-2xl bg-gray-800 p-6 rounded-lg shadow-lg">
                <div className="space-y-4">
                    <textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} className="w-full bg-gray-700 border border-gray-600 rounded-md p-2 text-white focus:ring-2 focus:ring-blue-500" placeholder="A cinematic shot of a futuristic city..." rows={3}></textarea>
                    
                    <div>
                        <label htmlFor="video-file-upload" className="block text-sm font-medium text-gray-300 mb-2">Optional Starting Image</label>
                        <input id="video-file-upload" type="file" accept="image/*" onChange={handleFileChange} className="block w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-500 file:text-white hover:file:bg-blue-600"/>
                        {imageUrl && <img src={imageUrl} alt="upload preview" className="mt-4 rounded-lg max-h-40 mx-auto"/>}
                    </div>

                    <div className="flex items-center gap-4">
                        <label className="text-gray-300">Aspect Ratio:</label>
                        <select value={aspectRatio} onChange={e => setAspectRatio(e.target.value as '16:9' | '9:16')} className="bg-gray-700 border border-gray-600 rounded-md p-2 text-white">
                            <option value="16:9">16:9 (Landscape)</option>
                            <option value="9:16">9:16 (Portrait)</option>
                        </select>
                    </div>

                    <button onClick={handleGenerate} disabled={isLoading} className="w-full bg-blue-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-blue-700 disabled:bg-blue-800 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2">
                        {isLoading ? 'Generating Video...' : 'Generate'}
                        {!isLoading && <SparklesIcon className="w-5 h-5"/>}
                    </button>
                </div>
            </div>
            
            {error && <p className="text-red-400 mt-4 text-center">{error}</p>}

            <div className="mt-8 w-full max-w-2xl">
                {isLoading && (
                    <div className="text-center bg-gray-800 p-6 rounded-lg">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400 mx-auto"></div>
                        <p className="mt-4 text-lg font-semibold">{loadingMessage}</p>
                    </div>
                )}
                {videoUrl && (
                    <div>
                        <h3 className="text-xl font-bold text-center mb-4">Your Video is Ready!</h3>
                        <video src={videoUrl} controls autoPlay loop className="w-full rounded-lg shadow-2xl">
                            Your browser does not support the video tag.
                        </video>
                    </div>
                )}
            </div>
        </div>
    );
};
import { GoogleGenAI, Chat, Modality } from '@google/genai';

// --- Helper Functions ---
const fileToGenerativePart = async (file: File) => {
    const base64EncodedDataPromise = new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
        reader.readAsDataURL(file);
    });
    return {
        inlineData: { data: await base64EncodedDataPromise, mimeType: file.type },
    };
};

const getAi = () => {
    const apiKey = process.env.API_KEY;
    if (!apiKey) {
        throw new Error("API_KEY environment variable not set.");
    }
    return new GoogleGenAI({ apiKey });
}

// --- Image Generation & Editing ---
export const generateImage = async (prompt: string, aspectRatio: string): Promise<string> => {
    const ai = getAi();
    const response = await ai.models.generateImages({
        model: 'imagen-4.0-generate-001',
        prompt: prompt,
        config: {
            numberOfImages: 1,
            outputMimeType: 'image/jpeg',
            aspectRatio: aspectRatio,
        },
    });
    return response.generatedImages[0].image.imageBytes;
};

export const editImage = async (imageFile: File, prompt: string): Promise<string> => {
    const ai = getAi();
    const imagePart = await fileToGenerativePart(imageFile);
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: { parts: [imagePart, { text: prompt }] },
        config: { responseModalities: [Modality.IMAGE] },
    });
    const firstPart = response.candidates?.[0]?.content?.parts[0];
    if (firstPart && 'inlineData' in firstPart && firstPart.inlineData) {
        return firstPart.inlineData.data;
    }
    throw new Error("响应中没有图像数据。");
};

export const analyzeImage = async (imageFile: File, prompt: string): Promise<string> => {
    const ai = getAi();
    const imagePart = await fileToGenerativePart(imageFile);
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: { parts: [imagePart, { text: prompt }] },
    });
    return response.text;
};

{/* Fix: Added missing generateVideo function. */}
// --- Video Generation ---
export const generateVideo = async (prompt: string, imageFile: File | null, aspectRatio: '16:9' | '9:16'): Promise<string> => {
    // A new instance is created to ensure the latest API key is used, as required by Veo models.
    const ai = getAi();

    const requestPayload: any = {
        model: 'veo-3.1-fast-generate-preview',
        prompt: prompt,
        config: {
            numberOfVideos: 1,
            resolution: '720p',
            aspectRatio: aspectRatio,
        }
    };
    
    if (imageFile) {
        const imagePart = await fileToGenerativePart(imageFile);
        requestPayload.image = {
            imageBytes: imagePart.inlineData.data,
            mimeType: imagePart.inlineData.mimeType,
        };
    }
    
    let operation = await ai.models.generateVideos(requestPayload);

    while (!operation.done) {
        await new Promise(resolve => setTimeout(resolve, 10000));
        operation = await ai.operations.getVideosOperation({ operation });
    }

    const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
    if (!downloadLink) {
        throw new Error("Video generation did not return a valid download link.");
    }

    const apiKey = process.env.API_KEY;
    if (!apiKey) {
        throw new Error("API_KEY is required to download the generated video.");
    }

    // The response.body contains the MP4 bytes. You must append an API key when fetching from the download link.
    const response = await fetch(`${downloadLink}&key=${apiKey}`);
    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to download video: ${response.statusText} - ${errorText}`);
    }

    const videoBlob = await response.blob();
    return URL.createObjectURL(videoBlob);
};

// --- Chat ---
let chat: Chat | null = null;
export const getChatResponse = async (message: string): Promise<string> => {
    const ai = getAi();
    if (!chat) {
        chat = ai.chats.create({
            model: 'gemini-2.5-flash',
        });
    }
    const response = await chat.sendMessage({ message });
    return response.text;
};

// --- Grounded Search & Maps ---
export const generateWithSearch = async (query: string) => {
    const ai = getAi();
    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: query,
        config: { tools: [{ googleSearch: {} }] },
    });
    return {
        text: response.text,
        sources: response.candidates?.[0]?.groundingMetadata?.groundingChunks || [],
    };
};

export const generateWithMaps = async (query: string, location: { latitude: number, longitude: number }) => {
    const ai = getAi();
    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: query,
        config: {
            tools: [{ googleMaps: {} }],
            toolConfig: {
                retrievalConfig: { latLng: location }
            }
        },
    });
    return {
        text: response.text,
        sources: response.candidates?.[0]?.groundingMetadata?.groundingChunks || [],
    };
};

// --- Text-to-Speech ---
export const generateSpeech = async (text: string) => {
    const ai = getAi();
    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-preview-tts",
        contents: [{ parts: [{ text }] }],
        config: {
            responseModalities: [Modality.AUDIO],
            speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } } },
        },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!base64Audio) throw new Error("响应中没有音频数据。");

    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
    const binaryString = atob(base64Audio);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }

    const dataInt16 = new Int16Array(bytes.buffer);
    const frameCount = dataInt16.length;
    const buffer = audioContext.createBuffer(1, frameCount, 24000);
    const channelData = buffer.getChannelData(0);
    for (let i = 0; i < frameCount; i++) {
        channelData[i] = dataInt16[i] / 32768.0;
    }

    const source = audioContext.createBufferSource();
    source.buffer = buffer;
    source.connect(audioContext.destination);
    source.start();
};
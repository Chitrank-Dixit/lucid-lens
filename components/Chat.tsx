
import React, { useState, useEffect, useRef, FormEvent } from 'react';
import { GoogleGenAI, Chat as GeminiChat } from '@google/genai';
import { ChatMessage } from '../types';
import { SendIcon, UserIcon, SparklesIcon } from './icons';

interface ChatProps {
  dreamTranscription: string;
}

const Chat: React.FC<ChatProps> = ({ dreamTranscription }) => {
  const [chat, setChat] = useState<GeminiChat | null>(null);

  // Lazy initialize state from localStorage
  const [history, setHistory] = useState<ChatMessage[]>(() => {
    try {
      const savedHistoryKey = `chatHistory_${dreamTranscription}`;
      const savedHistory = localStorage.getItem(savedHistoryKey);
      if (savedHistory) {
        return JSON.parse(savedHistory);
      }
    } catch (error) {
      console.error("Could not load chat history from localStorage", error);
    }
    // Return a default welcome message if no history is found or on error
    return [{
      role: 'model',
      text: "I've analyzed your dream. Ask me anything about the symbols or themes you see."
    }];
  });

  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const initChat = () => {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const systemInstruction = `You are an expert in dream analysis. The user's dream was: "${dreamTranscription}". Your role is to answer their follow-up questions about specific symbols or themes from this specific dream. Keep your answers concise and focused on the user's question within the context of their dream.`;

      // Filter out our welcome message, as the model doesn't need it for context.
      const chatHistoryForModel = history
        .filter(msg => !(msg.role === 'model' && msg.text.startsWith("I've analyzed your dream.")))
        .map(msg => ({
          role: msg.role,
          parts: [{ text: msg.text }]
        }));

      const chatSession = ai.chats.create({
        model: 'gemini-2.5-flash',
        history: chatHistoryForModel,
        config: {
          systemInstruction: systemInstruction,
        },
      });
      setChat(chatSession);
    };
    initChat();
    // We intentionally only run this when the dream transcription changes,
    // to initialize the chat with the history loaded from localStorage.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dreamTranscription]);

  // Save history to localStorage whenever it changes.
  useEffect(() => {
    try {
      const savedHistoryKey = `chatHistory_${dreamTranscription}`;
      localStorage.setItem(savedHistoryKey, JSON.stringify(history));
    } catch (error)      {
      console.error("Could not save chat history to localStorage", error);
    }
  }, [history, dreamTranscription]);
  
  useEffect(() => {
    if (chatContainerRef.current) {
        chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [history]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !chat || isLoading) return;

    const userMessage: ChatMessage = { role: 'user', text: input };
    
    // If the history only contains the welcome message, replace it with the new conversation.
    const newHistory = (history.length === 1 && history[0].role === 'model' && history[0].text.startsWith("I've analyzed your dream."))
      ? [userMessage]
      : [...history, userMessage];

    setHistory(newHistory);
    setInput('');
    setIsLoading(true);

    try {
        const result = await chat.sendMessageStream({ message: input });
        let modelResponse = '';
        setHistory(prev => [...prev, { role: 'model', text: '' }]);

        for await (const chunk of result) {
            modelResponse += chunk.text;
            setHistory(prev => {
                const newHistory = [...prev];
                newHistory[newHistory.length - 1].text = modelResponse;
                return newHistory;
            });
        }
    } catch (error) {
        console.error("Chat error:", error);
        setHistory(prev => [...prev, { role: 'model', text: "Sorry, I encountered an error. Please try again." }]);
    } finally {
        setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full p-4">
      <h2 className="text-xl font-bold text-gray-100 border-b border-gray-700 pb-3 mb-4 flex-shrink-0">
        Explore Your Dream
      </h2>
      <div ref={chatContainerRef} className="flex-grow overflow-y-auto pr-2 space-y-4">
        {history.map((msg, index) => (
          <div key={index} className={`flex items-start gap-3 ${msg.role === 'user' ? 'justify-end' : ''}`}>
            {msg.role === 'model' && (
              <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center flex-shrink-0">
                <SparklesIcon className="w-5 h-5 text-white" />
              </div>
            )}
            <div className={`max-w-xs md:max-w-md lg:max-w-lg px-4 py-2 rounded-xl ${msg.role === 'user' ? 'bg-indigo-600 text-white rounded-br-none' : 'bg-gray-700 text-gray-200 rounded-bl-none'}`}>
              <p className="whitespace-pre-wrap">{msg.text}</p>
            </div>
             {msg.role === 'user' && (
              <div className="w-8 h-8 rounded-full bg-gray-600 flex items-center justify-center flex-shrink-0">
                <UserIcon className="w-5 h-5 text-white" />
              </div>
            )}
          </div>
        ))}
         {isLoading && history.length > 0 && history[history.length-1].role === 'user' && (
             <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center flex-shrink-0">
                    <SparklesIcon className="w-5 h-5 text-white" />
                </div>
                <div className="max-w-md px-4 py-2 rounded-xl bg-gray-700 text-gray-200 rounded-bl-none">
                    <div className="flex items-center space-x-1">
                        <span className="w-2 h-2 bg-gray-300 rounded-full animate-pulse delay-0"></span>
                        <span className="w-2 h-2 bg-gray-300 rounded-full animate-pulse delay-150"></span>
                        <span className="w-2 h-2 bg-gray-300 rounded-full animate-pulse delay-300"></span>
                    </div>
                </div>
            </div>
         )}
      </div>
      <form onSubmit={handleSubmit} className="mt-4 flex-shrink-0">
        <div className="flex items-center bg-gray-800 rounded-lg p-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about a symbol..."
            className="flex-grow bg-transparent text-white placeholder-gray-400 focus:outline-none"
            disabled={isLoading}
          />
          <button type="submit" disabled={isLoading || !input.trim()} className="p-2 rounded-full bg-indigo-600 text-white disabled:bg-gray-600 disabled:cursor-not-allowed hover:bg-indigo-500 transition-colors">
            <SendIcon className="w-5 h-5" />
          </button>
        </div>
      </form>
    </div>
  );
};

export default Chat;

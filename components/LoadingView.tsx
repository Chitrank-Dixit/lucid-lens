
import React, { useState, useEffect } from 'react';

const loadingMessages = [
  "Transcribing the echoes of your dream...",
  "Weaving the visuals from slumber...",
  "Consulting the collective unconscious...",
  "Translating symbols into insights...",
  "Painting with pixels of perception..."
];

const LoadingView: React.FC = () => {
  const [messageIndex, setMessageIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setMessageIndex((prevIndex) => (prevIndex + 1) % loadingMessages.length);
    }, 2500);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gradient-to-b from-gray-900 to-indigo-900 text-center p-4">
      <div className="w-16 h-16 border-4 border-dashed rounded-full animate-spin border-purple-400 mb-6"></div>
      <h2 className="text-2xl font-bold text-gray-200 mb-2">Analyzing Your Dream</h2>
      <p className="text-lg text-indigo-300 transition-opacity duration-500">
        {loadingMessages[messageIndex]}
      </p>
    </div>
  );
};

export default LoadingView;

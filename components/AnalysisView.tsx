
import React from 'react';
import { DreamAnalysis } from '../types';
import Chat from './Chat';

// A simple markdown renderer
const SimpleMarkdown: React.FC<{ content: string }> = ({ content }) => {
    const htmlContent = content
        .replace(/### (.*)/g, '<h3 class="text-xl font-bold text-purple-300 mt-4 mb-2">$1</h3>')
        .replace(/\*\*(.*)\*\*/g, '<strong>$1</strong>')
        .replace(/\* (.*)/g, '<li class="ml-4 list-disc">$1</li>');

    return <div className="prose prose-invert text-gray-300" dangerouslySetInnerHTML={{ __html: htmlContent }} />;
};


interface AnalysisViewProps {
  analysis: DreamAnalysis;
  onReset: () => void;
}

const AnalysisView: React.FC<AnalysisViewProps> = ({ analysis, onReset }) => {
  return (
    <div className="min-h-screen w-full mx-auto p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl md:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-indigo-500">
            Dream Analysis
            </h1>
            <button
                onClick={onReset}
                className="px-5 py-2 bg-indigo-600 text-white font-semibold rounded-lg shadow-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 focus:ring-offset-gray-900 transition-colors"
            >
                New Dream
            </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column: Image and Interpretation */}
          <div className="flex flex-col gap-8">
            <div className="bg-black bg-opacity-30 rounded-xl shadow-2xl overflow-hidden">
              <img src={analysis.imageUrl} alt="AI-generated representation of the dream" className="w-full h-auto object-cover" />
            </div>
            
            <div className="bg-black bg-opacity-30 rounded-xl shadow-2xl p-6">
                <h2 className="text-2xl font-bold text-gray-100 border-b border-gray-700 pb-2 mb-4">Psychological Interpretation</h2>
                <SimpleMarkdown content={analysis.interpretation} />
            </div>
          </div>

          {/* Right Column: Chat */}
          <div className="bg-black bg-opacity-30 rounded-xl shadow-2xl flex flex-col h-[85vh]">
            <Chat dreamTranscription={analysis.transcription} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalysisView;

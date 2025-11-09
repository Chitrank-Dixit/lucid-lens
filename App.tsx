
import React, { useState, useCallback } from 'react';
import { AppState, DreamAnalysis, ChatMessage } from './types';
import RecorderView from './components/RecorderView';
import LoadingView from './components/LoadingView';
import AnalysisView from './components/AnalysisView';
import { generateDreamImage, interpretDream } from './services/geminiService';

const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>(AppState.IDLE);
  const [analysis, setAnalysis] = useState<DreamAnalysis | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [transcribedText, setTranscribedText] = useState<string>('');

  const handleRecordingComplete = useCallback(async (transcription: string) => {
    if (!transcription.trim()) {
      setErrorMessage("The dream transcription is empty. Please try recording again.");
      setAppState(AppState.IDLE);
      return;
    }
    
    setTranscribedText(transcription);
    setAppState(AppState.PROCESSING);
    setErrorMessage(null);

    try {
      const [imageResult, interpretationResult] = await Promise.all([
        generateDreamImage(transcription),
        interpretDream(transcription)
      ]);

      setAnalysis({
        transcription: transcription,
        imageUrl: imageResult,
        interpretation: interpretationResult,
      });
      setAppState(AppState.ANALYSIS);
    } catch (error) {
      console.error("Error during dream analysis:", error);
      setErrorMessage("Sorry, something went wrong while analyzing your dream. Please try again.");
      setAppState(AppState.ERROR);
    }
  }, []);

  const handleReset = () => {
    setAppState(AppState.IDLE);
    setAnalysis(null);
    setErrorMessage(null);
    setTranscribedText('');
  };

  const renderContent = () => {
    switch (appState) {
      case AppState.IDLE:
      case AppState.RECORDING:
        return <RecorderView onRecordingComplete={handleRecordingComplete} setAppState={setAppState} appState={appState} />;
      case AppState.PROCESSING:
        return <LoadingView />;
      case AppState.ANALYSIS:
        return analysis && <AnalysisView analysis={analysis} onReset={handleReset} />;
      case AppState.ERROR:
        return (
          <div className="flex flex-col items-center justify-center h-screen bg-gray-900 text-center p-4">
            <h2 className="text-2xl font-bold text-red-500 mb-4">An Error Occurred</h2>
            <p className="text-gray-300 mb-6">{errorMessage}</p>
            <button
              onClick={handleReset}
              className="px-6 py-3 bg-indigo-600 text-white font-semibold rounded-lg shadow-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 focus:ring-offset-gray-900 transition-colors"
            >
              Try Again
            </button>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-indigo-900 font-sans">
      {renderContent()}
    </div>
  );
};

export default App;

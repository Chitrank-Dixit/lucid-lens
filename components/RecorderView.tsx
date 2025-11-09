
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { GoogleGenAI, LiveSession, LiveServerMessage, Modality, Blob } from '@google/genai';
import { AppState } from '../types';
import { MicrophoneIcon } from './icons';

interface RecorderViewProps {
  onRecordingComplete: (transcription: string) => void;
  setAppState: (state: AppState) => void;
  appState: AppState;
}

// Helper function from Gemini documentation
function encode(bytes: Uint8Array) {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

const RecorderView: React.FC<RecorderViewProps> = ({ onRecordingComplete, setAppState, appState }) => {
  const [transcription, setTranscription] = useState('');
  const [error, setError] = useState<string | null>(null);
  const sessionRef = useRef<LiveSession | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const mediaStreamSourceRef = useRef<MediaStreamAudioSourceNode | null>(null);

  const startRecording = useCallback(async () => {
    setAppState(AppState.RECORDING);
    setError(null);
    setTranscription('');

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-09-2025',
        callbacks: {
          onopen: () => {
            console.log('Session opened.');
            audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
            mediaStreamSourceRef.current = audioContextRef.current.createMediaStreamSource(stream);
            processorRef.current = audioContextRef.current.createScriptProcessor(4096, 1, 1);
            
            processorRef.current.onaudioprocess = (audioProcessingEvent) => {
              const inputData = audioProcessingEvent.inputBuffer.getChannelData(0);
              const pcmBlob: Blob = {
                data: encode(new Uint8Array(new Int16Array(inputData.map(x => x * 32768)).buffer)),
                mimeType: 'audio/pcm;rate=16000',
              };
              sessionPromise.then((session) => {
                 session.sendRealtimeInput({ media: pcmBlob });
              });
            };

            mediaStreamSourceRef.current.connect(processorRef.current);
            processorRef.current.connect(audioContextRef.current.destination);
          },
          onmessage: (message: LiveServerMessage) => {
            if (message.serverContent?.inputTranscription) {
              setTranscription(prev => prev + message.serverContent.inputTranscription.text);
            }
             if (message.serverContent?.turnComplete) {
                // We handle final transcription on stop.
             }
          },
          onerror: (e: ErrorEvent) => {
            console.error('Session error:', e);
            setError('A connection error occurred. Please try again.');
            stopRecording();
          },
          onclose: (e: CloseEvent) => {
            console.log('Session closed.');
          },
        },
        config: {
          inputAudioTranscription: {},
        },
      });

      sessionRef.current = await sessionPromise;

    } catch (err) {
      console.error('Error starting recording:', err);
      setError('Could not access microphone. Please check your browser permissions.');
      setAppState(AppState.IDLE);
    }
  }, [setAppState]);

  const stopRecording = useCallback(() => {
    if (sessionRef.current) {
      sessionRef.current.close();
      sessionRef.current = null;
    }
    if (processorRef.current) {
      processorRef.current.disconnect();
      processorRef.current = null;
    }
    if (mediaStreamSourceRef.current) {
        mediaStreamSourceRef.current.disconnect();
        mediaStreamSourceRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    
    // Pass the final transcription
    onRecordingComplete(transcription);
  }, [onRecordingComplete, transcription]);

  useEffect(() => {
    return () => { // Cleanup on unmount
      if (sessionRef.current) {
        sessionRef.current.close();
      }
    };
  }, []);

  const isRecording = appState === AppState.RECORDING;

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center bg-gradient-to-b from-gray-900 to-indigo-900">
      <div className="w-full max-w-2xl">
        <h1 className="text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-indigo-500 mb-4">
          Lucid Lens
        </h1>
        <p className="text-lg md:text-xl text-gray-300 mb-8">
          {isRecording ? "I'm listening... tell me about your dream." : "When you're ready, press the button and describe your dream."}
        </p>

        <div className="relative mb-8">
          <button
            onClick={isRecording ? stopRecording : startRecording}
            className={`relative w-28 h-28 md:w-32 md:h-32 rounded-full flex items-center justify-center transition-all duration-300 ease-in-out shadow-lg focus:outline-none focus:ring-4 ${isRecording ? 'bg-red-600 hover:bg-red-700 focus:ring-red-400 animate-pulse' : 'bg-indigo-600 hover:bg-indigo-700 focus:ring-indigo-400'}`}
          >
            <MicrophoneIcon className="w-12 h-12 md:w-14 md:h-14 text-white" />
          </button>
        </div>

        {error && <p className="text-red-400 mb-4">{error}</p>}

        <div className="bg-black bg-opacity-20 rounded-lg p-4 min-h-[150px] w-full text-left">
            <p className="text-gray-200 whitespace-pre-wrap">{transcription || "Your transcribed dream will appear here..."}</p>
        </div>
      </div>
    </div>
  );
};

export default RecorderView;

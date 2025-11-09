
export enum AppState {
  IDLE,
  RECORDING,
  PROCESSING,
  ANALYSIS,
  ERROR
}

export interface DreamAnalysis {
  transcription: string;
  imageUrl: string;
  interpretation: string;
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}

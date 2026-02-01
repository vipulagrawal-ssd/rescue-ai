
import React, { useState, useEffect, useRef } from 'react';
import { playBeep } from '../utils/audioUtils';

interface VoiceInputProps {
  onTranscript: (text: string) => void;
  isProcessing: boolean;
  isDarkMode?: boolean;
}

const VoiceInput: React.FC<VoiceInputProps> = ({ onTranscript, isProcessing, isDarkMode }) => {
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = 'en-US';

      recognitionRef.current.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        onTranscript(transcript);
        setIsListening(false);
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current.onerror = (event: any) => {
        console.error('Speech recognition error', event.error);
        setIsListening(false);
      };
    }
  }, [onTranscript]);

  const initAudioContext = () => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (audioContextRef.current.state === 'suspended') {
      audioContextRef.current.resume();
    }
  };

  const toggleListening = () => {
    initAudioContext();
    if (isListening) {
      playBeep(audioContextRef.current!, 'end');
      recognitionRef.current?.stop();
    } else {
      playBeep(audioContextRef.current!, 'start');
      recognitionRef.current?.start();
      setIsListening(true);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center p-8 space-y-6">
      <div className="relative">
        {isListening && (
          <div className={`absolute inset-0 opacity-20 rounded-full pulse-animation -m-4 ${
            isDarkMode ? 'bg-blue-400' : 'bg-yellow-400'
          }`}></div>
        )}
        <button
          onClick={toggleListening}
          disabled={isProcessing}
          className={`h-24 w-24 rounded-full flex items-center justify-center text-white shadow-xl transition-all duration-300 transform active:scale-90 ${
            isListening 
              ? 'bg-red-500 scale-110' 
              : isDarkMode ? 'bg-blue-600 hover:bg-blue-700' : 'bg-yellow-500 hover:bg-yellow-600'
          } ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          <i className={`fas ${isListening ? 'fa-stop' : 'fa-microphone'} text-3xl`}></i>
        </button>
      </div>
      
      <div className="text-center">
        <h2 className={`text-2xl font-bold transition-colors ${isDarkMode ? 'text-slate-100' : 'text-gray-800'}`}>
          {isListening ? 'Listening...' : 'Need Assistance?'}
        </h2>
        <p className={`mt-2 transition-colors ${isDarkMode ? 'text-slate-500' : 'text-gray-500'}`}>
          {isListening 
            ? 'Tell us what happened and where you are' 
            : 'Press the mic and speak naturally'}
        </p>
      </div>
      
      {isListening && (
        <div className="flex gap-1 items-center justify-center h-4">
          {[...Array(5)].map((_, i) => (
            <div 
              key={i} 
              className={`w-1 rounded-full animate-bounce ${isDarkMode ? 'bg-blue-500' : 'bg-yellow-500'}`}
              style={{ animationDelay: `${i * 0.1}s`, height: `${Math.random() * 20 + 10}px` }}
            ></div>
          ))}
        </div>
      )}
    </div>
  );
};

export default VoiceInput;

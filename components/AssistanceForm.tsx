
import React, { useState } from 'react';

interface AssistanceFormProps {
  onSubmit: (text: string) => void;
  isProcessing: boolean;
  isDarkMode?: boolean;
}

const AssistanceForm: React.FC<AssistanceFormProps> = ({ onSubmit, isProcessing, isDarkMode }) => {
  const [text, setText] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (text.trim() && !isProcessing) {
      onSubmit(text);
      setText('');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-md px-4 mt-6">
      <div className="relative">
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Or type your emergency here..."
          disabled={isProcessing}
          className={`w-full pl-4 pr-12 py-4 border rounded-2xl shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all disabled:opacity-50 ${
            isDarkMode 
              ? 'bg-slate-900 border-slate-800 text-slate-100 placeholder-slate-600' 
              : 'bg-white border-gray-200 text-gray-800 placeholder-gray-400'
          }`}
        />
        <button
          type="submit"
          disabled={!text.trim() || isProcessing}
          className={`absolute right-2 top-2 h-10 w-10 flex items-center justify-center rounded-xl transition-all disabled:opacity-30 ${
            isDarkMode ? 'bg-blue-600 text-white' : 'bg-gray-900 text-white'
          }`}
        >
          <i className="fas fa-arrow-up"></i>
        </button>
      </div>
      <div className="mt-4 flex flex-wrap gap-2 justify-center">
        {['Flat tyre', 'Battery jump', 'Towing', 'No fuel'].map((chip) => (
          <button
            key={chip}
            type="button"
            onClick={() => onSubmit(chip)}
            className={`px-4 py-1.5 text-xs font-medium rounded-full transition-colors ${
              isDarkMode 
                ? 'bg-slate-800 text-slate-400 hover:bg-slate-700' 
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {chip}
          </button>
        ))}
      </div>
    </form>
  );
};

export default AssistanceForm;

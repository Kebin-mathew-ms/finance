import React, { useState, useRef, useEffect } from 'react';
import { Mic, Square, Trash2, Check, RefreshCw } from 'lucide-react';
import Button from './Button';

const AudioRecorder = ({ onRecordComplete, onCancel }) => {
  const [recording, setRecording] = useState(false);
  const [duration, setDuration] = useState(0);
  const [audioBlob, setAudioBlob] = useState(null);
  const [audioUrl, setAudioUrl] = useState(null);
  
  const mediaRecorderRef = useRef(null);
  const timerRef = useRef(null);
  const chunksRef = useRef([]);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (audioUrl) URL.revokeObjectURL(audioUrl);
    };
  }, [audioUrl]);

  const startRecording = async () => {
    chunksRef.current = [];
    setAudioBlob(null);
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
      setAudioUrl(null);
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      // Choose standard audio mime-type
      const options = { mimeType: 'audio/webm' };
      let recorder;
      try {
        recorder = new MediaRecorder(stream, options);
      } catch (e) {
        // Fallback for browsers (like Safari) which do not support webm audio
        recorder = new MediaRecorder(stream);
      }

      mediaRecorderRef.current = recorder;
      
      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      recorder.onstop = () => {
        const mimeType = recorder.mimeType || 'audio/wav';
        const blob = new Blob(chunksRef.current, { type: mimeType });
        const url = URL.createObjectURL(blob);
        setAudioBlob(blob);
        setAudioUrl(url);
        
        // Stop all track streams to release microphone
        stream.getTracks().forEach(track => track.stop());
      };

      recorder.start(250); // slices data every 250ms
      setRecording(true);
      setDuration(0);
      
      timerRef.current = setInterval(() => {
        setDuration(prev => prev + 1);
      }, 1000);

    } catch (err) {
      console.error("Failed to access microphone stream:", err);
      alert("Microphone access denied or not supported in this browser.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && recording) {
      mediaRecorderRef.current.stop();
      setRecording(false);
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  };

  const resetRecorder = () => {
    setAudioBlob(null);
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
      setAudioUrl(null);
    }
    setDuration(0);
  };

  const handleConfirm = () => {
    if (audioBlob && onRecordComplete) {
      onRecordComplete(audioBlob);
    }
  };

  const formatDuration = (sec) => {
    const m = Math.floor(sec / 60).toString().padStart(2, '0');
    const s = (sec % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  return (
    <div className="flex flex-col items-center p-6 border border-zinc-800 bg-zinc-950/40 rounded-2xl max-w-sm mx-auto space-y-5">
      <div className="text-center">
        <h4 className="text-sm font-bold text-zinc-200">Voice Command Dictation</h4>
        <p className="text-[10px] text-zinc-500 mt-1">Speak clearly to describe your transactions</p>
      </div>

      {/* Visual recording node */}
      <div className="relative w-28 h-28 flex items-center justify-center">
        {recording && (
          <span className="absolute inset-0 rounded-full bg-accent-rose/10 border border-accent-rose/25 animate-ping duration-1000"></span>
        )}
        <div className={`w-24 h-24 rounded-full flex flex-col items-center justify-center border transition-all ${
          recording 
            ? 'border-accent-rose bg-accent-rose/5 text-accent-rose shadow-lg shadow-accent-rose/15' 
            : 'border-zinc-800 bg-zinc-900/60 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200'
        }`}>
          {recording ? (
            <div className="flex flex-col items-center">
              <Square className="h-6 w-6 shrink-0 fill-current" onClick={stopRecording} className="cursor-pointer hover:scale-105 transition" />
              <span className="text-xs font-bold text-zinc-300 mt-2">{formatDuration(duration)}</span>
            </div>
          ) : (
            <Mic className="h-8 w-8 cursor-pointer hover:scale-110 transition shrink-0" onClick={startRecording} />
          )}
        </div>
      </div>

      {audioUrl && !recording && (
        <div className="w-full space-y-3 animate-fade-in">
          <audio src={audioUrl} controls className="w-full h-8 bg-zinc-900 rounded-lg outline-none" />
          
          <div className="flex gap-2 justify-center pt-2">
            <button
              onClick={resetRecorder}
              className="p-2 rounded-lg border border-zinc-850 bg-zinc-900 text-zinc-400 hover:text-white transition"
              title="Redo recording"
            >
              <RefreshCw className="h-4 w-4" />
            </button>
            <Button onClick={handleConfirm} className="text-xs">
              <Check className="h-4 w-4 mr-1" /> Use Recording
            </Button>
          </div>
        </div>
      )}

      {recording && (
        <div className="text-[10px] font-semibold text-accent-rose flex items-center space-x-1.5 animate-pulse">
          <span className="w-2.5 h-2.5 rounded-full bg-accent-rose block shrink-0"></span>
          <span>Recording Speech...</span>
        </div>
      )}
    </div>
  );
};

export default AudioRecorder;

import React, { useState, useRef, useEffect } from 'react';
import { Mic, Square, Check, RefreshCw } from 'lucide-react';
import Button from './Button';

const AudioRecorder = ({ onRecordComplete }) => {
  const [recording, setRecording] = useState(false);
  const [duration, setDuration] = useState(0);
  const [audioBlob, setAudioBlob] = useState(null);
  const [audioUrl, setAudioUrl] = useState(null);

  // Refs — always hold latest values, no stale closures inside callbacks
  const mediaRecorderRef = useRef(null);
  const streamRef = useRef(null);
  const timerRef = useRef(null);
  const chunksRef = useRef([]);
  const recordingRef = useRef(false);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (audioUrl) URL.revokeObjectURL(audioUrl);
    };
  }, [audioUrl]);

  const stopRecording = () => {
    if (!recordingRef.current) return; // guard — uses ref, not stale state

    recordingRef.current = false;
    setRecording(false);

    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (mediaRecorderRef.current) {
      try { mediaRecorderRef.current.stop(); } catch (e) {}
      mediaRecorderRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
  };

  const startRecording = async () => {
    chunksRef.current = [];
    setAudioBlob(null);
    if (audioUrl) { URL.revokeObjectURL(audioUrl); setAudioUrl(null); }
    setDuration(0);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      let recorder;
      try { recorder = new MediaRecorder(stream, { mimeType: 'audio/webm' }); }
      catch (e) { recorder = new MediaRecorder(stream); }

      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType || 'audio/wav' });
        setAudioBlob(blob);
        setAudioUrl(URL.createObjectURL(blob));
      };

      recorder.start(250);
      recordingRef.current = true;
      setRecording(true);

      // Auto-stop at 60 seconds
      timerRef.current = setInterval(() => {
        setDuration(prev => {
          const next = prev + 1;
          if (next >= 60) stopRecording();
          return next;
        });
      }, 1000);

    } catch (err) {
      console.error('Microphone error:', err);
      alert('Microphone access denied or not supported.');
    }
  };

  const resetRecorder = () => {
    setAudioBlob(null);
    if (audioUrl) { URL.revokeObjectURL(audioUrl); setAudioUrl(null); }
    setDuration(0);
  };

  const handleConfirm = () => {
    if (audioBlob && onRecordComplete) onRecordComplete(audioBlob);
  };

  const fmt = (sec) =>
    `${Math.floor(sec / 60).toString().padStart(2, '0')}:${(sec % 60).toString().padStart(2, '0')}`;

  return (
    <div className="flex flex-col items-center p-6 border border-zinc-800 bg-zinc-950/40 rounded-2xl max-w-sm mx-auto space-y-5">
      <div className="text-center">
        <h4 className="text-sm font-bold text-zinc-200">Voice Command Dictation</h4>
        <p className="text-[10px] text-zinc-500 mt-1">Speak clearly to describe your transactions</p>
      </div>

      {/* Full circle is the click target — no tiny icon to miss */}
      <div className="relative w-28 h-28 flex items-center justify-center">
        {recording && (
          <span className="absolute inset-0 rounded-full bg-accent-rose/10 border border-accent-rose/25 animate-ping" />
        )}
        <button
          type="button"
          onClick={recording ? stopRecording : startRecording}
          className={`w-24 h-24 rounded-full flex flex-col items-center justify-center border transition-all focus:outline-none ${
            recording
              ? 'border-accent-rose bg-accent-rose/5 text-accent-rose shadow-lg shadow-accent-rose/15'
              : 'border-zinc-800 bg-zinc-900/60 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200'
          }`}
        >
          {recording ? (
            <div className="flex flex-col items-center pointer-events-none select-none">
              <Square className="h-6 w-6 fill-current shrink-0" />
              <span className="text-xs font-bold text-zinc-300 mt-2">{fmt(duration)}</span>
            </div>
          ) : (
            <Mic className="h-8 w-8 shrink-0" />
          )}
        </button>
      </div>

      {audioUrl && !recording && (
        <div className="w-full space-y-3 animate-fade-in">
          <audio src={audioUrl} controls className="w-full h-8 bg-zinc-900 rounded-lg" />
          <div className="flex gap-2 justify-center pt-2">
            <button
              onClick={resetRecorder}
              className="p-2 rounded-lg border border-zinc-800 bg-zinc-900 text-zinc-400 hover:text-white transition"
              title="Re-record"
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
          <span className="w-2.5 h-2.5 rounded-full bg-accent-rose block shrink-0" />
          <span>Recording... tap circle to stop</span>
        </div>
      )}
    </div>
  );
};

export default AudioRecorder;

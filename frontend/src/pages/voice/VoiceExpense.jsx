import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Mic, ArrowRight, ArrowLeft, HelpCircle } from 'lucide-react';
import AudioRecorder from '../../components/common/AudioRecorder';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import apiClient from '../../api/client';

const convertBlobToWav = async (blob) => {
  try {
    const arrayBuffer = await blob.arrayBuffer();
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
    
    const numChannels = 1;
    const sampleRate = audioBuffer.sampleRate;
    const samples = audioBuffer.getChannelData(0);
    
    const buffer = new ArrayBuffer(44 + samples.length * 2);
    const view = new DataView(buffer);
    
    const writeString = (v, offset, string) => {
      for (let i = 0; i < string.length; i++) {
        v.setUint8(offset + i, string.charCodeAt(i));
      }
    };

    writeString(view, 0, 'RIFF');
    view.setUint32(4, 36 + samples.length * 2, true);
    writeString(view, 8, 'WAVE');
    writeString(view, 12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, numChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * 2, true);
    view.setUint16(32, 2, true);
    view.setUint16(34, 16, true);
    writeString(view, 36, 'data');
    view.setUint32(40, samples.length * 2, true);
    
    let offset = 44;
    for (let i = 0; i < samples.length; i++, offset += 2) {
      const s = Math.max(-1, Math.min(1, samples[i]));
      view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
    }
    
    audioContext.close();
    return new Blob([view], { type: 'audio/wav' });
  } catch (e) {
    console.warn('WAV conversion fallback failed:', e);
    return blob;
  }
};

const VoiceExpense = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const handleRecordComplete = async (rawBlob) => {
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      // 1. Convert audio blob to WAV format for SpeechRecognition compatibility
      const wavBlob = await convertBlobToWav(rawBlob);
      const formData = new FormData();
      const uniqueName = `voice_input_${Date.now()}.wav`;
      formData.append('file', wavBlob, uniqueName);
      
      const uploadRes = await apiClient.post('/files/upload?folder=audio', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      const savedPath = uploadRes.data.saved_path;

      // 2. Trigger voice processing and expense creation
      const processRes = await apiClient.post(`/voice/process?audio_path=${encodeURIComponent(savedPath)}`);
      const expense = processRes.data;

      setSuccess(`Success! Expense created: "${expense.title}" for ${expense.amount} under category ${expense.category}.`);
      
      // Auto redirect to expense lists after 2.5 seconds
      setTimeout(() => {
        navigate('/expense');
      }, 2500);

    } catch (err) {
      console.error(err);
      setError(err.response?.data?.detail || "Voice processing failed. Speak loudly and specify amount & category.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-2xl mx-auto">
      {/* Title block */}
      <div className="flex items-center space-x-3">
        <Link to="/dashboard" className="text-zinc-400 hover:text-zinc-200 transition">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-xl md:text-2xl font-extrabold tracking-tight text-zinc-100">
            Voice Command Expense Entry
          </h1>
          <p className="text-xs text-zinc-400 mt-1">Dictate expense commands to automatically log records</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left column: Tips */}
        <Card title="How to Speak Commands" className="md:col-span-1 flex flex-col justify-between">
          <div className="space-y-4 text-xs text-zinc-400 leading-relaxed">
            <p>Ensure you state the **amount** and **category** keyword clearly in your command.</p>
            <div className="space-y-2.5">
              <h5 className="font-bold text-zinc-300 uppercase tracking-wider text-[10px]">Examples:</h5>
              <div className="border border-white/5 rounded-lg p-2 bg-zinc-905">
                "I spent <span className="font-semibold text-accent-cyan">300 rupees</span> on <span className="font-semibold text-accent-indigo">food</span>"
              </div>
              <div className="border border-white/5 rounded-lg p-2 bg-zinc-905">
                "I paid <span className="font-semibold text-accent-cyan">1200 rupees</span> for <span className="font-semibold text-accent-indigo">electricity bill</span>"
              </div>
              <div className="border border-white/5 rounded-lg p-2 bg-zinc-905">
                "I spent <span className="font-semibold text-accent-cyan">500 rupees</span> on <span className="font-semibold text-accent-indigo">transportation</span>"
              </div>
            </div>
          </div>
        </Card>

        {/* Right column: Mic action */}
        <div className="md:col-span-2 space-y-4">
          {error && (
            <div className="text-xs text-accent-rose bg-accent-rose/10 p-2.5 rounded border border-accent-rose/25">
              ⚠ {error}
            </div>
          )}

          {success && (
            <div className="text-xs text-accent-emerald bg-accent-emerald/10 p-2.5 rounded border border-accent-emerald/25 animate-pulse">
              ✓ {success}
            </div>
          )}

          <Card title="Speech Input Console" subtitle="Click the mic icon below, grant access and start dictating">
            <div className="py-4">
              <AudioRecorder onRecordComplete={handleRecordComplete} />
            </div>
            
            {loading && (
              <div className="text-xs text-zinc-400 text-center animate-pulse py-2">
                Analyzing speech waveform and logging transaction...
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
};

export default VoiceExpense;

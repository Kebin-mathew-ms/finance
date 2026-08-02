import React, { useState, useRef } from 'react';
import { Upload, X, File, Image as ImageIcon, Film, FileText } from 'lucide-react';
import Button from './Button';

const FileUploader = ({ 
  onFileSelect, 
  onClear, 
  allowedExtensions = ['.jpg', '.jpeg', '.png', '.pdf', '.wav', '.mp3'], 
  maxSizeMB = 5,
  label = "Upload receipt or invoice document"
}) => {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [error, setError] = useState('');
  
  const inputRef = useRef(null);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const validateFile = (file) => {
    setError('');
    const name = file.name.toLowerCase();
    const size = file.size;
    const extension = name.substring(name.lastIndexOf('.'));

    // Check extension
    if (!allowedExtensions.includes(extension)) {
      setError(`File type not allowed. Supported extensions: ${allowedExtensions.join(', ')}`);
      return false;
    }

    // Check size limits
    const maxSize = maxSizeMB * 1024 * 1024;
    if (size > maxSize) {
      setError(`File is too large. Size limit is ${maxSizeMB} MB.`);
      return false;
    }

    return true;
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (validateFile(file)) {
        setFile(file);
      }
    }
  };

  const handleChange = (e) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (validateFile(file)) {
        setFile(file);
      }
    }
  };

  const setFile = (file) => {
    setSelectedFile(file);
    onFileSelect(file);

    // Setup preview if image type
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result);
      };
      reader.readAsDataURL(file);
    } else {
      setPreviewUrl(null);
    }
  };

  const handleClear = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setSelectedFile(null);
    setPreviewUrl(null);
    setError('');
    if (inputRef.current) {
      inputRef.current.value = "";
    }
    if (onClear) onClear();
  };

  const handleButtonClick = () => {
    if (inputRef.current) {
      inputRef.current.click();
    }
  };

  return (
    <div className="space-y-2">
      <div
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
        onClick={handleButtonClick}
        className={`relative border-2 border-dashed rounded-xl p-6 transition duration-200 cursor-pointer flex flex-col items-center justify-center min-h-[160px] ${
          dragActive 
            ? "border-accent-indigo bg-accent-indigo/5" 
            : "border-zinc-800 bg-zinc-900/40 hover:border-zinc-700 hover:bg-zinc-800/20"
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          className="hidden"
          onChange={handleChange}
          accept={allowedExtensions.join(',')}
        />

        {selectedFile ? (
          <div className="flex flex-col items-center text-center space-y-3 w-full max-w-xs relative z-10" onClick={e => e.stopPropagation()}>
            {previewUrl ? (
              <div className="w-24 h-24 rounded-lg overflow-hidden border border-white/10 shadow-lg relative shrink-0">
                <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
              </div>
            ) : selectedFile.name.endsWith('.pdf') ? (
              <FileText className="h-12 w-12 text-accent-indigo shrink-0" />
            ) : (
              <File className="h-12 w-12 text-accent-cyan shrink-0" />
            )}
            
            <div className="min-w-0">
              <p className="text-xs font-bold text-zinc-200 truncate">{selectedFile.name}</p>
              <p className="text-[10px] text-zinc-500 mt-0.5">{(selectedFile.size / (1024 * 1024)).toFixed(2)} MB</p>
            </div>

            <button
              onClick={handleClear}
              className="absolute -top-4 -right-4 p-1.5 rounded-full border border-zinc-800 bg-zinc-950 text-zinc-400 hover:text-white hover:bg-zinc-900 shadow-md transition"
              title="Remove file"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        ) : (
          <div className="text-center space-y-2 relative z-10 pointer-events-none">
            <div className="w-10 h-10 rounded-full bg-zinc-950/40 border border-zinc-850 flex items-center justify-center mx-auto text-zinc-400">
              <Upload className="h-5 w-5" />
            </div>
            <p className="text-xs font-bold text-zinc-200">{label}</p>
            <p className="text-[10px] text-zinc-500">
              Drag & drop here or click to browse. Max size {maxSizeMB}MB
            </p>
          </div>
        )}
      </div>
      
      {error && (
        <p className="text-xs text-accent-rose font-medium mt-1">⚠ {error}</p>
      )}
    </div>
  );
};

export default FileUploader;

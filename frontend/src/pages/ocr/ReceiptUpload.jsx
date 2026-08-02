import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Sparkles, ArrowRight, ArrowLeft } from 'lucide-react';
import FileUploader from '../../components/common/FileUploader';
import Button from '../../components/common/Button';
import Card from '../../components/common/Card';
import apiClient from '../../api/client';

const EXPENSE_CATEGORIES = ["Food", "Bills", "Transportation", "Entertainment", "Healthcare", "Shopping", "Education", "Insurance", "Other"];

const ReceiptUpload = () => {
  const navigate = useNavigate();
  const [selectedFile, setSelectedFile] = useState(null);
  const [createExpense, setCreateExpense] = useState(true);
  const [category, setCategory] = useState('Food');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleFileSelect = (file) => {
    setSelectedFile(file);
    setError('');
  };

  const handleClear = () => {
    setSelectedFile(null);
  };

  const handleProcessOCR = async (e) => {
    e.preventDefault();
    if (!selectedFile) {
      setError("Please select a receipt scan image first.");
      return;
    }

    setLoading(true);
    setError('');

    try {
      // 1. Upload raw file to storage provider
      const formData = new FormData();
      formData.append('file', selectedFile);
      
      // Upload using files upload endpoint
      const uploadRes = await apiClient.post('/files/upload?folder=receipts', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      const savedPath = uploadRes.data.saved_path;

      // 2. Trigger OCR extraction
      await apiClient.post(
        `/ocr/process?image_path=${encodeURIComponent(savedPath)}&create_expense=${createExpense}&category=${category}`
      );

      // Redirect to receipt listing logs
      navigate('/ocr/history');

    } catch (err) {
      console.error(err);
      setError(err.response?.data?.detail || "Failed to process receipt. Check image clarity.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-2xl mx-auto">
      {/* Title block */}
      <div className="flex items-center space-x-3">
        <Link to="/ocr/history" className="text-zinc-400 hover:text-zinc-200 transition">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-xl md:text-2xl font-extrabold tracking-tight text-zinc-100">
            Receipt OCR Scanning
          </h1>
          <p className="text-xs text-zinc-400 mt-1">Upload images of bills to automatically extract transaction details</p>
        </div>
      </div>

      <Card hoverable>
        <form onSubmit={handleProcessOCR} className="space-y-5">
          {error && (
            <p className="text-xs text-accent-rose bg-accent-rose/10 p-2.5 rounded border border-accent-rose/25">
              ⚠ {error}
            </p>
          )}

          {/* 1. File Upload Dropzone */}
          <FileUploader
            onFileSelect={handleFileSelect}
            onClear={handleClear}
            allowedExtensions={['.jpg', '.jpeg', '.png']}
            maxSizeMB={5}
            label="Drag & drop receipt image (JPEG, PNG)"
          />

          {/* 2. Auto-generate Expense fields toggle */}
          <div className="space-y-4 pt-2 border-t border-white/5">
            <div className="flex items-center space-x-2">
              <input
                id="create-expense-check"
                type="checkbox"
                checked={createExpense}
                onChange={(e) => setCreateExpense(e.target.checked)}
                className="rounded border-zinc-800 bg-zinc-900 text-accent-indigo focus:ring-accent-indigo focus:ring-offset-background"
              />
              <label htmlFor="create-expense-check" className="text-xs font-semibold text-zinc-300 cursor-pointer">
                Auto-generate matching Expense record in transaction list
              </label>
            </div>

            {createExpense && (
              <div className="flex flex-col space-y-1.5 max-w-xs animate-fade-in pl-5">
                <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Expense Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="block w-full bg-zinc-900 border border-zinc-800 rounded-lg text-sm text-zinc-100 pr-3 py-2 focus:outline-none focus:ring-2 focus:ring-accent-indigo"
                >
                  {EXPENSE_CATEGORIES.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* 3. Process button */}
          <div className="pt-2 flex justify-end gap-3">
            <Link to="/ocr/history">
              <Button variant="outline" type="button">Cancel</Button>
            </Link>
            <Button type="submit" loading={loading} disabled={!selectedFile}>
              <Sparkles className="h-4 w-4 mr-1 text-accent-cyan" /> Scan and Extract
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};

export default ReceiptUpload;

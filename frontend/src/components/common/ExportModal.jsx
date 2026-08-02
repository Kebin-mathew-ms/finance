import React, { useState } from 'react';
import { Download, FileSpreadsheet, FileText, Calendar, X } from 'lucide-react';
import Modal from './Modal';
import Button from './Button';
import apiClient from '../../api/client';

const ExportModal = ({ isOpen, onClose }) => {
  const [module, setModule] = useState('income');
  const [format, setFormat] = useState('csv');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleExport = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      let url = `/export/${format}?module=${module}`;
      if (startDate) url += `&start_date=${startDate}`;
      if (endDate) url += `&end_date=${endDate}`;

      const response = await apiClient.get(url, { responseType: 'blob' });
      
      // Determine filename from content disposition or fallback
      const contentDisposition = response.headers['content-disposition'];
      let filename = `${module}_export.${format}`;
      if (contentDisposition) {
        const matches = /filename="?([^"]+)"?/.exec(contentDisposition);
        if (matches && matches[1]) {
          filename = matches[1];
        }
      }

      // Trigger browser download dialog
      const blob = new Blob([response.data], { type: response.headers['content-type'] });
      const downloadUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      
      // Clean up DOM objects
      link.remove();
      URL.revokeObjectURL(downloadUrl);
      onClose();

    } catch (err) {
      console.error(err);
      setError('Failed to generate export file. Check parameter bounds.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Export Financial Data"
    >
      <form onSubmit={handleExport} className="space-y-4">
        {error && (
          <p className="text-xs text-accent-rose bg-accent-rose/10 p-2 rounded border border-accent-rose/25">
            ⚠ {error}
          </p>
        )}

        {/* 1. Module Selector */}
        <div className="flex flex-col space-y-1.5">
          <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Export Module</label>
          <select
            value={module}
            onChange={(e) => setModule(e.target.value)}
            className="block w-full bg-zinc-900 border border-zinc-800 rounded-lg text-sm text-zinc-100 pr-3 py-2 focus:outline-none focus:ring-2 focus:ring-accent-indigo"
          >
            <option value="income">Incomes</option>
            <option value="expense">Expenses</option>
            <option value="budget">Budgets</option>
            <option value="goal">Savings Goals</option>
            <option value="reminder">Bill Reminders</option>
          </select>
        </div>

        {/* 2. Format Selector cards */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider block">File Format</label>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => setFormat('csv')}
              className={`p-3 border rounded-lg flex flex-col items-center justify-center space-y-1 transition duration-150 ${
                format === 'csv'
                  ? 'border-accent-cyan bg-accent-cyan/10 text-accent-cyan'
                  : 'border-zinc-800 bg-zinc-900/40 text-zinc-400 hover:border-zinc-755'
              }`}
            >
              <FileSpreadsheet className="h-5 w-5" />
              <span className="text-[10px] font-bold">CSV</span>
            </button>
            
            <button
              type="button"
              onClick={() => setFormat('xlsx')}
              className={`p-3 border rounded-lg flex flex-col items-center justify-center space-y-1 transition duration-150 ${
                format === 'xlsx'
                  ? 'border-accent-indigo bg-accent-indigo/10 text-accent-indigo'
                  : 'border-zinc-800 bg-zinc-900/40 text-zinc-400 hover:border-zinc-755'
              }`}
            >
              <FileSpreadsheet className="h-5 w-5" />
              <span className="text-[10px] font-bold">Excel (.xlsx)</span>
            </button>
            
            <button
              type="button"
              onClick={() => setFormat('pdf')}
              className={`p-3 border rounded-lg flex flex-col items-center justify-center space-y-1 transition duration-150 ${
                format === 'pdf'
                  ? 'border-accent-rose bg-accent-rose/10 text-accent-rose'
                  : 'border-zinc-800 bg-zinc-900/40 text-zinc-400 hover:border-zinc-755'
              }`}
            >
              <FileText className="h-5 w-5" />
              <span className="text-[10px] font-bold">PDF Sheet</span>
            </button>
          </div>
        </div>

        {/* 3. Date Filters */}
        <div className="grid grid-cols-2 gap-3 pt-2">
          <div className="flex flex-col space-y-1">
            <label className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider block">Start Date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="block w-full bg-zinc-900 border border-zinc-800 rounded-lg text-xs text-zinc-100 px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-accent-indigo"
            />
          </div>
          <div className="flex flex-col space-y-1">
            <label className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider block">End Date</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="block w-full bg-zinc-900 border border-zinc-800 rounded-lg text-xs text-zinc-100 px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-accent-indigo"
            />
          </div>
        </div>

        {/* 4. Controls */}
        <div className="flex justify-end gap-2 pt-3 border-t border-white/5">
          <Button variant="outline" type="button" onClick={onClose}>Cancel</Button>
          <Button type="submit" loading={loading}>
            <Download className="h-4 w-4 mr-1" /> Download
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default ExportModal;

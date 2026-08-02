import React from 'react';
import { FileText, Calendar, DollarSign, Award, X } from 'lucide-react';
import Modal from './Modal';
import { formatCurrency, formatDate } from '../../utils/formatters';

const ReceiptViewer = ({ isOpen, onClose, receipt }) => {
  if (!receipt) return null;

  const imageUrl = `http://localhost:8000/api/v1/files/${receipt.image_path}`;
  const confidence = parseFloat(receipt.confidence_score);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Receipt OCR Inspection"
      size="lg"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-h-[75vh] overflow-y-auto pr-1">
        {/* Left column: Receipt scan image */}
        <div className="rounded-xl border border-zinc-800 bg-zinc-950 overflow-hidden min-h-[300px] flex items-center justify-center relative shadow-inner">
          <img 
            src={imageUrl} 
            alt="Receipt Scan" 
            className="max-h-[400px] max-w-full object-contain" 
            onError={(e) => {
              e.target.src = "https://via.placeholder.com/300x400?text=Receipt+Image+Not+Found";
            }}
          />
        </div>

        {/* Right column: Extracted metadata details */}
        <div className="space-y-4">
          <div className="border-b border-white/5 pb-3">
            <h4 className="text-base font-bold text-zinc-100">{receipt.merchant_name || 'Unknown Store'}</h4>
            <div className="flex items-center space-x-1.5 mt-1.5">
              <span className={`px-2 py-0.5 text-[10px] font-bold rounded border ${
                confidence > 80 
                  ? 'bg-accent-emerald/10 border-accent-emerald/20 text-accent-emerald' 
                  : confidence > 50 
                  ? 'bg-amber-500/10 border-amber-500/20 text-amber-500' 
                  : 'bg-accent-rose/10 border-accent-rose/20 text-accent-rose'
              }`}>
                Confidence: {confidence.toFixed(1)}%
              </span>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm py-1 border-b border-white/5">
              <span className="text-zinc-500 font-medium flex items-center">
                <Calendar className="h-4 w-4 mr-2 text-zinc-600 shrink-0" /> Date
              </span>
              <span className="font-bold text-zinc-300">
                {receipt.transaction_date ? formatDate(receipt.transaction_date) : 'N/A'}
              </span>
            </div>

            <div className="flex items-center justify-between text-sm py-1 border-b border-white/5">
              <span className="text-zinc-500 font-medium flex items-center">
                <DollarSign className="h-4 w-4 mr-2 text-zinc-600 shrink-0" /> Tax Amount
              </span>
              <span className="font-bold text-zinc-300">
                {receipt.tax_amount ? formatCurrency(receipt.tax_amount) : '$0.00'}
              </span>
            </div>

            <div className="flex items-center justify-between text-sm py-1 border-b border-white/5">
              <span className="text-zinc-500 font-medium flex items-center">
                <DollarSign className="h-4 w-4 mr-2 text-zinc-600 shrink-0" /> Total Amount
              </span>
              <span className="font-bold text-accent-emerald text-base">
                {receipt.total_amount ? formatCurrency(receipt.total_amount) : '$0.00'}
              </span>
            </div>

            <div className="flex items-center justify-between text-sm py-1 border-b border-white/5">
              <span className="text-zinc-500 font-medium flex items-center">
                <Award className="h-4 w-4 mr-2 text-zinc-600 shrink-0" /> Linked Expense ID
              </span>
              <span className="font-semibold text-zinc-400">
                {receipt.expense_id ? `#${receipt.expense_id}` : 'None'}
              </span>
            </div>

            <div className="flex items-center justify-between text-sm py-1 border-b border-white/5">
              <span className="text-zinc-500 font-medium flex items-center">
                <FileText className="h-4 w-4 mr-2 text-zinc-600 shrink-0" /> File Path
              </span>
              <span className="text-[10px] text-zinc-500 truncate max-w-[180px]" title={receipt.image_path}>
                {receipt.image_path}
              </span>
            </div>
          </div>

          <div className="pt-4 flex justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-zinc-800 bg-zinc-900 text-sm font-semibold text-zinc-400 hover:text-white hover:bg-zinc-800 transition duration-150"
            >
              Close Details
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default ReceiptViewer;

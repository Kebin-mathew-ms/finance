import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Eye, Trash2, Calendar, FileText, Award, AlertTriangle } from 'lucide-react';
import apiClient from '../../api/client';
import { formatCurrency, formatDate } from '../../utils/formatters';
import Button from '../../components/common/Button';
import Card from '../../components/common/Card';
import Table from '../../components/common/Table';
import Modal from '../../components/common/Modal';
import ReceiptViewer from '../../components/common/ReceiptViewer';

const ReceiptHistory = () => {
  const [receipts, setReceipts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);

  // Inspector Modal states
  const [activeReceipt, setActiveReceipt] = useState(null);
  
  // Delete Modal States
  const [deleteId, setDeleteId] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const fetchReceipts = async () => {
    setLoading(true);
    try {
      // Receipt items paginated
      const res = await apiClient.get(`/ocr?page=${page}&size=10`);
      setReceipts(res.data.items || []);
      setTotalCount(res.data.total_count || 0);
      setPages(res.data.pages || 1);
    } catch (err) {
      console.error("Error loading receipt history:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReceipts();
  }, [page]);

  const openDeleteModal = (id) => {
    setDeleteId(id);
  };

  const closeDeleteModal = () => {
    setDeleteId(null);
  };

  const handleConfirmDelete = async () => {
    setDeleteLoading(true);
    try {
      await apiClient.delete(`/ocr/${deleteId}`);
      closeDeleteModal();
      if (receipts.length === 1 && page > 1) {
        setPage(page - 1);
      } else {
        fetchReceipts();
      }
    } catch (err) {
      console.error("Failed to delete receipt record:", err);
    } finally {
      setDeleteLoading(false);
    }
  };

  const renderRow = (receipt) => {
    const confidence = parseFloat(receipt.confidence_score);
    const confidenceChip = confidence > 80 
      ? 'bg-accent-emerald/10 text-accent-emerald border-accent-emerald/20' 
      : confidence > 50 
      ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' 
      : 'bg-accent-rose/10 text-accent-rose border-accent-rose/20';

    return (
      <tr key={receipt.receipt_id} className="hover:bg-white/2 transition duration-150">
        <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-zinc-300">
          {receipt.transaction_date ? formatDate(receipt.transaction_date) : '—'}
        </td>
        <td className="px-6 py-4 text-sm font-medium text-zinc-100 max-w-xs truncate">
          {receipt.merchant_name || 'Unknown Store'}
        </td>
        <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-zinc-200">
          {receipt.total_amount ? formatCurrency(receipt.total_amount) : '$0.00'}
        </td>
        <td className="px-6 py-4 whitespace-nowrap text-xs font-semibold">
          <span className={`px-2 py-0.5 rounded border ${confidenceChip}`}>
            {confidence.toFixed(0)}% Match
          </span>
        </td>
        <td className="px-6 py-4 whitespace-nowrap text-xs font-semibold text-zinc-400">
          {receipt.expense_id ? `Linked #${receipt.expense_id}` : 'None'}
        </td>
        <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-300 flex items-center space-x-2">
          <button
            onClick={() => setActiveReceipt(receipt)}
            className="p-1.5 rounded-lg border border-zinc-800 text-accent-cyan bg-zinc-900/60 hover:bg-zinc-800 hover:text-white transition duration-150"
            title="Inspect scans"
          >
            <Eye className="h-4 w-4" />
          </button>
          <button
            onClick={() => openDeleteModal(receipt.receipt_id)}
            className="p-1.5 rounded-lg border border-zinc-800 text-accent-rose bg-zinc-900/60 hover:bg-accent-rose/10 transition duration-150"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </td>
      </tr>
    );
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Title bar */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-extrabold tracking-tight text-zinc-100">
            Receipt Scanning History
          </h1>
          <p className="text-xs text-zinc-400 mt-1">Review OCR document metrics and parsed expense parameters</p>
        </div>
        <div>
          <Link to="/ocr/upload">
            <Button>
              <Plus className="h-4 w-4 mr-1" />
              Scan New Receipt
            </Button>
          </Link>
        </div>
      </div>

      {/* Receipts Ledger Table */}
      <Card title={`Scanned Documents (${totalCount})`}>
        <Table
          headers={["Receipt Date", "Merchant Name", "Total Amount", "OCR Match", "Expense Link", "Actions"]}
          items={receipts}
          renderRow={renderRow}
          page={page}
          pages={pages}
          onPageChange={setPage}
          totalCount={totalCount}
          loading={loading}
          emptyMessage="No receipts scanned yet."
        />
      </Card>

      {/* Scans Inspector Modal */}
      <ReceiptViewer
        isOpen={activeReceipt !== null}
        onClose={() => setActiveReceipt(null)}
        receipt={activeReceipt}
      />

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={deleteId !== null}
        onClose={closeDeleteModal}
        title="Delete Receipt Scan"
        onConfirm={handleConfirmDelete}
        confirmText="Delete Receipt"
        confirmVariant="danger"
        loading={deleteLoading}
      >
        <div className="flex items-center space-x-3 text-zinc-300">
          <AlertTriangle className="h-8 w-8 text-accent-rose shrink-0" />
          <p>Are you sure you want to permanently delete this receipt scan? The image file will be removed from storage.</p>
        </div>
      </Modal>
    </div>
  );
};

export default ReceiptHistory;

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Calendar, 
  Search, 
  Image as ImageIcon, 
  Eye, 
  AlertTriangle,
  RotateCcw
} from 'lucide-react';
import apiClient from '../../api/client';
import { formatCurrency, formatDate } from '../../utils/formatters';
import Button from '../../components/common/Button';
import Card from '../../components/common/Card';
import Table from '../../components/common/Table';
import Modal from '../../components/common/Modal';
import Input from '../../components/common/Input';

const EXPENSE_CATEGORIES = ["Food", "Bills", "Transportation", "Entertainment", "Healthcare", "Shopping", "Education", "Insurance", "Other"];

const ExpenseList = () => {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);

  // Filters State
  const [category, setCategory] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [search, setSearch] = useState('');

  // Delete Modal States
  const [deleteId, setDeleteId] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Receipt Modal View States
  const [viewReceiptPath, setViewReceiptPath] = useState(null);

  // Monthly summary metrics
  const [monthlyTotal, setMonthlyTotal] = useState(0);

  const fetchExpenses = async () => {
    setLoading(true);
    try {
      let url = `/expense?page=${page}&size=10`;
      if (category) url += `&category=${category}`;
      if (startDate) url += `&start_date=${startDate}`;
      if (endDate) url += `&end_date=${endDate}`;
      if (search) url += `&search=${encodeURIComponent(search)}`;

      const res = await apiClient.get(url);
      setExpenses(res.data.items || []);
      setTotalCount(res.data.total_count || 0);
      setPages(res.data.pages || 1);

      // Fetch summary for current month
      const today = new Date();
      const summaryRes = await apiClient.get(`/expense/summary?year=${today.getFullYear()}&month=${today.getMonth() + 1}`);
      setMonthlyTotal(parseFloat(summaryRes.data.total_expense || 0));

    } catch (err) {
      console.error("Error loading expense records:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExpenses();
  }, [page, category, startDate, endDate]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchExpenses();
  };

  const handleResetFilters = () => {
    setCategory('');
    setStartDate('');
    setEndDate('');
    setSearch('');
    setPage(1);
  };

  const openDeleteModal = (id) => {
    setDeleteId(id);
  };

  const closeDeleteModal = () => {
    setDeleteId(null);
  };

  const handleConfirmDelete = async () => {
    setDeleteLoading(true);
    try {
      await apiClient.delete(`/expense/${deleteId}`);
      closeDeleteModal();
      // Reload list
      if (expenses.length === 1 && page > 1) {
        setPage(page - 1);
      } else {
        fetchExpenses();
      }
    } catch (err) {
      console.error("Failed to delete record:", err);
    } finally {
      setDeleteLoading(false);
    }
  };

  const renderRow = (expense) => (
    <tr key={expense.expense_id} className="hover:bg-white/2 transition duration-150">
      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-zinc-300">
        {formatDate(expense.expense_date)}
      </td>
      <td className="px-6 py-4 text-sm font-medium text-zinc-100 max-w-xs truncate">
        {expense.title}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-xs">
        <span className="px-2.5 py-1 rounded-full font-semibold bg-accent-rose/10 text-accent-rose border border-accent-rose/20">
          {expense.category}
        </span>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-accent-rose">
        {formatCurrency(expense.amount)}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-400">
        {expense.receipt_path ? (
          <button
            onClick={() => setViewReceiptPath(expense.receipt_path)}
            className="inline-flex items-center text-xs text-accent-cyan hover:underline font-semibold bg-accent-cyan/10 px-2 py-1 rounded border border-accent-cyan/20"
          >
            <ImageIcon className="h-3.5 w-3.5 mr-1" />
            View
          </button>
        ) : (
          <span className="text-zinc-600 text-xs">None</span>
        )}
      </td>
      <td className="px-6 py-4 text-xs text-zinc-400 max-w-xs truncate">
        {expense.description || '—'}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-300 flex items-center space-x-2">
        <Link to={`/expense/edit/${expense.expense_id}`}>
          <button className="p-1.5 rounded-lg border border-zinc-800 text-zinc-400 bg-zinc-900/60 hover:bg-zinc-800 hover:text-white transition duration-150">
            <Edit className="h-4 w-4" />
          </button>
        </Link>
        <button
          onClick={() => openDeleteModal(expense.expense_id)}
          className="p-1.5 rounded-lg border border-zinc-800 text-accent-rose bg-zinc-900/60 hover:bg-accent-rose/10 transition duration-150"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </td>
    </tr>
  );

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-extrabold tracking-tight text-zinc-100">
            Expenses Tracker
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            Log your daily outflows, manage invoice receipt uploads and scan histories
          </p>
        </div>
        <div>
          <Link to="/expense/add">
            <Button>
              <Plus className="h-4 w-4 mr-1" />
              Add Expense
            </Button>
          </Link>
        </div>
      </div>

      {/* Summary Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card hoverable className="md:col-span-1">
          <span className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider block">Monthly Total Outflow</span>
          <p className="text-3xl font-extrabold text-accent-rose mt-2">{formatCurrency(monthlyTotal)}</p>
          <span className="text-[10px] text-zinc-500 mt-1 block">Summed for current month</span>
        </Card>

        <Card className="md:col-span-2 flex flex-col justify-center">
          <span className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider block mb-2">Invoice Receipts Vault</span>
          <div className="text-xs text-zinc-500">
            Click "View" next to any expense row to view receipt image overlays.
          </div>
        </Card>
      </div>

      {/* Search & Filters */}
      <Card title="Query & Search Filters" hoverable>
        <form onSubmit={handleSearchSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 items-end">
            {/* Direct Database Search */}
            <div className="sm:col-span-2">
              <Input
                label="Search Description / Title"
                placeholder="Search..."
                icon={Search}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <div className="flex flex-col space-y-1.5">
              <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Category</label>
              <select
                value={category}
                onChange={(e) => { setCategory(e.target.value); setPage(1); }}
                className="block w-full bg-zinc-900 border border-zinc-800 rounded-lg text-sm text-zinc-100 pr-3 py-2 transition duration-200 focus:outline-none focus:ring-2 focus:ring-accent-indigo"
              >
                <option value="">All Categories</option>
                {EXPENSE_CATEGORIES.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <div className="flex justify-end space-x-2">
              <Button type="submit" variant="primary" className="text-xs w-full sm:w-auto">
                Search
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Start Date"
              type="date"
              icon={Calendar}
              value={startDate}
              onChange={(e) => { setStartDate(e.target.value); setPage(1); }}
            />
            <Input
              label="End Date"
              type="date"
              icon={Calendar}
              value={endDate}
              onChange={(e) => { setEndDate(e.target.value); setPage(1); }}
            />
          </div>
        </form>

        <div className="flex justify-end mt-4">
          <Button 
            variant="outline" 
            className="text-xs" 
            onClick={handleResetFilters}
            disabled={!category && !startDate && !endDate && !search}
          >
            <RotateCcw className="h-3.5 w-3.5 mr-1" />
            Reset Ledger
          </Button>
        </div>
      </Card>

      {/* Ledger Table */}
      <Card title={`Expense History (${totalCount})`} subtitle="Ledger listing of outflows">
        <Table
          headers={["Date", "Title", "Category", "Amount", "Receipt", "Description", "Actions"]}
          items={expenses}
          renderRow={renderRow}
          page={page}
          pages={pages}
          onPageChange={setPage}
          totalCount={totalCount}
          loading={loading}
          emptyMessage="No expenses logged for current query parameters."
        />
      </Card>

      {/* Delete Modal */}
      <Modal
        isOpen={deleteId !== null}
        onClose={closeDeleteModal}
        title="Delete Outflow Record"
        onConfirm={handleConfirmDelete}
        confirmText="Delete Expense"
        confirmVariant="danger"
        loading={deleteLoading}
      >
        <div className="flex items-center space-x-3 text-zinc-300">
          <AlertTriangle className="h-8 w-8 text-accent-rose shrink-0" />
          <p>Are you sure you want to permanently delete this expense? All uploaded receipt files will be removed from disk.</p>
        </div>
      </Modal>

      {/* Clickable Receipt Image Overlay Modal */}
      <Modal
        isOpen={viewReceiptPath !== null}
        onClose={() => setViewReceiptPath(null)}
        title="Receipt Invoice Image Viewer"
      >
        <div className="flex flex-col items-center justify-center p-2">
          {viewReceiptPath && (
            <img 
              src={`http://localhost:8000/uploads/${viewReceiptPath}`} 
              alt="Receipt Invoice" 
              className="max-w-full max-h-[70vh] rounded-lg object-contain border border-white/10 shadow-lg"
            />
          )}
        </div>
      </Modal>
    </div>
  );
};

export default ExpenseList;

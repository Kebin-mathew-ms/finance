import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Edit, Trash2, Calendar, AlertTriangle, Eye, TrendingUp, HelpCircle } from 'lucide-react';
import apiClient from '../../api/client';
import { formatCurrency } from '../../utils/formatters';
import Button from '../../components/common/Button';
import Card from '../../components/common/Card';
import Table from '../../components/common/Table';
import Modal from '../../components/common/Modal';

const BudgetList = () => {
  const [budgets, setBudgets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);

  // Date Filter defaults to current month/year
  const today = new Date();
  const [month, setMonth] = useState(today.getMonth() + 1);
  const [year, setYear] = useState(today.getFullYear());

  // Delete Modal States
  const [deleteId, setDeleteId] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const fetchBudgets = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get(`/budgets?page=${page}&size=10&year=${year}&month=${month}`);
      setBudgets(res.data.items || []);
      setTotalCount(res.data.total_count || 0);
      setPages(res.data.pages || 1);
    } catch (err) {
      console.error("Error loading budgets:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBudgets();
  }, [page, month, year]);

  const openDeleteModal = (id) => {
    setDeleteId(id);
  };

  const closeDeleteModal = () => {
    setDeleteId(null);
  };

  const handleConfirmDelete = async () => {
    setDeleteLoading(true);
    try {
      await apiClient.delete(`/budgets/${deleteId}`);
      closeDeleteModal();
      if (budgets.length === 1 && page > 1) {
        setPage(page - 1);
      } else {
        fetchBudgets();
      }
    } catch (err) {
      console.error("Failed to delete budget:", err);
    } finally {
      setDeleteLoading(false);
    }
  };

  const renderRow = (budget) => {
    const limit = parseFloat(budget.amount_limit);
    const remaining = parseFloat(budget.remaining_amount);
    const spent = limit - remaining;
    const spentPercentage = Math.min(100, Math.max(0, (spent / limit) * 100));
    
    // Choose status colors
    const isExceeded = budget.status === "EXCEEDED" || remaining < 0;
    const progressColor = isExceeded ? 'bg-accent-rose' : spentPercentage > 85 ? 'bg-amber-500' : 'bg-accent-indigo';

    return (
      <tr key={budget.budget_id} className="hover:bg-white/2 transition duration-150">
        <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-zinc-300">
          {budget.year}-{budget.month.toString().padStart(2, '0')}
        </td>
        <td className="px-6 py-4 text-sm font-medium text-zinc-100 max-w-xs truncate">
          {budget.title}
        </td>
        <td className="px-6 py-4 whitespace-nowrap text-xs">
          <span className="px-2.5 py-1 rounded-full font-semibold bg-zinc-800 text-zinc-300 border border-zinc-700/50">
            {budget.category}
          </span>
        </td>
        <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-zinc-200">
          {formatCurrency(budget.amount_limit)}
        </td>
        <td className={`px-6 py-4 whitespace-nowrap text-sm font-bold ${isExceeded ? 'text-accent-rose' : 'text-accent-emerald'}`}>
          {formatCurrency(budget.remaining_amount)}
        </td>
        <td className="px-6 py-4 text-sm text-zinc-400 min-w-[120px]">
          <div className="flex items-center space-x-2">
            <div className="w-full bg-zinc-800 h-2 rounded-full overflow-hidden border border-white/5">
              <div 
                className={`h-full ${progressColor} transition-all duration-500`}
                style={{ width: `${spentPercentage}%` }}
              ></div>
            </div>
            <span className="text-[10px] font-bold text-zinc-400 shrink-0">{spentPercentage.toFixed(0)}%</span>
          </div>
        </td>
        <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-300 flex items-center space-x-2">
          <Link to={`/budgets/${budget.budget_id}`}>
            <button className="p-1.5 rounded-lg border border-zinc-800 text-accent-cyan bg-zinc-900/60 hover:bg-zinc-800 hover:text-white transition duration-150" title="Inspect expenses matches">
              <Eye className="h-4 w-4" />
            </button>
          </Link>
          <Link to={`/budgets/edit/${budget.budget_id}`}>
            <button className="p-1.5 rounded-lg border border-zinc-800 text-zinc-400 bg-zinc-900/60 hover:bg-zinc-800 hover:text-white transition duration-150">
              <Edit className="h-4 w-4" />
            </button>
          </Link>
          <button
            onClick={() => openDeleteModal(budget.budget_id)}
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
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-extrabold tracking-tight text-zinc-100">
            Monthly Budgets
          </h1>
          <p className="text-xs text-zinc-400 mt-1">Set, track and verify expense envelopes to avoid overspending</p>
        </div>
        <div>
          <Link to="/budgets/add">
            <Button>
              <Plus className="h-4 w-4 mr-1" />
              Create Budget
            </Button>
          </Link>
        </div>
      </div>

      {/* Period Selection Filters */}
      <Card title="Inspected Period" hoverable>
        <div className="grid grid-cols-2 gap-4 max-w-md">
          <div className="flex flex-col space-y-1.5">
            <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Month</label>
            <select
              value={month}
              onChange={(e) => { setMonth(parseInt(e.target.value, 10)); setPage(1); }}
              className="block w-full bg-zinc-900 border border-zinc-800 rounded-lg text-sm text-zinc-100 pr-3 py-2 focus:outline-none focus:ring-2 focus:ring-accent-indigo"
            >
              {Array.from({ length: 12 }).map((_, idx) => (
                <option key={idx + 1} value={idx + 1}>
                  {new Date(2020, idx).toLocaleString('default', { month: 'long' })}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col space-y-1.5">
            <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Year</label>
            <select
              value={year}
              onChange={(e) => { setYear(parseInt(e.target.value, 10)); setPage(1); }}
              className="block w-full bg-zinc-900 border border-zinc-800 rounded-lg text-sm text-zinc-100 pr-3 py-2 focus:outline-none focus:ring-2 focus:ring-accent-indigo"
            >
              {Array.from({ length: 5 }).map((_, idx) => {
                const y = today.getFullYear() - 1 + idx;
                return <option key={y} value={y}>{y}</option>;
              })}
            </select>
          </div>
        </div>
      </Card>

      {/* Budgets Ledger */}
      <Card title={`Monitored Budgets (${totalCount})`}>
        <Table
          headers={["Period", "Budget Title", "Category", "Limit", "Remaining", "Spent %", "Actions"]}
          items={budgets}
          renderRow={renderRow}
          page={page}
          pages={pages}
          onPageChange={setPage}
          totalCount={totalCount}
          loading={loading}
          emptyMessage="No budgets created for selected month and year."
        />
      </Card>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={deleteId !== null}
        onClose={closeDeleteModal}
        title="Delete Budget Stream"
        onConfirm={handleConfirmDelete}
        confirmText="Delete Budget"
        confirmVariant="danger"
        loading={deleteLoading}
      >
        <div className="flex items-center space-x-3 text-zinc-300">
          <AlertTriangle className="h-8 w-8 text-accent-rose shrink-0" />
          <p>Are you sure you want to delete this budget envelope? Category expense histories will not be affected.</p>
        </div>
      </Modal>
    </div>
  );
};

export default BudgetList;

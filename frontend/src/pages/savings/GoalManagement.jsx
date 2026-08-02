import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Edit, Trash2, Calendar, Target, Award, ArrowUpRight, TrendingUp, AlertTriangle } from 'lucide-react';
import apiClient from '../../api/client';
import { formatCurrency, formatDate } from '../../utils/formatters';
import Button from '../../components/common/Button';
import Card from '../../components/common/Card';
import Table from '../../components/common/Table';
import Modal from '../../components/common/Modal';
import Input from '../../components/common/Input';

const GoalManagement = () => {
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');

  // Add Funds Inline Modal States
  const [addFundsGoal, setAddFundsGoal] = useState(null);
  const [fundsAmount, setFundsAmount] = useState('');
  const [fundsLoading, setFundsLoading] = useState(false);
  const [fundsError, setFundsError] = useState('');

  // Delete Modal States
  const [deleteId, setDeleteId] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Summary Metrics
  const [metrics, setMetrics] = useState({
    activeGoalsCount: 0,
    totalTarget: 0,
    totalSaved: 0,
  });

  const fetchGoals = async () => {
    setLoading(true);
    try {
      let url = `/goals?page=${page}&size=10`;
      if (statusFilter) url += `&status=${statusFilter}`;

      const res = await apiClient.get(url);
      setGoals(res.data.items || []);
      setTotalCount(res.data.total_count || 0);
      setPages(res.data.pages || 1);

      // Fetch summary details (load all active goals to calculate totals)
      const allActiveRes = await apiClient.get('/goals?size=100&status=IN_PROGRESS');
      const activeList = allActiveRes.data.items || [];
      const targetSum = activeList.reduce((acc, curr) => acc + parseFloat(curr.target_amount), 0);
      const savedSum = activeList.reduce((acc, curr) => acc + parseFloat(curr.saved_amount), 0);
      
      setMetrics({
        activeGoalsCount: activeList.length,
        totalTarget: targetSum,
        totalSaved: savedSum
      });

    } catch (err) {
      console.error("Error loading savings goals:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGoals();
  }, [page, statusFilter]);

  const openDeleteModal = (id) => {
    setDeleteId(id);
  };

  const closeDeleteModal = () => {
    setDeleteId(null);
  };

  const handleConfirmDelete = async () => {
    setDeleteLoading(true);
    try {
      await apiClient.delete(`/goals/${deleteId}`);
      closeDeleteModal();
      if (goals.length === 1 && page > 1) {
        setPage(page - 1);
      } else {
        fetchGoals();
      }
    } catch (err) {
      console.error("Failed to delete goal:", err);
    } finally {
      setDeleteLoading(false);
    }
  };

  const openAddFundsModal = (goal) => {
    setAddFundsGoal(goal);
    setFundsAmount('');
    setFundsError('');
  };

  const closeAddFundsModal = () => {
    setAddFundsGoal(null);
  };

  const handleAddFundsSubmit = async (e) => {
    e.preventDefault();
    const amountFloat = parseFloat(fundsAmount);
    if (isNaN(amountFloat) || amountFloat <= 0) {
      setFundsError("Please enter a positive numeric value.");
      return;
    }

    setFundsLoading(true);
    setFundsError('');
    try {
      const currentSaved = parseFloat(addFundsGoal.saved_amount);
      const newSaved = currentSaved + amountFloat;
      
      await apiClient.put(`/goals/${addFundsGoal.goal_id}`, {
        saved_amount: newSaved
      });
      closeAddFundsModal();
      fetchGoals();
    } catch (err) {
      console.error(err);
      setFundsError(err.response?.data?.detail || "Failed to update savings amount.");
    } finally {
      setFundsLoading(false);
    }
  };

  const renderRow = (goal) => {
    const target = parseFloat(goal.target_amount);
    const saved = parseFloat(goal.saved_amount);
    const progress = Math.min(100, Math.max(0, (saved / target) * 100));

    // Define colors
    const isCompleted = goal.status === "COMPLETED";
    const isExpired = goal.status === "EXPIRED";
    const statusChip = isCompleted 
      ? 'bg-accent-emerald/10 text-accent-emerald border-accent-emerald/20' 
      : isExpired 
      ? 'bg-accent-rose/10 text-accent-rose border-accent-rose/20' 
      : 'bg-accent-indigo/10 text-accent-indigo border-accent-indigo/20';

    return (
      <tr key={goal.goal_id} className="hover:bg-white/2 transition duration-150">
        <td className="px-6 py-4 text-sm font-semibold text-zinc-100 max-w-xs truncate">
          {goal.goal_name}
        </td>
        <td className="px-6 py-4 whitespace-nowrap text-xs">
          <span className="px-2.5 py-1 rounded-full font-semibold bg-zinc-800 text-zinc-300 border border-zinc-700/50">
            {goal.goal_type}
          </span>
        </td>
        <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-zinc-200">
          {formatCurrency(goal.target_amount)}
        </td>
        <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-accent-cyan">
          {formatCurrency(goal.saved_amount)}
        </td>
        <td className="px-6 py-4 text-sm text-zinc-400 min-w-[140px]">
          <div className="flex items-center space-x-2">
            <div className="w-full bg-zinc-800 h-2 rounded-full overflow-hidden border border-white/5">
              <div 
                className={`h-full transition-all duration-500 ${isCompleted ? 'bg-accent-emerald' : 'bg-accent-cyan'}`}
                style={{ width: `${progress}%` }}
              ></div>
            </div>
            <span className="text-[10px] font-bold text-zinc-400 shrink-0">{progress.toFixed(0)}%</span>
          </div>
        </td>
        <td className="px-6 py-4 whitespace-nowrap text-xs font-semibold">
          <span className={`px-2 py-0.5 rounded border ${statusChip}`}>
            {goal.status}
          </span>
        </td>
        <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-300 flex items-center space-x-2">
          {!isCompleted && !isExpired && (
            <button
              onClick={() => openAddFundsModal(goal)}
              className="px-2.5 py-1 rounded text-xs font-semibold border border-accent-cyan/20 text-accent-cyan bg-accent-cyan/10 hover:bg-accent-cyan hover:text-white transition duration-150"
            >
              Add Funds
            </button>
          )}
          <Link to={`/goals/progress/${goal.goal_id}`}>
            <button className="p-1.5 rounded-lg border border-zinc-800 text-accent-indigo bg-zinc-900/60 hover:bg-zinc-800 hover:text-white transition duration-150">
              <Target className="h-4 w-4" />
            </button>
          </Link>
          <Link to={`/goals/edit/${goal.goal_id}`}>
            <button className="p-1.5 rounded-lg border border-zinc-800 text-zinc-400 bg-zinc-900/60 hover:bg-zinc-800 hover:text-white transition duration-150">
              <Edit className="h-4 w-4" />
            </button>
          </Link>
          <button
            onClick={() => openDeleteModal(goal.goal_id)}
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
            Savings Goals
          </h1>
          <p className="text-xs text-zinc-400 mt-1">Define targets, upload saved progress, and allocate funds</p>
        </div>
        <div>
          <Link to="/goals/add">
            <Button>
              <Plus className="h-4 w-4 mr-1" />
              New Savings Goal
            </Button>
          </Link>
        </div>
      </div>

      {/* Metrics Dashboard */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card hoverable>
          <span className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider block">Active Savings Goals</span>
          <p className="text-3xl font-extrabold text-accent-indigo mt-2">{metrics.activeGoalsCount}</p>
        </Card>
        
        <Card hoverable>
          <span className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider block">Total Allocated Target</span>
          <p className="text-3xl font-extrabold text-zinc-200 mt-2">{formatCurrency(metrics.totalTarget)}</p>
        </Card>

        <Card hoverable>
          <span className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider block">Total Saved Amount</span>
          <p className="text-3xl font-extrabold text-accent-cyan mt-2">{formatCurrency(metrics.totalSaved)}</p>
        </Card>
      </div>

      {/* Filtering Selector */}
      <Card title="Status Filtering">
        <div className="flex flex-col space-y-1.5 max-w-xs">
          <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Status</label>
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            className="block w-full bg-zinc-900 border border-zinc-800 rounded-lg text-sm text-zinc-100 pr-3 py-2 focus:outline-none focus:ring-2 focus:ring-accent-indigo"
          >
            <option value="">All Statuses</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="COMPLETED">Completed</option>
            <option value="EXPIRED">Expired</option>
          </select>
        </div>
      </Card>

      {/* Savings Goals Table */}
      <Card title={`Targets Registry (${totalCount})`} subtitle="Check allocation limits and target dates">
        <Table
          headers={["Goal Name", "Type", "Target", "Saved", "Progress", "Status", "Actions"]}
          items={goals}
          renderRow={renderRow}
          page={page}
          pages={pages}
          onPageChange={setPage}
          totalCount={totalCount}
          loading={loading}
          emptyMessage="No savings goals created."
        />
      </Card>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={deleteId !== null}
        onClose={closeDeleteModal}
        title="Delete Savings Target"
        onConfirm={handleConfirmDelete}
        confirmText="Delete Goal"
        confirmVariant="danger"
        loading={deleteLoading}
      >
        <div className="flex items-center space-x-3 text-zinc-300">
          <AlertTriangle className="h-8 w-8 text-accent-rose shrink-0" />
          <p>Are you sure you want to permanently delete this savings goal? Stored amounts details will be removed.</p>
        </div>
      </Modal>

      {/* Inline Add Funds Modal */}
      <Modal
        isOpen={addFundsGoal !== null}
        onClose={closeAddFundsModal}
        title={`Add Savings: ${addFundsGoal?.goal_name}`}
      >
        <form onSubmit={handleAddFundsSubmit} className="space-y-4">
          {fundsError && <p className="text-xs text-accent-rose">⚠ {fundsError}</p>}
          <div className="text-xs text-zinc-400">
            Currently saved: <span className="font-semibold text-zinc-200">{formatCurrency(addFundsGoal?.saved_amount)}</span> of target <span className="font-semibold text-zinc-200">{formatCurrency(addFundsGoal?.target_amount)}</span>.
          </div>
          <Input
            label="Amount to Add ($)"
            type="number"
            step="0.01"
            icon={ArrowUpRight}
            placeholder="0.00"
            value={fundsAmount}
            onChange={(e) => setFundsAmount(e.target.value)}
            required
            autoFocus
          />
          <div className="pt-2 flex justify-end gap-2">
            <Button variant="outline" type="button" onClick={closeAddFundsModal}>Cancel</Button>
            <Button type="submit" loading={fundsLoading}>Allocate Funds</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default GoalManagement;

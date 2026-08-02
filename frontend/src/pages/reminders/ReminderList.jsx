import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Edit, Trash2, Calendar, CreditCard, RotateCcw, AlertTriangle, CheckSquare, Square } from 'lucide-react';
import apiClient from '../../api/client';
import { formatCurrency, formatDate } from '../../utils/formatters';
import Button from '../../components/common/Button';
import Card from '../../components/common/Card';
import Table from '../../components/common/Table';
import Modal from '../../components/common/Modal';
import Input from '../../components/common/Input';

const ReminderList = () => {
  const [reminders, setReminders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [completedFilter, setCompletedFilter] = useState('false'); // defaults to active/incomplete reminders

  // Delete Modal States
  const [deleteId, setDeleteId] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Toggle paid inline loading states
  const [actionLoadingId, setActionLoadingId] = useState(null);

  // Upcoming bills count
  const [upcomingCount, setUpcomingCount] = useState(0);

  const fetchReminders = async () => {
    setLoading(true);
    try {
      let url = `/reminders?page=${page}&size=10`;
      if (completedFilter) {
        url += `&is_completed=${completedFilter}`;
      }

      const res = await apiClient.get(url);
      setReminders(res.data.items || []);
      setTotalCount(res.data.total_count || 0);
      setPages(res.data.pages || 1);

      // Fetch incomplete count for top indicator
      const incompleteRes = await apiClient.get('/reminders?is_completed=false&size=100');
      setUpcomingCount(incompleteRes.data.total_count || 0);

    } catch (err) {
      console.error("Error loading reminders list:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReminders();
  }, [page, completedFilter]);

  const openDeleteModal = (id) => {
    setDeleteId(id);
  };

  const closeDeleteModal = () => {
    setDeleteId(null);
  };

  const handleConfirmDelete = async () => {
    setDeleteLoading(true);
    try {
      await apiClient.delete(`/reminders/${deleteId}`);
      closeDeleteModal();
      if (reminders.length === 1 && page > 1) {
        setPage(page - 1);
      } else {
        fetchReminders();
      }
    } catch (err) {
      console.error("Failed to delete reminder:", err);
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleTogglePaid = async (reminder) => {
    setActionLoadingId(reminder.reminder_id);
    try {
      const nextPaidState = !reminder.is_completed;
      await apiClient.put(`/reminders/${reminder.reminder_id}`, {
        is_completed: nextPaidState
      });
      fetchReminders();
    } catch (err) {
      console.error("Failed to toggle paid status:", err);
    } finally {
      setActionLoadingId(null);
    }
  };

  const renderRow = (rem) => {
    const isCompleted = rem.is_completed;
    
    // Choose date alerts
    const today = new Date();
    today.setHours(0,0,0,0);
    const dueDate = new Date(rem.due_date);
    dueDate.setHours(0,0,0,0);
    
    const isOverdue = !isCompleted && dueDate < today;
    const isDueSoon = !isCompleted && !isOverdue && (dueDate - today) <= (3 * 24 * 60 * 60 * 1000);

    const dateColor = isCompleted 
      ? 'text-zinc-500' 
      : isOverdue 
      ? 'text-accent-rose font-bold' 
      : isDueSoon 
      ? 'text-amber-500 font-bold' 
      : 'text-zinc-300';

    return (
      <tr key={rem.reminder_id} className="hover:bg-white/2 transition duration-150">
        <td className="px-6 py-4 whitespace-nowrap text-sm">
          <button
            onClick={() => handleTogglePaid(rem)}
            disabled={actionLoadingId === rem.reminder_id}
            className="text-zinc-500 hover:text-zinc-300 transition duration-150 focus:outline-none disabled:opacity-50"
            title={isCompleted ? "Mark as unpaid" : "Mark as paid"}
          >
            {isCompleted ? (
              <CheckSquare className="h-5 w-5 text-accent-emerald" />
            ) : (
              <Square className="h-5 w-5 text-zinc-600" />
            )}
          </button>
        </td>
        <td className={`px-6 py-4 text-sm font-semibold max-w-xs truncate ${isCompleted ? 'line-through text-zinc-500' : 'text-zinc-100'}`}>
          {rem.title}
        </td>
        <td className="px-6 py-4 whitespace-nowrap text-xs">
          <span className="px-2.5 py-1 rounded bg-zinc-800 text-zinc-300 border border-zinc-700/50">
            {rem.reminder_type}
          </span>
        </td>
        <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-zinc-200">
          {formatCurrency(rem.amount)}
        </td>
        <td className={`px-6 py-4 whitespace-nowrap text-sm font-semibold ${dateColor}`}>
          <div className="flex items-center space-x-1">
            <Calendar className="h-3.5 w-3.5" />
            <span>{formatDate(rem.due_date)}</span>
            {isOverdue && <span className="text-[9px] bg-accent-rose/10 px-1 py-0.5 rounded border border-accent-rose/25 ml-1">Overdue</span>}
            {isDueSoon && <span className="text-[9px] bg-amber-500/10 px-1 py-0.5 rounded border border-amber-500/25 ml-1">Soon</span>}
          </div>
        </td>
        <td className="px-6 py-4 whitespace-nowrap text-xs font-semibold text-zinc-400 capitalize">
          {rem.repeat_interval.toLowerCase()}
        </td>
        <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-300 flex items-center space-x-2">
          <Link to={`/reminders/edit/${rem.reminder_id}`}>
            <button className="p-1.5 rounded-lg border border-zinc-800 text-zinc-400 bg-zinc-900/60 hover:bg-zinc-800 hover:text-white transition duration-150">
              <Edit className="h-4 w-4" />
            </button>
          </Link>
          <button
            onClick={() => openDeleteModal(rem.reminder_id)}
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
            Bill Reminders
          </h1>
          <p className="text-xs text-zinc-400 mt-1">Configure automated trackers for recurring utility bills and loan schedules</p>
        </div>
        <div>
          <Link to="/reminders/add">
            <Button>
              <Plus className="h-4 w-4 mr-1" />
              Add Reminder
            </Button>
          </Link>
        </div>
      </div>

      {/* Top Banner metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card hoverable>
          <span className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider block">Upcoming Unpaid Bills</span>
          <p className="text-3xl font-extrabold text-accent-cyan mt-2">{upcomingCount}</p>
        </Card>
        
        <Card className="sm:col-span-2 flex flex-col justify-center">
          <span className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider block mb-2">Automated Rollovers</span>
          <div className="text-xs text-zinc-500 leading-relaxed">
            Bill reminders configured as monthly or weekly will automatically schedule their next payment dates upon clicking the paid checkboxes.
          </div>
        </Card>
      </div>

      {/* Filter panel */}
      <Card title="Status Filtering">
        <div className="flex flex-col space-y-1.5 max-w-xs">
          <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Status</label>
          <select
            value={completedFilter}
            onChange={(e) => { setCompletedFilter(e.target.value); setPage(1); }}
            className="block w-full bg-zinc-900 border border-zinc-800 rounded-lg text-sm text-zinc-100 pr-3 py-2 focus:outline-none focus:ring-2 focus:ring-accent-indigo"
          >
            <option value="false">Active / Unpaid</option>
            <option value="true">Paid / Completed</option>
            <option value="">All Reminders</option>
          </select>
        </div>
      </Card>

      {/* Reminders Ledger */}
      <Card title={`Reminders Registry (${totalCount})`}>
        <Table
          headers={["Paid?", "Title", "Type", "Amount", "Due Date", "Frequency", "Actions"]}
          items={reminders}
          renderRow={renderRow}
          page={page}
          pages={pages}
          onPageChange={setPage}
          totalCount={totalCount}
          loading={loading}
          emptyMessage="No bill payment reminders scheduled."
        />
      </Card>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={deleteId !== null}
        onClose={closeDeleteModal}
        title="Delete Reminder Schedule"
        onConfirm={handleConfirmDelete}
        confirmText="Delete Reminder"
        confirmVariant="danger"
        loading={deleteLoading}
      >
        <div className="flex items-center space-x-3 text-zinc-300">
          <AlertTriangle className="h-8 w-8 text-accent-rose shrink-0" />
          <p>Are you sure you want to permanently delete this reminder schedule? Recurring cycles will cease.</p>
        </div>
      </Modal>
    </div>
  );
};

export default ReminderList;

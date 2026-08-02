import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Edit, Trash2, Calendar, Filter, RotateCcw, AlertTriangle } from 'lucide-react';
import apiClient from '../../api/client';
import { formatCurrency, formatDate } from '../../utils/formatters';
import Button from '../../components/common/Button';
import Card from '../../components/common/Card';
import Table from '../../components/common/Table';
import Modal from '../../components/common/Modal';
import Input from '../../components/common/Input';

const INCOME_CATEGORIES = ["Salary", "Business", "Freelancing", "Investment", "Rental income", "Other income"];

const IncomeList = () => {
  const [incomes, setIncomes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);

  // Filters State
  const [category, setCategory] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Delete Modal States
  const [deleteId, setDeleteId] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Monthly summary metrics
  const [monthlyTotal, setMonthlyTotal] = useState(0);

  const fetchIncomes = async () => {
    setLoading(true);
    try {
      let url = `/income?page=${page}&size=10`;
      if (category) url += `&category=${category}`;
      if (startDate) url += `&start_date=${startDate}`;
      if (endDate) url += `&end_date=${endDate}`;

      const res = await apiClient.get(url);
      setIncomes(res.data.items || []);
      setTotalCount(res.data.total_count || 0);
      setPages(res.data.pages || 1);

      // Fetch summary for current month
      const today = new Date();
      const summaryRes = await apiClient.get(`/income/summary?year=${today.getFullYear()}&month=${today.getMonth() + 1}`);
      setMonthlyTotal(parseFloat(summaryRes.data.total_income || 0));

    } catch (err) {
      console.error("Error loading income records:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIncomes();
  }, [page, category, startDate, endDate]);

  const handleResetFilters = () => {
    setCategory('');
    setStartDate('');
    setEndDate('');
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
      await apiClient.delete(`/income/${deleteId}`);
      closeDeleteModal();
      // Reload list
      if (incomes.length === 1 && page > 1) {
        setPage(page - 1);
      } else {
        fetchIncomes();
      }
    } catch (err) {
      console.error("Failed to delete record:", err);
    } finally {
      setDeleteLoading(false);
    }
  };

  const renderRow = (income) => (
    <tr key={income.income_id} className="hover:bg-white/2 transition duration-150">
      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-zinc-300">
        {formatDate(income.income_date)}
      </td>
      <td className="px-6 py-4 text-sm font-medium text-zinc-100 max-w-xs truncate">
        {income.title}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-xs">
        <span className="px-2.5 py-1 rounded-full font-semibold bg-accent-emerald/10 text-accent-emerald border border-accent-emerald/20">
          {income.category}
        </span>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-accent-emerald">
        {formatCurrency(income.amount)}
      </td>
      <td className="px-6 py-4 text-xs text-zinc-400 max-w-xs truncate">
        {income.description || '—'}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-300 flex items-center space-x-2">
        <Link to={`/income/edit/${income.income_id}`}>
          <button className="p-1.5 rounded-lg border border-zinc-800 text-zinc-400 bg-zinc-900/60 hover:bg-zinc-800 hover:text-white transition duration-150">
            <Edit className="h-4 w-4" />
          </button>
        </Link>
        <button
          onClick={() => openDeleteModal(income.income_id)}
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
            Income Streams
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            Log, filter and track your earnings across business projects
          </p>
        </div>
        <div>
          <Link to="/income/add">
            <Button>
              <Plus className="h-4 w-4 mr-1" />
              Add Income
            </Button>
          </Link>
        </div>
      </div>

      {/* Summary card panel */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card hoverable className="md:col-span-1">
          <span className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider block">Monthly Total Earnings</span>
          <p className="text-3xl font-extrabold text-accent-emerald mt-2">{formatCurrency(monthlyTotal)}</p>
          <span className="text-[10px] text-zinc-500 mt-1 block">Summed for current month</span>
        </Card>
        
        {/* Dynamic breakdown banner */}
        <Card className="md:col-span-2 flex flex-col justify-center">
          <span className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider block mb-2">Category Overview (this month)</span>
          <div className="text-xs text-zinc-500">
            Navigate through streams using filters below to inspect details.
          </div>
        </Card>
      </div>

      {/* Filters Box */}
      <Card title="Query Filters" hoverable>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
          <div className="flex flex-col space-y-1.5">
            <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Category</label>
            <select
              value={category}
              onChange={(e) => { setCategory(e.target.value); setPage(1); }}
              className="block w-full bg-zinc-900 border border-zinc-800 rounded-lg text-sm text-zinc-100 pr-3 py-2 transition duration-200 focus:outline-none focus:ring-2 focus:ring-accent-indigo"
            >
              <option value="">All Categories</option>
              {INCOME_CATEGORIES.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

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

        <div className="flex justify-end mt-4">
          <Button 
            variant="outline" 
            className="text-xs" 
            onClick={handleResetFilters}
            disabled={!category && !startDate && !endDate}
          >
            <RotateCcw className="h-3.5 w-3.5 mr-1" />
            Reset Filters
          </Button>
        </div>
      </Card>

      {/* Table Data list */}
      <Card title={`Earnings Ledger (${totalCount})`} subtitle="Chronological list of all logged earnings">
        <Table
          headers={["Date", "Title", "Category", "Amount", "Description", "Actions"]}
          items={incomes}
          renderRow={renderRow}
          page={page}
          pages={pages}
          onPageChange={setPage}
          totalCount={totalCount}
          loading={loading}
          emptyMessage="No incomes logged for current query parameters."
        />
      </Card>

      {/* Confirmation Modal */}
      <Modal
        isOpen={deleteId !== null}
        onClose={closeDeleteModal}
        title="Delete Record"
        onConfirm={handleConfirmDelete}
        confirmText="Delete Stream"
        confirmVariant="danger"
        loading={deleteLoading}
      >
        <div className="flex items-center space-x-3 text-zinc-300">
          <AlertTriangle className="h-8 w-8 text-accent-rose shrink-0" />
          <p>Are you sure you want to permanently delete this income stream? This action cannot be reversed.</p>
        </div>
      </Modal>
    </div>
  );
};

export default IncomeList;

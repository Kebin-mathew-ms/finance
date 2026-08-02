import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Wallet, Calendar, AlertTriangle, CheckCircle, TrendingDown } from 'lucide-react';
import apiClient from '../../api/client';
import { formatCurrency, formatDate } from '../../utils/formatters';
import Card from '../../components/common/Card';
import Table from '../../components/common/Table';
import { PageLoader } from '../../components/common/Loader';

const BudgetDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  
  const [budget, setBudget] = useState(null);
  const [expenses, setExpenses] = useState([]);
  const [totalSpent, setTotalSpent] = useState(0);

  useEffect(() => {
    const fetchDetails = async () => {
      setLoading(true);
      try {
        // 1. Fetch budget
        const budgetRes = await apiClient.get(`/budgets/${id}`);
        const budgetData = budgetRes.data;
        setBudget(budgetData);

        // 2. Fetch expenses in the same category and month/year
        // Calculate date boundaries (e.g. 2026-08-01 to 2026-08-31)
        const startDayStr = `${budgetData.year}-${budgetData.month.toString().padStart(2, '0')}-01`;
        
        // Find last day of target month
        const lastDay = new Date(budgetData.year, budgetData.month, 0).getDate();
        const endDayStr = `${budgetData.year}-${budgetData.month.toString().padStart(2, '0')}-${lastDay}`;
        
        const expenseRes = await apiClient.get(
          `/expense?category=${budgetData.category}&start_date=${startDayStr}&end_date=${endDayStr}&size=100`
        );
        
        const expenseItems = expenseRes.data.items || [];
        setExpenses(expenseItems);
        
        // Sum total spent
        const sum = expenseItems.reduce((acc, curr) => acc + parseFloat(curr.amount), 0);
        setTotalSpent(sum);

      } catch (err) {
        console.error("Failed to load budget inspect logs:", err);
        navigate('/budgets');
      } finally {
        setLoading(false);
      }
    };

    fetchDetails();
  }, [id, navigate]);

  if (loading) {
    return <PageLoader message="Analyzing spending envelopes..." />;
  }

  const limit = parseFloat(budget.amount_limit);
  const remaining = limit - totalSpent;
  const isExceeded = remaining < 0;
  const spentPct = Math.min(100, (totalSpent / limit) * 100);

  const renderRow = (exp) => (
    <tr key={exp.expense_id} className="hover:bg-white/2 transition duration-150">
      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-zinc-300">
        {formatDate(exp.expense_date)}
      </td>
      <td className="px-6 py-4 text-sm font-medium text-zinc-100 max-w-xs truncate">
        {exp.title}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-accent-rose">
        {formatCurrency(exp.amount)}
      </td>
      <td className="px-6 py-4 text-xs text-zinc-400 max-w-sm truncate">
        {exp.description || '—'}
      </td>
    </tr>
  );

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl mx-auto">
      {/* Navigation Title */}
      <div className="flex items-center space-x-3">
        <Link to="/budgets" className="text-zinc-400 hover:text-zinc-200 transition">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-xl md:text-2xl font-extrabold tracking-tight text-zinc-100">
            Inspect: {budget.title}
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            Category: {budget.category} • Period: {budget.year}-{budget.month.toString().padStart(2, '0')}
          </p>
        </div>
      </div>

      {/* Overspending Alerts */}
      {isExceeded && (
        <div className="border border-accent-rose/20 bg-accent-rose/10 rounded-xl p-4 flex items-start space-x-3 text-zinc-200 animate-pulse">
          <AlertTriangle className="h-5 w-5 text-accent-rose shrink-0 mt-0.5" />
          <div>
            <h4 className="font-bold text-sm text-accent-rose">Budget Limit Exceeded!</h4>
            <p className="text-xs text-zinc-300 mt-1">
              Your actual expenses for category '{budget.category}' this month have exceeded your limit by <span className="font-bold text-white">{formatCurrency(Math.abs(remaining))}</span>. Consider adjusting details.
            </p>
          </div>
        </div>
      )}

      {/* Summary metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card hoverable>
          <span className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider block">Limit</span>
          <p className="text-2xl font-bold text-zinc-200 mt-2">{formatCurrency(limit)}</p>
        </Card>
        
        <Card hoverable>
          <span className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider block">Spent</span>
          <p className="text-2xl font-bold text-accent-rose mt-2">{formatCurrency(totalSpent)}</p>
          <span className="text-[10px] text-zinc-500 mt-1 block">{spentPct.toFixed(0)}% of limit</span>
        </Card>

        <Card hoverable>
          <span className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider block">Remaining</span>
          <p className={`text-2xl font-bold mt-2 ${isExceeded ? 'text-accent-rose' : 'text-accent-emerald'}`}>
            {formatCurrency(remaining)}
          </p>
          <span className="text-[10px] text-zinc-500 mt-1 block">Left in envelope</span>
        </Card>
      </div>

      {/* Progress visualizer card */}
      <Card title="Envelope Progress Tracker">
        <div className="space-y-3 py-2">
          <div className="flex justify-between items-center text-xs text-zinc-400 font-semibold">
            <span>Progress Spent</span>
            <span>{spentPct.toFixed(1)}%</span>
          </div>
          <div className="w-full bg-zinc-900 border border-white/5 h-4 rounded-full overflow-hidden">
            <div 
              className={`h-full transition-all duration-700 ${isExceeded ? 'bg-accent-rose' : spentPct > 85 ? 'bg-amber-500' : 'bg-accent-indigo'}`}
              style={{ width: `${spentPct}%` }}
            ></div>
          </div>
        </div>
      </Card>

      {/* Matching Expense Transactions Table */}
      <Card title="Category Expense Transactions" subtitle={`List of matching transactions in ${budget.category} for this period`}>
        <Table
          headers={["Date", "Title", "Amount", "Description"]}
          items={expenses}
          renderRow={renderRow}
          page={1}
          pages={1}
          totalCount={expenses.length}
          emptyMessage="No expenses recorded in this category for the selected period."
        />
      </Card>
    </div>
  );
};

export default BudgetDetails;

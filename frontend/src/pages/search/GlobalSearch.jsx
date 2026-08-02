import React, { useState } from 'react';
import { Search, ArrowUpRight, ArrowDownRight, Target, Calendar, FileText, CalendarRange } from 'lucide-react';
import apiClient from '../../api/client';
import { formatCurrency, formatDate } from '../../utils/formatters';
import SearchBar from '../../components/common/SearchBar';
import Card from '../../components/common/Card';
import Table from '../../components/common/Table';

const GlobalSearch = () => {
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [results, setResults] = useState({
    incomes: [],
    expenses: [],
    savings_goals: [],
    reminders: [],
    receipts: []
  });

  const handleSearch = async (params) => {
    setLoading(true);
    setSearched(true);
    try {
      // Build query string
      const q = Object.entries(params)
        .filter(([_, v]) => v !== undefined)
        .map(([k, v]) => `${k}=${encodeURIComponent(v)}`)
        .join('&');

      const res = await apiClient.get(`/search?${q}`);
      setResults(res.data);
    } catch (err) {
      console.error("Search query failed:", err);
    } finally {
      setLoading(false);
    }
  };

  const getResultsCount = () => {
    return results.incomes.length + 
           results.expenses.length + 
           results.savings_goals.length + 
           results.reminders.length + 
           results.receipts.length;
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-5xl mx-auto">
      {/* Title block */}
      <div>
        <h1 className="text-xl md:text-2xl font-extrabold tracking-tight text-zinc-100">
          Global Financial Search
        </h1>
        <p className="text-xs text-zinc-400 mt-1">Search ledger logs, savings goals, due bills and parsed receipts</p>
      </div>

      {/* Interactive Search Console */}
      <SearchBar onSearch={handleSearch} loading={loading} />

      {/* Searched Results View */}
      {searched && (
        <div className="space-y-6">
          <div className="text-xs font-semibold text-zinc-400">
            Found <span className="text-accent-indigo font-bold">{getResultsCount()}</span> matching records
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* 1. Incomes Panel */}
            <Card title={`Matching Incomes (${results.incomes.length})`}>
              <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                {results.incomes.length === 0 ? (
                  <p className="text-xs text-zinc-500 py-3 text-center">No incomes matched.</p>
                ) : (
                  results.incomes.map(inc => (
                    <div key={inc.income_id} className="flex justify-between items-center p-2.5 rounded-lg border border-zinc-800 bg-zinc-900/40 hover:bg-zinc-850 transition">
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-zinc-200 truncate">{inc.title}</div>
                        <div className="text-[9px] text-zinc-500 mt-0.5">{inc.category} • {formatDate(inc.income_date)}</div>
                      </div>
                      <span className="text-xs font-bold text-accent-emerald shrink-0 ml-2">
                        +{formatCurrency(inc.amount)}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </Card>

            {/* 2. Expenses Panel */}
            <Card title={`Matching Expenses (${results.expenses.length})`}>
              <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                {results.expenses.length === 0 ? (
                  <p className="text-xs text-zinc-500 py-3 text-center">No expenses matched.</p>
                ) : (
                  results.expenses.map(exp => (
                    <div key={exp.expense_id} className="flex justify-between items-center p-2.5 rounded-lg border border-zinc-800 bg-zinc-900/40 hover:bg-zinc-850 transition">
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-zinc-200 truncate">{exp.title}</div>
                        <div className="text-[9px] text-zinc-500 mt-0.5">{exp.category} • {formatDate(exp.expense_date)}</div>
                      </div>
                      <span className="text-xs font-bold text-accent-rose shrink-0 ml-2">
                        -{formatCurrency(exp.amount)}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </Card>

            {/* 3. Savings Goals Panel */}
            <Card title={`Matching Savings Goals (${results.savings_goals.length})`}>
              <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                {results.savings_goals.length === 0 ? (
                  <p className="text-xs text-zinc-500 py-3 text-center">No savings goals matched.</p>
                ) : (
                  results.savings_goals.map(goal => (
                    <div key={goal.goal_id} className="p-2.5 rounded-lg border border-zinc-800 bg-zinc-900/40 hover:bg-zinc-850 transition space-y-1.5">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-bold text-zinc-200 truncate pr-2">{goal.goal_name}</span>
                        <span className="text-[9px] px-1.5 py-0.5 font-bold rounded border border-zinc-700 text-zinc-400 capitalize bg-zinc-800">{goal.status.toLowerCase()}</span>
                      </div>
                      <div className="flex justify-between items-center text-[10px] text-zinc-500">
                        <span>Target: {formatCurrency(goal.target_amount)}</span>
                        <span>Saved: {formatCurrency(goal.saved_amount)}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </Card>

            {/* 4. Reminders Panel */}
            <Card title={`Matching Bill Reminders (${results.reminders.length})`}>
              <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                {results.reminders.length === 0 ? (
                  <p className="text-xs text-zinc-500 py-3 text-center">No bill reminders matched.</p>
                ) : (
                  results.reminders.map(rem => (
                    <div key={rem.reminder_id} className="flex justify-between items-center p-2.5 rounded-lg border border-zinc-800 bg-zinc-900/40 hover:bg-zinc-850 transition">
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-zinc-200 truncate">{rem.title}</div>
                        <div className="text-[9px] text-zinc-500 mt-0.5">Due {formatDate(rem.due_date)} • {rem.repeat_interval}</div>
                      </div>
                      <span className="text-xs font-bold text-zinc-300 shrink-0 ml-2">
                        {formatCurrency(rem.amount)}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </Card>

            {/* 5. Receipts Panel */}
            <Card title={`Matching OCR Receipts (${results.receipts.length})`} className="md:col-span-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-72 overflow-y-auto pr-1">
                {results.receipts.length === 0 ? (
                  <p className="text-xs text-zinc-500 py-3 text-center col-span-2">No scanned receipts matched.</p>
                ) : (
                  results.receipts.map(rc => (
                    <div key={rc.receipt_id} className="flex items-center space-x-3 p-2.5 rounded-lg border border-zinc-800 bg-zinc-900/40 hover:bg-zinc-850 transition">
                      <div className="w-10 h-10 rounded border border-white/5 bg-zinc-950 overflow-hidden flex items-center justify-center shrink-0">
                        <img 
                          src={`http://localhost:8000/api/v1/files/${rc.image_path}`} 
                          alt="receipt" 
                          className="w-full h-full object-cover"
                          onError={(e) => { e.target.src = "https://via.placeholder.com/40?text=Scan"; }}
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-bold text-zinc-200 truncate">{rc.merchant_name}</div>
                        <div className="text-[9px] text-zinc-500 mt-0.5">{formatDate(rc.transaction_date)} • Confidence: {parseFloat(rc.confidence_score).toFixed(0)}%</div>
                      </div>
                      <span className="text-xs font-bold text-zinc-300 shrink-0 ml-2">
                        {formatCurrency(rc.total_amount || 0.0)}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </Card>

          </div>
        </div>
      )}
    </div>
  );
};

export default GlobalSearch;
